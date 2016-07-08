/**
 * Default metadata extractor.
 */

// TODO inherited xpath issue
// TODO more field ops: predicates, parallels, pattern matchers, etc

/**
 * A convenient class for creating scopes. A scope is essentially an Object.
 * @constructor
 * @param {string} id
 *   The ID of this scope.
 * @param {Scope} parent
 *   The parent scope.
 */
function Scope(id, parent) {
  this._id = (parent ? (parent._id + '.') : '') + id;
  if (parent instanceof Scope) {
    this._parent = parent;
    parent.subscopes = parent.subscopes || new Array();
    parent.subscopes.push(this);
  }
}

Scope.prototype.trace = function(key, component) {
  var obj = this;
  while (obj) {
    var comp = component ? obj[component] : obj;
    if (comp && key in comp) {
      return comp[key];
    }
    obj = obj._parent;
  }
  return null;
}

/**
 * An extraction task.
 * @constructor
 * @param {Response} resp
 *   Must contain 'entity' as root DOM element.
 * @param {MetaMetadata} mmd
 *   The meta-metadata used for extraction.
 * @param {BigSemantics} bsFacade
 *   BigSemantics facade. Nullable.
 * @param {Object} options
 *   Additional options. Nullable.
 */
function Extraction(resp, mmd, bsFacade, options) {
  if (resp === undefined || resp === null) {
    throw new Error("Required argument missing: resp");
  }
  if (resp.entity === undefined || resp.entity === null) {
    throw new Error("Required argument missing: resp.entity");
  }
  if (mmd === undefined || mmd === null) {
    throw new Error("Required argument missing: mmd");
  }
  this.response = resp;
  this.location = new ParsedURL(this.response.location);
  this.rootNode = resp.entity;
  this.rawMmd = mmd;
  this.mmd = BSUtils.unwrapMmd(mmd);
  this.bs = bsFacade;
  this.options = options || {};
  return this;
}

Extraction.prototype.isScalar = function(field) {
  return field.scalar ? true : false;;
}

Extraction.prototype.isScalarCollection = function(field) {
  return (field.collection && field.collection.child_scalar_type) ? true : false;
}

Extraction.prototype.isComposite = function(field) {
  return field.composite ? true : false;
}

Extraction.prototype.isCompositeCollection = function(field) {
  return (field.collection && field.collection.child_type) ? true : false;
}

Extraction.prototype.getContextNode = function(field, parentScope) {
  var result = null;
  if (field.context_node) {
    result = parentScope.trace(field.context_node, 'vars');
  }
  else {
    result = parentScope.node;
  }
  if (result === null) {
    console.error("Context node is null: something is definitely wrong!");
  }
  return result;
}

/**
 * Handles def_vars defined inside a field.
 * @param  {MetaMetadataField} field
 *   The mmd field containing def_vars.
 * @param  {Scope} localScope
 *   The extraction scope for this field.
 */
Extraction.prototype.handleDefVars = function(field, localScope) {
  var result = new Object();
  var empty = true;
  if (field.def_vars instanceof Array) {
    for (var i = 0; i < field.def_vars.length; ++i) {
      var defVar = field.def_vars[i];
      if (defVar.type === 'node') {
        if (defVar.name && defVar.xpaths instanceof Array) {
          for (var j = 0; j < defVar.xpaths.length; ++j) {
            var xpath = defVar.xpaths[j];
            var targetNode = this.evaluateFirstNode(xpath, localScope.contextNode);
            if (targetNode) {
              result[defVar.name] = targetNode.singleNodeValue;
              empty = false;
              break;
            }
          }
        }
      }
      else {
        console.warn("Unknown def_var type: %O", defVar);
      }
    }
  }
  return empty ? null : result;
}

