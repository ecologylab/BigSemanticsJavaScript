/**
 * Provides BSAutoSwitch.
 */

import * as Promise from 'bluebird';
import * as simpl from 'simpl.js';
import ParsedURL from '../core/ParsedURL';
import Readyable from '../core/Readyable';
import {
  HttpResponse,
  BuildInfo,
  MetaMetadata,
  Repository,
  Metadata,
  TypedMetadata,
  BSResult,
} from '../core/types';
import RepoMan, { RepoOptions, RepoCallOptions } from '../core/RepoMan';
import { Downloader } from '../core/Downloader';
import { Extractor } from '../core/Extractor';
import {
  BigSemanticsOptions,
  BigSemanticsCallOptions,
  BigSemantics,
} from '../core/BigSemantics';
import BSExtension, { BSExtensionOptions } from './BSExtension';
import BSWebApp, { BSWebAppOptions } from './BSWebApp';

/**
 * Options for BSAutoSwitch
 */
export interface BSAutoSwitchOptions extends BigSemanticsOptions {
  appId: string;
  appVer: string;

  extensionIds: string[];

  serviceBase: string | ParsedURL;
  repoOptions?: RepoOptions;
  cacheRepoFor?: string;
  disableRepoCaching?: boolean;
  requesterFactory?: ()=>Downloader;
}

/**
 * First try BSExtension, then try BSWebApp.
 */
export default class BSAutoSwitch extends Readyable implements BigSemantics {
  private bsExt: BSExtension;
  private bsWebApp: BSWebApp;
  bsImpl: BSExtension | BSWebApp = undefined;

  load(options: BSAutoSwitchOptions): void {
    let loadBSExt = (options: BSAutoSwitchOptions) => {
      if (!options.extensionIds) {
        return Promise.reject(new Error("Extension IDs not specified"));
      }
      console.log("Try to load BSExtension; IDs: ", options.extensionIds);
      this.bsExt = new BSExtension();
      this.bsExt.load(options);
      return this.bsExt.onReadyP().then(() => {
        console.log("BSExtension loaded with " + this.bsExt.getActiveExtensionId());
      }).catch(err => {
        console.error(err);
      });
    };

    let loadBSWebApp = (options: BSAutoSwitchOptions) => {
      if (!options.appId) {
        return Promise.reject(new Error("Must specify appId in options"));
      }
      if (!options.appVer) {
        return Promise.reject(new Error("Must specify appVer in options"));
      }
      if (!options.serviceBase) {
        return Promise.reject(new Error("Must specify serviceBase in options"));
      }
      console.log("Try to load BSWebApp; Service base: ", options.serviceBase);
      this.bsWebApp = new BSWebApp();
      this.bsWebApp.load(options as BSWebAppOptions);
      return this.bsWebApp.onReadyP().then(() => {
        console.log("BSWebApp loaded with " + this.bsWebApp.getServiceBase());
      }).catch(err => {
        console.error(err);
      });
    };

    loadBSExt(options).then(() => {
      this.bsImpl = this.bsExt;
      this.setReady();
    }).finally(() => {
      return loadBSWebApp(options).then(() => {
        if (!this.bsImpl) {
          this.bsImpl = this.bsWebApp;
          this.setReady();
        }
      });
    }).catch(err => {
      console.error(err);
    });
  }

  reload(): void {
    this.bsImpl.reload();
  }

  loadMetadata(location: string | ParsedURL, options: BigSemanticsCallOptions = {}): Promise<BSResult> {
    if (!(this.bsImpl instanceof BSWebApp)) {
      return this.selectMmd(location, options).then(mmd => {
        if (mmd.extract_with === 'service') {
          return this.bsWebApp.loadMetadata(location, options);
        }
        else {
          return this.bsExt.loadMetadata(location, options);
        }
      })
    }
    else {
      return this.bsImpl.loadMetadata(location, options);
    }
  }

  loadInitialMetadata(location: string | ParsedURL, options: BigSemanticsCallOptions = {}): Promise<BSResult> {
    return this.bsImpl.loadInitialMetadata(location, options);
  }

  getBuildInfo(options: BigSemanticsCallOptions = {}): Promise<BuildInfo> {
    return this.bsImpl.getBuildInfo(options);
  }

  getRepository(options: BigSemanticsCallOptions = {}): Promise<Repository> {
    return this.bsImpl.getRepository(options);
  }

  getUserAgentString(userAgentName: string, options: BigSemanticsCallOptions = {}): Promise<string> {
    return this.bsImpl.getUserAgentString(userAgentName, options);
  }

  getDomainInterval(domain: string, options: BigSemanticsCallOptions = {}): Promise<number> {
    return this.bsImpl.getDomainInterval(domain, options);
  }

  loadMmd(name: string, options: BigSemanticsCallOptions = {}): Promise<MetaMetadata> {
    return this.bsImpl.loadMmd(name, options);
  }

  selectMmd(location: string | ParsedURL, options: BigSemanticsCallOptions = {}): Promise<MetaMetadata> {
    return this.bsImpl.selectMmd(location, options);
  }

  normalizeLocation(location: string | ParsedURL, options: BigSemanticsCallOptions = {}): Promise<string> {
    return this.bsImpl.normalizeLocation(location, options);
  }
}
