/**
 * XPath-based metadata extractor.
 */

// TODO inherited xpath issue: we need more test cases to actually address this
// TODO more field ops: predicates, parallels, pattern matchers, etc

/// <reference path="../../typings/index.d.ts" />

import * as Promise from 'bluebird';
import ParsedURL from './ParsedURL';
import Scope from './Scope';
import {
  HttpResponse,
  DefVar,
  MetaMetadataField,
  MetaMetadataScalarField,
  MetaMetadataCompositeField,
  MetaMetadataCollectionField,
  TypedMetaMetadataField,
  MetaMetadata,
  Metadata,
  TypedMetadata,
} from './types';
import { FieldOps } from './FieldOps';
import { ExtractionOptions, Extractor } from './Extractor';
import { BigSemantics } from './BigSemantics';


interface Vars {
  [varName: string]: any;
}
/**
 * A special scope for xpath-based extraction.
 */
export class ExtractionScope extends Scope {
  _parent: ExtractionScope;
  _subscopes: ExtractionScope[];

  rootNode: Node;
  contextNode: Node;

  field: MetaMetadataField;

  vars: Vars;
  node: Node;
  nodes: Node[];
  collectionIndex: number;

  value: any;
  innerHTML: string;

  constructor(id: string, parent: ExtractionScope = null) {
    super(id, parent);
  }
}

/**
 * A class representing an extraction task.
 */
export class Extraction {
  private response: HttpResponse;
  private location: ParsedURL;
  private rootNode: Document;
  private mmd: MetaMetadata;
  private bigsemanticsApi: BigSemantics;
  private options: ExtractionOptions;
  private scope: ExtractionScope;
  private metadata: Metadata;
  private typeTag: string;
  private typedMetadata: TypedMetadata;

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
  constructor(resp: HttpResponse, mmd: MetaMetadata, bigsemanticsApi: BigSemantics, options: ExtractionOptions = {}) {
    if (!resp.entity) {
      throw new Error("Response (resp) must have entity, the root DOM");
    }
    this.response = resp;
    this.location = new ParsedURL(this.response.location);
    this.rootNode = resp.entity;
    this.mmd = mmd;
    this.bigsemanticsApi = bigsemanticsApi;
    this.options = options;
  }

  isScalar(field: TypedMetaMetadataField): boolean {
    return field.scalar ? true : false;;
  }

  isScalarCollection(field: TypedMetaMetadataField): boolean {
    return (field.collection && field.collection.child_scalar_type) ? true : false;
  }

  isComposite(field: TypedMetaMetadataField): boolean {
    return field.composite ? true : false;
  }

