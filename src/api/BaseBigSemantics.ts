/**
 * A basic, but still abstract implementation of BigSemantics.
 */

import * as Promise from 'bluebird';
import ParsedURL from '../core/ParsedURL';
import Readyable from '../core/Readyable';
import {
  HttpResponse,
  MetaMetadata,
  BuildInfo,
  TypedRepository,
  Metadata,
  TypedMetadata,
  BSResult,
} from '../core/types';
import { PreFilter } from '../core/FieldOps';
import RepoMan from '../core/RepoMan';
import { Extractor } from '../core/Extractor';
import {
  BigSemanticsCallOptions,
  BigSemantics,
} from '../core/BigSemantics';
import { AbstractBigSemantics } from "./AbstractBigSemantics";

/**
 * A basic implementation providing a template for loadMetadata().
 */
export abstract class BaseBigSemantics extends AbstractBigSemantics {
  loadMetadata(location: string | ParsedURL, options: BigSemanticsCallOptions = {}): Promise<BSResult> {
    let purl = ParsedURL.get(location);
    return this.getMmd(purl, options).then(mmd => {
      return this.getResponse(purl, options).then(resp => {
        let extractorNames = [ options.useExtractor, mmd.extract_with, mmd.parser ];
        let extractor: Extractor = this.getExtractor(extractorNames);
        if (!extractor) {
          throw new Error("Can't find extractor: " + extractorNames.join(" or "));
        }
        return extractor.extractMetadata(resp, mmd, this, options.extractionOptions).then(metadata => {
          let result: BSResult = {
            metadata: metadata,
          };
          if (options.includeMmdInResult) {
            result.mmd = mmd;
          }
          return result;
        });
      })
    });
  }

  protected getMmd(purl: ParsedURL, options?: BigSemanticsCallOptions): Promise<MetaMetadata> {
    if (options.mmd) {
      return Promise.resolve(options.mmd);
    }
    if (options.mmdName) {
      return this.loadMmd(options.mmdName, options);
    }
    return this.selectMmd(purl, options);
  }

  protected abstract getResponse(purl: ParsedURL, options?: BigSemanticsCallOptions): Promise<HttpResponse>;

  protected abstract getExtractor(names: string[]): Extractor;
}
