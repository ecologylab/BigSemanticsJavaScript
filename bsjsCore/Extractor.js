/**
 * Default metadata extractor.
 */

// TODO inherited xpath issue: we need more test cases to actually address this
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
    parent.subscopes = parent.subscopes || [];
    parent.subscopes.push(this);
  }
}

/**
 * Trace a value in this scope and its ancestors for a given key.
 * @param  {string} key
 *   The key to the value to be traced.
 * @param  {string} component
 *   The name of the component to trace in this scope and its ancestors. Each
 *   scope can have multiple components.
 * @return {Object} The first value with the given key (and in the component, if
 * specified) in this scope or in its ancestors.
 */
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

/**
 * Find the context node for a given field and its parent scope.
 * @param  {MetaMetadataField} field
 *   The mmd field potentially specifying context node.
 * @param  {Scope} parentScope
 *   The parent scope of the field.
 * @return {Node} The context node.
 */
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
 * Handles def_vars defined inside a field, using its local scope.
 * @param  {MetaMetadataField} field
 *   The mmd field containing def_vars.
 * @param  {Scope} localScope
 *   The extraction scope for this field.
 * @return {Object} An object containing def var names and values.
 */
Extraction.prototype.handleDefVars = function(field, localScope) {
  var result = {};
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
  return Object.keys(result).length > 0 ? result : null;
}

/**
 * Amends an XPath. This mainly includes joining multiple lines if any, turning
 * absolute XPaths to relative ones, and resolving metadata-related variables in
 * the XPath.
 * @param  {string} xpath
 *   The XPath to amend.
 * @param  {Scope} parentScope
 *   The parent scope of the field that has the XPath. Used to resolve
 *   metadata-related variables.
 * @return {string} Amended XPath.
 */