Extraction.prototype.amendXpath = function(xpath, parentScope) {
  var result = xpath;
  if (typeof result === 'string') {
    // join multiple lines
    result = result.replace('\n', '').replace('\r', '');

    // absolute to relative
    // TODO use a real xpath parser, e.g. https://github.com/dodo/xpath-parser
    if (result.indexOf('/') === 0) {
      result = '.' + result;
    }
    if (result.indexOf('(/') === 0) {
      result = result.replace('(/', '(./');
    }

    // replace $i to index in the parent which must be collection
    if (parentScope && parentScope.collectionIndex && result.indexOf('$i') >= 0) {
      result = result.replace('$i', parentScope.collectionIndex);
    }
  }
  return result;
}

Extraction.prototype.evaluateFirstNode = function(xpath, contextNode, parentScope) {
  xpath = this.amendXpath(xpath, parentScope);
  return this.rootNode.evaluate(xpath, contextNode, null, XPathResult.FIRST_ORDERED_NODE_TYPE);
}

Extraction.prototype.evaluateAllNodes = function(xpath, contextNode, parentScope) {
  xpath = this.amendXpath(xpath, parentScope);
  return this.rootNode.evaluate(xpath, contextNode, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE);
}

Extraction.prototype.toTypedScalar = function(val, scalarType) {
  if (val && scalarType) {
    switch (scalarType) {
      case 'Int':
      case 'Integer':
      case 'Float':
      case 'Double':
      case 'Number':
        val = Number(val);
        break;
      case 'Bool':
      case 'Boolean':
        val = Boolean(val);
        break;
      case 'URL':
      case 'ParsedURL':
        var purl = new ParsedURL(val, this.location.base);
        // TODO filter purl asynchronously
        val = purl.toString();
        break;
    }
  }
  return val;
}

Extraction.prototype.extractScalar = function(field, parentScope) {
  // step 1: prepare objects used in extraction
  var contextNode = this.getContextNode(field, parentScope);
  var value = null;

  // step 2: do extraction

  // TODO case 2.1: extract from previous field op result

  // case 2.2: regular xpath extraction
  if (!value && contextNode && field.xpaths instanceof Array) {
    for (var i = 0; i < field.xpaths.length; ++i) {
      var xpath = field.xpaths[i];
      var xres = this.evaluateFirstNode(xpath, contextNode, parentScope);
      if (xres && xres.singleNodeValue && xres.singleNodeValue.textContent) {
        value = xres.singleNodeValue.textContent.trim();
        break;
      }
    }
  }

  // step 3: apply field ops
  if (field.field_ops) {
    value = FieldOps.operate(value, field.field_ops);
  }
  if (field.concatenate_values) {
    FieldOps.concatenateValues(field.concatenate_values, parentScope);
  }

  value = this.toTypedScalar(value, field.scalar_type);
  return value;
}

Extraction.prototype.extractScalarCollection = function(field, parentScope) {
  // step 1: prepare objects used in extraction
  var contextNode = this.getContextNode(field, parentScope);
  var value = new Array();

  // step 2: do extraction

  // TODO case 2.1: extract from previous field op result

  // case 2.2: regular xpath extraction
  if (!value && contextNode && field.xpaths instanceof Array) {
    for (var i = 0; i < field.xpaths.length; ++i) {
      var xpath = field.xpaths[i];
      var xres = this.evaluateAllNodes(xpath, contextNode, parentScope);
      if (xres && xres.snapshotLength > 0) {
        for (var j = 0; j < xres.snapshotLength; ++j) {
          var item = xres.snapshotItem(j).textContent;
          if (item) {
            value.push(item.trim());
          }
        }
        break;
      }
    }
  }

  // TODO step 3: apply field ops

  if (value.length > 0) {
    var raw = value;
    value = new Array();
    for (var i in raw) {
      value.push(this.toTypedScalar(raw[i], field.child_scalar_type));
    }
    return value;
  }
  return null;
}

