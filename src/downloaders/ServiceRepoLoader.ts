/**
 * Helper for caching repository from BigSemantics web service.
 */

import * as Promise from 'bluebird';
import ParsedURL from '../core/ParsedURL';
import { Repository } from '../core/types';
import RepoMan, { RepoOptions } from '../core/RepoMan';
import { Downloader } from '../core/Downloader';
import { RepoLoader } from '../core/RepoLoader';
import ServiceHelper from "./ServiceHelper";

/**
 *
 */
export interface ServiceRepoLoaderOptions {
  appId?: string;
  appVer?: string;
  serviceBase: string | ParsedURL;
  repoOptions?: RepoOptions;
  cacheRepoFor?: string;
  requesterFactory?: ()=>Downloader;
}

/**
 * Helper for caching repository from BigSemantics web service.
 */
export default class ServiceRepoLoader implements RepoLoader {
  private options: ServiceRepoLoaderOptions;
  private serviceHelper: ServiceHelper;
  private repoMan: RepoMan;
  private repoManLife: number = 0;
  private repoManTimer: any = undefined;

  getServiceBase(): ParsedURL {
    return this.serviceHelper.serviceBase;
  }

  getServiceHelper(): ServiceHelper {
    return this.serviceHelper;
  }

  load(options: ServiceRepoLoaderOptions): void {
    this.options = options;
    this.serviceHelper = new ServiceHelper();
    this.serviceHelper.load(options);
    if (options.cacheRepoFor) {
      let match = options.cacheRepoFor.match(/((\d+)d)?((\d+)h)?((\d+)m)?/i);
      if (!match) {
        throw new Error("Invalid cache life: " + options.cacheRepoFor);
      }
      let d = match[2] ? Number(match[2]) : 0;
      let h = match[4] ? Number(match[4]) : 0;
      let m = match[6] ? Number(match[6]) : 0;
      this.repoManLife = d*86400000 + h*3600000 + m*60000;
      this.getRepoMan();
    } else {
      this.repoMan = null;
    }
  }

  /**
   * If repository is cached, this will force repository to be reloaded from the
   * last used service.
   */
  reload(): void {
    if (this.repoMan) {
      this.reloadRepoMan();
    }
  }

  isLoaded(): boolean {
    return !!this.repoMan;
  }

  reloadRepo(): Promise<Repository> {
    return this.serviceHelper.callJSONService('repository.json').then(bsresp => {
      if (!bsresp.repository) {
        throw new Error("Missing repository in server response");
      }
      return bsresp.repository;
    });
  }

  getRepoMan(): Promise<RepoMan> {
    if (this.repoMan) {
      return Promise.resolve(this.repoMan);
    }
    return this.reloadRepoMan();
  }

  reloadRepoMan(): Promise<RepoMan> {
    if (this.repoMan) {
      this.repoMan.reset();
    } else {
      this.repoMan = new RepoMan();
    }

    this.reloadRepo().then(repo => {
      this.repoMan.load(repo, this.options.repoOptions);
      if (this.repoManLife > 0) {
        if (this.repoManTimer) {
          clearTimeout(this.repoManTimer);
        }
        this.repoManTimer = setTimeout(() => {
          this.getRepoMan();
        }, this.repoManLife);
      }
    }).catch(err => {
      this.repoMan.setError(err);
    });

    return Promise.resolve(this.repoMan);
  }
}
