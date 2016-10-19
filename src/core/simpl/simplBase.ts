/**
 * SIMPL basic de/serialization.
 *
 * To use this in browser, first compile it into JavaScript using tsc, then
 * browserify it with:
 *
 *   $ browserify --standalone simpl -o ../../bsjsCore/simpl/simplBase.js simplBase.js
 */

/**
 * A set of callback functions, to receive events and take actions while
 * traversing the object tree.
 */
export interface SimplHandlers {
  /**
   * Traversal encounters a scalar element (e.g. a string or a number).
   *
   * @param {any}           elem   The current (scalar) element.
   * @param {Object}        parent The parent element.
   * @param {string|number} key    The key of elem in parent.
   */
  onScalar?(elem: any, parent: Object, key: string|number): void;

  /**
   * Traversal encounters an array element.
   *
   * @param {any[]}         elem   The current (array) element.
   * @param {Object}        parent The parent element.
   * @param {string|number} key    The key of elem in parent.
   */
  onArray?(elem: any[], parent: Object, key: string|number): void;

  /**
   * Traversal finishes an array element.
   *
   * @param {any[]}         elem   The current (array) element.
   * @param {Object}        parent The parent element.
   * @param {string|number} key    The key of elem in parent.
   */
  onArrayEnd?(elem: any[], parent: Object, key: string|number): void;

  /**
   * Traversal finishes with one element in an array and is about to move to the
   * next element.
   *
   * @param {any}    val  The next element to be traversed.
   * @param {any[]}  elem The array.
   * @param {number} i    The index of val in elem.
   */
  onSep?(val: any, elem: any[], i: number): void;

  /**
   * Traversal encounters an object element.
   *
   * @param {Object}        elem   The current (object) element.
   * @param {Object}        parent The parent element.
   * @param {string|number} key    The key of elem in parent.
   */
  onObject?(elem: Object, parent: Object, key: string|number): void;

  /**
   * Before traversing into an object, this callback is called to notify the
   * field names.
   *
   * @param {Object}          elem       The object to be traversed.
   * @param {Object}          parent     The parent object.
   * @param {string|number}   key        The key of elem in parent.
   * @param {string[]}        fieldNames The field names in elem.
   */
  onFieldNames?(elem: Object, parent: Object, name: string|number, fieldNames: string[]): void;

  /**
   * Before traversing into a field, this callback is called to notify the name
   * of that field.
   *
   * @param {any}    field     The field to be traversed.
   * @param {Object} parent    The parent object.
   * @param {string} fieldName The name of field in parent.
   */
  onFieldName?(field: any, parent: Object, fieldName: string): void;

  /**
   * Traversal finishes an object.
   *
   * @param {Object}        elem   The object being finished.
   * @param {Object}        parent The parent object.
   * @param {string|number} key    The key of elem in parent.
   */
  onObjectEnd?(elem: Object, parent: Object, key: string|number): void;

  /**
   * Traversal encounters an object that has been visited before.
   *
   * Traversal should NOT go into visited objects, to prevent infinite loop.

   * @param {Object}        elem   The object being revisited.
   * @param {Object}        parent The parent object.
   * @param {string|number} key   The key of elem in parent.
   */
  onObjectRevisit?(elem: Object, parent: Object, key: string|number): void;

  /**
   * Before traversing into a field, this callback is called to notify the name
   * of the field, to determine if the field should be skipped.
   *
   * @param  {any}     field     The field value.
   * @param  {Object}  elem      The element the field belongs to.
   * @param  {string}  fieldName The name of the field.
   * @return {boolean}           Returns true iff the field should be skipped.
   */
  skipField?(field: any, elem: Object, fieldName: string): boolean;
}

export interface SimplOptions {
  /**
   * Show debugging information to console.
   */
  debugging?: boolean;

  /**
   * Make simpl.id always appear before simpl.refs that refer to it in the
   * serialized form.
   *
   * This is required for some simpl implementation to work.
   *
   * Up to 3x slower than JSON.parse() on V8.
   */
  id_before_ref?: boolean;
}

