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
  BuildInfo,
  MetaMetadata,
  TypedRepository,
  Metadata,
  TypedMetadata,
} from '../core/types';
import RepoMan, {
  RepoCallOptions,
} from '../core/RepoMan';
import {
  BigSemanticsComponents,
  BigSemanticsOptions,
  BigSemanticsCallOptions,
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

export interface BSExtensionOptions extends BigSemanticsOptions {
  extensionIds: string[];
}

export default class BSExtension extends AbstractBigSemantics {
  private activeExtId: string;

  initialize(options: BSExtensionOptions, components: BigSemanticsComponents): void {
    super.initialize(options, components);
    if (!this.activeExtId) {
      this.pickExt();
    }
  }

  getActiveExtensionId(): string {
    return this.activeExtId;
  }

  private sendMsg(extId: string, req: Request): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      let msg = simpl.graphCollapse(req);
      let callback = resp => {
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
      };
      if (extId) {
        chrome.runtime.sendMessage(extId, msg, callback);
      } else {
        chrome.runtime.sendMessage(msg, callback);
      }
    });
  }

  private pickExt(): Promise<void> {
    let extIds = (this.options as BSExtensionOptions).extensionIds;
    let tryExt = (extIds, i) => {
      if (i >= extIds.length) {
        return Promise.reject(new Error("No available extension"));
      }
      this.sendMsg(extIds[i], {
        method: 'extensionInfo',
      }).then(result => {
        this.activeExtId = extIds[i];
        return Promise.resolve();
      }).catch(err => {
        return tryExt(extIds, i+1);
      })
    }
    return tryExt(extIds, 0);
  }

  reloadRepo(): void {
    this.onReadyP().then(() => {
      this.sendMsg(this.activeExtId, {
        method: 'reloadRepo',
      });
    });
  }

  getBuildInfo(options?: BigSemanticsCallOptions): Promise<BuildInfo> {
    return this.onReadyP().then(() => {
      return this.sendMsg(this.activeExtId, {
        method: 'getBuildInfo',
        params: {
          options: options,
        },
      });
    });
  }

  getRepository(options?: RepoCallOptions): Promise<TypedRepository> {
    return this.onReadyP().then(() => {
      return this.sendMsg(this.activeExtId, {
        method: 'getRepository',
        params: {
          options: options,
        },
      });
    });
  }

  loadMetadata(location: string | ParsedURL, options: BigSemanticsCallOptions = {}): Promise<MetadataResult> {
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
}
