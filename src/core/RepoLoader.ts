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
export interface RepoLoaderFactory {
  (options?: Object): RepoLoader;
}

let factories: RepoLoaderFactory[] = [];

/**
 * @param {RepoLoaderFactory} factory
 */
export function registerFactory(factory: RepoLoaderFactory): void {
  factories.unshift(factory);
}

/**
 * @param {Object} options
 * @return {RepoLoader}
 */
export function create(options?: Object): RepoLoader {
  for (let factory of factories) {
    let result = factory(options);
    if (result) {
      return result;
    }
  }
  let err = new Error("Cannot find a suitable RepoLoader factory");
  console.error(err);
  return null;
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

registerFactory(options => {
  if ('repository' in options) {
    let result = new DefaultRepoLoader();
    result.load(options as DefaultRepoLoaderOptions);
    return result;
  }
  return null;
});
