// SIMPL basic de/serialization.

var simpl = {}; // namespace

// keys
simpl.SIMPL_ID = "simpl.id";
simpl.SIMPL_REF = "simpl.ref";
simpl.SIMPL_VISITED_ID = "_simpl._visited"; // used to keep track of visited objects.

simpl.jsonEscape = function(str)
{
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
//
// Depth-first search on the given object. The object is treated as a tree.
//
// handlers is an object with callback functions as methods, to receive events
// and take actions while traversing the tree. possible callbacks include:
//
// - onScalar(elem, parent, name): traversing encounters a scalar element (e.g.
//   a string or a number). arguments:
//   - elem: the current element (in this case the scalar value)
//   - parent: the parent element from which the current element is found
//   - name: the field name of the current element in its parent element
//
// - onArray(elem, parent, name): traversing encounters an array. the arguments
//   are very similar to onScalar, except that the current element is an array
//   instead of a scalar value. explanation of arguments omitted.
//
// - onArrayEnd(elem, parent, name): traversing finishes with an array.
//
// - onSep(val, elem, i): traversing finishes with one element in an array, and
//   is about to traverse the next element. val is the next element that is
//   about to be traversed, elem is the array, and i is the index of val.
//
// - onObject(elem, parent, name): traversing encounters an object.
//
// - onFieldNames(elem, parent, name, fieldNames): before traversing into an
//   encountered object, this callback will be called with the object's field
//   names, so that the receiver can prepare itself.
//
// - onFieldName(elem, parent, name): before traversing into a field on an
//   encountered object, this callback will be called with the name of that
//   field, so that the receiver can prepare itself.
//
// - onObjectEnd(elem, parent, name): traversing finishes with an object.
//
// - onObjectRevisit(elem, parent, name): traversing encounters an object that
//   has been traversed before. it won't traverse this object again, to prevent
//   infinite loop.
//
// - skipField(field, elem, fieldName): before traversing into a field on an
//   encountered object, this callback will be called with the name of the
//   field, to determine if this field should be skipped.
//   - if the callback returns true, the field is skipped.
simpl.dfs = function(obj, options, handlers)
{
  // the initial ID, 1000, is hard coded. it is OK because no implementation
  // should depend on the value of the IDs, as long as IDs are unique.
  var visitId = 1000;
  var visited = {};

  // calls a particular callback, if that callback exists.
  function emit(handler)
  {
    if (handler && handler instanceof Function)
    {
      var args = [];
      for (var i = 1; i < arguments.length; ++i)
      {
        args.push(arguments[i]);
      }
      // Function.apply() is needed to treat args (an array) as an argument
      // list.
      return handler.apply(handlers, args);
    }
  }

  // a recursive procedure that actually does the traversing.
  function helper(elem, parentElem, name)
  {
    if (typeof elem === 'undefined')
    {
      return;
    }

    if (elem instanceof Array)
    {
      // case 1: current element is an array
      emit(handlers.onArray, elem, parentElem, name);
      for (var i in elem)
      {
        var val = elem[i];
        if (typeof val === 'undefined')
        {
          // not sure what we should do if there is an undefined in the array.
          val = null;
        }

        if (i > 0)
        {
          emit(handlers.onSep, val, elem, i);
        }
        helper(val, elem, i);
      }
      emit(handlers.onArrayEnd, elem, parentElem, name);
    }
    else if (elem && elem instanceof Object)
    {
      // case 2: current element is an object
      if (simpl.SIMPL_VISITED_ID in elem)
      {
        emit(handlers.onObjectRevisit, elem, parentElem, name);
        return; // visited before; skip to prevent infinite loop
      }
      // use a special property (visited mark) on the object to keep track of
      // visited ones. after normal traversing, these marks need to be cleared.
      elem[simpl.SIMPL_VISITED_ID] = visitId;
      visited[visitId] = elem;
      visitId += 1;

      emit(handlers.onObject, elem, parentElem, name);
      elem = parentElem[name]; // in case onObject() changes something

      if (elem)
      {
        var fieldNames = Object.getOwnPropertyNames(elem);
        emit(handlers.onFieldNames, elem, parentElem, name, fieldNames);
        var first = true;
        for (var i in fieldNames)
        {
          var fieldName = fieldNames[i];
          if (fieldName === simpl.SIMPL_VISITED_ID)
          {
            continue; // skip visited marks from traversing
          }

          var field = elem[fieldName];
          if (typeof field === 'undefined')
          {
            continue; // skip fields with undefined as values
          }

          if (emit(handlers.skipField, field, elem, fieldName))
          {
            continue; // skip fields if the receiver requests
          }

          if (!first)
          {
            emit(handlers.onSep, field, elem, fieldName);
          }
          first = false;
          emit(handlers.onFieldName, field, elem, fieldName);
          helper(field, elem, fieldName);
          i += 1;
        }
      }
      emit(handlers.onObjectEnd, elem, parentElem, name);
    }
    else
    {
      // case 3: scalar; type of elem: boolean, number, string, or null
      emit(handlers.onScalar, elem, parentElem, name);
    }
  }

  // wrap it so that the root can be changed if necessary
  var dumpWrap = { '$root$': obj };
  // do it!
  helper(obj, dumpWrap, '$root$');

  // finish: clear our visited marks
  for (var id in visited)
  {
    delete visited[id][simpl.SIMPL_VISITED_ID];
  }
}

// Replaces all cyclic references with an object stub containing only a
// simpl_ref.
//
// Operates on the object in place. Returns modified object, also.
simpl.graphCollapse = function(obj, options)
{
  if (typeof obj != 'object')
  {
    throw new Error("Must be an object");
  }

  // it works by doing a DFS traversing and replacing recurring objects with a
  // stub like { 'simpl_id': '1234' } through the onObjectRevisit() callback.
  simpl.dfs(obj, options, {
    onObjectRevisit: function(val, parentVal, name) {
      // val is the recurring object.
      // if val doesn't have 'simpl_id' in it, set it.
      if (!(simpl.SIMPL_ID in val))
      {
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
simpl.graphExpand = function(obj, options)
{
  if (typeof obj != 'object')
  {
    throw new Error("Must be an object");
  }

  // book keeping
  var simplObjs = {};

  // Pass 1: collect all objects comtaining simpl_id, by doing a DFS traversing
  // and using the onObject() callback:
  simpl.dfs(obj, options, {
    onObject: function(val, parentVal, name) {
      if (simpl.SIMPL_ID in val)
      {
        var id = val[simpl.SIMPL_ID];
        if (id in simplObjs)
        {
          console.warn("WARN: duplicate id: " + id);
        }
        else
        {
          // put that object into simplObjs with corresponding simpl_id, and
          // delete the original 'simpl_id' property because after expansion
          // they should be gone.
          simplObjs[id] = val;
          delete val[simpl.SIMPL_ID];
        }
      }
    }
  });

  // Pass 2: replace all object stubs containing simpl_ref, by doing another DFS
  // traversing and using the onObject() callback:
  simpl.dfs(obj, options, {
    onObject: function(val, parentVal, name) {
      if (simpl.SIMPL_REF in val)
      {
        var refId = val[simpl.SIMPL_REF];
        var ref = simplObjs[refId]; // try to find the object by simpl_ref ID.
        if (ref)
        {
          if (parentVal === null)
          {
            console.warn("WARN: parentObj is null, operation aborted.");
          }
          if (name === null)
          {
            console.warn("WARN: field name or index is null, operation aborted.");
          }
          parentVal[name] = ref; // replace the stub with the real object.
        }
        else
        {
          console.warn("WARN: unknown simpl_ref: " + refId);
        }
      }
    }
  });

  // (only when options.debugging is set)
  // check if there are simpl_id / simpl_ref left after expansion.
  if (options && options.debugging) {
    simpl.dfs(obj, options, {
      onObject: function(val, parentVal, name) {
        if (simpl.SIMPL_ID in val)
        {
          console.warn("WARN: uncollected simpl_id: " + val[simpl.SIMPL_ID]);
        }
        else if (simpl.SIMPL_REF in val)
        {
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
// options:
// - id_before_ref: make simpl_id always appear before simpl_ref's that
//                  refer to it, in the serialized form. this is required for
//                  some simpl deserialization libraries. up to 3x slower on V8.
//
// Returns the serialized string.
simpl.serialize = function(obj, options)
{
  // first, replace all recurring objects with a stub containing simpl_ref:
  simpl.graphCollapse(obj, options);

  var result = undefined;
  if (options && options.id_before_ref)
  {
    // the following process makes sure that simpl_id appears before
    // corresponding simpl_refs.
    var parts = [];

    // helper function to add multiple strings into parts.
    function output()
    {
      Array.prototype.push.apply(parts, arguments);
    }

    // manually converting an object into JSON through DFS traversing.
    simpl.dfs(obj, options, {
      onScalar: function(val, parentVal, name) {
        if (typeof val === 'string')
        {
          output('"', simpl.jsonEscape(val), '"');
        }
        else
        {
          output(String(val));
        }
      },
      onArray: function(val, parentVal, name) {
        output('[');
      },
      onArrayEnd: function(val, parentVal, name) {
        output(']');
      },
      onSep: function(val, parentVal, name) {
        output(',');
      },
      onObject: function(val, parentVal, name) {
        output('{');
      },
      onObjectEnd: function(val, parentVal, name) {
        output('}');
      },
      onFieldNames: function(val, parentVal, name, fieldNames) {
        // output simpl_id before all other fields:
        var k = fieldNames.indexOf(simpl.SIMPL_ID);
        if (k > 0)
        {
          var tmp = fieldNames[0];
          fieldNames[0] = simpl.SIMPL_ID;
          fieldNames[k] = tmp;
        }
      },
      onFieldName: function(val, parentVal, name) {
        output('"', name, '":');
      }
    });
    result = parts.join('');
  }
  else
  {
    result = JSON.stringify(obj);
  }
  simpl.graphExpand(obj, options);
  return result;
}

// Deserialize a string into a simpl object. Replace all cyclic references
// containing simpl_refs with the real objects identified by simpl_ids.
//
// Returns the deserialized object.
simpl.deserialize = function(str, options)
{
  return simpl.graphExpand(JSON.parse(str), options);
}

// for use in Node:
if (typeof module === 'object' && module)
{
  module.exports = simpl;
}

