// SIMPL basic de/serialization.

var simpl = {}; // namespace

// const
simpl.SIMPL_ID = "simpl.id";
simpl.SIMPL_REF = "simpl.ref";
simpl.SIMPL_VISITED_ID = "_simpl._visited";

simpl.jsonEscape = function(str) {
  return str.replace(/\\n/g, "\\n")
            .replace(/\\'/g, "\\'")
            .replace(/\\"/g, '\\"')
            .replace(/\\&/g, "\\&")
            .replace(/\\r/g, "\\r")
            .replace(/\\t/g, "\\t")
            .replace(/\\b/g, "\\b")
            .replace(/\\f/g, "\\f");
};

// (For internal use)
// Depth-first search on the given object.
// 'handlers' can be used to receive events and operate on the tree.
simpl.dfs = function(obj, options, handlers) {
  var visitId = 1000;
  var visited = {};

  function emit(handler) {
    if (handler && handler instanceof Function) {
      var args = [];
      for (var i = 1; i < arguments.length; ++i) { args.push(arguments[i]); }
      return handler.apply(handlers, args);
    }
  }

  function helper(elem, parentElem, name) {
    if (typeof elem == 'undefined') { return; }

    if (elem instanceof Array) {                          // case 1: array
      emit(handlers.onArray, elem, parentElem, name);
      for (var i in elem) {
        var val = elem[i];
        if (typeof val == 'undefined') { val = null; }
        if (i > 0) { emit(handlers.onSep, val, elem, i); }
        helper(val, elem, i);
      }
      emit(handlers.onArrayEnd, elem, parentElem, name);
    } else if (elem instanceof Object && elem != null) {  // case 2: object
      if (simpl.SIMPL_VISITED_ID in elem) {
        emit(handlers.onObjectRevisit, elem, parentElem, name);
        return;
      }
      elem[simpl.SIMPL_VISITED_ID] = String(visitId);
      visited[visitId] = elem;
      visitId += 1;

      emit(handlers.onObject, elem, parentElem, name);
      elem = parentElem[name]; // in case onObject changes something

      if (elem) {
        var fieldNames = Object.getOwnPropertyNames(elem);
        emit(handlers.onFieldNames, elem, parentElem, name, fieldNames);
        var first = true;
        for (var i in fieldNames) {
          var fieldName = fieldNames[i];
          if (fieldName == simpl.SIMPL_VISITED_ID) { continue; }
          var field = elem[fieldName];
          if (typeof field == 'undefined') { continue; }
          if (emit(handlers.skipField, field, elem, fieldName)) { continue; }

          if (!first) { emit(handlers.onSep, field, elem, fieldName); }
          first = false;
          emit(handlers.onFieldName, field, elem, fieldName);
          helper(field, elem, fieldName);
          i += 1;
        }
      }
      emit(handlers.onObjectEnd, elem, parentElem, name);
    } else {
      // case 3: scalar; type of elem: boolean, number, string, or null
      emit(handlers.onScalar, elem, parentElem, name);
    }
  }

  // wrap it so that the root can be changed if necessary
  var dumpWrap = { '$root$': obj };
  // do it!
  helper(obj, dumpWrap, '$root$');

  // finish: clear our visited marks
  for (var id in visited) {
    delete visited[id][simpl.SIMPL_VISITED_ID];
  }
}

// Replaces all cyclic references with an object stub containing only a
// simpl_ref.
//
// Operates on the object in place. Returns modified object, also.
simpl.graphCollapse = function(obj, options) {
  if (typeof obj != 'object') {
    throw { error: "Must be an object" };
  }

  // when 
  simpl.dfs(obj, options, {
    onObjectRevisit: function(val, parentVal, name) {
      if (!(simpl.SIMPL_ID in val)) {
        val[simpl.SIMPL_ID] = val[simpl.SIMPL_VISITED_ID];
      }
      parentVal[name] = {};
      parentVal[name][simpl.SIMPL_REF] = val[simpl.SIMPL_ID];
    }
  });

  return obj;
}

// Replaces all object stubs containing simpl_refs with the real object
// (identified by simpl_id).
//
// Operates on the object in place. Returns modified object, also.
simpl.graphExpand = function(obj, options) {
  if (typeof obj != 'object') {
    throw { error: "Must be an object" };
  }

  // book keeping
  var simplObjs = {};

  // Pass 1: collect all objects comtaining simpl_id
  simpl.dfs(obj, options, {
    onObject: function(val, parentVal, name) {
      if (simpl.SIMPL_ID in val) {
        var id = val[simpl.SIMPL_ID];
        if (id in simplObjs) {
          console.warn("WARN: duplicate id: " + id);
        } else {
          simplObjs[id] = val;
          delete val[simpl.SIMPL_ID];
        }
      }
    }
  });

  // Pass 2: replace all object stubs containing simpl_ref
  simpl.dfs(obj, options, {
    onObject: function(val, parentVal, name) {
      if (simpl.SIMPL_REF in val) {
        var refId = val[simpl.SIMPL_REF];
        var ref = simplObjs[refId];
        if (ref) {
          if (parentVal == null) {
            console.warn("WARN: parentObj is null, operation aborted.");
          }
          if (name == null) {
            console.warn("WARN: field name or index is null, operation aborted.");
          }
          parentVal[name] = ref;
        } else {
          console.warn("WARN: unknown simpl_ref: " + refId);
        }
      }
    }
  });

  // debugging: 
  if (options && options.debugging) {
    simpl.dfs(obj, options, {
      onObject: function(val, parentVal, name) {
        if (simpl.SIMPL_ID in val) {
          console.warn("WARN: uncollected simpl_id: " + val[simpl.SIMPL_ID]);
        } else if (simpl.SIMPL_REF in val) {
          var refId = val[simpl.SIMPL_REF];
          console.warn("WARN: unresolved simpl_ref: " + val[simpl.SIMPL_REF]
                       + "; parent: " + parentVal);
        }
      }
    });
  }

  return obj;
}

// Serialize an object with cyclic references. Cyclic references will be
// replaced with simpl_refs.
//
// Input object will be modified during the process, but will be eventually
// restored.
//
// Returns the serialized string.
simpl.serialize = function(obj, options) {
  simpl.graphCollapse(obj, options);
  var result = undefined;
  if (options && options.id_before_ref) {
    // the following process makes sure that simpl_id appears before
    // corresponding simpl_refs.
    var parts = [];
    function output() { Array.prototype.push.apply(parts, arguments); }
    simpl.dfs(obj, options, {
      onScalar: function(val, parentVal, name) {
        if (typeof val == 'string') { output('"', simpl.jsonEscape(val), '"'); }
        else { output(String(val)); }
      },
      onArray: function(val, parentVal, name) { output('['); },
      onArrayEnd: function(val, parentVal, name) { output(']'); },
      onSep: function(val, parentVal, name) { output(','); },
      onObject: function(val, parentVal, name) { output('{'); },
      onObjectEnd: function(val, parentVal, name) { output('}'); },
      onFieldNames: function(val, parentVal, name, fieldNames) {
        // output simpl_id before all other fields:
        var k = fieldNames.indexOf(simpl.SIMPL_ID);
        if (k > 0) {
          var tmp = fieldNames[0];
          fieldNames[0] = simpl.SIMPL_ID;
          fieldNames[k] = tmp;
        }
      },
      onFieldName: function(val, parentVal, name) { output('"', name, '":'); }
    });
    result = parts.join('');
  } else {
    result = JSON.stringify(obj);
  }
  simpl.graphExpand(obj, options);
  return result;
}

 // Deserialize a string into a simpl object. Replace all cyclic references
 // containing simpl_refs with the real objects identified by simpl_ids.
 //
 // Returns the deserialized object.
simpl.deserialize = function(str, options) {
  return simpl.graphExpand(JSON.parse(str), options);
}

// for use in Node:
if (typeof module == 'object' && module != null) {
  module.exports = simpl;
}



// tests:

simpl.test = {};

simpl.test.assert = function(cond) {
  if (!cond) {
    throw new Error("Assertion failed!");
  } else {
    console.log("Assertion passed.");
  }
}

simpl.test.collapseExpand = function() {
  var assert = simpl.test.assert;

  var obj = {
    name: { firstname: 'first name', lastname: 'last name' },
    tags: [ 'tag1', 'tag2', 'tag3' ],
    refs: [ { name: { firstname: 'abc', lastname: 'def' } } ],
  }
  obj.refs.push(obj);

  
  var s0 = JSON.stringify(simpl.graphCollapse(obj));
  var o = simpl.graphExpand(obj);
  assert('first name' == o.name.firstname);
  assert('last name' == o.name.lastname);
  assert('tag1' == o.tags[0]);
  assert('tag2' == o.tags[1]);
  assert('tag3' == o.tags[2]);
  assert('abc' == o.refs[0].name.firstname);
  assert('def' == o.refs[0].name.lastname);
  assert('first name' == o.refs[1].name.firstname);
  assert('last name' == o.refs[1].name.lastname);
  var s1 = JSON.stringify(simpl.graphCollapse(obj));
  assert(s0 == s1);
}

simpl.test.roundtrip = function() {
  var assert = simpl.test.assert;

  var obj = {
    name: { firstname: 'first name', lastname: 'last name' },
    tags: [ 'tag1', 'tag2', 'tag3' ],
    refs: [ { name: { firstname: 'abc', lastname: 'def' } } ],
    gotcha: null,
    gotchaAgain: undefined
  }
  obj.refs.push(obj);

  var s = simpl.serialize(obj);
  console.log(s);

  var o = simpl.deserialize(s, { debugging: true });
  assert('first name' == o.name.firstname);
  assert('last name' == o.name.lastname);
  assert('tag1' == o.tags[0]);
  assert('tag2' == o.tags[1]);
  assert('tag3' == o.tags[2]);
  assert('abc' == o.refs[0].name.firstname);
  assert('def' == o.refs[0].name.lastname);
  assert('first name' == o.refs[1].name.firstname);
  assert('last name' == o.refs[1].name.lastname);
}

// simpl.test.collapseExpand();
// simpl.test.roundtrip();

