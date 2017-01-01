/**
 * Helper for caching repository from BigSemantics web service.
 */

import * as Promise from 'bluebird';
import * as simpl from 'simpl.js';
import ParsedURL from '../core/ParsedURL';
import { Repository, TypedRepository, BSResult } from '../core/types';
import RepoMan, { RepoOptions } from '../core/RepoMan';
import { Downloader } from '../core/Downloader';
import { RepoLoader } from '../core/RepoLoader';
import XHRDownloader from './XHRDownloader';

/**
 *
 */
export interface RemoteRepoLoaderOptions {
  appId?: string;
  appVer?: string;

  repositoryUrl: string | ParsedURL;

  repoOptions?: RepoOptions;

  /**
   * Format: "1d", "1d12h", "5h30m", "100m"
   * Minimum: 10 min
   * Default value: 1d.
   * @type {[type]}
   */
  cacheRepoFor?: string;

  disableRepoCaching?: boolean;

  requesterFactory?: ()=>Downloader;
}

/**
 * Helper for caching repository from BigSemantics web service.
 */
export class RemoteRepoLoader implements RepoLoader {
  private options: RemoteRepoLoaderOptions;
  private repository: Repository;
  private repoMan: RepoMan;
  private repoManLife: number = 0;
  private repoManTimer: any = undefined;

  getOptions(): RemoteRepoLoaderOptions {
    return this.options;
  }

  load(options: RemoteRepoLoaderOptions): void {
    this.options = options;
    if (!options.disableRepoCaching) {
      let cacheRepoFor = options.cacheRepoFor || '1d';
      let match = cacheRepoFor.match(/((\d+)d)?((\d+)h)?((\d+)m)?/i);
      if (!match) {
        throw new Error("Invalid cache life: " + options.cacheRepoFor);
      }
      let d = match[2] ? Number(match[2]) : 0;
      let h = match[4] ? Number(match[4]) : 0;
      let m = match[6] ? Number(match[6]) : 0;
      this.repoManLife = d*86400000 + h*3600000 + m*60000;
      if (this.repoManLife < 3600000) {
        console.warn("Minimal repository cache life: 10min");
        this.repoManLife = 600000;
      }
      this.getRepoMan();
    } else {
      console.log("Repository caching disabled.");
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

  getRepoMan(): Promise<RepoMan> {
    if (this.repoMan && !this.options.disableRepoCaching) {
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

    let requester: Downloader = null;
    if (this.options.requesterFactory) {
      requester = this.options.requesterFactory();
    } else {
      requester = new XHRDownloader();
    }

    let opts = {
      responseType: 'json',
    };
    return requester.httpGet(this.options.repositoryUrl, opts).then(resp => {
      let entity: any = resp.entity;
      if (!entity) {
        if (resp.text) {
          entity = simpl.deserialize(resp.text);
        }
      }

      if (!entity) {
        throw new Error("Missing repository in response");
      }

      let repo: Repository | TypedRepository = null;
      if ('meta_metadata_repository' in entity) {
        repo = entity['meta_metadata_repository'] as Repository;
      } else if ('repository' in entity) {
        repo = entity['repository'] as Repository;
      } else {
        repo = entity;
      }

      simpl.graphExpand(repo);
      this.repoMan.load(repo, this.options.repoOptions);
      if (this.repoManLife > 0) {
        if (this.repoManTimer) {
          clearTimeout(this.repoManTimer);
        }
        this.repoManTimer = setTimeout(() => {
          this.reloadRepoMan();
        }, this.repoManLife);
      }

      return this.repoMan.onReadyP();
    }).catch(err => {
      this.repoMan.setError(err);
    });
  }
}

export default RemoteRepoLoader;
