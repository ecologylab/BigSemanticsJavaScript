/**
 * Helper for calling BigSemantics web service.
 */

import * as Promise from 'bluebird';
import * as simpl from 'simpl.js';
import ParsedURL, { QueryMap } from '../core/ParsedURL';
import { BSResult } from '../core/types';
import { RequestOptions, Downloader } from '../core/Downloader';
import XHRDownloader from '../downloaders/XHRDownloader';

/**
 *
 */
export interface ServiceHelperOptions {
  appId?: string;
  appVer?: string;
  serviceBase: string | ParsedURL;
  requesterFactory?: ()=>Downloader;
}

/**
 * Helper for calling BigSemantics web service.
 */
export default class ServiceHelper {
  private options: ServiceHelperOptions;
  private serviceBase: ParsedURL;

  getServiceBase(): ParsedURL {
    return this.serviceBase;
  }

  load(options: ServiceHelperOptions): void {
    this.options = options;
    this.serviceBase = ParsedURL.get(options.serviceBase);
  }

  callJSONService(endpoint: string, params: QueryMap = {}, options: RequestOptions = {}): Promise<BSResult> {
    let url = ParsedURL.get(endpoint, this.options.serviceBase).withQuery({
      aid: this.options.appId,
      av: this.options.appVer,
    }).withQuery(params);
    if (!options.responseType) {
      options.responseType = 'json';
    }
    let requester: Downloader = null;
    if (this.options.requesterFactory) {
      requester = this.options.requesterFactory();
    } else {
      requester = new XHRDownloader();
    }
    return requester.httpGet(url, options).then(resp => {
      if (resp.entity) {
        simpl.graphExpand(resp.entity);
        return resp.entity as BSResult;
      }
      let bsresp = simpl.deserialize(resp.text) as BSResult;
      return bsresp;
    });
  }
}
