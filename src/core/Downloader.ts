/**
 * A general Downloader interface.
 */

/// <reference path="../../typings/index.d.ts" />

import * as Promise from 'bluebird';
import ParsedURL from './ParsedURL';
import { HttpResponse } from './types';

/**
 * A table of domains and minimum download intervals for them.
 */
export interface DomainIntervals {
  [domain: string]: number;
}

/**
 * Options for the whole downloader.
 */
export interface DownloaderOptions {
  domainIntervals?: DomainIntervals;
  minGlobalInterval?: number;
}

/**
 * Options for individual requests.
 */
export interface RequestOptions {
  responseType?: string;
  response?: HttpResponse;
  acceptTypes?: string[];
}

/**
 * A general downloader interface.
 */
export interface Downloader {
  /**
   * A unique name for this downloader.
   */
  name: string;

  /**
   * Set the minimum download interval for a domain.
   *
   * @param {string} domain
   * @param {number} interval The minimum interval, in millisecond.
   */
  setDomainInterval(domain: string, interval: number): void;

  /**
   * Set minimum download intervals for multiple domains.
   *
   * @param {DomainIntervals} domainIntervals
   */
  setDomainIntervals(domainIntervals: DomainIntervals): void;

  /**
   * Make a HTTP GET request.
   *
   * @param  {string|ParsedURL} location
   * @param  {RequestOptions}   options
   * @return {Promise<HttpResponse>}
   */
  httpGet(location: string | ParsedURL, options?: RequestOptions): Promise<HttpResponse>;
}

/**
 * A base implementation of the Downloader interface.
 * Deals with download intervals.
 */
export abstract class BaseDownloader implements Downloader {
  name = 'base';
  protected options: DownloaderOptions;
  protected lastHits: { [domain: number]: number } = {};

  constructor(options: DownloaderOptions = {}) {
    this.options = options;
    if (!this.options.domainIntervals) {
      this.options.domainIntervals = {};
    }
  }

  setDomainInterval(domain: string, interval: number): void {
    this.options.domainIntervals[domain] = interval;
  }

  setDomainIntervals(domainIntervals: DomainIntervals): void {
    for (let domain in domainIntervals) {
      this.options.domainIntervals[domain] = domainIntervals[domain];
    }
  }

  httpGet(location: string | ParsedURL, options: RequestOptions = {}): Promise<HttpResponse> {
    if (!options.responseType) {
      options.responseType = 'document';
    }
    let purl = ParsedURL.get(location);

    let interval = this.options.minGlobalInterval || 0;
    if (purl.domain in this.options.domainIntervals) {
      interval = this.options.domainIntervals[purl.domain];
    }
    if (interval > 0) {
      if (purl.domain in this.lastHits) {
        let elapsed = Date.now() - this.lastHits[purl.domain];
        if (elapsed < interval) {
          return new Promise<HttpResponse>((resolve, reject) => {
            setTimeout(() => {
              this.doHttpGet(purl, options).then(resp => {
                resolve(resp);
              }).catch(err => {
                reject(err);
              });
            }, interval - elapsed);
          });
        }
      }
    }
    return this.doHttpGet(purl, options);
  }

  protected abstract doHttpGet(location: string | ParsedURL, options?: RequestOptions): Promise<HttpResponse>;
}
