/**
 * A class to make JSONP easier.
 */

/// <reference path="../../typings/index.d.ts" />

import * as Promise from 'bluebird';
import simpl from '../core/simpl/simplBase';
import ParsedURL, { QueryMap } from '../core/ParsedURL';

export interface JSONPHelperOptions {
  callbackParamName: string;
  extraQuery?: QueryMap;
  timeout?: number;
}

export interface JSONPCallOptions {
  timeout?: number;
}

export default class JSONPHelper {
  private static readonly PREFIX = 'jsonp_';

  private options: JSONPHelperOptions;

  constructor(options: JSONPHelperOptions) {
    if (typeof window !== 'object' || typeof document !== 'object') {
      throw new Error("Missing global window or document object");
    }
    this.options = options;
  }

  call(id: string, url: string | ParsedURL, options: JSONPCallOptions = {}): Promise<any[]> {
    if (!id || !url) {
      return Promise.reject(new Error("Missing required arguments"));
    }

    let timeout = options.timeout || this.options.timeout;

    let result = new Promise<any[]>((resolve, reject) => {
      let callbackName = JSONPHelper.PREFIX + id;

      let callbackQuery: QueryMap = {};
      callbackQuery[this.options.callbackParamName] = callbackName;
      let purl = ParsedURL.get(url).withQuery(callbackQuery).withQuery(this.options.extraQuery);

      let script = document.createElement('script');
      script.src = purl.toString();
      script.onerror = event => {
        reject(event.error);
      };
      window[callbackName] = (...args: any[]) => {
        resolve(args);
        document.getElementsByTagName('head')[0].removeChild(script);
        delete window[callbackName];
      };
      document.getElementsByTagName('head')[0].appendChild(script);
    });

    if (timeout) {
      result = result.timeout(timeout);
    }

    return result;
  }
}
