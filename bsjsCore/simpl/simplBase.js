// SIMPL basic de/serialization.

var SimplBase = function() {

  // const
	var SIMPL_ID = "simpl.id";
	var SIMPL_REF = "simpl.ref";
  var SIMPL_VISITED_ID = "_simpl._visited";

  /** Serialize an object with cyclic references.
   * 
   * If you know the object does not contain cyclic references, use
   * JSON.stringify instead since it's about twice faster (on V8).
   */
  this.serialize = function(obj) {
    if (typeof obj != 'object') {
      throw { error: "Must be an object" };
    }

    var parts = [];

    function output(strs) {
      Array.prototype.push.apply(parts, strs);
    }

    var visitId = 1000;
    var visited = {};

    function handle(that) {
      if (typeof that == 'object') {
        if (SIMPL_VISITED_ID in that) {
          if (!(SIMPL_ID in that)) {
            that[SIMPL_ID] = String(that[SIMPL_VISITED_ID]);
          }
          output('{"', SIMPL_REF, '":', that[SIMPL_ID], '"}');
        } else {
          that[SIMPL_VISITED_ID] = visitId;
          visited[visitId] = that;
          visitId += 1;

          output('{');
          var first = true;
          for (var name in that) {
            if (!first) { output(','); }
            first = false;
            output('"', name, '":');
            handle(that[name]);
          }
          output('}');
        }
      } else if (typeof that == 'array') {
        output('[');
        var first = true;
        for (var i in that) {
          if (!first) { output(','); }
          first = false;
          handle(that[i]);
        }
        output(']');
      } else if (typeof that == 'number') {
        output(String(that));
      } else {
        output('"', String(that), '"');
      }
    }

    // do it!
    handle(obj);

    // finish: clear our visited marks
    for (var id in visited) {
      delete visited[id][SIMPL_VISITED_ID];
    }

    return parts.join('');
  }

  /**
   * Deserialize a simpl object. Restore all cyclic references, if any exists
   * represented by simpl_ids and simpl_refs.
   *
   * @param simplObj, object to deserialize.
   */
  this.simplDeserialize = function(simplObj) {

    // book keeping
    var simplObjs = {};

    // idCallback: (obj, parentObj, name) => void
    // refCallback: (obj, parentObj, name) => resolvedObj
    //   (note that refCallback should return the resolved object)
    function dfs(obj, parentObj, name, idCallback, refCallback) {
      var SIMPL_VISITED_ID = "_simpl_visited";
      var visitId = 1;
      var visited = {};

      function helper(obj, parentObj, name, idCallback, refCallback) {
        if (obj != null && obj instanceof Object) {
          // first of all, resolve ref on the current object.
          if (SIMPL_REF in obj) {
            if (refCallback) {
              obj = refCallback(obj, parentObj, name);
              if (!obj) { return; }
            }
          }

          if (SIMPL_VISITED_ID in obj) { return; }
          obj[SIMPL_VISITED_ID] = visitId;
          visited[visitId] = obj;
          visitId += 1;

          for (var subname in obj) {
            var sub = obj[subname];
            if (sub instanceof Array) {
              for(var i = 0; i < sub.length; i++) {
                helper(sub[i], sub, i, idCallback, refCallback);
              }
            } else if (sub instanceof Object) {
              helper(sub, obj, subname, idCallback, refCallback);
            }
          }

          if (SIMPL_ID in obj) {
            if (idCallback) { idCallback(obj, parentObj, name); }
          }
        }
      }

      // do it!
      helper(obj, parentObj, name, idCallback, refCallback);

      // finish: clear our visited marks
      for (var id in visited) {
        delete visited[id][SIMPL_VISITED_ID];
      }
    }

    // Pass 1: collect all objects comtaining simpl_id
    dfs(simplObj, null, null, function(obj, parentObj, name) {
      var id = obj[SIMPL_ID];
      if (id in simplObjs) {
        console.warn("Warn: already collected: " + id);
      } else {
        simplObjs[id] = obj;
        delete obj[SIMPL_ID];
      }
    });

    // Pass 2: replace all object stubs containing simpl_ref
    dfs(simplObj, null, null, null, function(obj, parentObj, name) {
      var refId = obj[SIMPL_REF];
      var ref = simplObjs[refId];
      if (ref) {
        if (parentObj == null) {
          console.error("Error: parentObj cannot be null.");
          return null;
        }
        if (name == null) {
          console.error("Error: field name cannot be null.");
          return null;
        }
        parentObj[name] = ref;
        return ref;
      } else {
        console.error("Error: unknown simpl_ref: " + refId);
      }
      return null;
    });

    /*
    // testing: 
    dfs(simplObj, null, null, function(obj, parentObj, name) {
      var id = obj[SIMPL_ID];
      console.error("Error: uncollected simpl_id: " + id);
    }, function(obj, parentObj, name) {
      var refId = obj[SIMPL_REF];
      console.error("Error: unresolved simpl_ref: " + refId);
      console.log(parentObj);
      return obj;
    });
    */
  }
  
  return this;
}

/*
// testing:
var fs = require('fs');
var repoJson = fs.readFileSync('tests/testRepo.json');
var repo = JSON.parse(repoJson);
simplDeserialize(repo);
*/
