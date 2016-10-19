/**
 * A parsed URL representation.
 */

/**
 * Convenience type declaration.
 */
export interface HostSpec {
  user?: string;
  password?: string;
  host: string;
  port?: number;
}

/**
 * Convenience type declaration.
 */
export interface QueryMap {
  [name: string]: string|string[];
}

/**
 * A parsed URL representation.
 */
export default class ParsedURL {
  static readonly subdomainsToStrip = [ 'www', 'en' ];

  /**
   * Parse a host specification in the form of [user[:password]@]host[:port]
   * @param {string} hostSpec
   * @return {HostSpec}
   */
  static parseHostSpec(hostSpec: string): HostSpec {
    let result: HostSpec = { host: null };

    let p = hostSpec.indexOf('@');
    if (p >= 0) {
      let userPass = hostSpec.substr(0, p);
      let q = userPass.indexOf(':');
      if (q >= 0) {
        result.user = userPass.substr(0, q);
        result.password = userPass.substr(q+1);
      } else {
        result.user = userPass;
      }
      hostSpec = hostSpec.substr(p+1);
    }

    p = hostSpec.indexOf(':');
    if (p >= 0) {
      result.host = hostSpec.substr(0, p);
      result.port = Number(hostSpec.substr(p+1));
    } else {
      result.host = hostSpec;
    }

    return result;
  }

  /**
   * Parse URL query parameters.
   * Originally from: http://stackoverflow.com/questions/979975
   *
   * @param {string} query
   *   The URL query string.
   * @return {QueryMap}
   *   A set of key-value pairs representing query parameters.
   */
  static parseQueryParams(query: string): QueryMap {
    let result: QueryMap = {};

    if (query && query.length > 0) {
      if (query[0] == '?') query = query.substr(1);

      let parts = query.split('&');
      for (let part of parts) {
        let pair = part.split('=');
        let name = pair[0];
        let val = decodeURIComponent(pair[1]);
        let currVal = result[name]
        if (typeof currVal === 'undefined') {
          // first entry with this name
          result[name] = val;
        } else if (typeof currVal === 'string') {
          // second entry with this name
          let arr = [ currVal, val ];
          result[name] = arr;
        } else {
          // third or later entry with this name
          currVal.push(val);
        }
      }
    }

    return result;
  }

  raw: string;
  base: string;
  stripped: string;

  scheme: string;
  user: string;
  password: string;
  host: string;
  port: number;

  domain: string;

  path: string;
  query: QueryMap;
  fragmentId: string;

  private cachedString: string = null;

  /**
   * Constructor.
   *
   * @param {string} url
   *   The raw URL string.
   * @param {string = null} base
   *   The base URL, if 'url' is a relative one.
   */
  constructor(url: string, base: string = null) {
    if (url.indexOf('//') === 0 && base) {
      let p = base.indexOf('://');
      if (p !== -1) {
        this.scheme = base.substr(0, p);
        url = this.scheme + ':' + url;
      }
    } else if (url.length > 0 && url[0] === '/' && base) {
      let p = base.length - 1;
      while (p >= 0 && base[p] === '/') p--;
      base = base.substr(0, p+1);
      url = base + url;
    }

    this.raw = url;
    let matches = url.match(/^(((\w+)\:\/\/([^\/?#]+))([^?#]*))(\?[^#]*)?(#.*)?/);
    if (matches) {
      this.stripped = matches[1];

      this.base = matches[2];

      this.scheme = matches[3];

      let hostSpec = ParsedURL.parseHostSpec(matches[4]);
      this.user = hostSpec.user;
      this.password = hostSpec.password;
      this.host = hostSpec.host;
      this.port = hostSpec.port;

      // TODO a better way of getting the top level domain, see
      // https://publicsuffix.org/list/public_suffix_list.dat
  		// this is better but not ideal
  		let strippedHost = this.host;
  		for (let toStrip of ParsedURL.subdomainsToStrip) {
        toStrip += '.';
  			let l = toStrip.length;
  			if (strippedHost.length >= l && strippedHost.substr(0, l) === toStrip) {
  				strippedHost = strippedHost.substr(l);
  			}
  		}
  		this.domain = strippedHost;

      this.path = matches[5];
      if (this.path.length === 0) {
        this.path = '/';
      }

      this.query = ParsedURL.parseQueryParams(matches[6]);
      let fragId = matches[7];
      if (fragId) this.fragmentId = fragId.substr(1);
    }
  }

  /**
   * Return a string representation, which will be cached for future use.
   *
   * @return {string}
   */
  toString(): string {
    if (!this.cachedString) {
      let result = '';
      if (this.scheme) result += this.scheme + ':';
      result += '//';
      if (this.user) {
        result += encodeURIComponent(this.user);
        if (this.password) result += ':' + encodeURIComponent(this.password);
        result += '@';
      }
      if (this.port) result += ':' + this.port;
      result += this.path;
      if (this.query) {
        let parts = [];
        for (let key in this.query) {
          let val = this.query[key];
          if (val instanceof Array) {
            for (let elem of val) parts.push(key + '=' + elem);
          } else {
            parts.push(key + '=' + val);
          }
        }
        result += '?' + parts.join('&');
      }
      if (this.fragmentId) result += this.fragmentId;

      this.cachedString = result;
    }
    return this.cachedString;
  }
}
