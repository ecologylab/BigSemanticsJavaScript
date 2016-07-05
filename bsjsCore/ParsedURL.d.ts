// Type declaration for ParsedURL. For use with TypeScript.

export default class ParsedURL {
  raw: string;
  stripped: string;

  scheme: string;
  hostSpec: string; // [user:password@host:port]
  user: string;
  password: string;
  host: string;
  port: number;

  domain: string; // top level domain
  path: string;
  query: Object; // param key-value pairs
  fragmentId: string;

  constructor(url: string, base?: string);
}
