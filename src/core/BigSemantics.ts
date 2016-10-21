/**
 * BigSemantics API.
 */

/// <reference path="../../typings/index.d.ts" />

import * as Promise from 'bluebird';
import ParsedURL from './ParsedURL';
import { uuid } from '../core/utils';
import Readyable from './Readyable';
import {
  HttpResponse,
  MetaMetadata,
  Repository,
  TypedRepository,
  Metadata,
  TypedMetadata,
} from './types';
import RepoMan, {
  RepoOptions,
  RepoCallOptions,
  RepoManService,
  LoadableRepoManService,
} from './RepoMan';
import { RequestOptions, Downloader } from './Downloader';
import { ExtractionOptions, Extractor } from './Extractor';
import { Cache, BaseCache } from './Cache';

export interface BigSemanticsOptions extends RepoOptions {
  appId: string;
  appVer: string;

  timeout?: number; // TODO implement support for timeout

  repoOptions?: RepoOptions;
}

/**
 * Options for extracting a metadata instance.
 */
export interface MetadataOptions {
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
export interface BigSemantics {
  /**
   * A unique name identifying this implementation.
   */
  name: string;

  /**
   * Loads a metadata instance from the given location.
   *
   * @param {string | ParsedURL} location
   * @param {MetadataOptions} options
   * @return {Promise<MetadataResult>}
   */
  loadMetadata(location: string | ParsedURL, options?: MetadataOptions): Promise<MetadataResult>;

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
  loadInitialMetadata(location: string | ParsedURL, options?: MetadataOptions): Promise<MetadataResult>;
}

/**
 * Components used by BigSemantics.
 */
export interface Components {
  repoMan?: RepoMan;
  metadataCache?: Cache<TypedMetadata>;
  downloaders?: {[name: string]: Downloader};
  extractors?: {[name: string]: Extractor};
}

export abstract class AbstractBigSemantics extends Readyable implements BigSemantics, RepoManService {
  name = 'bsabs_' + uuid(3);

  protected options: BigSemanticsOptions;

  protected metadataCache: Cache<TypedMetadata>;
  protected downloaders: { [name: string]: Downloader };
  protected extractors: { [name: string]: Extractor };

  constructor(components: Components, options: BigSemanticsOptions) {
    super();

    this.options = options;

    this.metadataCache = components.metadataCache || new BaseCache<TypedMetadata>();
    this.downloaders = components.downloaders || {};
    this.extractors = components.extractors || {};
    /*
    this.repoMan.onReady(err => {
      if (err) {
        this.setError(err);
        return;
      }
      for (let name in this.downloaders) {
        let downloader = this.downloaders[name];
        downloader.setDomainIntervals(this.repoMan.options.domainIntervals);
      }
      this.setReady();
    });
    */

    // if (typeof IframeExtractor === 'function' && IframeExtractor){
    //     this.iframeExtractor = new IframeExtractor();
    // }
    // if (typeof PopUnderExtractor === 'function' && PopUnderExtractor){
    //     this.popUnderExtractor = new PopUnderExtractor();
    // }
  }

  loadMetadata(location: string | ParsedURL, options: MetadataOptions = {}): Promise<MetadataResult> {
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

      // if (mmd.extract_with == "service"){
      //   options.useHttps = (window.location.protocol == 'https:'); //use Https if we are on an https page
      //   that.bss.loadMetadata(location, options, callback);
      // }
    });
  }

  loadInitialMetadata(location: string | ParsedURL, options: MetadataOptions = {}): Promise<MetadataResult> {
    return this.onReadyP().then(() => {
      let purl = ParsedURL.get(location);

      return this.selectMmd(purl, options.repoCallOptions).then(mmd => {
        let typeTag = mmd.tag || mmd.name;
        let metadata = {
          mm_name: typeTag,
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

  abstract getUserAgentString(userAgentName: string): Promise<string>;
  abstract getDomainInterval(domain: string): Promise<number>;
  abstract loadMmd(name: string, options?: RepoCallOptions): Promise<MetaMetadata>;
  abstract selectMmd(location: string | ParsedURL, options?: RepoCallOptions): Promise<MetaMetadata>;
  abstract normalizeLocation(location: string | ParsedURL, options?: RepoCallOptions): Promise<string>;
  abstract untypeMetadata(typedMetadata: TypedMetadata, options?: RepoCallOptions): Promise<Metadata>;
  abstract serializeRepository(options?: RepoCallOptions): Promise<string>;
}

/**
 * A basic implementation of BigSemantics.
 */
export class BaseBigSemantics extends AbstractBigSemantics {
  name = 'bsbas_' + uuid(3);

  protected repoMan: RepoMan;

  constructor(components: Components, options: BigSemanticsOptions) {
    super(components, options);

    this.repoMan = components.repoMan;
    this.repoMan.onReady(err => {
      if (err) {
        this.setError(err);
        return;
      }
      for (let name in this.downloaders) {
        let downloader = this.downloaders[name];
        downloader.setDomainIntervals(this.repoMan.options.domainIntervals);
      }
      this.setReady();
    });
  }

  getUserAgentString(userAgentName: string): Promise<string> {
    return this.repoMan.getUserAgentString(userAgentName);
  }

  getDomainInterval(domain: string): Promise<number> {
    return this.repoMan.getDomainInterval(domain);
  }

  loadMmd(name: string, options?: RepoCallOptions): Promise<MetaMetadata> {
    return this.repoMan.loadMmd(name, options);
  }

  selectMmd(location: string | ParsedURL, options?: RepoCallOptions): Promise<MetaMetadata> {
    return this.repoMan.selectMmd(location, options);
  }

  normalizeLocation(location: string | ParsedURL, options?: RepoCallOptions): Promise<string> {
    return this.repoMan.normalizeLocation(location, options);
  }

  untypeMetadata(typedMetadata: TypedMetadata, options?: RepoCallOptions): Promise<Metadata> {
    return this.repoMan.untypeMetadata(typedMetadata, options);
  }

  serializeRepository(options?: RepoCallOptions): Promise<string> {
    return this.repoMan.serializeRepository(options);
  }
}

export class ReloadableBaseBigSemantics extends BaseBigSemantics {
  name = 'bsbasr_' + uuid(3);

  constructor(components: Components, options: BigSemanticsOptions) {
    super(components, options);
  }

  reload(): void {
    this.reset();
    this.repoMan.reload();
    this.repoMan.onReady(err => {
      if (err) {
        this.setError(err);
        return;
      }
      this.setReady();
    });
  }
}

export class LoadableBaseBigSemantics extends ReloadableBaseBigSemantics {
  name = 'bsbasl_' + uuid(3);

  constructor(components: Components, options: BigSemanticsOptions) {
    super(components, options);
  }

  load(repository: Repository|TypedRepository, options?: RepoOptions): void {
    this.reset();
    this.repoMan.load(repository, options);
    this.repoMan.onReady(err => {
      if (err) {
        this.setError(err);
        return;
      }
      this.setReady();
    });
  }
}
