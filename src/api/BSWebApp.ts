/**
 * This module enables using BigSemantics in a vanilla web application.
 */

import * as Promise from 'bluebird';
import * as simpl from 'simpl.js';
import ParsedURL, { QueryMap } from '../core/ParsedURL';
import Readyable from '../core/Readyable';
import {
  MetaMetadata,
  BuildInfo,
  Repository,
  Metadata,
  TypedMetadata,
  BSResult,
} from '../core/types';
import { PreFilter } from '../core/FieldOps';
import RepoMan, { RepoOptions, RepoCallOptions, } from '../core/RepoMan';
import { RequestOptions, Downloader } from '../core/Downloader';
import XHRDownloader from '../downloaders/XHRDownloader';
import ServiceRepoLoader, { ServiceRepoLoaderOptions } from '../downloaders/ServiceRepoLoader';
import { BigSemanticsOptions, BigSemanticsCallOptions, } from '../core/BigSemantics';
import { AbstractBigSemantics } from "./AbstractBigSemantics";

/**
 * Options for BSWebApp.
 */
export interface BSWebAppOptions extends BigSemanticsOptions {
  appId: string;
  appVer: string;

  serviceBase: string | ParsedURL;
  repoOptions?: RepoOptions;
  cacheRepoFor?: string; // e.g. 30d, 20h, 30m, 1d12h, 5h30m, 5d12h30m
  disableRepoCaching?: boolean;
  requesterFactory?: ()=>Downloader;
}

/**
 * A BigSemantics implementation for vanilla web applications.
 * It uses JSONP to work around CORS limitations (and therefore inherently
 * lacking in error reporting).
 */
export class BSWebApp extends AbstractBigSemantics {
  private options: BSWebAppOptions;
  private repoLoader: ServiceRepoLoader;

  getServiceBase(): ParsedURL {
    return this.repoLoader.getServiceHelper().getServiceBase();
  }

  /**
   * (Re)Load this instance with specified options.
   *
   * @param {BSWebAppOptions} options
   */
  load(options: BSWebAppOptions): void {
    this.reset();

    this.options = options;

    this.repoLoader = new ServiceRepoLoader();
    this.repoLoader.load(options);
    this.repoLoader.getRepoMan().then(() => {
      this.setReady();
    }).catch(err => {
      this.setError(err);
    });
  }

  /**
   * If repository is cached, this will force repository to be reloaded from the
   * last used service.
   */
  reload(): void {
    this.repoLoader.reload();
  }

  loadMetadata(location: string | ParsedURL, options: BigSemanticsCallOptions = {}): Promise<BSResult> {
    let purl = ParsedURL.get(location);
    // due to limit on CORS, we always use the service.
    return this.repoLoader.getServiceHelper().callJSONService('metadata.json', {
      url: purl.toString(),
      timeout: options.timeout || this.options.timeout,
      wmmd: options.includeMmdInResult,
    }).then(bsresp => {
      if (!bsresp.metadata) {
        throw new Error("Metadata missing from service response");
      }
      if (options.includeMmdInResult && !bsresp.mmd) {
        throw new Error("Wrapper should be included in service response");
      }
      let result: BSResult = {
        metadata: bsresp.metadata,
      };
      if (options.includeMmdInResult) {
        result.mmd = bsresp.mmd;
      }
      return result;
    });
  }

  getBuildInfo(options: BigSemanticsCallOptions = {}): Promise<BuildInfo> {
    return this.repoLoader.getRepoMan().then(repoMan => repoMan.getBuildInfo(options));
  }

  getRepository(options: BigSemanticsCallOptions = {}): Promise<Repository> {
    return this.repoLoader.getRepoMan().then(repoMan => repoMan.getRepository(options));
  }

  getSerializedRepository(options: BigSemanticsCallOptions = {}): Promise<string> {
    return this.repoLoader.getRepoMan().then(repoMan => repoMan.getSerializedRepository(options));
  }

  getUserAgentString(userAgentName: string, options: BigSemanticsCallOptions = {}): Promise<string> {
    return this.repoLoader.getRepoMan().then(repoMan => repoMan.getUserAgentString(userAgentName, options));
  }

  getDomainInterval(domain: string, options: BigSemanticsCallOptions = {}): Promise<number> {
    return this.repoLoader.getRepoMan().then(repoMan => repoMan.getDomainInterval(domain, options));
  }

  loadMmd(name: string, options: BigSemanticsCallOptions = {}): Promise<MetaMetadata> {
    if (this.repoLoader.getOptions().disableRepoCaching) {
      return this.repoLoader.getRepoMan().then(repoMan => repoMan.loadMmd(name, options));
    } else {
      return this.repoLoader.getServiceHelper().callJSONService('wrapper.json', {
        name: name,
      }).then(bsresp => {
        if (!bsresp.mmd) {
          throw new Error("Wrapper missing from service response");
        }
        return bsresp.mmd;
      });
    }
  }

  selectMmd(location: string | ParsedURL, options: BigSemanticsCallOptions = {}): Promise<MetaMetadata> {
    let purl = ParsedURL.get(location);
    if (this.repoLoader.getOptions().disableRepoCaching) {
      return this.repoLoader.getRepoMan().then(repoMan => repoMan.selectMmd(purl, options));
    } else {
      return this.repoLoader.getServiceHelper().callJSONService('wrapper.json', {
        url: purl.toString(),
      }).then(bsresp => {
        if (!bsresp.mmd) {
          throw new Error("Wrapper missing from service response");
        }
        return bsresp.mmd;
      });
    }
  }

  normalizeLocation(location: string | ParsedURL, options: BigSemanticsCallOptions = {}): Promise<string> {
    return this.loadInitialMetadata(location, options).then(result => {
      let metadata_type_name = result.metadata.metadata_type_name;
      return (result.metadata[metadata_type_name] as Metadata).location;
    });
  }
}

export default BSWebApp;