Extraction.prototype.extractComposite = function(field, parentScope) {
  // step 1: prepare local scope for extracting nested fields
  var localScope = new Scope(field.name, parentScope);
  localScope.contextNode = this.getContextNode(field, parentScope);
  localScope.vars = this.handleDefVars(field, localScope);
  localScope.value = null;

  // case 1.1: extract root metadata as composite
  if (parentScope.rootNode) {
    localScope.value = {
      location: this.response.location,
      additional_locations: this.response.otherLocations,
    };
    localScope.node = parentScope.rootNode;
  }

  // TODO case 1.2: extract from previous field op result

  // case 1.3: regular xpath extraction
  // TODO allow composite to not have xpath?
  if (localScope.contextNode && field.xpaths instanceof Array) {
    for (var i = 0; i < field.xpaths.length; ++i) {
      var xpath = field.xpaths[i];
      var xres = this.evaluateFirstNode(xpath, localScope.contextNode, parentScope);
      if (xres && xres.singleNodeValue) {
        localScope.node = xres.singleNodeValue;
        localScope.value = localScope.value || new Object();
        break;
      }
    }
  }

  // step 2: extract nested fields using the newly created local scope
  if (localScope.value) {
    localScope.value.meta_metadata_name = field.type || field.name;
    this.extract(field.kids, localScope, localScope.value);
    if (Object.keys(localScope.value).length > 1) {
      // TODO change meta_metadata_name based on location
      return localScope.value;
    }
    localScope.value = null;
  }

  return null;
}

Extraction.prototype.extractCompositeCollection = function(field, parentScope) {
  var surrogateComposite = null;
  if (field.kids instanceof Array && field.kids.length === 1) {
    surrogateComposite = field.kids[0].composite;
  }
  if (!surrogateComposite) {
    console.warn("Invalid surrogate composite on %s: %O", field.name, field);
    return;
  }

  // step 1: prepare local scope for extracting nested fields
  var localScope = new Scope(field.name, parentScope);
  localScope.contextNode = this.getContextNode(field, parentScope);
  localScope.vars = this.handleDefVars(field, localScope);
  localScope.value = new Array();
  localScope.count = 0;

  // TODO case 1.1: extract from previous field op result

  // case 1.2: regular xpath extraction
  // TODO allow composite to not have xpath?
  if (field.xpaths instanceof Array) {
    for (var i = 0; i < field.xpaths.length; ++i) {
      var xpath = field.xpaths[i];
      var xres = this.evaluateAllNodes(xpath, localScope.contextNode, parentScope);
      if (xres && xres.snapshotLength > 0) {
        localScope.count = xres.snapshotLength;
        localScope.nodes = new Array();
        for (var j = 0; j < xres.snapshotLength; ++j) {
          localScope.nodes.push(xres.snapshotItem(j));
        }
        break;
      }
    }
  }

  // step 2: extract nested fields using newly created local scope
  for (var i = 0; i < localScope.count; ++i) {
    var lscopei = new Scope('$' + i, localScope);
    lscopei.collectionIndex = i+1;
    lscopei.node = localScope.nodes[i];
    var item = {
      meta_metadata_name: surrogateComposite.type || surrogateComposite.name,
    };
    this.extract(surrogateComposite.kids, lscopei, item);
    if (Object.keys(item).length > 1) {
      // TODO change meta_metadata_name based on location
      localScope.value.push(item);
    }
  }

  if (localScope.value.length > 0) {
    return localScope.value;
  }
  localScope.value = null;
  return null;
}

/**
 * Recursively extract semantics from contextNode, according to fieldList.
 * @param  {Array<MetaMetadataField>} fieldList
 *   The list of nested fields.
 * @param  {Scope} parentScope
 *   The lexical scope to store intermediate results.
 * @param  {metadata} obj
 *   The result / intermediate metadata object.
 */
