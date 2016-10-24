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
  [name: string]: boolean|string|string[];
}

/**
 * A parsed URL representation.
 */
export default class ParsedURL {
  private static readonly noBase = '$NOBASE$';
  static readonly subdomainsToStrip = [ 'www', 'en' ];

  static get(url: string | ParsedURL, base: string | ParsedURL = null): ParsedURL {
    if (url instanceof ParsedURL) {
      return url;
    }
    return url ? new ParsedURL(url, base) : null;
  }

  /**
   * Parse a host specification in the form of [user[:password]@]host[:port]
   *
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
   * Convert a HostSpec to string, in the form of [user[:password]@]host[:port]
   *
   * @param {HostSpec} hostSpec
   * @return {string}
   */
  static hostSpecToString(hostSpec: HostSpec): string {
    let result: string = '';
    if (hostSpec.user) {
      result += encodeURIComponent(hostSpec.user);
      if (hostSpec.password) {
        result += ':' + encodeURIComponent(hostSpec.password);
      }
      result += '@';
    }
    result += hostSpec.host;
    if (hostSpec.port) {
      result += ':' + hostSpec.port;
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
        let name = decodeURIComponent(pair[0]);
        let val = pair[1] ? decodeURIComponent(pair[1]) : null;
        let currVal = result[name];
        if (typeof currVal === 'undefined') {
          // first entry with this name
          if (val) {
            result[name] = val;
          } else {
            result[name] = true;
          }
        } else if (typeof currVal === 'string' || typeof currVal === 'boolean') {
          // second entry with this name
          let arr = [ String(currVal), String(val) ];
          result[name] = arr;
        } else {
          // third or later entry with this name
          currVal.push(val);
        }
      }
    }

    return result;
  }

  /**
   * Convert a QueryMap to a string representation.
   *
   * @param {QueryMap} queryMap
   * @return {string}
   */
  static queryMapToString(queryMap: QueryMap): string {
    let result = '';
    if (queryMap) {
      let parts = [];
      for (let key in queryMap) {
        let val = queryMap[key];
        if (val instanceof Array) {
          for (let elem of val) {
            parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(elem));
          }
        } else {
          if (typeof val === 'boolean') {
            parts.push(encodeURIComponent(key));
          } else {
            parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(val));
          }
        }
      }
      if (parts.length > 0) {
        result += '?' + parts.join('&');
      }
    }
    return result;
  }

  raw: string;
  base: ParsedURL;

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
   *   The base URL, if 'url' is a relative one. Must be absolute.
   */
  constructor(url: string, base: string | ParsedURL = null) {
    if (url) {
      this.raw = url;
      this.base = this.getBase(base);

      let m = null;
      m = url.match(/^(\w+)\:\/\/([^\/?#]+)([^?#]*)(\?[^#]*)?(#.*)?/);
      if (m) {
        // url is absolute, with scheme and host
        let hostSpec = ParsedURL.parseHostSpec(m[2]);
        this.initialize(m[1], hostSpec, m[3], m[4], m[5]);
        return;
      }

      if (!this.base) {
        throw new Error("Missing base URL");
      }

      m = url.match(/^\/\/([^\/?#]+)([^?#]*)(\?[^#]*)?(#.*)?/);
      if (m) {
        // url is absolute, without scheme, with host
        let hostSpec = ParsedURL.parseHostSpec(m[1]);
        this.initialize(this.base.scheme, hostSpec, m[2], m[3], m[4]);
        return;
      }

      m = url.match(/^(\/[^?#]*)(\?[^#]*)?(#.*)?/);
      if (m) {
        // url is absolute, without scheme, without host
        this.initialize(this.base.scheme, this.base, m[1], m[2], m[3]);
        return;
      }

      // TODO deal with relative paths starting with ./ or ../

      m = url.match(/([^?#]+)(\?[^#]*)?(#.*)?/);
      if (m) {
        // url is relative
        let path = this.base.path;
        let i = path.lastIndexOf('/');
        path = path.substr(0, i+1) + m[1];
        this.initialize(this.base.scheme, this.base, path, m[2], m[3]);
        return;
      }

      throw new Error("Invalid URL: " + url);
    }
  }

  private initialize(scheme: string, hostSpec: HostSpec, path: string, query: string, frag: string): void {
    this.scheme = scheme;

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
		this.domain = strippedHost.length > 0 ? strippedHost : this.host;

    this.path = path;
    if (this.path.length === 0) {
      this.path = '/';
    }

    this.stripped = this.scheme + '://' + ParsedURL.hostSpecToString(this) + this.path;

    this.query = ParsedURL.parseQueryParams(query);

    if (frag && frag.length > 1) {
      this.fragmentId = frag.substr(1);
    }
  }

  private getBase(base: string | ParsedURL = null) {
    if (base === ParsedURL.noBase) {
      return null;
    }
    if (!base && typeof window === 'object' && window.location && window.location.href) {
      return ParsedURL.get(window.location.href, ParsedURL.noBase);
    }
    return ParsedURL.get(base, ParsedURL.noBase);
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
      result += ParsedURL.hostSpecToString(this);
      result += this.path;
      result += ParsedURL.queryMapToString(this.query);
      if (this.fragmentId) {
        result += '#' + this.fragmentId;
      }
      this.cachedString = result;
    }
    return this.cachedString;
  }

  clone(): ParsedURL {
    let result: ParsedURL = new ParsedURL(null);

    result.scheme = this.scheme;
    result.user = this.user;
    result.password = this.password;
    result.host = this.host;
    result.port = this.port;
    result.domain = this.domain;
    result.path = this.path;
    result.query = {};
    for (let name in this.query) {
      let val = this.query[name];
      if (val instanceof Array) {
        result.query[name] = [];
        for (let item in val) {
          (result.query[name] as string[]).push(item);
        }
      } else {
        result.query[name] = val;
      }
    }
    result.fragmentId = this.fragmentId;
    result.stripped = this.stripped;

    return result;
  }

  withQuery(queryMap: QueryMap): ParsedURL {
    if (!queryMap) {
      return this;
    }
    let result = this.clone();
    for (let name in queryMap) {
      let val = queryMap[name];
      if (val) {
        result.query[name] = val;
      }
    }
    return result;
  }
}
