/**
 * Base class for remote extractors.
 */

import * as Promise from 'bluebird';
import {
  HttpResponse,
  MetaMetadata,
  TypedMetadata,
} from '../core/types';
import { PreFilter } from '../core/FieldOps';
import { ExtractionOptions, Extractor } from '../core/Extractor';
import { BigSemantics } from '../core/BigSemantics';

/**
 * A remote extraction task.
 */
export class RemoteExtractionTask {
  location: string;
  mmd: MetaMetadata;
  timeout: number;

  typedMetadata: Promise<TypedMetadata>;
  private resolver: (TypedMetadata)=>void;
  private rejecter: (Error)=>void;

  constructor(location: string, mmd: MetaMetadata, timeout: number) {
    this.location = location;
    this.mmd = mmd;
    this.timeout = timeout;
    this.typedMetadata = new Promise((resolve, reject) => {
      this.resolver = resolve;
      this.rejecter = reject;
    }).timeout(timeout) as Promise<TypedMetadata>;
  }

  resolve(typedMetadata: TypedMetadata): void {
    this.resolver.call(null, typedMetadata);
  }

  reject(err: Error): void {
    this.rejecter.call(null, err);
  }
}

export interface RemoteExtractionOptions extends ExtractionOptions {
  timeout?: number;
}

/**
 * A base remote extractor.
 * Detailed spec: https://docs.google.com/document/d/1kjgonh8jp3vwLKajReEa2zfAYfodcKCc233n7kVu3tE
 */
export abstract class RemoteExtractor implements Extractor {
  name = 'remote';

  defaultTimeout: number;
  protected tasks: { [location: string]: RemoteExtractionTask } = {};

  constructor(defaultTimeout: number = 30000) {
    this.defaultTimeout = defaultTimeout;
  }

  extractMetadata(
    response: HttpResponse,
    mmd: MetaMetadata,
    bigSemanticsApi: BigSemantics = null,
    options: RemoteExtractionOptions = {}
  ): Promise<TypedMetadata> {
    let location = response.location;
    if (mmd.filter_location) {
      location = PreFilter.filter(location, mmd.filter_location);
    }

    if (location in this.tasks) {
      return this.tasks[location].typedMetadata;
    }

    let task = this.newTask(response, mmd, options);
    this.tasks[location] = task;
    task.typedMetadata.finally(() => {
      delete this.tasks[location];
    });

    this.start(location);

    return task.typedMetadata;
  }

  /**
   * Create a new extraction task object.
   * @param {HttpResponse} response
   * @param {MetaMetadata} mmd
   * @param {RemoteExtractionOptions} options
   * @return {RemoteExtractionTask}
   */
  protected newTask(
    response: HttpResponse,
    mmd: MetaMetadata,
    options: RemoteExtractionOptions
  ): RemoteExtractionTask {
    return new RemoteExtractionTask(
      response.location,
      mmd,
      options.timeout || this.defaultTimeout
    );
  }

  /**
   * Start remote extraction. Should be implemented by subclasses.
   * @param {string} location
   */
  abstract start(location: string): void;

  /**
   * Finish remote extraction, e.g. cleaning up. Should be implemented by
   * subclasses.
   * @param {string} location
   */
  abstract finish(location: string): void;

  /**
   * Extraction finished.
   * @param {string} location
   * @param {Error} err
   * @param {TypedMetadata} typedMetadata
   */
  doneWith(location: string, err: Error, typedMetadata: TypedMetadata): void {
    if (location in this.tasks) {
      this.finish(location);
      if (err) {
        this.tasks[location].reject(err);
      } else {
        this.tasks[location].resolve(typedMetadata);
      }
    }
  }

  /**
   * Answer whether a newly loaded page needs to be extracted.
   * @param {string} location
   * @return {boolean}
   */
  extractNeeded(location: string): boolean {
    return location in this.tasks;
  }
}
