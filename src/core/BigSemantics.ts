/**
 * BigSemantics API.
 */

/// <reference path="../../typings/index.d.ts" />

import * as Promise from 'bluebird';
import ParsedURL from './ParsedURL';
import Readyable from './Readyable';
import { HttpResponse, MetaMetadata, TypedMetadata } from './types';
import RepoMan, { RepoOptions, RepoCallOptions } from './RepoMan';
import { RequestOptions, Downloader } from './Downloader';
import { ExtractionOptions, Extractor } from './Extractor';
import { Cache, BaseCache } from './Cache';

export interface BigSemanticsOptions {
  // TODO
}

/**
 * Options for extracting a metadata instance.
 */
export interface MetadataOptions {
  mmd?: MetaMetadata;
  mmdName?: string;
  repoCallOptions?: RepoCallOptions;

  useDownloader?: string;
  response?: HttpResponse;
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
   * The repository manager.
   */
  repoMan: RepoMan;

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
  repoMan: RepoMan;
  metadataCache?: Cache<TypedMetadata>;
  downloaders?: {[name: string]: Downloader};
  extractors?: {[name: string]: Extractor};
}

/**
 * A basic implementation of BigSemantics.
 */
export class BaseBigSemantics extends Readyable implements BigSemantics {
  name = 'base';

  repoMan: RepoMan;
  private metadataCache: Cache<TypedMetadata>;
  private downloaders: { [name: string]: Downloader };
  private extractors: { [name: string]: Extractor };

  private options: BigSemanticsOptions;

  constructor(components: Components, options: BigSemanticsOptions = {}) {
    super();

    this.options = options;

    this.repoMan = components.repoMan;
    this.metadataCache = components.metadataCache || new BaseCache<TypedMetadata>();
    this.downloaders = components.downloaders;
    this.extractors = components.extractors;
    this.repoMan.onReady((err) => {
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

    // if (typeof IframeExtractor === 'function' && IframeExtractor){
    //     this.iframeExtractor = new IframeExtractor();
    // }
    // if (typeof PopUnderExtractor === 'function' && PopUnderExtractor){
    //     this.popUnderExtractor = new PopUnderExtractor();
    // }
  }

  loadMetadata(location: string | ParsedURL, options: MetadataOptions = {}): Promise<MetadataResult> {
    return new Promise<MetadataResult>((resolve, reject) => {
      this.onReady(err => {
        if (err) {
          reject(err);
          return;
        }

        let purl = ParsedURL.get(location);

        let mmd: MetaMetadata = null;
        let getMmd = () => {
          if (mmd) {
            return Promise.resolve(options.mmd);
          }
          if (options.mmd) {
            return Promise.resolve(options.mmd);
          }
          if (options.mmdName) {
            return this.repoMan.loadMmd(options.mmdName, options.repoCallOptions);
          }
          return this.repoMan.selectMmd(purl, options.repoCallOptions);
        };

        let getResp = () => {
          if (options.response) {
            return Promise.resolve(options.response);
          }
          let downloader: Downloader = null;
          for (let name in this.downloaders) {
            // TODO pick the right downloader
            // TODO in case of in browser extraction, we already have the DOM,
            // thus no need for a downloader. Maybe a dummy downloader?
            downloader = this.downloaders[name];
            break;
          }
          if (!downloader) {
            return Promise.reject(new Error("Missing downloader"));
          }
          return downloader.httpGet(purl, options.requestOptions);
        };

        let metadata = this.metadataCache.get(purl.toString(), url => {
          return Promise.all([getMmd(), getResp()]).then(result => {
            let extractor: Extractor = null;
            for (let name in this.extractors) {
              // TODO pick the right extractor
              // TODO iframe / popunder extractor
              extractor = this.extractors[name];
              break;
            }
            if (!extractor) {
              throw new Error("Missing extractor for " + url);
            }

            let mmd = result[0];
            let resp = result[1];
            return extractor.extractMetadata(resp, mmd, this, options.extractionOptions);
          });
        });

        if (options.includeMmdInResult) {
          resolve(Promise.all([metadata, getMmd()]).then(result => {
            let metadataResult: MetadataResult = {
              metadata: result[0],
              mmd: result[1],
            };
            return metadataResult;
          }));
        } else {
          resolve(metadata);
        }

        // if (mmd.extract_with == "service"){
        //   options.useHttps = (window.location.protocol == 'https:'); //use Https if we are on an https page
        //   that.bss.loadMetadata(location, options, callback);
        // }
      });
    });
  }

  loadInitialMetadata(location: string | ParsedURL, options: MetadataOptions = {}): Promise<MetadataResult> {
    return new Promise<MetadataResult>((resolve, reject) => {
      this.onReady(err => {
        if (err) {
          reject(err);
          return;
        }

        let url: string = null;
        let purl: ParsedURL = null;
        if (location instanceof ParsedURL) {
          purl = location;
          url = purl.toString();
        } else {
          url = location;
          purl = new ParsedURL(url);
        }

        resolve(this.repoMan.selectMmd(purl, options.repoCallOptions).then(mmd => {
          let typeTag = mmd.tag || mmd.name;
          let metadata = {
            mm_name: typeTag,
          }
          let typedMetadata: TypedMetadata = {};
          typedMetadata[typeTag] = metadata;
          let metadataResult: MetadataResult = {
            metadata: typedMetadata,
          };
          if (options.includeMmdInResult) {
            metadataResult.mmd = mmd;
          }
          return metadataResult;
        }));
      });
    });
  }
}
