/**
 * This module enables using BigSemantics in a vanilla web application.
 */

/// <reference path="../../typings/index.d.ts" />

import * as Promise from 'bluebird';
import simpl from '../core/simpl/simplBase';
import ParsedURL from '../core/ParsedURL';
import { uuid } from '../core/utils';
import Readyable from '../core/Readyable';
import {
  MetaMetadata,
  Repository,
  TypedRepository,
  Metadata,
  TypedMetadata,
  BSResponse,
} from '../core/types';
import { PreFilter } from '../core/FieldOps';
import RepoMan, {
  RepoOptions,
  RepoCallOptions,
} from '../core/RepoMan';
import { Downloader } from '../core/Downloader';
import {
  BigSemanticsComponents,
  BigSemanticsOptions,
  BigSemanticsCallOptions,
  MetadataResult,
  BaseBigSemantics,
} from '../core/BigSemantics';
import JSONPHelper, { JSONPHelperOptions } from '../downloaders/JSONPHelper';

export interface BSWebAppOptions extends BigSemanticsOptions {
  appId: string;
  appVer: string;
  serviceBase: string | ParsedURL;
}

/**
 * A BigSemantics implementation for vanilla web applications.
 * It uses JSONP to work around CORS limitations (and therefore inherently
 * lacking in error reporting).
 */
export default class BSWebApp extends BaseBigSemantics {
  protected options: BSWebAppOptions;

  private jsonp: JSONPHelper;

  private serviceBase: ParsedURL;
  private repositoryBase: ParsedURL;
  private wrapperBase: ParsedURL;
  private metadataBase: ParsedURL;

  initialize(options: BSWebAppOptions, components: BigSemanticsComponents): void {
    super.initialize(options, components);

    this.jsonp = new JSONPHelper({
      callbackParamName: 'callback',
      extraQuery: {
        aid: options.appId,
        av: options.appVer,
      },
      timeout: options.timeout,
    });

    this.serviceBase = ParsedURL.get(options.serviceBase);
    this.repositoryBase = ParsedURL.get('repository.jsonp', this.serviceBase);
    this.wrapperBase = ParsedURL.get('wrapper.jsonp', this.serviceBase);
    this.metadataBase = ParsedURL.get('metadata.jsonp', this.serviceBase);

    this.repoMan.reset();
    let id = [options.appId, options.appVer, 'repo'].join('_').replace(/[^\w_]/g, '_');
    this.jsonp.call(id, this.repositoryBase).then(args => {
      if (!args || args.length == 0) {
        throw new Error("Invalid server response");
      }
      let repo = (simpl.graphExpand(args[0]) as BSResponse).repository;
      if (!repo) {
        throw new Error("Missing repository in server response");
      }
      this.repoMan.load(repo, this.options.repoOptions);
    }).catch(err => {
      this.setError(err);
    });
  }

  loadMetadata(location: string | ParsedURL, options: BigSemanticsCallOptions = {}): Promise<MetadataResult> {
    return this.onReadyP().then(() => {
      let id = [this.options.appId, this.options.appVer, 'M', uuid()].join('_').replace(/[^\w_]/g, '_');
      let purl = ParsedURL.get(location);
      let reqUrl = this.metadataBase.withQuery({
        url: purl.toString(),
        wmmd: options.includeMmdInResult,
        uid: options.userId,
        sid: options.sessionId,
      });
      return this.jsonp.call(id, reqUrl, {
        timeout: options.timeout || this.options.timeout,
      }).then(args => {
        if (!args || args.length === 0) {
          throw new Error("Invalid server response");
        }
        let resp = simpl.graphExpand(args[0]) as BSResponse;
        return {
          metadata: resp.metadata,
          mmd: resp.wrapper,
        };
      });
    });
  }
}
