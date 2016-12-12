/**
 * An abstract BigSemantics implementation.
 */

import * as Promise from 'bluebird';
import ParsedURL from '../core/ParsedURL';
import Readyable from '../core/Readyable';
import {
  MetaMetadata,
  BuildInfo,
  TypedRepository,
  Metadata,
  TypedMetadata,
  BSResult,
} from '../core/types';
import { PreFilter } from '../core/FieldOps';
import RepoMan from '../core/RepoMan';
import {
  BigSemanticsCallOptions,
  BigSemantics,
} from '../core/BigSemantics';

/**
 * An abstract implementation of BigSemantics, providing a basic implementation
 * for loadInitialMetadata().
 */
export abstract class AbstractBigSemantics extends Readyable implements BigSemantics {
  abstract loadMetadata(location: string | ParsedURL, options?: BigSemanticsCallOptions): Promise<BSResult>;

  loadInitialMetadata(location: string | ParsedURL, options: BigSemanticsCallOptions = {}): Promise<BSResult> {
    let purl = ParsedURL.get(location);
    let url = purl.toString();
    return this.selectMmd(purl, options.repoCallOptions).then(mmd => {
      let type = mmd.tag || mmd.name;

      let metadata: Metadata = {
        mm_name: type,
      };
      let newUrl = url;
      if (mmd.filter_location) {
        newUrl = PreFilter.filter(url, mmd.filter_location);
      }
      if (newUrl === url) {
        metadata.location = url;
      } else {
        metadata.location = newUrl;
        metadata['additional_locations'] = [ newUrl ];
      }

      let typedMetadata: TypedMetadata = {
        type: type,
      };
      typedMetadata[type] = metadata;

      let result: BSResult = {
        metadata: typedMetadata,
      };
      if (options.includeMmdInResult) {
        result.mmd = mmd;
      }
      return result;
    });
  }

  abstract getBuildInfo(options?: BigSemanticsCallOptions): Promise<BuildInfo>;
  abstract getUserAgentString(userAgentName: string, options?: BigSemanticsCallOptions): Promise<string>;
  abstract getDomainInterval(domain: string, options?: BigSemanticsCallOptions): Promise<number>;
  abstract loadMmd(name: string, options?: BigSemanticsCallOptions): Promise<MetaMetadata>;
  abstract selectMmd(location: string | ParsedURL, options?: BigSemanticsCallOptions): Promise<MetaMetadata>;
  abstract normalizeLocation(location: string | ParsedURL, options?: BigSemanticsCallOptions): Promise<string>;
  abstract getRepository(options?: BigSemanticsCallOptions): Promise<TypedRepository>;
}
