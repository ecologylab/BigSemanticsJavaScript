/**
 * Helper for caching repository from BigSemantics web service.
 */

import * as Promise from 'bluebird';
import ParsedURL from '../core/ParsedURL';
import { Repository } from '../core/types';
import RepoMan, { RepoOptions } from '../core/RepoMan';
import ServiceHelper from "./ServiceHelper";

/**
 * Helper for caching repository from BigSemantics web service.
 */
export default class RepoServiceHelper extends ServiceHelper {
  repoMan: RepoMan;
  repoOptions: RepoOptions;
  private repoManLife: number = 0;
  private repoManTimer: any = undefined;

  load(
    serviceBase: string | ParsedURL,
    cacheRepoFor?: string,
    repoOptions?: RepoOptions,
    appId?: string,
    appVer?: string,
  ): void {
    super.load(serviceBase, appId, appVer);
    this.repoOptions = repoOptions;
    if (cacheRepoFor) {
      let match = cacheRepoFor.match(/((\d+)d)?((\d+)h)?((\d+)m)?/i);
      if (!match) {
        throw new Error("Invalid cache life: " + cacheRepoFor);
      }
      let d = match[2] ? Number(match[2]) : 0;
      let h = match[4] ? Number(match[4]) : 0;
      let m = match[6] ? Number(match[6]) : 0;
      this.repoManLife = d*86400000 + h*3600000 + m*60000;
      this.loadRepoManFromService();
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
      this.loadRepoManFromService();
    }
  }

  loadRepositoryFromService(): Promise<Repository> {
    return this.callJSONService('repository.json').then(bsresp => {
      if (!bsresp.repository) {
        throw new Error("Missing repository in server response");
      }
      return bsresp.repository;
    });
  }

  loadRepoManFromService(): void {
    if (this.repoMan) {
      this.repoMan.reset();
    } else {
      this.repoMan = new RepoMan();
    }

    this.loadRepositoryFromService().then(repo => {
      this.repoMan.load(repo, this.repoOptions);
      if (this.repoManLife > 0) {
        if (this.repoManTimer) {
          clearTimeout(this.repoManTimer);
        }
        this.repoManTimer = setTimeout(() => {
          this.loadRepoManFromService();
        }, this.repoManLife);
      }
    }).catch(err => {
      this.repoMan.setError(err);
    });
  }
}
