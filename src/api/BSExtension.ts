/**
 * This module enables using BigSemantics with an extension in a web
 * application.
 */

/// <reference path="../../typings/index.d.ts" />

import * as Promise from 'bluebird';
import simpl from '../core/simpl/simplBase';
import ParsedURL from '../core/ParsedURL';
import { uuid } from '../core/utils';
import {
  MetaMetadata,
  Metadata,
  TypedMetadata,
} from '../core/types';
import RepoMan, {
  RepoCallOptions,
  ReloadableRepoManService,
} from '../core/RepoMan';
import {
  BigSemanticsOptions,
  MetadataOptions,
  MetadataResult,
  AbstractBigSemantics,
} from '../core/BigSemantics';

export interface Params {
  [key: string]: any;
}

export interface Request {
  method: string;
  params?: Params;
}

/**
 * [BigSemantics description]
 * @type {[type]}
 */
export default class BSExtension extends AbstractBigSemantics implements ReloadableRepoManService {
  name = 'bsext_' + uuid(3);

  private extIds: string[];
  private activeExtId: string;

  constructor(extIds: string[], options: BigSemanticsOptions) {
    super({}, options);
    this.extIds = extIds;
  }

  getActiveExtensionId(): string {
    return this.activeExtId;
  }

  reset(): void {
    super.reset();
    this.activeExtId = null;
  }

  private sendMsg(extId: string, req: Request): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      let msg = simpl.graphCollapse(req);
      chrome.runtime.sendMessage(extId, msg, resp => {
        if (!resp) {
          reject(new Error("Null response"));
        }
        if (resp instanceof Object) {
          resp = simpl.graphExpand(resp);
        }
        if (resp.error) {
          reject(resp.error);
          return;
        }
        resolve(resp.result);
      });
    });
  }

  private pickExt(): Promise<void> {
    let tryExt = i => {
      if (i >= this.extIds.length) {
        return Promise.reject(new Error("No available extension"));
      }
      this.sendMsg(this.extIds[i], {
        method: 'extensionInfo',
      }).then(result => {
        this.activeExtId = this.extIds[i];
        return Promise.resolve();
      }).catch(err => {
        return tryExt(i+1);
      })
    }
    return tryExt(0);
  }

  reload(): void {
    this.reset();
    this.pickExt();
    this.sendMsg(this.activeExtId, {
      method: 'reload',
    }).then(result => {
      this.setReady();
    }).catch(err => {
      this.setError(err);
    });
  }

  loadMetadata(location: string | ParsedURL, options: MetadataOptions = {}): Promise<MetadataResult> {
    return this.onReadyP().then(() => {
      let purl = ParsedURL.get(location);
      return this.sendMsg(this.activeExtId, {
        method: 'loadMetadata',
        params: {
          location: purl.toString(),
          options: options,
        },
      });
    });
  }

  getUserAgentString(userAgentName: string): Promise<string> {
    return this.onReadyP().then(() => {
      return this.sendMsg(this.activeExtId, {
        method: 'getUserAgentString',
        params: {
          userAgentName: userAgentName,
        },
      });
    });
  }

  getDomainInterval(domain: string): Promise<number> {
    return this.onReadyP().then(() => {
      return this.sendMsg(this.activeExtId, {
        method: 'getDomainInterval',
        params: {
          domain: domain,
        },
      });
    });
  }

  loadMmd(name: string, options: RepoCallOptions = {}): Promise<MetaMetadata> {
    return this.onReadyP().then(() => {
      return this.sendMsg(this.activeExtId, {
        method: 'loadMmd',
        params: {
          name: name,
          options: options,
        },
      });
    });
  }

  selectMmd(location: string | ParsedURL, options: RepoCallOptions = {}): Promise<MetaMetadata> {
    return this.onReadyP().then(() => {
      let purl = ParsedURL.get(location);
      return this.sendMsg(this.activeExtId, {
        method: 'selectMmd',
        params: {
          location: purl.toString(),
          options: options,
        },
      });
    });
  }

  normalizeLocation(location: string | ParsedURL, options: RepoCallOptions = {}): Promise<string> {
    return this.onReadyP().then(() => {
      let purl = ParsedURL.get(location);
      return this.sendMsg(this.activeExtId, {
        method: 'normalizeLocation',
        params: {
          location: purl.toString(),
          options: options,
        },
      });
    });
  }

  untypeMetadata(typedMetadata: TypedMetadata, options?: RepoCallOptions): Promise<Metadata> {
    let tm = simpl.graphCollapse(typedMetadata);
    return this.onReadyP().then(() => {
      return this.sendMsg(this.activeExtId, {
        method: 'untypeMetadata',
        params: {
          typedMetadata: tm,
          options: options,
        },
      });
    });
  }

  serializeRepository(options?: RepoCallOptions): Promise<string> {
    return this.onReadyP().then(() => {
      return this.sendMsg(this.activeExtId, {
        method: 'serializeRepository',
        params: {
          options: options,
        },
      });
    });
  }
}
