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
export interface BSServiceOptions extends BigSemanticsOptions {
  appId: string;
  appVer: string;
  serviceBase: string | ParsedURL;
  minReloadInterval?: number;
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

  load(options: BSServiceOptions, components: BigSemanticsComponents = {}): void {
    this.reset();

    this.options = options;

    this.serviceBase = ParsedURL.get(options.serviceBase);
    this.repositoryBase = ParsedURL.get('repository.json', this.serviceBase);

    this.commonQueries = {
      aid: options.appId,
      av: options.appVer,
    };

    if (components.downloaders) {
      this.downloaders = components.downloaders;
    }
    if (!this.downloaders || Object.keys(this.downloaders).length == 0) {
      this.downloaders = { xhr: new XHRDownloader() };
    }
    if (components.extractors) {
      this.extractors = components.extractors;
    }
    if (!this.extractors || Object.keys(this.extractors).length == 0) {
      this.extractors = { xpath: new XPathExtractor() };
    }

    // specification of repoMan is disallowed for this class.
    components.repoMan = null;
    if (this.repoMan) {
      this.repoMan.reset();
    } else {
      this.repoMan = new RepoMan();
    }
    this.repoDownloader = new XHRDownloader({
      minGlobalInterval: options.minReloadInterval || 10000,
    });
    let reqUrl = this.repositoryBase.withQuery(this.commonQueries);
    let reqOptions = { responseType: 'json' };
    this.repoDownloader.httpGet(reqUrl, reqOptions).then(resp => {
      if (!resp || !resp.entity) {
        throw new Error("Missing or invalid response");
      }
      let bsresp = simpl.graphExpand(resp.entity) as BSResponse;
      if (!bsresp.repository) {
        throw new Error("Missing repository in server response");
      }
      this.repoMan.load(bsresp.repository, options.repoOptions);
      super.load(options, components);
    }).catch(err => {
      this.setError(err);
    });
  }
}