let simpl = {
  // constant key names
  SIMPL_ID: 'simpl.id',
  SIMPL_REF: 'simpl.ref',
  SIMPL_VISITED_ID: '_simpl._visited',

  /**
   * (For internal use only) Depth-first search on the given object.
   *
   * @param {Object}        obj      The object to be searched.
   * @param {SimplOptions}  options  Options for the DFS process.
   * @param {SimplHandlers} handlers Handlers for events in the DFS process.
   */
  dfs: function(obj: Object, options: SimplOptions = {}, handlers: SimplHandlers = {}): void
  {
    if (!obj || !(obj instanceof Object)) return;

    // The initial ID is hard coded as 1000. No implementation should depend on
    // the value of the IDs, as long as IDs are unique in the same object.
    let visitId = 1000;

    // Keep track of visited objects.
    let visited: any = {};

    /**
     * Calls a particular callback, if that callback exists.
     *
     * @param  {Function} handler The handler.
     * @param  {any[]}    ...args Arguments for that handler.
     * @return {any}              Any value from the receiver.
     */
    function emit(handler: Function, ...args: any[]): any
    {
      if (handler && handler instanceof Function)
      {
        // Function.apply() needed, to treat args as an argument list.
        return handler.apply(handlers, args);
      }
    }

    /**
     * A recursive procedure that actually does the DFS.
     *
     * @param {any}           elem       The current element.
     * @param {Object}        parentElem The parent element.
     * @param {string|number} key        The key of elem in parentElem.
     */
    function helper(elem: any, parentElem: Object, key: string|number): void
    {
      if (!elem) return;

      if (elem instanceof Array)
      {
        // case 1: current element is an array
        emit(handlers.onArray, elem, parentElem, key);
        let first = true;
        for (let i in elem)
        {
          let val = elem[i] || null;
          if (!first)
            emit(handlers.onSep, val, elem, i);
          first = false;
          helper(val, elem, i);
        }
        emit(handlers.onArrayEnd, elem, parentElem, key);
      }
      else if (elem instanceof Object)
      {
        // case 2: current element is an object
        if (simpl.SIMPL_VISITED_ID in elem)
        {
          emit(handlers.onObjectRevisit, elem, parentElem, key);
          return; // visited before; skip to prevent infinite loop
        }

        // use a special property (visited mark) on the object to keep track of
        // visited ones. after normal traversing, these marks need to be cleared.
        elem[simpl.SIMPL_VISITED_ID] = visitId;
        visited[visitId] = elem;
        visitId += 1;

        emit(handlers.onObject, elem, parentElem, key);
        elem = parentElem[key]; // in case onObject() changes something
        if (elem)
        {
          let fieldNames = Object.keys(elem);
          emit(handlers.onFieldNames, elem, parentElem, key, fieldNames);
          let first = true;
          for (let fieldName of fieldNames)
          {
            if (fieldName === simpl.SIMPL_VISITED_ID)
              continue;
            let field = elem[fieldName];
            if (!field)
              continue;
            if (emit(handlers.skipField, field, elem, fieldName))
              continue; // skip fields if the receiver asks to
            if (!first)
              emit(handlers.onSep, field, elem, fieldName);
            first = false;
            emit(handlers.onFieldName, field, elem, fieldName);
            helper(field, elem, fieldName);
          }
        }
        emit(handlers.onObjectEnd, elem, parentElem, key);
      }
      else
      {
        // case 3: scalar; type of elem: boolean, number, string, or null
        emit(handlers.onScalar, elem, parentElem, key);
      }
    }

    // wrap it so that the root can be changed if necessary
    let dumpWrap = { '$root$': obj };
    // do it!
    helper(obj, dumpWrap, '$root$');
    // finish: clear our visited marks
    for (let id in visited)
    {
      delete visited[id][simpl.SIMPL_VISITED_ID];
    }
  },

  /**
   * Replaces cyclic references with a stub containing only a simpl.ref.
   *
   * Operates on the object in place.
   *
   * @param  {Object}       obj     The object to be collapsed.
   * @param  {SimplOptions} options Options.
   * @return {Object}               Collapsed object.
   */
  graphCollapse: function(obj: Object, options?: SimplOptions): Object
  {
    if (typeof obj !== 'object' || !obj) return obj;

    // it works by doing a DFS traversing and replacing recurring objects with a
    // stub like { 'simpl_id': '1234' } through the onObjectRevisit() callback.
    simpl.dfs(obj, options, {
      onObjectRevisit: (val, parentVal, key) => {
        // val is the recurring object.
        // if val doesn't have 'simpl_id' in it, set it.
        if (!(simpl.SIMPL_ID in val))
          val[simpl.SIMPL_ID] = val[simpl.SIMPL_VISITED_ID];
        parentVal[key] = {};
        parentVal[key][simpl.SIMPL_REF] = val[simpl.SIMPL_ID];
      }
    });
    return obj;
  },

  /**
   * Replaces each stub containing simpl.ref with the real object identified by
   * simpl.id.
   *
   * Operates on the object in place.
   *
   * @param  {Object}       obj     The object to be expanded.
   * @param  {SimplOptions} options Options.
   * @return {Object}               The expanded object.
   */
  graphExpand: function(obj: Object, options?: SimplOptions): Object
  {
    if (typeof obj !== 'object' || !obj) return obj;

    // book keeping
    let simplObjs: any = {};

    // Pass 1: collect all objects comtaining simpl_id, by doing a DFS traversing
    // and using the onObject() callback:
    simpl.dfs(obj, options, {
      onObject: (val, parentVal, key) => {
        if (simpl.SIMPL_ID in val)
        {
          let id = val[simpl.SIMPL_ID];
          if (id in simplObjs)
          {
            console.warn("Duplicate simpl.id: " + id);
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
      onObject: (val, parentVal, key) => {
        if (simpl.SIMPL_REF in val)
        {
          let refId = val[simpl.SIMPL_REF];
          let ref = simplObjs[refId]; // try to find the object by simpl_ref ID.
          if (!ref)
          {
            console.warn("Aborted: Unknown simpl.ref: " + refId);
            return;
          }
          if (!parentVal)
          {
            console.warn("Aborted: parentObj cannot be undefined or null");
            return;
          }
          if (!key)
          {
            console.warn("Aborted: field name or index cannot be undefind or null.");
            return;
          }
          parentVal[key] = ref; // replace the stub with the real object.
        }
      }
    });

    // (only when options.debugging is set)
    // check if there are simpl_id / simpl_ref left after expansion.
    if (options && options.debugging)
    {
      simpl.dfs(obj, options, {
        onObject: (val, parentVal, key) => {
          if (simpl.SIMPL_ID in val)
          {
            console.warn("Uncollected simpl.id: " + val[simpl.SIMPL_ID]);
          }
          if (simpl.SIMPL_REF in val)
          {
            let refId = val[simpl.SIMPL_REF];
            console.warn("Unresolved simpl.ref: " + refId + " in " + parentVal);
          }
        },
      });
    }

    return obj;
  },

  /**
   * Serialize an object. The object can contain cyclic references.
   *
   * The input object is modified during the process, but restored before it
   * returns.
   *
   * @param  {Object}       obj     The object to be serialized.
   * @param  {SimplOptions} options Options.
   * @return {string}               The serialized representation.
   */
  serialize: function(obj: Object, options?: SimplOptions): string
  {
    /**
     * Helper function to add multiple strings into an array.
     *
     * @param  {string[]} array   The array.
     * @param  {string[]} ...args Strings to add to the array.
     */
    function output(array: string[], ...args: string[])
    {
      Array.prototype.push.apply(array, args);
    }

    /**
     * Escape special charaters in the input string in JSON way.
     *
     * @param  {[type]} str The raw input string.
     * @return {[type]}     The escaped string.
     */
    function jsonEscape(str)
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

    // first, replace all recurring objects with a stub containing simpl_ref:
    simpl.graphCollapse(obj, options);

    let result = undefined;
    if (options && options.id_before_ref)
    {
      // the following process makes sure that simpl_id appears before
      // corresponding simpl_refs.
      let parts = [];

      // manually converting an object into JSON through DFS traversing.
      simpl.dfs(obj, options, {
        onScalar: (val, parentVal, key) => {
          if (typeof val === 'string')
          {
            output(parts, '"', jsonEscape(val), '"');
          }
          else
          {
            output(parts, String(val));
          }
        },
        onArray: (val, parentVal, key) => {
          output(parts, '[');
        },
        onArrayEnd: (val, parentVal, key) => {
          output(parts, ']');
        },
        onSep: (val, parentVal, key) => {
          output(parts, ',');
        },
        onObject: (val, parentVal, key) => {
          output(parts, '{');
        },
        onObjectEnd: (val, parentVal, key) => {
          output(parts, '}');
        },
        onFieldNames: (val, parentVal, key, fieldNames) => {
          // output simpl_id before all other fields:
          let k = fieldNames.indexOf(simpl.SIMPL_ID);
          if (k > 0)
          {
            let tmp = fieldNames[0];
            fieldNames[0] = simpl.SIMPL_ID;
            fieldNames[k] = tmp;
          }
        },
        onFieldName: (val, parentVal, key) => {
          output(parts, '"', key, '":');
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
  },

  /**
   * Deserialize a string into an object.
   *
   * @param  {string}       serial  The serialized representation.
   * @param  {SimplOptions} options Options.
   * @return {Object}               The deserialized object.
   */
  deserialize: function(serial: string, options?: SimplOptions): Object
  {
    return simpl.graphExpand(JSON.parse(serial), options);
  }
};

export default simpl;