Extraction.prototype.amendXpath = function(xpath, parentScope) {
  var result = xpath;
  if (typeof result === 'string') {
    // join multiple lines
    result = result.replace('\n', '').replace('\r', '');

    // absolute to relative
    // FIXME use a real xpath parser, e.g. https://github.com/dodo/xpath-parser
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

/**
 * Turns a scalar value represented in raw string to a typed value.
 * @param  {string} val
 *   The scalar value in a raw string.
 * @param  {string} scalarType
 *   The scalar type.
 * @return {any} The converted, typed value.
 */
Extraction.prototype.toTypedScalar = function(val, scalarType) {
  if (val && scalarType) {
    switch (scalarType) {
      case 'String':
        break;
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
        // FIXME filter purl asynchronously
        val = purl.toString();
        break;
      default:
        console.warn("Scalar type unsupported yet: " + scalarType + "; for value: " + val);
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
        if (field.extract_as_html) {
          value = xres.singleNodeValue.innerHTML;
        } else {
          value = xres.singleNodeValue.textContent.trim();
        }
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
  var value = null;

  // step 2: do extraction

  // TODO case 2.1: extract from previous field op result

  // case 2.2: regular xpath extraction
  if (!value && contextNode && field.xpaths instanceof Array) {
    for (var i = 0; i < field.xpaths.length; ++i) {
      var xpath = field.xpaths[i];
      var xres = this.evaluateAllNodes(xpath, contextNode, parentScope);
      if (xres && xres.snapshotLength > 0) {
        value = [];
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

  if (value && value.length > 0) {
    var typed = [];
    for (var i in value) {
      typed.push(this.toTypedScalar(value[i], field.child_scalar_type));
    }
    return typed;
  }
  return null;
}

/**
 * If srcField is inheriting from targetField.
 * @param {MetaMetadataField} srcField
 * @param {MetaMetadataField} targetField
 * @return {Boolean}
 */
Extraction.prototype.isFieldInheritingFrom = function(srcField, targetField) {
  if (srcField) {
    var f = targetField;
    while (f) {
      f = this.unwrapField(f);
      if (srcField.name !== f.name) return false;
      if (srcField === f) return true;
      f = f.super_field;
    }
  }
  return false;
}

/**
 * If we will result in infinite recursion with the input scope (which
 * represents a stage of the extraction process).
 * @param {Scope} scope
 *   The current scope.
 * @return {Boolean}
 */
Extraction.prototype.isInfiniteRecursion = function(scope) {
  if (scope) {
    var field = scope.field;
    var contextNode = scope.contextNode;
    if (field && contextNode) {
      var ancestor = scope._parent;
      while (ancestor) {
        var inheriting = this.isFieldInheritingFrom(field, ancestor.field);
        var inherited = this.isFieldInheritingFrom(ancestor.field, field);
        if ((inheriting || inherited) && ancestor.contextNode === contextNode) {
          return true;
        }
        ancestor = ancestor._parent;
      }
      return false;
    }
  }
  return true;
}

Extraction.prototype.extractComposite = function(field, parentScope) {
  // step 1: prepare local scope for extracting nested fields
  var localScope = new Scope(field.name, parentScope);
  localScope.field = field;
  localScope.contextNode = this.getContextNode(field, parentScope);
  localScope.vars = this.handleDefVars(field, localScope);
  localScope.value = null;
  var done = false; // true iff localScope is ready for extraction

  // detect and prevent infinite recursion
  if (this.isInfiniteRecursion(localScope)) {
    return null;
  }

  // case 1.1: extract root metadata as composite
  if (parentScope.rootNode) {
    localScope.value = {
      location: this.response.location,
      additional_locations: this.response.otherLocations,
    };
    localScope.node = parentScope.rootNode;
  }

  // TODO case 1.2: extract from previous field op result (and set done)

  // case 1.3: regular xpath extraction
  if (!done && localScope.contextNode) {
    var xpaths = field.xpaths || [];
    /* FIXME this solution to the inherited xpath issue doesn't work for all
     * cases. we need to have more test cases to address it.
    var superFieldXpaths = this.unwrapField(field.super_field || {}).xpaths || [];
    if (!parentScope.rootNode && xpaths.length === superFieldXpaths.length) {
      localScope.node = localScope.contextNode;
      localScope.authoredKidsOnly = true;
      localScope.value = localScope.value || {};
      done = true;
    }
    else {
    */
      for (var i = 0; i < xpaths.length; ++i) {
        var xpath = xpaths[i];
        var xres = this.evaluateFirstNode(xpath, localScope.contextNode, parentScope);
        if (xres && xres.singleNodeValue) {
          localScope.node = xres.singleNodeValue;
          localScope.value = localScope.value || {};
          done = true;
          break;
        }
      }
    /* FIXME (solution to the inherited xpath issue)
    }
    */
  }

  // step 2: extract nested fields using the newly created local scope
  if (localScope.value) {
    localScope.value.mm_name = field.type || field.name;
    var kids = field.kids || [];
    /* FIXME (solution to the inherited xpath issue)
    // if we only allow authored kids to be extracted, filter `kids`.
    if (localScope.authoredKidsOnly) {
      if (!field._authored_kids) {
        field._authored_kids = [];
        var superkids = this.unwrapField(field.super_field || {}).kids || [];
        for (var i = 0; i < field.kids.length; ++i) {
          var kid = kids[i];
          var found = false;
          for (var j = 0; j < superkids.length; ++j) {
            var superkid = superkids[j];
            if (this.unwrapField(kid) === this.unwrapField(superkid)) {
              found = true;
              break;
            }
          }
          if (!found) field._authored_kids.push(kid);
        }
      }
      kids = field._authored_kids;
    }
    */
    this.extractFields(kids, localScope, localScope.value);
    if (Object.keys(localScope.value).length > 1) {
      if (field.polymorphic_scope || field.polymorphic_classes) {
        // TODO change mm_name based on location
        var wrapper = {};
        wrapper[localScope.value.mm_name] = localScope.value;
        localScope.value = wrapper;
      }
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
    return null;
  }

  // step 1: prepare local scope for extracting nested fields
  var localScope = new Scope(field.name, parentScope);
  localScope.field = field;
  localScope.contextNode = this.getContextNode(field, parentScope);
  localScope.vars = this.handleDefVars(field, localScope);
  localScope.value = [];
  localScope.count = 0;
  var done = false;

  // detect and prevent infinite recursion
  if (this.isInfiniteRecursion(localScope)) {
    return null;
  }

  // TODO case 1.1: extract from previous field op result

  // case 1.2: regular xpath extraction
  if (!done && field.xpaths instanceof Array) {
    for (var i = 0; i < field.xpaths.length; ++i) {
      var xpath = field.xpaths[i];
      var xres = this.evaluateAllNodes(xpath, localScope.contextNode, parentScope);
      if (xres && xres.snapshotLength > 0) {
        localScope.count = xres.snapshotLength;
        localScope.nodes = [];
        for (var j = 0; j < xres.snapshotLength; ++j) {
          localScope.nodes.push(xres.snapshotItem(j));
        }
        done = true;
        break;
      }
    }
  }

  // step 2: extract nested fields using newly created local scope
  for (var i = 0; i < localScope.count; ++i) {
    var localScopei = new Scope('$' + i, localScope);
    localScopei.collectionIndex = i+1;
    localScopei.node = localScope.nodes[i];
    var item = {
      mm_name: surrogateComposite.type || surrogateComposite.name,
    };
    this.extractFields(surrogateComposite.kids, localScopei, item);
    if (Object.keys(item).length > 1) {
      if (field.polymorphic_scope || field.polymorphic_classes) {
        // TODO change mm_name based on location
        var wrapper = {};
        wrapper[item.mm_name] = item;
        item = wrapper;
      }
      localScope.value.push(item);
    }
  }

  if (done && localScope.value.length > 0) {
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
Extraction.prototype.extractFields = function(fieldList, parentScope, obj) {
  if (fieldList instanceof Array) {
    var sorted = [];
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
      var field = sorted[i];
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

/**
 * Unwrap a meta-metadata field.
 * @param {MetaMetadataField} field
 * @return {Object} The unwrapped field, if `field` is a wrapped
 * MetaMetadataField, or the input itself unchanged.
 */
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

/**
 * Sort the input list of fields by dependency, i.e. if A depends on B, in the
 * output, B precedes A.
 * @param {Array<MetaMetadataField>} fieldList
 *   The list of fields to be sorted.
 * @return {Array<MetaMetadataField} The sorted list of fields.
 */
Extraction.prototype.sortFieldsByDependency = function(fieldList) {
  if (fieldList instanceof Array) {
    var result = [];

    var map = {}; // name => field
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
        console.warn("Cyclic dependency among fields detected in %O", fieldList);
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
 * Start extraction. Calls callback when finished.
 * @param  {(err, metadata)=>void} callback
 *   Callback function to receive result. Result metadata is wrapped.
 */
Extraction.prototype.extract = function(callback) {
  this.scope = new Scope('$');
  this.scope.field = this.mmd;
  this.scope.rootNode = this.rootNode;
  this.scope.node = this.rootNode;

  this.metadata = {};
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
  extraction.extract(callback);
}

/**
 * @deprecated
 * This is added for debugging. This synchronous version will be removed soon.
 * TODO remove this.
 */
function extractMetadataSync(resp, mmd, bsFacade, options) {
  var extraction = new Extraction(resp, mmd, bsFacade, options);
  extraction.extract(function() {});
  return extraction.metadata;
}
