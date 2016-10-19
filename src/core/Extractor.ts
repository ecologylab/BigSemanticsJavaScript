/**
 * A general interface for extractors.
 */

/// <reference path="../../typings/index.d.ts" />

import * as Promise from 'bluebird';
import { HttpResponse, MetaMetadata, TypedMetadata } from './types';
import { BigSemantics } from './BigSemantics';

/**
 * Options for extraction.
 */
export interface ExtractionOptions {
  // TODO
}

/**
 * A general extractor interface.
 */
export interface Extractor {
  /**
   * A unique name for this extractor.
   */
  name: string;

  /**
   * Extract metadata from the given response, using the given wrapper.
   *
   * @param {HttpResponse} response
   * @param {MetaMetadata} mmd
   * @param {BigSemantics} bigSemanticsApi
   * @param {ExtractionOptions} options
   * @return {Promise<TypedMetadata>}
   */
  extractMetadata(response: HttpResponse,
                  mmd: MetaMetadata,
                  bigSemanticsApi?: BigSemantics,
                  options?: ExtractionOptions): Promise<TypedMetadata>;
}
