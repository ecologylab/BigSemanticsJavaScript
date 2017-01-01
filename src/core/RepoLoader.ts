/**
 * An abstraction of obtaining a Repository or RepoMan object.
 */

import * as Promise from 'bluebird';
import { Repository, TypedRepository } from './types';
import RepoMan from './RepoMan';
import { RemoteRepoLoaderOptions, RemoteRepoLoader } from '../downloaders/RemoteRepoLoader';
import { ServiceRepoLoaderOptions, ServiceRepoLoader } from '../downloaders/ServiceRepoLoader';

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

/**
 * @param {Object} options
 * @return {RepoLoader}
 */
export function create(options?: Object): RepoLoader {
  if ('repository' in options && options['repository']) {
    let result = new DefaultRepoLoader();
    result.load(options as DefaultRepoLoaderOptions);
    return result;
  }

  if ('repositoryUrl' in options && options['repositoryUrl']) {
    let result = new RemoteRepoLoader();
    result.load(options as RemoteRepoLoaderOptions);
    return result;
  }

  if ('serviceBase' in options && options['serviceBase']) {
    let result = new ServiceRepoLoader();
    result.load(options as ServiceRepoLoaderOptions);
    return result;
  }

  let err = new Error("Cannot find a suitable RepoLoader factory");
  console.error(err);
  return null;
}
