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
import { RepoLoader, DefaultRepoLoaderOptions, DefaultRepoLoader } from '../core/RepoLoader';
import XHRDownloader from '../downloaders/XHRDownloader';
import ServiceRepoLoader, { ServiceRepoLoaderOptions } from '../downloaders/ServiceRepoLoader';
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

  serviceBase?: string | ParsedURL;
  repoOptions?: RepoOptions;
  cacheRepoFor?: string; // e.g. 30d, 20h, 30m, 5d12h30m
}

/**
 * A BigSemantics implementation using the BigSemantics web service through
 * (potentially cross-origin) XHR.
 */
export default class BSDefault extends BaseBigSemantics {
  private options: BSDefaultOptions;

  private repoLoader: RepoLoader;
  private downloaders: { [name: string]: Downloader } = {};
  private extractors: { [name: string]: Extractor } = {};

  getServiceBase(): ParsedURL {
    if (this.repoLoader instanceof ServiceRepoLoader) {
      return this.repoLoader.getServiceBase();
    }
    return null;
  }

  load(
    options: BSDefaultOptions,
    downloaders?: { [name: string]: Downloader },
    extractors?: { [name: string]: Extractor },
  ): void {
    this.reset();

    this.options = options;

    if (downloaders) {
      this.downloaders = downloaders;
    }
    if (!this.downloaders || Object.keys(this.downloaders).length == 0) {
      this.downloaders = { xhr: new XHRDownloader() };
    }

    if (extractors) {
      this.extractors = extractors;
    }
    if (!this.extractors || Object.keys(this.extractors).length == 0) {
      this.extractors = { xpath: new XPathExtractor() };
    }

    if (options.repository) {
      this.repoLoader = new DefaultRepoLoader();
      (this.repoLoader as DefaultRepoLoader).load(options as DefaultRepoLoaderOptions);
    } else if (options.serviceBase) {
      this.repoLoader = new ServiceRepoLoader();
      if (!options.cacheRepoFor) {
        options.cacheRepoFor = '1d';
      }
      (this.repoLoader as ServiceRepoLoader).load(options as ServiceRepoLoaderOptions);
    } else {
      let err = new Error("Failed to create repoLoader");
      console.error(err);
    }

    this.repoLoader.getRepoMan().then(() => {
      this.setReady();
    });
  }

  reload(): void {
    if (this.repoLoader instanceof DefaultRepoLoader) {
      this.repoLoader.reload();
    } else if (this.repoLoader instanceof ServiceRepoLoader) {
      this.repoLoader.reload();
    } else {
      let err = new Error("Unknown type for repoLoader");
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

  getRepository(options: BigSemanticsCallOptions = {}): Promise<TypedRepository> {
    return this.repoLoader.getRepoMan().then(repoMan => repoMan.getRepository(options));
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