Extraction.prototype.extract = function(fieldList, parentScope, obj) {
  if (fieldList instanceof Array) {
    var sorted = new Array();
    for (var i = 0; i < fieldList.length; ++i) {
      var field = fieldList[i];
      if (this.isScalar(field)) {
        sorted.push(field);
      }
    }
    sorted = this.sortFieldsByDependency(sorted);
    for (var i = 0; i < fieldList.length; ++i) {
      var field = fieldList[i];
      if (!this.isScalar(field)) {
        sorted.push(field);
      }
    }

    for (var i = 0; i < sorted.length; ++i) {
      var field = fieldList[i];
      var value = null;
      if (this.isScalar(field)) {
        value = this.extractScalar(field.scalar, parentScope);
      }
      else if (this.isScalarCollection(field)) {
        value = this.extractScalarCollection(field.collection, parentScope);
      }
      else if (this.isComposite(field)) {
        value = this.extractComposite(field.composite, parentScope);
      }
      else if (this.isCompositeCollection(field)) {
        value = this.extractCompositeCollection(field.collection, parentScope);
      }
      else {
        console.warn("Unknown field type: ", field);
      }

      if (value) {
        var unwrapped = this.unwrapField(field);
        obj[unwrapped.tag || unwrapped.name] = value;
      }
    }
  }
}

Extraction.prototype.unwrapField = function(field) {
  if (field.scalar) {
    return field.scalar;
  }
  if (field.composite) {
    return field.composite;
  }
  if (field.collection) {
    return field.collection;
  }
  return field;
}

Extraction.prototype.sortFieldsByDependency = function(fieldList) {
  if (fieldList instanceof Array) {
    var result = new Array();

    var map = new Object(); // name => field
    for (var i = 0; i < fieldList.length; ++i) {
      var field = fieldList[i];
      map[this.unwrapField(field).name] = field;
    }

    function forEachDep(field, callback) {
      if (field.scalar && field.scalar.concatenate_values instanceof Array) {
        for (var i = 0; i < field.concatenate_values.length; ++i) {
          var depName = field.concatenate_values[i].from_scalar;
          if (depName && depName.length > 0) {
            callback(depName);
          }
        }
      }
    }

    // topological sort
    var visited = {}; // name => boolean; used for DFS
    var marked = {}; // name => boolean; used to detect cyclic dependencies.
    function visit(name) {
      var field = map[name];
      if (name in marked) {
        console.warn("Cyclic dependency among fields detected in %O",
          fieldList);
        return fieldList;
      }
      if (!(name in visited)) {
        marked[name] = true;
        forEachDep(field, function(depName) {
          visit(depName);
        });
        delete marked[name];
        visited[name] = true;
        result.push(field);
      }
    }
    for (var i = 0; i < fieldList.length; ++i) {
      var name = this.unwrapField(fieldList[i]).name;
      if (!(name in visited)) {
        visit(name);
      }
    }

    return result;
  }
  return fieldList;
}

/**
 * Start extraction.
 * @param  {(err, metadata)=>void} callback
 *   Callback function to receive result. Result metadata is wrapped.
 */
Extraction.prototype.start = function(callback) {
  this.scope = new Scope('$');
  this.scope.rootNode = this.rootNode;
  this.scope.node = this.rootNode;

  this.metadata = new Object();
  this.metadata[this.mmd.tag || this.mmd.name] = this.extractComposite(this.mmd, this.scope);
  console.log("Extraction finished: %O", this.metadata);
  callback(null, this.metadata);
}

/**
 * Extract metadata, given the root DOM element and the meta-metadata.
 * @param  {Response} resp
 *   Contains the root DOM element.
 * @param  {MetaMetadata} mmd
 *   The wrapper.
 * @param  {BigSemantics} bsFacade
 *   Provide BigSemantics functionalities. Nullable.
 * @param  {Object} options
 *   Additional options. Nullable.
 * @param  {(err, metadata)=>void)} callback
 *   Callback function to receive result. Result metadata is wrapped.
 */
function extractMetadata(resp, mmd, bsFacade, options, callback) {
  var extraction = new Extraction(resp, mmd, bsFacade, options);
  extraction.start(callback);
}

/**
 * @deprecated
 * This is added for debugging. This synchronous version will be removed soon.
 */
function extractMetadataSync(resp, mmd, bsFacade, options) {
  var extraction = new Extraction(resp, mmd, bsFacade, options);
  extraction.start(function() {});
  return extraction.metadata;
}
