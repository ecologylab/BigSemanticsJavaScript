/**
 * A downloader using XMLHttpRequest.
 */

/// <reference path="../../typings/index.d.ts" />

import * as Promise from 'bluebird';
import ParsedURL from '../core/ParsedURL';
import { HttpResponse } from '../core/types';
import {
  DownloaderOptions,
  RequestOptions,
  BaseDownloader,
} from '../core/Downloader';

/**
 * A Downloader implementation using XMLHttpRequest.
 */
export default class XHRDownloader extends BaseDownloader {
  name = 'xhr';

  /**
   * Add a new location to the given response.
   *
   * @param {HttpResponse} response
   * @param {string} newLocation
   * @return {boolean} True iff new location is successfully added to response.
   */
  static addNewLocation(response: HttpResponse, newLocation: string): boolean {
    if (newLocation && newLocation.length > 0) {
      if (newLocation !== response.location) {
        if (!response.otherLocations) response.otherLocations = [];
        if (response.otherLocations.indexOf(newLocation) < 0) {
          let prevLocation = response.location;
          response.location = newLocation;
          response.otherLocations.push(prevLocation);
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Is content-type acceptable for the given set of options.
   *
   * @param {string} contentType
   * @param {RequestOptions} options
   * @return {boolean}
   */
  static isContentTypeAcceptable(contentType: string, options: RequestOptions): boolean {
    const baseList = [ null, '', 'text/html', 'text/plain' ];
    if (baseList.indexOf(contentType) >= 0) return true;
    if (contentType.indexOf('xml') >= 0) return true;
    if (options && options.responseType === 'json' && contentType.indexOf('json') >= 0) return true;
    if (options && options.acceptTypes instanceof Array && options.acceptTypes.indexOf(contentType) >= 0) return true;
    return false;
  }

  /**
   * Check if redirection is done through JavaScript.
   *
   * @param {XMLHttpRequest} xhr
   * @return {string}
   *   Destination URL, if JS redirection is detected; otherwise null.
   */
  static checkJsContentRedirect(xhr: XMLHttpRequest): string {
    if (typeof Document === 'function' && xhr.response instanceof Document) {
      let heads = xhr.response.getElementsByTagName('head');
      if (heads.length > 0) {
        let scripts = heads[0].getElementsByTagName('script');
        for (let i = 0; i < scripts.length; ++i) {
          let script = scripts.item(i);
          if (script.innerText) {
            let match = script.innerText.match(/location.replace\(\"(.*)\"\)/i);
            if (match && match[1]) {
              let url = match[1].replace(/\\/g, '');
              return url;
            }
          }
        }
      }
    }
    return null;
  }

  /**
   * Constructor.
   * @param {DownloaderOptions = {}} options
   */
  constructor(options: DownloaderOptions = {}) {
    super(options);
  }

  /**
   * Implementation of making request through HTTP GET.
   *
   * @param {string | ParsedURL} location
   * @param {RequestOptions = {}} options
   * @return {Promise<HttpResponse>}
   */
  protected doHttpGet(location: string | ParsedURL, options: RequestOptions = {}): Promise<HttpResponse> {
    let purl = ParsedURL.get(location);

    let result = new Promise<HttpResponse>((resolve, reject) => {
      let response: HttpResponse = options.response || {
        location: purl.toString(),
        code: 0,
      };

      let xhr = new XMLHttpRequest();
      xhr.responseType = options.responseType;
      let err: Error = null;
      xhr.onreadystatechange = () => {
        response.code = xhr.status;
        switch (xhr.readyState) {
          case xhr.HEADERS_RECEIVED:
            if (xhr.status >= 500) {
              err = new Error("Server error: " + xhr.status);
            } else if (xhr.status >= 400) {
              err = new Error("Bad request: " + xhr.status);
            } else if (xhr.status >= 300 && xhr.status !== 304) {
              // handle redirects
              let newLocation = xhr.getResponseHeader('Location');
              console.log("Redirect: " + purl.toString() + " => " + newLocation);
              if (!XHRDownloader.addNewLocation(response, newLocation)) {
                err = new Error("Redirection loop detected");
                console.warn(err);
              }
            } else if (xhr.status === 304) {
              // TODO hanlde 'not modified' -- read from cache
              err = new Error("Unimplemented: 304 Not Modified");
              console.warn(err);
            } else {
              let contentType = xhr.getResponseHeader('Content-Type');
              let matches = contentType.match(/([^;]+)(;\s*charset=(.*))?/);
              if (matches) {
                response.contentType = matches[1];
                response.charset = matches[3];
              }
              if (!XHRDownloader.isContentTypeAcceptable(response.contentType, options)) {
                err = new Error("Unsupported content type: " + response.contentType);
                console.warn(err);
              }
            }
            if (err) {
              console.warn("Aborting XHR for " + purl.toString());
              xhr.abort();
              reject(err);
            }
            break;
          case xhr.DONE:
            if (err || xhr.status !== 200) break;
            XHRDownloader.addNewLocation(response, (xhr as any).responseURL);
            let jsRedirectLocation = XHRDownloader.checkJsContentRedirect(xhr);
            if (jsRedirectLocation) {
              if (!XHRDownloader.addNewLocation(response, jsRedirectLocation)) {
                err = new Error("JavaScript Redirection loop detected");
                console.warn(err);
              }
            }
            try {
              if (xhr.response) {
                response.entity = xhr.response;
              } else if (xhr.responseXML) {
                response.xml = xhr.responseXML;
              } else if (xhr.responseText) {
                response.text = xhr.responseText;
              } else {
                err = new Error("Missing response body");
                console.warn(err);
              }
            } catch (exception) {
              err = exception;
              console.warn(err);
            }
            if (err) {
              reject(err);
            } else {
              resolve(response);
            }
            break;
        }
      };
      xhr.open('GET', purl.toString(), true);
      if (purl.domain !== 'twitter.com') {
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
      }
      xhr.send();
    });

    let domain = purl.domain;
    if (domain in this.options.domainIntervals) {
      if (domain in this.lastHits) {
        let elapsed = Date.now() - this.lastHits[domain];
        let interval = this.options.domainIntervals[domain];
        if (elapsed < interval) {
          return result.delay(interval - elapsed);
        }
      }
      this.lastHits[domain] = Date.now();
    }
    return result;
  }
}
