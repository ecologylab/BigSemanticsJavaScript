/**
 * This module enables using BigSemantics with an extension in a web
 * application.
 */

/// <reference types="chrome" />

import * as Promise from 'bluebird';
import * as simpl from 'simpl.js';
import ParsedURL from '../core/ParsedURL';
import Readyable from '../core/Readyable';
import {
  HttpResponse,
  BuildInfo,
  MetaMetadata,
  TypedRepository,
  Metadata,
  TypedMetadata,
} from '../core/types';
import RepoMan from '../core/RepoMan';
import { Extractor } from '../core/Extractor';
import {
  BigSemanticsOptions,
  BigSemanticsCallOptions,
  MetadataResult,
} from '../core/BigSemantics';
import { BaseBigSemantics } from "./BaseBigSemantics";

/**
 * Params used in messaging with extension
 */
interface Params {
  [key: string]: any;
}

/**
 * Request message sent to extension
 */
interface Request {
  method: string;
  params?: Params;
}

/**
 *
 */
export interface BSExtensionOptions extends BigSemanticsOptions {
  extensionIds?: string[];
}

/**
 * A BigSemantics implementation that talks to a Chrome extension to do its job.
 */
export default class BSExtension extends BaseBigSemantics {
  private options: BSExtensionOptions;
  private activeExtId: string;
  private extractors: { [name: string]: Extractor } = {};

  /**
   * (Re)Load this instance using specified options.
   *
   * If extensionIds are not specified, assume this is in a content script.
   *
   * @param {BSExtensionOptions} options
   */
  load(options: BSExtensionOptions = {}, extractors: { [name: string]: Extractor } = {}): void {
    this.options = options;
    this.extractors = extractors;

    if (options.extensionIds) {
      this.pickExt().catch(err => {
        this.setError(err);
      });
    }
  }

  /**
   * Ask the connected extension to reload its BigSemantics implementation
   * (which involves reloading its wrapper repository).
   */
  reload(): void {
    this.onReadyP().then(() => {
      this.sendMsg(this.activeExtId, {
        method: 'reloadRepo',
      });
    });
  }

  getActiveExtensionId(): string {
    return this.activeExtId;
  }

  /**
   * Get the service base from the connected extension (assuming the extension
   * has loaded BigSemantics repository from a web service).
   *
   * @param {BigSemanticsCallOptions} options
   * @return {Promise<ParsedURL>}
   */
  getServiceBase(options?: BigSemanticsCallOptions): Promise<ParsedURL> {
    return this.onReadyP().then(() => {
      return this.sendMsg(this.activeExtId, {
        method: 'getServiceBase',
      });
    });
  }

  private pickExt(): Promise<void> {
    let extIds = (this.options as BSExtensionOptions).extensionIds;
    let tryExt = (extIds, i) => {
      if (i >= extIds.length) {
        let err = new Error("No available extension");
        this.setError(err);
        return Promise.reject(err);
      }
      return this.sendMsg(extIds[i], {
        method: 'extensionInfo',
      }).then(result => {
        this.activeExtId = extIds[i];
        this.setReady();
        return Promise.resolve();
      }).catch(err => {
        return tryExt(extIds, i+1);
      })
    }
    return tryExt(extIds, 0);
  }

  private sendMsg(extId: string, req: Request): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      simpl.graphCollapse(req);
      try {
        let callback = resp => {
          if (!resp) {
            reject(new Error("Null response"));
            return;
          }

          if (resp instanceof Object) {
            resp = simpl.graphExpand(resp);
          }

          if (resp.error) {
            if (resp.error instanceof Error) {
              reject(resp.error);
            } else {
              reject(new Error(resp.error));
            }
            return;
          }

          resolve(resp.result);
        };
        if (extId) {
          chrome.runtime.sendMessage(extId, req, callback);
        } else {
          chrome.runtime.sendMessage(req, callback);
        }
      }
      finally {
        simpl.graphExpand(req);
      }
    });
  }

  loadMetadata(location: string | ParsedURL, options: BigSemanticsCallOptions = {}): Promise<MetadataResult> {
    return this.onReadyP().then(() => {
      let purl = ParsedURL.get(location);
      if (options.response) {
        return super.loadMetadata(location, options);
      }
      return this.sendMsg(this.activeExtId, {
        method: 'loadMetadata',
        params: {
          location: purl.toString(),
          options: options,
        },
      });
    });
  }

  protected getResponse(purl: ParsedURL, options: BigSemanticsCallOptions = {}): Promise<HttpResponse> {
    if (!options.response) {
      throw new Error("Missing options.response (expected to be document)");
    }
    return Promise.resolve(options.response);
  }

  protected getExtractor(names: string[]): Extractor {
    for (let name of names) {
      if (name && name in this.extractors) {
        return this.extractors[name];
      }
    }
    return null;
  }

  getBuildInfo(options: BigSemanticsCallOptions = {}): Promise<BuildInfo> {
    return this.onReadyP().then(() => {
      return this.sendMsg(this.activeExtId, {
        method: 'getBuildInfo',
        params: {
          options: options,
        },
      });
    });
  }

  getRepository(options: BigSemanticsCallOptions = {}): Promise<TypedRepository> {
    return this.onReadyP().then(() => {
      return this.sendMsg(this.activeExtId, {
        method: 'getRepository',
        params: {
          options: options,
        },
      });
    });
  }

  getUserAgentString(userAgentName: string, options: BigSemanticsCallOptions = {}): Promise<string> {
    return this.onReadyP().then(() => {
      return this.sendMsg(this.activeExtId, {
        method: 'getUserAgentString',
        params: {
          userAgentName: userAgentName,
        },
      });
    });
  }

  getDomainInterval(domain: string, options: BigSemanticsCallOptions = {}): Promise<number> {
    return this.onReadyP().then(() => {
      return this.sendMsg(this.activeExtId, {
        method: 'getDomainInterval',
        params: {
          domain: domain,
        },
      });
    });
  }

  loadMmd(name: string, options: BigSemanticsCallOptions = {}): Promise<MetaMetadata> {
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

  selectMmd(location: string | ParsedURL, options: BigSemanticsCallOptions = {}): Promise<MetaMetadata> {
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

  normalizeLocation(location: string | ParsedURL, options: BigSemanticsCallOptions = {}): Promise<string> {
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
}
