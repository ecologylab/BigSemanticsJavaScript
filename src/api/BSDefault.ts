/**
 * This module enables using BigSemantics through (potentially cross-origin)
 * XHR.
 */

import * as Promise from 'bluebird';
import * as simpl from 'simpl.js';
import ParsedURL from '../core/ParsedURL';
import {
  HttpResponse,
  MetaMetadata,
  BuildInfo,
  Repository,
  TypedRepository,
} from '../core/types';
import { RepoOptions } from '../core/RepoMan';
import { Downloader } from '../core/Downloader';
import { Extractor } from '../core/Extractor';
import { RepoLoader, create as createRepoLoader } from '../core/RepoLoader';
import ServiceRepoLoader from '../downloaders/ServiceRepoLoader';
import XHRDownloader from '../downloaders/XHRDownloader';
import XPathExtractor from '../extractors/XPathExtractor';
import { BigSemanticsOptions, BigSemanticsCallOptions } from '../core/BigSemantics';
import { BaseBigSemantics } from './BaseBigSemantics';

/**
 * Options for BSDefault.
 */
export interface BSDefaultOptions extends BigSemanticsOptions {
  appId: string;
  appVer: string;

  repository?: Repository | TypedRepository;
  repositoryUrl?: string | ParsedURL;
  serviceBase?: string | ParsedURL;

  repoOptions?: RepoOptions;
  cacheRepoFor?: string;
  disableRepoCaching?: boolean;
  requesterFactory?: ()=>Downloader;

  downloaders?: { [name: string]: Downloader };
  extractors?: { [name: string]: Extractor };
}

/**
 * A BigSemantics implementation using the BigSemantics web service through
 * (potentially cross-origin) XHR.
 */
export class BSDefault extends BaseBigSemantics {
  private options: BSDefaultOptions;

  private repoLoader: RepoLoader;
  private downloaders: { [name: string]: Downloader } = {};
  private extractors: { [name: string]: Extractor } = {};

  getServiceBase(): ParsedURL {
    if (this.repoLoader instanceof ServiceRepoLoader) {
      return this.repoLoader.getServiceHelper().getServiceBase();
    }
    return null;
  }

  load(options: BSDefaultOptions): void {
    this.reset();

    this.options = options;

    if (options.downloaders) {
      this.downloaders = options.downloaders;
    }
    if (!this.downloaders || Object.keys(this.downloaders).length == 0) {
      this.downloaders = { xhr: new XHRDownloader() };
    }

    if (options.extractors) {
      this.extractors = options.extractors;
    }
    if (!this.extractors || Object.keys(this.extractors).length == 0) {
      this.extractors = { xpath: new XPathExtractor() };
    }

    this.repoLoader = createRepoLoader(options);

    this.repoLoader.getRepoMan().then(() => {
      this.setReady();
    }).catch(err => {
      this.setError(err);
    });
  }

  reload(): void {
    if (typeof this.repoLoader['reload'] === 'function') {
      this.repoLoader['reload']();
    } else {
      let err = new Error("repoLoader not reloadable");
      console.error(err);
    }
  }

  protected getResponse(purl: ParsedURL, options: BigSemanticsCallOptions = {}): Promise<HttpResponse> {
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
  }

  protected getExtractor(names: string[]): Extractor {
    for (let name of names) {
      if (name && name in this.extractors) {
        return this.extractors[name];
      }
    }
    return null;
  }

  getBuildInfo(options: BigSemanticsCallOptions = {}): Promise<BuildInfo> {
    return this.repoLoader.getRepoMan().then(repoMan => repoMan.getBuildInfo(options));
  }

  getRepository(options: BigSemanticsCallOptions = {}): Promise<Repository> {
    return this.repoLoader.getRepoMan().then(repoMan => repoMan.getRepository(options));
  }

  getSerializedRepository(options: BigSemanticsCallOptions = {}): Promise<string> {
    return this.repoLoader.getRepoMan().then(repoMan => repoMan.getSerializedRepository(options));
  }

  getUserAgentString(userAgentName: string, options: BigSemanticsCallOptions = {}): Promise<string> {
    return this.repoLoader.getRepoMan().then(repoMan => repoMan.getUserAgentString(userAgentName, options));
  }

  getDomainInterval(domain: string, options: BigSemanticsCallOptions = {}): Promise<number> {
    return this.repoLoader.getRepoMan().then(repoMan => repoMan.getDomainInterval(domain, options));
  }

  loadMmd(name: string, options: BigSemanticsCallOptions = {}): Promise<MetaMetadata> {
    return this.repoLoader.getRepoMan().then(repoMan => repoMan.loadMmd(name, options));
  }

  selectMmd(location: string | ParsedURL, options: BigSemanticsCallOptions = {}): Promise<MetaMetadata> {
    return this.repoLoader.getRepoMan().then(repoMan => repoMan.selectMmd(location, options));
  }

  normalizeLocation(location: string | ParsedURL, options: BigSemanticsCallOptions = {}): Promise<string> {
    return this.repoLoader.getRepoMan().then(repoMan => repoMan.normalizeLocation(location, options));
  }
}

export default BSDefault;