  isCompositeCollection(field: TypedMetaMetadataField): boolean {
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
  getContextNode(field: MetaMetadataField, parentScope: ExtractionScope): Node {
    let result = null;
    if (field.context_node) {
      result = parentScope.trace(field.context_node, 'vars');
    } else {
      result = parentScope.node;
    }
    if (result === null) {
      throw new Error("Cannot find context node for " + field.name);
    }
    return result;
  }

  /**
   * Handles def_vars defined inside a field, using its local scope.
   * @param  {MetaMetadataField} field
   *   The mmd field containing def_vars.
   * @param  {Scope} localScope
   *   The extraction scope for this field.
   * @return {Vars} An object containing def let names and values.
   */
  handleDefVars(field: MetaMetadataField, localScope: ExtractionScope): Vars {
    let result: Vars = {};
    if (field.def_vars instanceof Array) {
      for (let defVar of field.def_vars) {
        if (defVar.type === 'node') {
          if (defVar.name && defVar.xpaths instanceof Array) {
            for (let xpath of defVar.xpaths) {
              let targetNode = this.evaluateFirstNode(xpath, localScope.contextNode);
              if (targetNode) {
                result[defVar.name] = targetNode;
                break;
              }
            }
          }
        } else {
          throw new Error("Unknown def_let type: " + defVar.type);
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
  amendXpath(xpath: string, parentScope: ExtractionScope = null): string {
    let result = xpath;
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
        result = result.replace(/\$i/, String(parentScope.collectionIndex));
      }
    }
    return result;
  }

  evaluateFirstNode(xpath: string, contextNode: Node, parentScope: ExtractionScope = null): Node {
    xpath = this.amendXpath(xpath, parentScope);
    let xres = this.rootNode.evaluate(xpath, contextNode, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    return xres ? xres.singleNodeValue : null;
  }

  evaluateAllNodes(xpath: string, contextNode: Node, parentScope: ExtractionScope = null): Node[] {
    xpath = this.amendXpath(xpath, parentScope);
    let xres = this.rootNode.evaluate(xpath, contextNode, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    let result = [];
    if (xres) {
      for (let i = 0; i < xres.snapshotLength; ++i) {
        result.push(xres.snapshotItem(i));
      }
    }
    return result;
  }

  /**
   * Turns a scalar value represented in raw string to a typed value.
   * TODO there could be a ScalarTypeManager.
   *
   * @param  {string} val
   *   The scalar value in a raw string.
   * @param  {string} scalarType
   *   The scalar type.
   * @return {any} The converted, typed value.
   */
  toTypedScalar(val: string, scalarType: string): any {
    let result: any = val;
    if (val && scalarType) {
      switch (scalarType) {
        case 'String':
          break;
        case 'Int':
        case 'Integer':
        case 'Float':
        case 'Double':
        case 'Number':
          result = Number(val);
          break;
        case 'Bool':
        case 'Boolean':
          result = Boolean(val);
          break;
        case 'URL':
        case 'ParsedURL':
          result = new ParsedURL(val, this.location.base);
          // FIXME filter purl asynchronously
          break;
        default:
          throw new Error("Invalid scalar type: " + scalarType);
      }
    }
    return result;
  }

  /**
   * Extract a scalar value.
   *
   * @param {MetaMetadataScalarField} field
   * @param {ExtractionScope} parentScope
   * @return {Promise<any>}
   */
  extractScalar(field: MetaMetadataScalarField, parentScope: ExtractionScope): Promise<any> {
    // step 1: prepare objects used in extraction
    let contextNode = this.getContextNode(field, parentScope);
    let value = null;

    // step 2: do extraction

    // TODO case 2.1: extract from previous field op result

    // case 2.2: regular xpath extraction
    if (!value && contextNode && field.xpaths instanceof Array) {
      for (let xpath of field.xpaths) {
        let node = this.evaluateFirstNode(xpath, contextNode, parentScope);
        if (node) {
          if (field.extract_as_html && node instanceof Element) {
            value = node.innerHTML;
          } else {
            value = node.textContent.trim();
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
    return Promise.resolve(value);
  }

  /**
   * Extract a scalar collection.
   *
   * @param {MetaMetadataCollectionField} field
   * @param {ExtractionScope} parentScope
   * @return {Promise<any[]>}
   */
  extractScalarCollection(field: MetaMetadataCollectionField, parentScope: ExtractionScope): Promise<any[]> {
    // step 1: prepare objects used in extraction
    let contextNode = this.getContextNode(field, parentScope);
    let value = null;

    // step 2: do extraction

    // TODO case 2.1: extract from previous field op result

    // case 2.2: regular xpath extraction
    if (!value && contextNode && field.xpaths instanceof Array) {
      for (let xpath of field.xpaths) {
        let nodes = this.evaluateAllNodes(xpath, contextNode, parentScope);
        if (nodes.length > 0) {
          value = [];
          for (let node of nodes) {
            if (field.extract_as_html && node instanceof Element) {
              value.push(node.innerHTML);
            } else {
              value.push(node.textContent.trim());
            }
          }
          break;
        }
      }
    }

    // TODO step 3: apply field ops

    if (value && value.length > 0) {
      let typed = [];
      for (let i in value) {
        typed.push(this.toTypedScalar(value[i], field.child_scalar_type));
      }
      return Promise.resolve(value);
    }
    return Promise.resolve(null);
  }

  /**
   * If srcField is inheriting from targetField.
   *
   * @param {MetaMetadataField} srcField
   * @param {MetaMetadataField} targetField
   * @return {Boolean}
   */
  isFieldInheritingFrom(srcField: MetaMetadataField, targetField: MetaMetadataField): boolean {
    if (srcField) {
      let f = targetField;
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
   *
   * @param {Scope} scope
   *   The current scope.
   * @return {Boolean}
   */
  isInfiniteRecursion(scope: ExtractionScope): boolean {
    if (scope) {
      let field = scope.field;
      let contextNode = scope.contextNode;
      if (field && contextNode) {
        let ancestor = scope._parent;
        while (ancestor) {
          let inheriting = this.isFieldInheritingFrom(field, ancestor.field);
          let inherited = this.isFieldInheritingFrom(ancestor.field, field);
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

  /**
   * Extract a composite value.
   *
   * @param {MetaMetadataCompositeField} field
   * @param {ExtractionScope} parentScope
   * @return {Promise<Metadata>}
   */
  extractComposite(field: MetaMetadataCompositeField, parentScope: ExtractionScope): Promise<Metadata> {
    // step 1: prepare local scope for extracting nested fields
    let localScope = new ExtractionScope(field.name, parentScope);
    localScope.field = field;
    localScope.contextNode = this.getContextNode(field, parentScope);
    localScope.vars = this.handleDefVars(field, localScope);
    localScope.value = null;
    let done = false; // true iff localScope is ready for extraction

    // detect and prevent infinite recursion
    if (this.isInfiniteRecursion(localScope)) {
      // console.warn("Infinite recursion detected on " + field.name);
      return Promise.resolve(null);
    }

    // case 1.1: extract root metadata as composite
    if (parentScope.rootNode) {
      localScope.value = {
        mm_name: null,
        location: this.response.location,
        additional_locations: this.response.otherLocations,
      };
      localScope.node = parentScope.rootNode;
    }

    // TODO case 1.2: extract from previous field op result (and set done)

    // case 1.3: regular xpath extraction
    if (!done && localScope.contextNode) {
      let xpaths = field.xpaths || [];
      /* FIXME this solution to the inherited xpath issue doesn't work for all
       * cases. we need to have more test cases to address it.
      let superFieldXpaths = this.unwrapField(field.super_field || {}).xpaths || [];
      if (!parentScope.rootNode && xpaths.length === superFieldXpaths.length) {
        localScope.node = localScope.contextNode;
        localScope.authoredKidsOnly = true;
        localScope.value = localScope.value || {};
        done = true;
      }
      else {
      */
        for (let xpath of xpaths) {
          let node = this.evaluateFirstNode(xpath, localScope.contextNode, parentScope);
          if (node) {
            localScope.node = node;
            localScope.value = localScope.value || { mm_name: null };
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
      (localScope.value as Metadata).mm_name = field.type || field.name;
      let kids = field.kids || [];
      /* FIXME (solution to the inherited xpath issue)
      // if we only allow authored kids to be extracted, filter `kids`.
      if (localScope.authoredKidsOnly) {
        if (!field._authored_kids) {
          field._authored_kids = [];
          let superkids = this.unwrapField(field.super_field || {}).kids || [];
          for (let i = 0; i < field.kids.length; ++i) {
            let kid = kids[i];
            let found = false;
            for (let j = 0; j < superkids.length; ++j) {
              let superkid = superkids[j];
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
      return this.extractFields(kids, localScope, localScope.value as Metadata);
    }

    return Promise.resolve(null);
  }

  /**
   * Extract a composite collection.
   *
   * @param {MetaMetadataCollectionField} field
   * @param {ExtractionScope} parentScope
   * @return {Promise<Metadata[]>}
   */
  extractCompositeCollection(field: MetaMetadataCollectionField, parentScope: ExtractionScope): Promise<Metadata[]> {
    let surrogateComposite = null;
    if (field.kids instanceof Array && field.kids.length === 1) {
      surrogateComposite = field.kids[0].composite;
    }
    if (!surrogateComposite) {
      console.warn("Invalid surrogate composite on " + field.name);
      return Promise.resolve(null);
    }

    // step 1: prepare local scope for extracting nested fields
    let localScope = new ExtractionScope(field.name, parentScope);
    localScope.field = field;
    localScope.contextNode = this.getContextNode(field, parentScope);
    localScope.vars = this.handleDefVars(field, localScope);
    localScope.value = [];
    let done = false;

    // detect and prevent infinite recursion
    if (this.isInfiniteRecursion(localScope)) {
      // console.warn("Infinite recursion detected on " + field.name);
      return Promise.resolve(null);
    }

    // TODO case 1.1: extract from previous field op result

    // case 1.2: regular xpath extraction
    if (!done && field.xpaths instanceof Array) {
      for (let xpath of field.xpaths) {
        localScope.nodes = this.evaluateAllNodes(xpath, localScope.contextNode, parentScope);
        if (localScope.nodes.length > 0) {
          done = true;
          break;
        }
      }
    }

    // step 2: extract nested fields using newly created local scope
    if (done) {
      let promises: Promise<Metadata>[] = [];
      for (let i = 0; i < localScope.nodes.length; ++i) {
        let localScopei = new ExtractionScope('$' + i, localScope);
        localScopei.collectionIndex = i+1;
        localScopei.node = localScope.nodes[i];
        localScopei.value = {
          mm_name: surrogateComposite.type || surrogateComposite.name,
        };
        promises.push(this.extractFields(surrogateComposite.kids, localScopei, localScopei.value as Metadata));
      }
      return Promise.all(promises).then(() => {
        return localScope.value;
      });
    }

    return Promise.resolve(null);
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
  extractFields(fieldList: TypedMetaMetadataField[], parentScope: ExtractionScope, obj: Metadata): Promise<Metadata> {
    if (!(fieldList instanceof Array)) {
      return Promise.reject(new Error("Missing meta-metadata field list"));
    }

    let sorted: TypedMetaMetadataField[] = [];
    for (let field of fieldList) {
      if (this.isScalar(field)) {
        sorted.push(field);
      }
    }
    sorted = this.sortFieldsByDependency(sorted);
    for (let field of fieldList) {
      if (!this.isScalar(field)) {
        sorted.push(field);
      }
    }

    let promises: Promise<Metadata>[] = [];
    for (let field of fieldList) {
      if (this.isScalar(field)) {
        promises.push(this.extractScalar(field.scalar, parentScope).then(scalar => {
          if (scalar) {
            if (!(scalar instanceof String) || scalar.length > 0) {
              obj[field.scalar.tag || field.scalar.name] = scalar;
            }
          }
          return obj;
        }));
      } else if (this.isScalarCollection(field)) {
        promises.push(this.extractScalarCollection(field.collection, parentScope).then(scalars => {
          if (scalars instanceof Array && scalars.length > 0) {
            obj[field.scalar.tag || field.scalar.name] = scalars;
          }
          return obj;
        }));
      } else if (this.isComposite(field)) {
        promises.push(this.extractComposite(field.composite, parentScope).then(composite => {
          if (composite && Object.keys(composite).length > 1) {
            if (field.composite.polymorphic_scope || field.composite.polymorphic_classes) {
              // TODO change mm_name based on location
              obj[field.composite.name][composite.mm_name] = composite;
            } else {
              obj[field.composite.tag || field.composite.name] = composite;
            }
          }
          return obj;
        }));
      } else if (this.isCompositeCollection(field)) {
        promises.push(this.extractCompositeCollection(field.collection, parentScope).then(composites => {
          if (composites instanceof Array && composites.length > 0) {
            if (field.collection.polymorphic_scope || field.collection.polymorphic_classes) {
              obj[field.collection.name] = [];
              for (let composite of composites) {
                // TODO change mm_name based on location
                let typedComposite: TypedMetadata = {};
                typedComposite[composite.mm_name] = composite;
                obj[field.collection.name].push(typedComposite);
              }
            } else {
              obj[field.collection.tag || field.collection.name] = composites;
            }
          }
          return obj;
        }));
      } else {
        console.warn("Ignoring unknown field type: " + field);
      }
    }

    return Promise.all(promises).then(() => {
      return obj;
    });
  }

  /**
   * Unwrap a meta-metadata field.
   * @param {MetaMetadataField} field
   * @return {Object} The unwrapped field, if `field` is a wrapped
   * MetaMetadataField, or the input itself unchanged.
   */
  unwrapField(field: TypedMetaMetadataField): MetaMetadataField {
    if (field.scalar) {
      return field.scalar;
    }
    if (field.composite) {
      return field.composite;
    }
    if (field.collection) {
      return field.collection;
    }
    return field as MetaMetadataField;
  }

  /**
   * Sort the input list of fields by dependency, i.e. if A depends on B, in the
   * output, B precedes A.
   * @param {Array<MetaMetadataField>} fieldList
   *   The list of fields to be sorted.
   * @return {Array<MetaMetadataField} The sorted list of fields.
   */
  sortFieldsByDependency(fieldList: TypedMetaMetadataField[]): TypedMetaMetadataField[] {
    if (fieldList instanceof Array) {
      let result: TypedMetaMetadataField[] = [];

      let map: {[fieldName: string]: TypedMetaMetadataField} = {}; // name => field
      for (let field of fieldList) {
        map[this.unwrapField(field).name] = field;
      }

      // topological sort
      let visited: {[fieldName: string]: TypedMetaMetadataField} = {}; // name => boolean; used for DFS
      let marked: {[fieldName: string]: TypedMetaMetadataField} = {}; // name => boolean; used to detect cyclic dependencies.
      for (let field of fieldList) {
        let name = this.unwrapField(field).name;
        if (!(name in visited)) {
          this.visitDependency(map, name, visited, marked, result);
        }
      }

      return result;
    }
    return fieldList;
  }

  /**
   * Visit a dependency, for topological ordering.
   *
   * @param {TypedMetaMetadataField}} fieldMap
   * @param {string} fieldName
   * @param {TypedMetaMetadataField}} visited
   * @param {TypedMetaMetadataField}} marked
   * @param {TypedMetaMetadataField[]} result
   */
  visitDependency(fieldMap: {[fieldName: string]: TypedMetaMetadataField},
                  fieldName: string,
                  visited: {[fieldName: string]: TypedMetaMetadataField},
                  marked: {[fieldName: string]: TypedMetaMetadataField},
                  result: TypedMetaMetadataField[]): void {
    if (fieldName in marked) {
      // console.warn("Cyclic dependency among fields detected in %O", fieldMap);
      throw new Error("Cyclic dependency detected in " + fieldMap);
    }
    let field = fieldMap[fieldName];
    if (!(fieldName in visited)) {
      marked[fieldName] = true;
      if (field.scalar && field.scalar.concatenate_values instanceof Array) {
        for (let concatVal of field.scalar.concatenate_values) {
          if (concatVal.from_scalar && concatVal.from_scalar.length > 0) {
            this.visitDependency(fieldMap, concatVal.from_scalar, visited, marked, result);
          }
        }
      }
      delete marked[fieldName];
      visited[fieldName] = true;
      result.push(field);
    }
  }

  /**
   * Start extraction. Calls callback when finished.
   * @return {Promise<TypedMetadata>}
   */
  extract(): Promise<TypedMetadata> {
    this.scope = new ExtractionScope('$');
    this.scope.field = this.mmd;
    this.scope.rootNode = this.rootNode;
    this.scope.node = this.rootNode;

    return this.extractComposite(this.mmd, this.scope).then(metadata => {
      console.log("Extraction finished: %O", this.metadata);
      this.typeTag = this.mmd.tag || this.mmd.name;
      this.typedMetadata = {};
      this.typedMetadata[this.typeTag] = this.metadata;
      return this.typedMetadata;
    });
  }
}

export default class XpathExtractor implements Extractor {
  name = 'xpath';

  extractMetadata(response: HttpResponse,
                  mmd: MetaMetadata,
                  bigsemanticsApi: BigSemantics,
                  options?: ExtractionOptions): Promise<TypedMetadata> {
    let extraction = new Extraction(response, mmd, bigsemanticsApi, options);
    return extraction.extract();
  }
}
