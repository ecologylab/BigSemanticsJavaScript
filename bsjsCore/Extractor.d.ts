// Extractor type definition.

import { Response } from './Downloader';
import { MetaMetadata, Metadata, IBigSemantics } from './BigSemantics';

export interface IExtractor {
  (response: Response,
   mmd: MetaMetadata,
   bigSemantics: IBigSemantics,
   options: any,
   callback: (err: Error, metadata: Metadata)=>void): void;
}

export interface IExtractorSync {
  (response: Response,
   mmd: MetaMetadata,
   bigSemantics: IBigSemantics,
   options: any): Metadata;
}

export declare var extractMetadata: IExtractor;
export declare var extractMetadataSync: IExtractorSync;
