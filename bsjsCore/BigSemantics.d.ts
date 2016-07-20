// BigSemantics type definition.

import { Readyable } from './Readyable';
import RepoMan from './RepoMan';

export interface MetaMetadata {
  name: string;
}

export interface Metadata {
  mm_name: string;
}

export interface IBigSemantics {
  loadMetadata(
    location: string,
    options: any,
    callback: (err: Error, result: { metadata: Metadata, mmd: MetaMetadata })=>void
  ): void;

  loadInitialMetadata(
    location: string,
    options: any,
    callback: (err: Error, initialMetadata: Metadata)=>void
  ): void;

  loadMmd(
    name: string,
    options: any,
    callback: (err: Error, mmd: MetaMetadata)=>void
  ): void;

  selectMmd(
    location: string,
    options: any,
    callback: (err: Error, mmd: MetaMetadata)=>void
  ): void;

  getRepoSource(
    callback: (err: Error, repoSource: any)=>void
  ): void;

  getRepo(): any;
}

export declare class BigSemantics extends Readyable implements IBigSemantics {
  constructor(repoSource: any, options: any);

  protected repoMan: RepoMan;

  loadMetadata(location, options, callback);
  loadInitialMetadata(location, options, callback);
  loadMmd(name, options, callback);
  selectMmd(location, options, callback);
  getRepoSource(callback);
  getRepo(): Object;
}

export default BigSemantics;
