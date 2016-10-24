/**
 * This module enables using BigSemantics through (potentially cross-origin)
 * XHR.
 */

/// <reference path="../../typings/index.d.ts" />

import * as Promise from 'bluebird';
import simpl from '../core/simpl/simplBase';
import ParsedURL, { QueryMap } from '../core/ParsedURL';
import { uuid } from '../core/utils';
import Readyable from '../core/Readyable';
import { PreFilter } from '../core/FieldOps';
import {
  MetaMetadata,
  TypedRepository,
  Metadata,
  TypedMetadata,
  BSResponse,
} from '../core/types';
import { RepoCallOptions, RepoManService } from '../core/RepoMan';
import { RequestOptions } from '../core/Downloader';
import {
  BigSemanticsComponents,
  BigSemanticsOptions,
  BigSemanticsCallOptions,
  MetadataResult,
  BaseBigSemantics,
} from '../core/BigSemantics';
import XHRDownloader from '../downloaders/XHRDownloader';

export interface BSServiceOptions extends BigSemanticsOptions {
  appId: string;
  appVer: string;
  serviceBase: string | ParsedURL;
}

/**
 * A BigSemantics implementation using the BigSemantics web service through
 * (potentially cross-origin) XHR.
 */
export default class BSService extends BaseBigSemantics {
  protected options: BSServiceOptions;

  private serviceBase: ParsedURL;
  private repositoryBase: ParsedURL;
  private wrapperBase: ParsedURL;
  private metadataBase: ParsedURL;

  private commonQueries: QueryMap;

  private repoDownloader: XHRDownloader;

  initialize(options: BSServiceOptions, components: BigSemanticsComponents): void {
    super.initialize(options, components);

    this.serviceBase = ParsedURL.get(options.serviceBase);
    this.repositoryBase = ParsedURL.get('repository.jsonp', this.serviceBase);
    this.wrapperBase = ParsedURL.get('wrapper.jsonp', this.serviceBase);
    this.metadataBase = ParsedURL.get('metadata.jsonp', this.serviceBase);

    this.commonQueries = {
      aid: options.appId,
      av: options.appVer,
    };

    this.repoDownloader = new XHRDownloader();

    this.repoMan.reset();
    this.httpGet(this.repositoryBase).then(bsresp => {
      this.repoMan.load(bsresp.repository, options.repoOptions);
    });
    this.setReady();
  }

  private httpGet(purl: ParsedURL, query: QueryMap = {}, options: RequestOptions = {}): Promise<BSResponse> {
    let reqUrl = purl.withQuery(this.commonQueries).withQuery(query);
    options.responseType = 'json';
    return this.repoDownloader.httpGet(reqUrl, options).then(resp => {
      if (!resp || !resp.entity) {
        throw new Error("Missing or invalid response");
      }
      let bsresp = simpl.graphExpand(resp) as BSResponse;
      return bsresp;
    });
  }
}
