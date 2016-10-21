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
import RepoMan, {
  RepoOptions,
  RepoCallOptions,
  ReloadableRepoManService,
} from '../core/RepoMan';
import { Downloader } from '../core/Downloader';
import {
  BigSemanticsOptions,
  MetadataOptions,
  MetadataResult,
  ReloadableBaseBigSemantics,
} from '../core/BigSemantics';
import JSONPHelper, { JSONPHelperOptions } from './JSONPHelper';

/**
 * [BigSemantics description]
 * @type {[type]}
 */
export default class BSService extends ReloadableBaseBigSemantics {
  name = 'bssvc_' + uuid(3);

  private jsonp: JSONPHelper;

  private serviceBase: ParsedURL;
  private repositoryBase: ParsedURL;
  private wrapperBase: ParsedURL;
  private metadataBase: ParsedURL;

  constructor(serviceBase: string | ParsedURL, options: BigSemanticsOptions) {
    super({
      repoMan: new RepoMan(null, options.repoOptions),
    }, options);

    this.jsonp = new JSONPHelper({
      callbackParamName: 'callback',
      extraQuery: {
        aid: this.options.appId,
        av: this.options.appVer,
      },
      timeout: options.timeout,
    });

    this.serviceBase = ParsedURL.get(serviceBase);
    this.repositoryBase = ParsedURL.get('repository.jsonp', this.serviceBase);
    this.wrapperBase = ParsedURL.get('wrapper.jsonp', this.serviceBase);
    this.metadataBase = ParsedURL.get('metadata.jsonp', this.serviceBase);

    this.reload();
  }

  reload(): void {
    this.jsonp.call(this.name + '_repo', this.repositoryBase).then(args => {
      if (!args || args.length == 0) {
        throw new Error("Invalid server response");
      }
      let repo = (simpl.graphExpand(args[0]) as BSResponse).repository;
      this.repoMan.load(repo, this.options.repoOptions);
      this.repoMan.onReady(err => {
        if (err) {
          this.setError(err);
          return;
        }
        this.setReady();
      });
    });
  }

  loadMetadata(location: string | ParsedURL, options: MetadataOptions = {}): Promise<MetadataResult> {
    return this.onReadyP().then(() => {
      let id = this.name + '_M' + uuid();
      let purl = ParsedURL.get(location);
      let reqUrl = this.metadataBase.withQuery({
        url: purl.toString(),
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
        if (options.includeMmdInResult) {
          return this.selectMmd(purl, options).then(mmd => {
            return {
              metadata: resp.metadata,
              mmd: mmd,
            } as MetadataResult;
          });
        }
        return { metadata: resp.metadata };
      });
    });
  }

  loadInitialMetadata(location: string | ParsedURL, options: MetadataOptions = {}): Promise<MetadataResult> {
    return this.onReadyP().then(() => {
      let purl = ParsedURL.get(location);

      return this.selectMmd(purl, options.repoCallOptions).then(mmd => {
        let typeTag = mmd.tag || mmd.name;
        let metadata = {
          mm_name: typeTag,
        }
        let typedMetadata: TypedMetadata = {};
        typedMetadata[typeTag] = metadata;
        let result: MetadataResult = {
          metadata: typedMetadata,
        };
        if (options.includeMmdInResult) {
          result.mmd = mmd;
        }
        return result;
      });
    });
  }
}
