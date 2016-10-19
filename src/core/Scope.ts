/**
 * A convenient calss for creating cascaded scopes.
 */

/**
 * A (nested) scope.
 */
export default class Scope {
  readonly _id: string;
  readonly _parent: Scope;
  _subscopes: Scope[];

  [name: string]: any;

  /**
   * @constructor
   * @param {string} id
   *   The ID of this scope.
   * @param {Scope} parent
   *   The parent scope.
   */
  constructor(id: string, parent: Scope = null) {
    this._id = (parent ? (parent._id + '.') : '') + id;
    if (parent) {
      this._parent = parent;
      if (!(this._parent._subscopes instanceof Array)) {
        this._parent._subscopes = [];
      }
      this._parent._subscopes.push(this);
    }
  }

  /**
   * Trace a value in this scope and its ancestors for a given key.
   *
   * @param  {string} key
   *   The key to the value to be traced.
   * @param  {string} componentName
   *   The name of the component to trace in this scope and its ancestors. Each
   *   scope can have multiple components.
   * @return {any}
   *   The first value with the given key (and in the component, if specified)
   *   in this scope or in its ancestors.
   */
  trace(key: string, componentName?: string): any {
    let obj: Scope = this;
    while (obj) {
      let comp = componentName ? obj[componentName] : obj;
      if (comp && key in comp) {
        return comp[key];
      }
      obj = obj._parent;
    }
    return null;
  }
}
