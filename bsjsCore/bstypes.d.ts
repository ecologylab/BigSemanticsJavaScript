// Base type declarations.

export interface MetaMetadata {
  name: string;
}

export interface Metadata {
  mm_name: string;
}

export interface Response {
  location: string;
  otherLocations?: Array<string>;

  code: number;
  contentType?: string;
  charset?: string;

  entity?: Object;
  xml?: Object;
  text?: string;
}

