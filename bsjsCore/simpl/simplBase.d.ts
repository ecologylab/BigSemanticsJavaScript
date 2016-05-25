// Type declarations for simplBase. For use with TypeScript.

export interface simplHandlers {
  onArray?(elem: Array<any>, parentElem: Object, name: any): void;
  onSep?(val: any, elem: Object, i: any): void;
  onArrayEnd?(elem: Array<any>, parentElem: Object, name: any): void;

  onObject?(elem: Object, parentElem: Object, name: any): void;
  onObjectRevisit?(elem: Object, parentElem: Object, name: any): void;
  onFieldNames?(elem: Object, parentElem: Object, name: any, fieldNames: Array<string>): void;
  onFieldName?(field: any, elem: Object, fieldName: string): void;
  skipField?(field: any, elem: Object, fieldName: string): boolean;
  onObjectEnd?(elem: Object, parentElem: Object, name: any): void;

  onScalar?(elem: any, parentElem: Object, name: any): void;
}

export var SIMPL_ID: string;
export var SIMPL_REF: string;
export var SIMPL_VISITED_ID: string;

export function jsonEscape(s: string): string;

export function dfs(obj: Object, options: Object, handlers: simplHandlers): void;

export function graphCollapse(obj: Object, options?: Object): Object;
export function graphExpand(obj: Object, options?: Object): Object;

export function serialize(obj: Object, options?: Object): string;
export function deserialize(s: string, options?: Object): Object;

