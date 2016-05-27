// RepoMan type definition.

import { Readyable } from './Readyable';
import { MetaMetadata } from './BigSemantics';

export class RepoMan extends Readyable {
  constructor(source: any, options: any);

  loadMmd(
    name: string,
    options: any,
    callback: (err: any, mmd: MetaMetadata)=>void
  ): void;

  selectMmd(
    location: string,
    options: any,
    callback: (err: any, mmd: MetaMetadata)=>void
  ): void;
}
