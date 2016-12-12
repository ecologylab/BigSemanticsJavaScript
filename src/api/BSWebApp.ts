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
  TypedRepository,
  Metadata,
  TypedMetadata,
  BSResult,
} from '../core/types';
import { PreFilter } from '../core/FieldOps';
import RepoMan, { RepoOptions, RepoCallOptions, } from '../core/RepoMan';
import { RequestOptions, Downloader } from '../core/Downloader';
import XHRDownloader from '../downloaders/XHRDownloader';
import ServiceRepoLoader from '../downloaders/ServiceRepoLoader';
import {
  BigSemanticsOptions,
  BigSemanticsCallOptions,
} from '../core/BigSemantics';
import { AbstractBigSemantics } from "./AbstractBigSemantics";

/**
 * Options for BSWebApp.
 */
export interface BSWebAppOptions extends BigSemanticsOptions {
  appId: string;
  appVer: string;
  serviceBase: string | ParsedURL;
  repoOptions?: RepoOptions;
  cacheRepoFor?: string; // e.g. 30d, 20h, 30m, 5d12h30m
}

/**
 * A BigSemantics implementation for vanilla web applications.
 * It uses JSONP to work around CORS limitations (and therefore inherently
 * lacking in error reporting).
 */
export default class BSWebApp extends AbstractBigSemantics {
  private options: BSWebAppOptions;
  private serviceRepoLoader: ServiceRepoLoader;

  /**
   * (Re)Load this instance with specified options.
   *
   * @param {BSWebAppOptions} options
   */
  load(options: BSWebAppOptions): void {
    this.reset();

    this.options = options;
    this.serviceRepoLoader = new ServiceRepoLoader();
    this.serviceRepoLoader.load(options);

    this.serviceRepoLoader.getRepoMan().then(repoMan => repoMan.onReadyP().then(() => {
      this.setReady();
    }));
  }

  /**
   * If repository is cached, this will force repository to be reloaded from the
   * last used service.
   */
  reload(): void {
    this.serviceRepoLoader.reload();
  }

  getServiceBase(): ParsedURL {
    return this.serviceRepoLoader.getServiceBase();
  }

  loadMetadata(location: string | ParsedURL, options: BigSemanticsCallOptions = {}): Promise<BSResult> {
    let purl = ParsedURL.get(location);
    return this.serviceRepoLoader.getServiceHelper().callJSONService('metadata.json', {
      url: purl.toString(),
      t: options.timeout || this.options.timeout,
      w: options.includeMmdInResult,
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
    if (this.serviceRepoLoader.isLoaded()) {
      return this.serviceRepoLoader.getRepoMan().then(repoMan => repoMan.getBuildInfo(options));
    } else {
      return this.serviceRepoLoader.reloadRepo().then(repo => repo.build);
    }
  }

  getRepository(options: BigSemanticsCallOptions = {}): Promise<TypedRepository> {
    if (this.serviceRepoLoader.isLoaded()) {
      return this.serviceRepoLoader.getRepoMan().then(repoMan => repoMan.getRepository(options));
    } else {
      return this.serviceRepoLoader.reloadRepo().then(repo => {
        return {
          meta_metadata_repository: repo,
        };
      });
    }
  }

  getUserAgentString(userAgentName: string, options: BigSemanticsCallOptions = {}): Promise<string> {
    if (this.serviceRepoLoader.isLoaded()) {
      return this.serviceRepoLoader.getRepoMan().then(repoMan => repoMan.getUserAgentString(userAgentName, options));
    } else {
      return this.serviceRepoLoader.reloadRepo().then(repo => {
        let defaultAgentString: string = null;
        for (let agent of repo.user_agents) {
          if (agent.name === userAgentName) {
            return agent.string;
          }
          if (agent.default) {
            defaultAgentString = agent.string;
          }
        }
        return defaultAgentString;
      });
    }
  }

  getDomainInterval(domain: string, options: BigSemanticsCallOptions = {}): Promise<number> {
    if (this.serviceRepoLoader.isLoaded()) {
      return this.serviceRepoLoader.getRepoMan().then(repoMan => repoMan.getDomainInterval(domain, options));
    } else {
      return this.serviceRepoLoader.reloadRepo().then(repo => {
        for (let site of repo.sites) {
          if (site.domain === domain) {
            return site.min_download_interval * 1000;
          }
        }
        return 0;
      });
    }
  }

  loadMmd(name: string, options: BigSemanticsCallOptions = {}): Promise<MetaMetadata> {
    if (this.serviceRepoLoader.isLoaded()) {
      return this.serviceRepoLoader.getRepoMan().then(repoMan => repoMan.loadMmd(name, options));
    } else {
      return this.serviceRepoLoader.getServiceHelper().callJSONService('wrapper.json', {
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
    if (this.serviceRepoLoader.isLoaded()) {
      return this.serviceRepoLoader.getRepoMan().then(repoMan => repoMan.selectMmd(purl, options));
    } else {
      return this.serviceRepoLoader.getServiceHelper().callJSONService('wrapper.json', {
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
      let type = result.metadata.type;
      return (result.metadata[type] as Metadata).location;
    });
  }
}
