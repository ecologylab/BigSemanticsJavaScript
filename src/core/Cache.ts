/**
 * A general cache interface.
 */

/// <reference path="../../typings/index.d.ts" />

import * as Promise from 'bluebird';

/**
 * A read-through function.
 */
export interface ReadThrough<Value> {
  (key: string): Promise<Value>;
}

/**
 * A general cache with read-throguh ability.
 */
export interface Cache<Value> {
  /**
   * A unique name for this cache.
   */
  name: string;

  /**
   * Return the capacity, i.e., max number of entries for this cache.
   * @return {number} Capacity.
   */
  getCapacity(): number;

  /**
   * Set the capacity.
   * @param {number} capacity New capacity.
   */
  setCapacity(capacity: number): void;

  /**
   * Return the size, i.e., actual number of entries in this cache.
   * @return {number} Size.
   */
  getSize(): number;

  /**
   * Retrieve an entry by key.
   *
   * @param  {string}             key
   * @param  {ReadThrough<Value>} readThrough
   *   If entry not found by key, create one using this funciton.
   * @return {Promise<Value>}
   */
  get(key: string, readThrough?: ReadThrough<Value>): Promise<Value>;

  /**
   * Put an entry into the cache.
   *
   * @param  {string}           key
   * @param  {Value}            val
   * @return {Promise<boolean>} If val is successfully put into the cache.
   */
  put(key: string, val: Value): Promise<boolean>;

  /**
   * Remove an entry from the cache.
   *
   * @param  {string}           key
   * @return {Promise<boolean>} If corresponding entry is successfully removed.
   */
  remove(key: string): Promise<boolean>;
}

/**
 * A base implementation of the Cache interface.
 * It does no caching: all put operations are ignored, and all get operations
 * either return null values or call the read-through function.
 */
export class BaseCache<Value> implements Cache<Value> {
  name = 'base';

  getCapacity(): number {
    return 0;
  }

  setCapacity(capacity: number): void {
    // nothing happens
  }

  getSize(): number {
    return 0;
  }

  get(key: string, readThrough?: ReadThrough<Value>): Promise<Value> {
    if (readThrough) {
      return readThrough(key);
    }
    return Promise.resolve(null);
  }

  put(key: string, val: Value): Promise<boolean> {
    return Promise.resolve(false);
  }

  remove(key: string): Promise<boolean> {
    return Promise.resolve(false);
  }
}
