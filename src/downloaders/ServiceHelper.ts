/**
 * Helper for calling BigSemantics web service.
 */

import * as Promise from 'bluebird';
import * as simpl from 'simpl.js';
import ParsedURL, { QueryMap } from '../core/ParsedURL';
import { BSResponse } from '../core/types';
import { RequestOptions } from '../core/Downloader';
import XHRDownloader from '../downloaders/XHRDownloader';

/**
 * Helper for calling BigSemantics web service.
 */
export default class ServiceHelper {
  serviceBase: ParsedURL;
  appId: string;
  appVer: string;

  load(serviceBase: string | ParsedURL, appId?: string, appVer?: string): void {
    this.appId = appId || 'Unknown App';
    this.appVer = appVer || 'Unknown Version';
    this.serviceBase = ParsedURL.get(serviceBase);
  }

  callJSONService(endpoint: string, params: QueryMap = {}, options: RequestOptions = {}): Promise<BSResponse> {
    let url = ParsedURL.get(endpoint, this.serviceBase).withQuery({
      aid: this.appId,
      av: this.appVer,
    }).withQuery(params);
    if (!options.responseType) {
      options.responseType = 'json';
    }
    let requester = new XHRDownloader();
    return requester.httpGet(url, options).then(resp => {
      if (resp.entity) {
        simpl.graphExpand(resp.entity);
        return resp.entity as BSResponse;
      }
      let bsresp = simpl.deserialize(resp.text) as BSResponse;
      return bsresp;
    });
  }
}
