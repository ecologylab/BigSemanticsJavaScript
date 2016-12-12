/**
 * An abstraction of obtaining a Repository or RepoMan object.
 */

import * as Promise from 'bluebird';
import { Repository, TypedRepository } from './types';
import RepoMan from './RepoMan';

/**
 *
 */
export interface RepoLoader {
  getRepoMan(): Promise<RepoMan>;
  reloadRepoMan(): Promise<RepoMan>;
}

/**
 *
 */
export interface DefaultRepoLoaderOptions {
  repository?: Repository | TypedRepository;
}

/**
 *
 */
export class DefaultRepoLoader implements RepoLoader {

  private typedRepository: TypedRepository;
  private repoMan: RepoMan;

  load(options: DefaultRepoLoaderOptions): void {
    if ('meta_metadata_repository' in options.repository) {
      this.typedRepository = options.repository as TypedRepository;
    } else {
      this.typedRepository = {
        meta_metadata_repository: options.repository as Repository,
      };
    }
    this.reloadRepoMan();
  }

  reload(): void {
    // nothing to do
  }

  getRepoMan(): Promise<RepoMan> {
    return Promise.resolve(this.repoMan);
  }

  reloadRepoMan(): Promise<RepoMan> {
    this.repoMan = new RepoMan();
    this.repoMan.load(this.typedRepository);
    return Promise.resolve(this.repoMan);
  }

}
