/**
 * A base class for things that can take time to get ready.
 */

/// <reference path="../../typings/index.d.ts" />

import * as Promise from 'bluebird';

/**
 * A convenience interface for callbacks.
 */
interface Callback<Value> {
  (err: Error, val?: Value): void;
}

/**
 * An object that can take time to get ready.
 */
export default class Readyable {
  private ready: boolean = false;
  private callbackQueue: Callback<this>[] = [];
  private error: Error = null;

  isReady(): boolean {
    return this.ready;
  }

  /**
   * If the object is ready or is in erroneous state, execute the callback
   * immediately and synchronously.
   *
   * If the object is still in preparation, queue the callback and call it when
   * the object gets ready or encounters error.
   *
   * @param {Callback<this>} callback The callback function.
   */
  onReady(callback: Callback<this>): void {
    if (this.error) {
      callback(this.error);
      return;
    }
    if (this.ready) {
      callback(null, this);
      return;
    }
    this.callbackQueue.push(callback);
  }

  /**
   * A promisified version of onReady().
   */
  onReadyP(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.onReady(err => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  /**
   * Mark this object as ready. Execute queued callbacks.
   *
   * Note that once set, the state cannot be changed until reset() is called.
   */
  setReady(): void {
    if (!this.ready && this.error === null) {
      this.ready = true;
      this.error = null;
      for (let callback of this.callbackQueue) {
        callback(null, this);
      }
      this.callbackQueue = [];
    }
  }

  /**
   * Mark this object with an error. Execute queued callbacks.
   *
   * Note that once set, the state cannot be changed until reset() is called.
   *
   * @param {Error} err
   *   The error with this object.
   */
  setError(err: Error): void {
    if (!this.ready && this.error === null) {
      this.ready = false;
      this.error = err;
      for (let callback of this.callbackQueue) {
        callback(err);
      }
      this.callbackQueue = [];
    }
  }

  /**
   * Reset the state of a ready or erroneous object back to that before it gets
   * ready or encounters error.
   */
  reset(): void {
    if (this.ready || this.error !== null) {
      this.ready = false;
      this.error = null;
      this.callbackQueue = []; // should already be empty.
    }
  }
}
