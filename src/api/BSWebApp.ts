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
  BSResponse,
} from '../core/types';
import { PreFilter } from '../core/FieldOps';
import RepoMan, { RepoOptions, RepoCallOptions, } from '../core/RepoMan';
import { RequestOptions, Downloader } from '../core/Downloader';
import XHRDownloader from '../downloaders/XHRDownloader';
import {
  BigSemanticsOptions,
  BigSemanticsCallOptions,
  MetadataResult,
} from '../core/BigSemantics';
import { AbstractBigSemantics } from "./AbstractBigSemantics";
import RepoServiceHelper from "../downloaders/RepoServiceHelper";

/**
 * Options for BSWebApp.
 */
export interface BSWebAppOptions extends BigSemanticsOptions {
  appId: string;
  appVer: string;
  serviceBase: string | ParsedURL;
  cacheRepoFor?: string; // e.g. 30d, 20h, 30m, 5d12h30m
}

/**
 * A BigSemantics implementation for vanilla web applications.
 * It uses JSONP to work around CORS limitations (and therefore inherently
 * lacking in error reporting).
 */
export default class BSWebApp extends AbstractBigSemantics {
  private options: BSWebAppOptions;
  private repoServiceHelper: RepoServiceHelper;

  /**
   * (Re)Load this instance with specified options.
   *
   * @param {BSWebAppOptions} options
   */
  load(options: BSWebAppOptions): void {
    this.reset();

    this.options = options;
    this.repoServiceHelper = new RepoServiceHelper();
    this.repoServiceHelper.load(
      options.serviceBase,
      options.cacheRepoFor,
      options.repoOptions,
      options.appId,
      options.appVer,
    );

    this.repoServiceHelper.repoMan.onReadyP().then(() => {
      this.setReady();
    });
  }

  /**
   * If repository is cached, this will force repository to be reloaded from the
   * last used service.
   */
  reload(): void {
    this.repoServiceHelper.reload();
  }

  getServiceBase(): ParsedURL {
    return this.repoServiceHelper.serviceBase;
  }

  loadMetadata(location: string | ParsedURL, options: BigSemanticsCallOptions = {}): Promise<MetadataResult> {
    let purl = ParsedURL.get(location);
    return this.repoServiceHelper.callJSONService('metadata.json', {
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
      let result: MetadataResult = {
        metadata: bsresp.metadata,
      };
      if (options.includeMmdInResult) {
        result.mmd = bsresp.mmd;
      }
      return result;
    });
  }

  getBuildInfo(options: BigSemanticsCallOptions = {}): Promise<BuildInfo> {
    if (this.repoServiceHelper.repoMan) {
      return this.repoServiceHelper.repoMan.getBuildInfo(options);
    } else {
      return this.repoServiceHelper.loadRepositoryFromService().then(repo => repo.build);
    }
  }

  getRepository(options: BigSemanticsCallOptions = {}): Promise<TypedRepository> {
    if (this.repoServiceHelper.repoMan) {
      return this.repoServiceHelper.repoMan.getRepository(options);
    } else {
      return this.repoServiceHelper.loadRepositoryFromService().then(repo => {
        return {
          meta_metadata_repository: repo,
        };
      });
    }
  }

  getUserAgentString(userAgentName: string, options: BigSemanticsCallOptions = {}): Promise<string> {
    if (this.repoServiceHelper.repoMan) {
      return this.repoServiceHelper.repoMan.getUserAgentString(userAgentName, options);
    } else {
      return this.repoServiceHelper.loadRepositoryFromService().then(repo => {
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
    if (this.repoServiceHelper.repoMan) {
      return this.repoServiceHelper.repoMan.getDomainInterval(domain, options);
    } else {
      return this.repoServiceHelper.loadRepositoryFromService().then(repo => {
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
    if (this.repoServiceHelper.repoMan) {
      return this.repoServiceHelper.repoMan.loadMmd(name, options);
    } else {
      return this.repoServiceHelper.callJSONService('wrapper.json', {
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
    if (this.repoServiceHelper.repoMan) {
      return this.repoServiceHelper.repoMan.selectMmd(purl, options);
    } else {
      return this.repoServiceHelper.callJSONService('wrapper.json', {
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
