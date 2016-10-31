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
import RepoMan, { RepoCallOptions, RepoManService } from '../core/RepoMan';
import { RequestOptions } from '../core/Downloader';
import {
  BigSemanticsComponents,
  BigSemanticsOptions,
  BigSemanticsCallOptions,
  MetadataResult,
  BaseBigSemantics,
} from '../core/BigSemantics';
import XHRDownloader from '../downloaders/XHRDownloader';
import XPathExtractor from '../extractors/XPathExtractor';

/**
 *
 */
export interface BSServiceReloadOptions extends BigSemanticsOptions {
  serviceBase: string | ParsedURL;
  minReloadInterval?: number;
}

/**
 *
 */
export interface BSServiceOptions extends BSServiceReloadOptions {
  appId: string;
  appVer: string;
}

/**
 * A BigSemantics implementation using the BigSemantics web service through
 * (potentially cross-origin) XHR.
 */
export default class BSService extends BaseBigSemantics {
  protected options: BSServiceOptions;

  private serviceBase: ParsedURL;
  private repositoryBase: ParsedURL;

  private commonQueries: QueryMap;

  private repoDownloader: XHRDownloader;

  getServiceBase(): ParsedURL {
    return this.serviceBase;
  }

  protected doLoad(options: BSServiceOptions, components: BigSemanticsComponents = {}): Promise<void> {
    let comps: BigSemanticsComponents = {};
    comps.repoMan = components.repoMan || new RepoMan();
    comps.metadataCache = components.metadataCache;
    comps.downloaders = components.downloaders || { xhr: new XHRDownloader() };
    comps.extractors = components.extractors || { xpath: new XPathExtractor() };
    super.doLoad(options, comps);

    this.serviceBase = ParsedURL.get(options.serviceBase);
    this.repositoryBase = ParsedURL.get('repository.json', this.serviceBase);

    this.commonQueries = {
      aid: options.appId,
      av: options.appVer,
    };

    return this.reload(options);
  }

  /**
   * Reinitialize this object with the same components.
   *
   * @param {BSServiceReloadOptions} options
   * @return {Promise<void>}
   */
  reload(options: BSServiceReloadOptions): Promise<void> {
    this.reset();

    this.repoDownloader = new XHRDownloader({
      minGlobalInterval: this.options.minReloadInterval || 10000,
    });

    this.repoMan.reset();
    let reqUrl = this.repositoryBase.withQuery(this.commonQueries);
    let reqOptions = { responseType: 'json' };
    return this.repoDownloader.httpGet(reqUrl, reqOptions).then(resp => {
      if (!resp || !resp.entity) {
        throw new Error("Missing or invalid response");
      }
      let bsresp = simpl.graphExpand(resp.entity) as BSResponse;
      this.repoMan.load(bsresp.repository, options.repoOptions);
      this.setReady();
    });
  }
}
