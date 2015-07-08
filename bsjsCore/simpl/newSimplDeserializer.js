/**
 * Iterates through the Simpl object to match up the simpl_ids and simpl_refs.
 *
 * @param simplObj, object to deserialize.
 */
function simplDeserialize(simplObj) {
  // const
	var SIMPL_ID = "simpl.id";
	var SIMPL_REF = "simpl.ref";

  // book keeping
  var simplObjs = {};

  // idCallback: (obj, parentObj, fieldName) => void
  // refCallback: (obj, parentObj, fieldName) => resolvedObj
  function dfs(obj, parentObj, fieldName, idCallback, refCallback) {
    var VISITED_MARK = "_simpl_visited";
    var visitId = 1;
    var visited = {};

    function helper(obj, parentObj, fieldName, idCallback, refCallback) {
      if (obj != null && obj instanceof Object) {
        // first of all, re
        if (SIMPL_REF in obj) {
          if (refCallback) {
            obj = refCallback(obj, parentObj, fieldName);
            if (!obj) { return; }
          }
        }

        if (obj[VISITED_MARK]) { return; }
        obj[VISITED_MARK] = visitId;
        visited[visitId] = obj;
        visitId++;

        for (var subfieldName in obj) {
          if (obj.hasOwnProperty(subfieldName)) {
            var subfield = obj[subfieldName];
            if (subfield instanceof Array) {
              for(var i = 0; i < subfield.length; i++) {
                helper(subfield[i], subfield, i, idCallback, refCallback);
              }
            } else if (subfield instanceof Object) {
              helper(subfield, obj, subfieldName, idCallback, refCallback);
            }
          }
        }

        if (SIMPL_ID in obj) {
          if (idCallback) { idCallback(obj, parentObj, fieldName); }
        }
      }
    }

    // do it!
    helper(obj, parentObj, fieldName, idCallback, refCallback);

    // finish: clear our visited marks
    for (var id in visited) {
      delete visited[id][VISITED_MARK];
    }
  }

  // Pass 1: collect all objects comtaining simpl_id
  dfs(simplObj, null, null, function(obj, parentObj, fieldName) {
    var id = obj[SIMPL_ID];
    if (id in simplObjs) {
      console.error("Error: already collected: " + id);
    } else {
      simplObjs[id] = obj;
      delete obj[SIMPL_ID];
    }
  });

  // Pass 2: replace all object stubs containing simpl_ref
  dfs(simplObj, null, null, null, function(obj, parentObj, fieldName) {
    var refId = obj[SIMPL_REF];
    var ref = simplObjs[refId];
    if (ref) {
      if (parentObj == null) {
        console.error("Error: parentObj cannot be null.");
        return null;
      }
      if (fieldName == null) {
        console.error("Error: fieldName cannot be null.");
        return null;
      }
      parentObj[fieldName] = ref;
      return ref;
    } else {
      console.error("Error: unknown simpl_ref: " + refId);
    }
    return null;
  });

  /*
  // testing: 
  dfs(simplObj, null, null, function(obj, parentObj, fieldName) {
    var id = obj[SIMPL_ID];
    console.error("Error: uncollected simpl_id: " + id);
  }, function(obj, parentObj, fieldName) {
    var refId = obj[SIMPL_REF];
    console.error("Error: unresolved simpl_ref: " + refId);
    console.log(parentObj);
    return obj;
  });
  */
}

/*
// testing:
var fs = require('fs');
var repoJson = fs.readFileSync('tests/testRepo.json');
var repo = JSON.parse(repoJson);
simplDeserialize(repo);
*/

