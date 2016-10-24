/**
 * Declarations of basic types used by BigSemantics.
 */

import ParsedURL from './ParsedURL';

/**
 * Header of a HTTP request / response.
 */
export interface HttpHeader {
  name: string;
  value: string;
}

/**
 * A HTTP response.
 */
export interface HttpResponse {
  location: string;
  otherLocations?: string[];

  code: number;
  message?: string;
  headers?: HttpHeader[];
  contentType?: string;
  charset?: string;

  entity?: Document;
  xml?: Object;
  text?: string;
}

/**
 * Marker interface for FieldOps in meta-metadata.
 */
export interface FieldOp {
  // nothing
}

/**
 * Typed FieldOp.
 */
export interface TypedFieldOp {
  append?: AppendOp;
  decode_url?: DecodeUrlOp;
  get_param?: GetParamOp;
  match?: MatchOp;
  override_params?: OverrideParamsOp;
  prepend?: PrependOp;
  replace?: ReplaceOp;
  set_param?: SetParamOp;
  strip?: StripOp;
  strip_param?: StripParamOp;
  strip_params_but?: StripParamsButOp;
  substring?: SubstringOp;
}

export interface AppendOp extends FieldOp {
  value: string;
}

export interface DecodeUrlOp extends FieldOp {
  // nothing
}

export interface GetParamOp extends FieldOp {
  name: string;
  otherwise?: string;
}

export interface MatchOp extends FieldOp {
  pattern: string;
  group?: number;
  on_match?: string;
  on_find?: string;
  on_fail?: string;
}

export interface OverrideParamsOp extends FieldOp {
  // nothing
}

export interface PrependOp extends FieldOp {
  value: string;
}

export interface ReplaceOp extends FieldOp {
  pattern: string;
  first_only?: boolean;
  to?: string;
}

export interface SetParamOp extends FieldOp {
  name: string;
  value: string;
  only_when_not_set?: boolean;
}

export interface StripOp extends FieldOp {
  any_of: string;
}

export interface StripParamOp extends FieldOp {
  name: string;
}

export interface StripParamsButOp extends FieldOp {
  names: string[];
}

export interface SubstringOp extends FieldOp {
  after?: string;
  inclusive_after?: string;
  begin?: number;
  before?: string;
  inclusive_before?: string;
  end?: number;
}

export interface DefVar {
  type: string;
  name: string;
  xpaths?: string[];
}

export interface ConcatenateValue {
  from_var?: string;
  from_scalar?: string;
  constant_value?: string;
}

/**
 * A general meta-metadata field.
 */
export interface MetaMetadataField {
  name: string;
  tag?: string;
  xpaths?: string[];
  context_node?: string;
  def_vars?: DefVar[];
  field_ops?: FieldOp[];
  extract_as_html?: boolean;
  super_field?: MetaMetadataField;
  polymorphic_scope?: string;
  polymorphic_classes?: string;
}

export interface MetaMetadataScalarField extends MetaMetadataField {
  scalar_type: string;
  concatenate_values?: ConcatenateValue[];
  super_field?: MetaMetadataScalarField;
}

export interface MetaMetadataCompositeField extends MetaMetadataField {
  type: string;
  kids?: TypedMetaMetadataField[];
  super_field?: MetaMetadataCompositeField;
}

export interface MetaMetadataCollectionField extends MetaMetadataField {
  child_scalar_type?: string;
  child_type?: string;
  kids?: TypedMetaMetadataField[];
  super_field?: MetaMetadataCollectionField;
}

/**
 * A simpl-typed meta-metadata field.
 */
export interface TypedMetaMetadataField {
  scalar?: MetaMetadataScalarField;
  composite?: MetaMetadataCompositeField;
  collection?: MetaMetadataCollectionField;
}

export interface SelectorParam {
  name: string;
  value?: string;
  value_is_not?: string;
  allow_empty_value?: boolean;
}

export interface Selector {
  name: string;

  url_stripped?: string;

  domain?: string;
  url_path_tree?: string;
  url_regex?: string;
  url_regex_fragment?: string;

  mime_types?: string[];
  suffixes?: string[];

  reselect_meta_metadata_name?: string;
  reselect_fields?: { name: string, value: string }[];

  params?: SelectorParam[];

  targetType?: string;
}

export interface FilterLocation {
  ops: FieldOp[];
}

/**
 * A wrapper written in meta-metadata.
 */
export interface MetaMetadata extends MetaMetadataCompositeField {
  name: string;
  extends?: string;

  selectors?: Selector[];
  filter_location?: FilterLocation;

  extract_with?: string;
  
  kids: TypedMetaMetadataField[];
}

export type Wrapper = MetaMetadata;

/**
 * A wrapper repository.
 */
export interface Repository {
  default_cache_life?: string;
  build?: BuildInfo;
  user_agents?: { name: string, string: string }[];
  sites?: { domain: string, min_download_interval: number }[];
  named_styles?: { name: string }[];
  repository_by_name: MetaMetadata[];
  alt_names: { name: string, mmd: MetaMetadata }[];
}

/**
 * A simpl-typed wrapper repository.
 */
export interface TypedRepository {
  meta_metadata_repository: Repository;
}

export interface BuildInfo {
  date: string;
  host: string;
  user: string;
}

/**
 * A metadata instance.
 */
export interface Metadata {
  mm_name: string;
  location?: string;
  title?: string;

  mixins?: TypedMetadata[];

  [fieldName: string]: any;
}

/**
 * A marker interface for simpl-typed metadata instances.
 *
 * Instance should contain a field named with a metadata type, and valued with
 * the actual metadata. For example:
 *
 * ```javascript
 * // instance of TypedMetadata
 * {
 *   amazon_product: {
 *     mm_name: 'amazon_product',
 *     title: 'Some Awesome Product',
 *     location: 'http://www.amazon.com/some-awesome-product',
 *     ...
 *   }
 * }
 * ```
 */
export interface TypedMetadata {
  // nothing
}

export interface BSRequest {
  appId?: string;
  userId?: string;
  sessionId?: string;
  reqId?: string;
}

export interface BSResponse extends BSRequest {
  id?: string;
  repository?: Repository;
  wrapper?: MetaMetadata;
  metadata?: TypedMetadata;
}