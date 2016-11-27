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
  TypedRepository,
} from '../core/types';
import {
  BigSemanticsOptions,
  BigSemanticsCallOptions,
} from '../core/BigSemantics';
import { Downloader } from '../core/Downloader';
import { Extractor } from '../core/Extractor';
import XHRDownloader from '../downloaders/XHRDownloader';
import XPathExtractor from '../extractors/XPathExtractor';
import { BaseBigSemantics } from './BaseBigSemantics';
import RepoServiceHelper from "../downloaders/RepoServiceHelper";

/**
 * Options for BSDefault.
 */
export interface BSDefaultOptions extends BigSemanticsOptions {
  appId: string;
  appVer: string;
  serviceBase: string | ParsedURL;
  cacheRepoFor?: string; // e.g. 30d, 20h, 30m, 5d12h30m
}

/**
 * A BigSemantics implementation using the BigSemantics web service through
 * (potentially cross-origin) XHR.
 */
export default class BSDefault extends BaseBigSemantics {
  private options: BSDefaultOptions;

  private repoServiceHelper: RepoServiceHelper;
  private downloaders: { [name: string]: Downloader } = {};
  private extractors: { [name: string]: Extractor } = {};

  getServiceBase(): ParsedURL {
    return this.repoServiceHelper.serviceBase;
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

    this.repoServiceHelper = new RepoServiceHelper();
    this.repoServiceHelper.load(
      options.serviceBase,
      options.cacheRepoFor || '1d',
      options.repoOptions,
      options.appId,
      options.appVer,
    );

    this.repoServiceHelper.repoMan.onReadyP().then(() => {
      this.setReady();
    });
  }

  reload(): void {
    this.repoServiceHelper.reload();
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
    return this.repoServiceHelper.repoMan.getBuildInfo(options);
  }

  getRepository(options: BigSemanticsCallOptions = {}): Promise<TypedRepository> {
    return this.repoServiceHelper.repoMan.getRepository(options);
  }

  getUserAgentString(userAgentName: string, options: BigSemanticsCallOptions = {}): Promise<string> {
    return this.repoServiceHelper.repoMan.getUserAgentString(userAgentName, options);
  }

  getDomainInterval(domain: string, options: BigSemanticsCallOptions = {}): Promise<number> {
    return this.repoServiceHelper.repoMan.getDomainInterval(domain, options);
  }

  loadMmd(name: string, options: BigSemanticsCallOptions = {}): Promise<MetaMetadata> {
    return this.repoServiceHelper.repoMan.loadMmd(name, options);
  }

  selectMmd(location: string | ParsedURL, options: BigSemanticsCallOptions = {}): Promise<MetaMetadata> {
    return this.repoServiceHelper.repoMan.selectMmd(location, options);
  }

  normalizeLocation(location: string | ParsedURL, options: BigSemanticsCallOptions = {}): Promise<string> {
    return this.repoServiceHelper.repoMan.normalizeLocation(location, options);
  }
}
