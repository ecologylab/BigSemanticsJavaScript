/**
 * BigSemantics API.
 */

/// <reference path="../../typings/index.d.ts" />

import * as Promise from 'bluebird';
import ParsedURL from './ParsedURL';
import Readyable from './Readyable';
import {
  HttpResponse,
  MetaMetadata,
  BuildInfo,
  Repository,
  TypedRepository,
  Metadata,
  TypedMetadata,
} from './types';
import { PreFilter } from './FieldOps';
import RepoMan, {
  RepoOptions,
  RepoCallOptions,
  RepoManService,
} from './RepoMan';
import { RequestOptions, Downloader } from './Downloader';
import { ExtractionOptions, Extractor } from './Extractor';
import { Cache, BaseCache } from './Cache';

export interface BigSemanticsComponents {
  repoMan?: RepoMan;
  metadataCache?: Cache<TypedMetadata>;
  downloaders?: {[name: string]: Downloader};
  extractors?: {[name: string]: Extractor};
}

export interface BigSemanticsOptions extends RepoOptions {
  timeout?: number; // TODO implement support for timeout

  repoOptions?: RepoOptions;
}

/**
 * Options for extracting a metadata instance.
 */
export interface BigSemanticsCallOptions extends RepoCallOptions {
  userId?: string;
  sessionId?: string;
  reqId?: string;

  timeout?: number; // TODO implement support for timeout

  mmd?: MetaMetadata;
  mmdName?: string;
  repoCallOptions?: RepoCallOptions;

  response?: HttpResponse;
  useDownloader?: string;
  requestOptions?: RequestOptions;

  useExtractor?: string;
  extractionOptions?: ExtractionOptions;

  includeMmdInResult?: boolean;
}

/**
 * Result of extracting a metadata instance.
 */
export interface MetadataResult {
  metadata: TypedMetadata,
  mmd?: MetaMetadata,
}

/**
 * A general interface for BigSemantics.
 */
export interface BigSemantics extends RepoManService {
  /**
   * Loads a metadata instance from the given location.
   *
   * @param {string | ParsedURL} location
   * @param {MetadataOptions} options
   * @return {Promise<MetadataResult>}
   */
  loadMetadata(location: string | ParsedURL, options?: BigSemanticsCallOptions): Promise<MetadataResult>;

  /**
   * Loads an initial metadata instance from the given location.
   * This method picks the appropriate wrapper and applies location filtering,
   * but does not initiate network operations.
   *
   * @param {string | ParsedURL} location
   * @param {MetadataOptions} options
   * @return {Promise<MetadataResult>}
   *   Note that the result contains an initial, thus incomplete, metadata.
   */
  loadInitialMetadata(location: string | ParsedURL, options?: BigSemanticsCallOptions): Promise<MetadataResult>;

  getBuildInfo(options?: BigSemanticsCallOptions): Promise<BuildInfo>;
  getRepository(options?: BigSemanticsCallOptions): Promise<TypedRepository>;
  getUserAgentString(userAgentName: string, options?: BigSemanticsCallOptions): Promise<string>;
  getDomainInterval(domain: string, options?: BigSemanticsCallOptions): Promise<number>;
  loadMmd(name: string, options?: BigSemanticsCallOptions): Promise<MetaMetadata>;
  selectMmd(location: string | ParsedURL, options?: BigSemanticsCallOptions): Promise<MetaMetadata>;
  normalizeLocation(location: string | ParsedURL, options?: BigSemanticsCallOptions): Promise<string>;
  untypeMetadata(typedMetadata: TypedMetadata, options?: BigSemanticsCallOptions): Promise<Metadata>;
}

export abstract class AbstractBigSemantics extends Readyable implements BigSemantics {
  protected options: BigSemanticsOptions;
  protected metadataCache: Cache<TypedMetadata> = new BaseCache<TypedMetadata>();
  protected downloaders: { [name: string]: Downloader } = {};
  protected extractors: { [name: string]: Extractor } = {};

  initialize(options: BigSemanticsOptions = {}, components: BigSemanticsComponents = {}): Promise<void> {
    this.options = options;
    if (components.metadataCache) {
      this.metadataCache = components.metadataCache;
    }
    if (components.downloaders) {
      this.downloaders = components.downloaders;
    }
    if (components.extractors) {
      this.extractors = components.extractors;
    }
    return Promise.resolve();
  }

  getMetadataCache(): Promise<Cache<TypedMetadata>> {
    return this.onReadyP().then(() => {
      return this.metadataCache;
    });
  }

