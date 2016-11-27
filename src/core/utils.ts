/**
 * Utility functions.
 */

import * as Promise from 'bluebird';

let chars = [
  '01234567',
  '89abcdef',
  'ghjkmnpq',
  'rstvwxyz',
].join('');

export function uuid(len: number = 10): string {
  let result: string = '';
  for (let i = 0; i < len; ++i) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function reflect<T>(promise: Promise<T>): Promise<T|Error> {
  return new Promise<T|Error>((resolve, reject) => {
    promise.then(val => {
      resolve(val);
    }).catch(err => {
      resolve(err);
    });
  });
}

export function allSettled<T>(promises: Promise<T>[]): Promise<(T|Error)[]> {
  return Promise.all(promises.map(reflect));
}
