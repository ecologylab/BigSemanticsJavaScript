/**
 * Utility functions.
 */

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