  loadMetadata(location: string | ParsedURL, options: BigSemanticsCallOptions = {}): Promise<MetadataResult> {
    return this.onReadyP().then(() => {
      let purl = ParsedURL.get(location);

      let mmd: MetaMetadata = null;
      let getMmd = () => {
        if (mmd || options.mmd) {
          return Promise.resolve(mmd || options.mmd);
        }
        let result: Promise<MetaMetadata> = null;
        if (options.mmdName) {
          result = this.loadMmd(options.mmdName, options.repoCallOptions);
        } else {
          result = this.selectMmd(purl, options.repoCallOptions);
        }
        return result.then(mmdResult => {
          mmd = mmdResult;
          return mmdResult;
        });
      };

      let getResp = () => {
        if (options.response) {
          return Promise.resolve(options.response);
        }

        let downloader: Downloader = null;

        if (options.useDownloader) {
          if (!(options.useDownloader in this.downloaders)) {
            let err = new Error("Unknown downloader: " + options.useDownloader);
            return Promise.reject(err);
          }
          downloader = this.downloaders[options.useDownloader];
        }

        if (!downloader) {
          // otherwise, use first downloader that is available.
          for (let name in this.downloaders) {
            downloader = this.downloaders[name];
            break;
          }
        }

        if (!downloader) {
          return Promise.reject(new Error("Missing downloader"));
        }
        return downloader.httpGet(purl, options.requestOptions);
      };

      let metadata = this.metadataCache.get(purl.toString(), url => {
        return Promise.all([getMmd(), getResp()]).then(result => {
          let mmd = result[0], resp = result[1];

          let extractor: Extractor = null;

          if (options.useExtractor) {
            if (!(options.useExtractor in this.extractors)) {
              let err = new Error("Unknown extractor: " + options.useExtractor);
              return Promise.reject(err);
            }
            extractor = this.extractors[options.useExtractor];
          }

          if (!extractor && mmd.extract_with) {
            if (!(mmd.extract_with in this.extractors)) {
              let err = new Error("Unknown extractor: " + mmd.extract_with);
              return Promise.reject(err);
            }
            extractor = this.extractors[mmd.extract_with];
          }

          // TODO iframe / popunder extractor
          // TODO extract_with === 'service'

          if (!extractor) {
            // otherwise, use first extractor that is available.
            for (let name in this.extractors) {
              extractor = this.extractors[name];
              break;
            }
          }

          if (!extractor) {
            return Promise.reject(new Error("Missing extractor"));
          }
          return extractor.extractMetadata(resp, mmd, this, options.extractionOptions);
        });
      });

      return metadata.then(m => {
        let result: MetadataResult = {
          metadata: m,
        };
        if (options.includeMmdInResult) {
          result.mmd = mmd;
        }
        return result;
      });
    });
  }

  loadInitialMetadata(location: string | ParsedURL, options: BigSemanticsCallOptions = {}): Promise<MetadataResult> {
    return this.onReadyP().then(() => {
      let purl = ParsedURL.get(location);
      return this.selectMmd(purl, options.repoCallOptions).then(mmd => {
        let typeTag = mmd.tag || mmd.name;
        let metadata: Metadata = {
          mm_name: typeTag,
        }
        if (mmd.filter_location) {
          metadata.location = PreFilter.filter(purl.toString(), mmd.filter_location);
        } else {
          metadata.location = purl.toString();
        }
        let typedMetadata: TypedMetadata = {};
        typedMetadata[typeTag] = metadata;
        let result: MetadataResult = {
          metadata: typedMetadata,
        };
        if (options.includeMmdInResult) {
          result.mmd = mmd;
        }
        return result;
      });
    });
  }

  abstract getBuildInfo(options?: BigSemanticsCallOptions): Promise<BuildInfo>;
  abstract getUserAgentString(userAgentName: string, options?: BigSemanticsCallOptions): Promise<string>;
  abstract getDomainInterval(domain: string, options?: BigSemanticsCallOptions): Promise<number>;
  abstract loadMmd(name: string, options?: BigSemanticsCallOptions): Promise<MetaMetadata>;
  abstract selectMmd(location: string | ParsedURL, options?: BigSemanticsCallOptions): Promise<MetaMetadata>;
  abstract normalizeLocation(location: string | ParsedURL, options?: BigSemanticsCallOptions): Promise<string>;
  abstract untypeMetadata(typedMetadata: TypedMetadata, options?: BigSemanticsCallOptions): Promise<Metadata>;
  abstract getRepository(options?: BigSemanticsCallOptions): Promise<TypedRepository>;
}

/**
 * A basic implementation of BigSemantics.
 */
export class BaseBigSemantics extends AbstractBigSemantics {
  protected repoMan: RepoMan = new RepoMan();

  initialize(options: BigSemanticsOptions = {}, components: BigSemanticsComponents = {}): Promise<void> {
    super.initialize(options, components);
    if (components.repoMan) {
      this.repoMan = components.repoMan;
    }
    return this.repoMan.onReadyP().then(() => {
      for (let name in this.downloaders) {
        let downloader = this.downloaders[name];
        downloader.setDomainIntervals(this.repoMan.options.domainIntervals);
      }
      this.setReady();
    });
  }

  getBuildInfo(options?: BigSemanticsCallOptions): Promise<BuildInfo> {
    return this.repoMan.getBuildInfo(options);
  }

  getRepository(options?: BigSemanticsCallOptions): Promise<TypedRepository> {
    return this.repoMan.getRepository(options);
  }

  getUserAgentString(userAgentName: string): Promise<string> {
    return this.repoMan.getUserAgentString(userAgentName);
  }

  getDomainInterval(domain: string): Promise<number> {
    return this.repoMan.getDomainInterval(domain);
  }

  loadMmd(name: string, options?: BigSemanticsCallOptions): Promise<MetaMetadata> {
    return this.repoMan.loadMmd(name, options);
  }

  selectMmd(location: string | ParsedURL, options?: BigSemanticsCallOptions): Promise<MetaMetadata> {
    return this.repoMan.selectMmd(location, options);
  }

  normalizeLocation(location: string | ParsedURL, options?: BigSemanticsCallOptions): Promise<string> {
    return this.repoMan.normalizeLocation(location, options);
  }

  untypeMetadata(typedMetadata: TypedMetadata, options?: BigSemanticsCallOptions): Promise<Metadata> {
    return this.repoMan.untypeMetadata(typedMetadata, options);
  }
}
