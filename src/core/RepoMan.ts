/**
 * A meta-metadata repository manager.
 */

/// <reference path="../../typings/index.d.ts" />

import * as Promise from 'bluebird';
import simpl from './simpl/simplBase';
import ParsedURL, { QueryMap } from './ParsedURL';
import Readyable from './Readyable';
import {
  SelectorParam,
  Selector,
  MetaMetadata,
  Metadata,
  TypedMetadata,
  Repository,
  TypedRepository,
  BuildInfo,
} from './types';
import { PreFilter } from './FieldOps';

// for dynamic loading in Node.
declare function require(moduleName: string): any;

// /**
//  * Indicating where to load the wrapper repository.
//  */
// export interface RepoSource {
//   repo?: Repository | TypedRepository;
//   serialization?: string;
//   file?: string;
//   url?: string;
// }

/**
 * Options for the repoMan.
 */
export interface RepoOptions {
  defaultDocumentType?: string;

  userAgents?: { [name: string]: string };
  domainIntervals?: { [domain: string]: number };

  // downloader?: Downloader;
  // downloaderOptions?: DownloaderOptions;
  // requestOptions?: RequestOptions;
}

/**
 * Options for calls to the repoMan.
 */
export interface RepoCallOptions {
  // TODO
}

/**
 * A map from key to selector array.
 */
interface SelectorMap {
  [key: string]: Selector[];
}

/**
 * A meta-metadata repository manager.
 */
export default class RepoMan extends Readyable {
  /**
   * Add a selector to the given selector map with a specified key.
   * @param {SelectorMap} selectorMap
   * @param {string}      key
   * @param {Selector}    selector
   */
  static addToSelectorMap(selectorMap: SelectorMap, key: string, selector: Selector): void {
    if (key && key.length > 0) {
      if (!(key in selectorMap)) {
        selectorMap[key] = [];
      }
      selectorMap[key].push(selector);
    } else {
      console.warn("Missing key for selector: ", selector);
    }
  }

  /**
   * Helper function for adding a <url_stripped> selector.
   * @param {SelectorMap} selectorMap
   * @param {Selector}    selector
   */
  static addUrlStripped(selectorMap: SelectorMap, selector: Selector): void {
    function removeLast(s: string, c: string): string {
      if (s) {
        let l = s.length;
        if (l > 0 && s[l - 1] == c) {
          return s.substr(0, l - 1);
        }
      }
      return s;
    }
    selector.url_stripped = removeLast(selector.url_stripped, '?');
    RepoMan.addToSelectorMap(selectorMap, selector.url_stripped, selector);
  }

  /**
   * Helper function for adding <url_path_tree> selector.
   * @param {SelectorMap} selectorMap
   * @param {Selector}    selector
   */
  static addUrlPath(selectorMap: SelectorMap, selector: Selector): void {
    let domain = selector.domain;
    if (!domain) {
      domain = new ParsedURL(selector.url_path_tree).domain;
    }
    if (!domain) {
      console.warn("WARN: Missing domain: ", selector);
    } else {
      RepoMan.addToSelectorMap(selectorMap, domain, selector);
    }
  }

  /**
   * Helper function for adding <url_regex> and <url_regex_fragment> selector.
   * @param {SelectorMap} selectorMap
   * @param {Selector}    selector
   */
  static addUrlPattern(selectorMap: SelectorMap, selector: Selector): void {
    function prependIfMissing(s: string, c: string): string {
      if (s) {
        if (s.length == 0 || s[0] != c) {
          return c + s;
        }
      }
      return s;
    }

    function appendIfMissing(s: string, c: string): string {
      if (s) {
        let l = s.length;
        if (l == 0 || s[l - 1] != c) {
          return s + c;
        }
      }
      return s;
    }

    try {
      if (selector.url_regex) {
        selector.url_regex = prependIfMissing(selector.url_regex, '^');
        selector.url_regex = appendIfMissing(selector.url_regex, '$');
      }
      RepoMan.addToSelectorMap(selectorMap, selector.domain, selector);
    } catch (err) {
      console.warn("WARN: Malformed: ", selector, "; Error: ", err);
    }
  }

  /**
   * Helper for matching using <url_stripped> selectors.
   * @param  {SelectorMap} selectors
   * @param  {ParsedURL}   purl
   * @return {Selector[]}
   */
  static matchUrlStripped(selectors: SelectorMap, purl: ParsedURL): Selector[] {
    let results: Selector[] = [];
    if (selectors && purl.stripped in selectors) {
      let relevant = selectors[purl.stripped];
      for (let selector of relevant) {
        if (selector.url_stripped === purl.stripped) {
          results.push(selector);
        }
      }
    }
    return results;
  }

  /**
   * Find the next path part from str, starting at start, using sep as the
   * separator.
   *
   * The part starts with a sep, ends with either a sep or the end of str.
   *
   * The returned part does not include the sep at the beginning or end.
   *
   * @param  {string} str
   * @param  {number} start
   * @param  {string} sep
   * @return {{part: string, nextPos: number}}
   */
  static nextPart(str: string, start: number, sep: string): { part: string, nextPos: number } {
    if (str && str.length > 0) {
      let i = start;
      while (i < str.length && str[i] != sep) {
        i++;
      }
      i++; // now i points to the next position that is not the sep
      if (i < str.length) {
        let j = i;
        while (j < str.length && str[j] != sep) {
          j++;
        }
        return {
          part: str.substring(i, j),
          nextPos: j,
        }
      }
    }
    return {
      part: '',
      nextPos: start,
    };
  }

  /**
   * Match the location to a path tree spec.
   * @param  {string}  domain
   * @param  {string}  path
   * @param  {string}  location
   * @return {boolean} true iff the location matches the path tree spec.
   */
  static matchUrlPathHelper(domain: string, path: string, location: string): boolean {
    let m = path.indexOf(domain);
    let n = location.indexOf(domain);
    // here, m and n cannot be -1
    while (true) {
      let p1 = RepoMan.nextPart(path, m, '/');
      let p2 = RepoMan.nextPart(location, n, '/');
      m = p1.nextPos;
      n = p2.nextPos;
      if (p1.part.length === 0) {
        return true;
      }
      if (p1.part === '*' && p2.part.length === 0 || p1.part !== '*' && p1.part !== p2.part) {
        return false;
      }
    }
  }

  /**
   * Helper for matching using <url_path_tree> selectors.
   * @param  {SelectorMap} selectorMap
   * @param  {ParsedURL}   purl
   * @return {Selector[]}
   */
  static matchUrlPath(selectorMap: SelectorMap, purl: ParsedURL): Selector[] {
    let results: Selector[] = [];
    if (selectorMap && purl.domain in selectorMap) {
      let relevant = selectorMap[purl.domain];
      for (let selector of relevant) {
        if (selector.url_path_tree) {
          if (RepoMan.matchUrlPathHelper(purl.domain, selector.url_path_tree, purl.raw)) {
            results.push(selector);
          }
        }
      }
    }
    return results;
  }

  /**
   * Helper for matching using <url_regex> and <url_regex_fragment> selectors.
   * @param  {SelectorMap} selectors
   * @param  {ParsedURL}   purl
   * @return {Selector[]}
   */
  static matchUrlPattern(selectors: SelectorMap, purl: ParsedURL): Selector[] {
    let results: Selector[] = [];
    if (selectors && purl.domain in selectors) {
      let relevant = selectors[purl.domain];
      for (let selector of relevant) {
        if (selector.url_regex) {
          if (purl.raw.match(selector.url_regex)) {
            results.push(selector);
          }
        } else if (selector.url_regex_fragment) {
          if (purl.raw.match(selector.url_regex_fragment)) {
            results.push(selector);
          }
        }
      }
    }
    return results;
  }

  /**
   * Match a query map object with a set of param specs.
   * @param  {QueryMap}        queryMap
   * @param  {SelectorParam[]} paramSpecs
   * @return {boolean} True iff the query map meets all param specs.
   */
  static checkForParams(queryMap: QueryMap, paramSpecs: SelectorParam[]): boolean {
    for (let spec of paramSpecs) {
      let val = queryMap[spec.name];
      let valstr = '';
      if (val) {
        if (val instanceof Array) {
          valstr = val.join(',');
        } else {
          valstr = val as string;
        }
      }
      if (spec.value && spec.value.length > 0) {
        let allowEmpty = String(spec.allow_empty_value) === 'true';
        let allowAndIsEmpty = allowEmpty && val.length === 0;
        if (!allowAndIsEmpty && spec.value !== valstr) {
          return false;
        }
      }
      if (spec.value_is_not && spec.value_is_not.length > 0) {
        if (spec.value_is_not === valstr) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Filter an array of selectors by <param> specs.
   * @param  {Selector[]} selectors
   * @param  {ParsedURL}  purl
   * @return {Selector[]}
   */
  static filterByParams(selectors: Selector[], purl: ParsedURL): Selector[] {
    let results: Selector[] = [];
    if (selectors) {
      for (let selector of selectors) {
        if (RepoMan.checkForParams(purl.query, selector.params)) {
          results.push(selector);
        }
      }
    }
    return results;
  }

  // /**
  //  * Specify where the repository should be / has been loaded.
  //  * @type {RepoSource}
  //  */
  // source: RepoSource;

  /**
   * Options for RepoMan itself.
   * @type {RepoOptions}
   */
  options: RepoOptions;

  /**
   * The actual meta-metadata repository.
   * @type {Repository}
   */
  repository: Repository;

  private cachedSerialization: string;
  private mmds: { [name: string]: MetaMetadata };
  private urlStripped: { [strippedUrl: string]: Selector[] };
  private urlPath: { [domain: string]: Selector[] };
  private urlRegex: { [domain: string]: Selector[] };

  /**
   * Construct an empty RepoMan. If source specified, load the repository.
   * @constructor
   * @param  {RepoSource}  source  [description]
   * @param  {RepoOptions} options [description]
   */
  // constructor(source?: RepoSource, options?: RepoOptions) {
  constructor(repository: Repository | TypedRepository = null, options: RepoOptions = {}) {
    super();
    this.options = options;
    if (repository) {
      this.load(repository, options);
    }
  }

  /**
   * Reset the RepoMan to its initial state.
   */
  reset(): void {
    super.reset();
    // this.source = null;
    this.repository = null;
    this.options = null;
    this.repository = null;
    this.mmds = null;
    this.urlStripped = null;
    this.urlPath = null;
    this.urlRegex = null;
    this.cachedSerialization = null;
  }

  // /**
  //  * Load repository from where source specifies.
  //  * @param {RepoSource}  source  [description]
  //  * @param {RepoOptions} options [description]
  //  */
  // load(source: RepoSource, options?: RepoOptions): void {
  //   this.reset();
  //
  //   this.source = source;
  //   this.options = options || {};
  //
  //   let callback = err => {
  //     if (err) {
  //       this.setError(err);
  //     } else {
  //       this.initialize();
  //     }
  //   }
  //
  //   if (this.source.repo) {
  //     this.loadFromInstance(this.source.repo, callback);
  //   } else if (this.source.serialization) {
  //     this.loadFromSerialization(this.source.serialization, callback);
  //   } else if (this.source.file) {
  //     this.loadFromFile(this.source.file, callback);
  //   } else if (this.source.url) {
  //     this.loadFromUrl(this.source.url, callback);
  //   } else {
  //     this.setError(new Error("Invalid repository source: " + this.source));
  //   }
  // }

  // /**
  //  * Load repository from a file.
  //  * @param  {string}   filePath [description]
  //  * @param  {Function} callback [description]
  //  */
  // private loadFromFile(filePath: string, callback: (err: Error)=>void): void {
  //   if (typeof require === 'function') {
  //     let fs: any = require('fs');
  //     fs.readFile(filePath, { encoding: 'utf8' }, (err, content) => {
  //       this.loadFromSerialization(content, callback);
  //     });
  //   } else {
  //     callback(new Error("Loading from file only supported on Node"));
  //   }
  // }

  // /**
  //  * Load repository from a URL. This uses a Downloader implementation, such as
  //  * a XhrDownloader or RequestDownloader (depending on the runtime
  //  * environment), to download the serialized repository, and parse it.
  //  *
  //  * @param  {string}   url      [description]
  //  * @param  {Function} callback [description]
  //  */
  // private loadFromUrl(url: string, callback: (err: Error)=>void): void {
  //   let downloader = this.options.downloader;
  //   if (!downloader) {
  //     if (typeof window === 'undefined') {
  //       // in node
  //       let RequestDownloader = require('./RequestDownloader').default;
  //       downloader = new RequestDownloader(this.options.downloaderOptions);
  //     } else {
  //       // in browser
  //       downloader = new XhrDownloader(this.options.downloaderOptions);
  //     }
  //   }
  //   let reqOptions = this.options.requestOptions || {};
  //   if (!reqOptions.responseType) {
  //     reqOptions.responseType = 'json';
  //   }
  //   downloader.httpGet(url, reqOptions, (err, resp) => {
  //     if (err) {
  //       return callback(err);
  //     }
  //     let repoInstance: any = null;
  //     try {
  //       if (resp.entity) {
  //         repoInstance = resp.entity;
  //         simpl.graphExpand(repoInstance);
  //       } else if (resp.text) {
  //         repoInstance = simpl.deserialize(resp.text);
  //       }
  //       if (!repoInstance) {
  //         return callback(new Error("Empty response"));
  //       }
  //       if (repoInstance.repository) {
  //         repoInstance = repoInstance.repository;
  //       }
  //       this.loadFromInstance(repoInstance, callback);
  //     } catch (exception) {
  //       callback(exception);
  //     }
  //   });
  // }

  // /**
  //  * Load the repository from a serialized form.
  //  * @param  {string}   serialization [description]
  //  * @param  {Function} callback      [description]
  //  */
  // private loadFromSerialization(serialization: string, callback: (err: Error)=>void): void {
  //   let instance: any = null;
  //   try {
  //     instance = simpl.deserialize(serialization);
  //     if (instance.repository) {
  //       // instance is a RepositoryResponse
  //       instance = instance.repository;
  //     }
  //     this.loadFromInstance(instance, callback);
  //   } catch (exception) {
  //     return callback(new Error("Failed to deserialize repository: " + serialization));
  //   }
  // }

  /**
   * Load the repository from another instance.
   * @param  {Repository | TypedRepository} instance [description]
   * @param  {Function}                     callback [description]
   */
  // private loadFromInstance(instance: Repository | TypedRepository, callback: (err: Error)=>void): void {
  load(repository: Repository | TypedRepository, options: RepoOptions = {}): void {
    this.reset();
    this.options = options;
    if ((repository as TypedRepository).meta_metadata_repository) {
      this.repository = (repository as TypedRepository).meta_metadata_repository;
    } else if ((repository as Repository).repository_by_name){
      this.repository = repository as Repository;
    } else {
      this.setError(new Error("Invalid repository provided"));
    }
    this.initialize();
  }

  /**
   * Initialize this repository, by processing information from this.repository.
   */
  private initialize(): void {
    if (!this.repository) {
      this.setError(new Error("No repository loaded"));
      return;
    }
    if (!this.repository.repository_by_name) {
      this.setError(new Error("Invalid repository"));
      return;
    }

    this.mmds = {};
    for (let mmd of this.repository.repository_by_name) {
      this.mmds[mmd.name] = mmd;
    }
    if (this.repository.alt_names) {
      for (let item of this.repository.alt_names) {
        this.mmds[item.name] = item.mmd;
      }
    }

    this.options.userAgents = {};
    if (this.repository.user_agents) {
      for (let item of this.repository.user_agents) {
        if (item.name && item.string) {
          this.options.userAgents[item.name] = item.string;
        }
      }
    }

    this.options.domainIntervals = {};
    if (this.repository.sites) {
      for (let site of this.repository.sites) {
        this.options.domainIntervals[site.domain] = site.min_download_interval * 1000;
      }
    }

    // stripped url => Array of selector
    this.urlStripped = {};
    // domain => Array of selector (only for <url_path_tree>)
    this.urlPath = {};
    // domain => Array of selector (only for <url_regex>)
    this.urlRegex = {};

    // initialize location-based selector maps
    for (let name in this.mmds) {
      let mmd = this.mmds[name];
      if (mmd.selectors) {
        for (let selector of mmd.selectors) {
          selector.targetType = mmd.name;
          if (selector.url_stripped) {
            RepoMan.addUrlStripped(this.urlStripped, selector);
          } else if (selector.url_path_tree) {
            RepoMan.addUrlPath(this.urlPath, selector);
          } else if (selector.url_regex || selector.url_regex_fragment) {
            RepoMan.addUrlPattern(this.urlRegex, selector);
          } // TODO more cases: mime types, suffixes, etc ...
        }
      }
    }

    this.setReady();
  }

  /**
   * Reload the repository using previous source and options.
   */
  reload(): void {
    this.load(this.repository, this.options);
  }

  /**
   * Get a user agent string by its name.
   * @param {string} userAgentName
   * @return {Promise<string>} callback
   */
  getUserAgentString(userAgentName: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.onReady(err => {
        if (err) {
          reject(err);
          return;
        }
        if (this.options.userAgents && userAgentName in this.options.userAgents) {
          resolve(this.options.userAgents[userAgentName]);
          return;
        }
        reject(new Error("Unknown user agent name: " + userAgentName));
      });
    });
  }

  /**
   * Get the minimum download interval (in millisecond) for a domain.
   * @param {string} domain
   * @return {Promise<number>}
   */
  getDomainInterval(domain: string): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      this.onReady(err => {
        if (err) {
          reject(err);
          return;
        }
        if (this.options.domainIntervals && domain in this.options.domainIntervals) {
          resolve(this.options.domainIntervals[domain]);
          return;
        }
        resolve(0);
      });
    });
  }

  /**
   * Load a wrapper by its name.
   *
   * @param {string} name
   * @param {RepoCallOptions} options
   * @return {Promise<MetaMetadata>}
   */
  loadMmd(name: string, options: RepoCallOptions = {}): Promise<MetaMetadata> {
    return new Promise<MetaMetadata>((resolve, reject) => {
      this.onReady(err => {
        if (err) {
          reject(err);
          return;
        }
        if (this.mmds && name in this.mmds) {
          resolve(this.mmds[name]);
        }
        reject(new Error("Wrapper not found: " + name));
      });
    });
  }

  /**
   * Load a wrapper by matching a location to its selector(s).
   *
   * @param {string} location
   * @param {RepoCallOptions} options
   * @return {Promise<MetaMetadata>}
   */
  selectMmd(location: string|ParsedURL, options: RepoCallOptions = {}): Promise<MetaMetadata> {
    return new Promise<MetaMetadata>((resolve, reject) => {
      this.onReady(err => {
        if (err) {
          reject(err);
          return;
        }

        let purl = ParsedURL.get(location);

        let result = RepoMan.matchUrlStripped(this.urlStripped, purl);
        if (result.length === 0) {
          result = RepoMan.matchUrlPath(this.urlPath, purl);
        }
        if (result.length === 0) {
          result = RepoMan.matchUrlPattern(this.urlRegex, purl);
        }

        result = RepoMan.filterByParams(result, purl);

        // TODO content-based selection

        switch (result.length) {
          case 0:
            resolve(this.mmds[this.options.defaultDocumentType]);
            break;
          case 1:
            resolve(this.loadMmd(result[0].targetType, options));
            break;
          default:
            console.warn("Multiple mmds matched for " + location + ": " + result);
            resolve(this.loadMmd(result[0].targetType, options));
            break;
        }
      });
    });
  }

  /**
   * Normalize a location to a canonical form, using the repository.
   *
   * @param {string|ParsedURL} location
   * @param {RepoCallOptions} options
   * @return {Promise<string>}
   */
  normalizeLocation(location: string | ParsedURL, options: RepoCallOptions = {}): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.onReady(err => {
        if (err) {
          reject(err);
          return;
        }

        let url: string = null;
        let purl: ParsedURL = null;
        if (location instanceof ParsedURL) {
          purl = location;
          url = purl.toString();
        } else {
          url = location;
          purl = new ParsedURL(url);
        }

        resolve(this.selectMmd(purl, options).then(mmd => {
          if (mmd && mmd.filter_location) {
            let filteredLocation = PreFilter.filter(url, mmd.filter_location);
            return filteredLocation;
          }
          return url;
        }));
      });
    });
  }

  /**
   * Convert a typed metadata object to an untyped metadata object.
   *
   * @param {TypedMetadata} typedMetadata
   * @param {RepoCallOptions} options
   * @return {Promise<Metadata>}
   */
  untypeMetadata(typedMetadata: TypedMetadata, options: RepoCallOptions = {}): Promise<Metadata> {
    return new Promise<Metadata>((resolve, reject) => {
      this.onReady(err => {
        if (err) {
          reject(err);
          return;
        }

        for (let fieldName in typedMetadata) {
          if (fieldName in this.mmds) {
            let val = typedMetadata[fieldName];
            let mm_name = val.mm_name || val.meta_metadata_name;
            if (mm_name === fieldName) {
              resolve(val as Metadata);
              return;
            }
          }
        }

        reject(new Error("Invalid typed metadata: " + typedMetadata));
      });
    });
  }

  /**
   * Get the serialized form of the repository.
   *
   * @param {RepoCallOptions} options
   * @return {Promise<string>}
   */
  serializeRepository(options: RepoCallOptions = {}): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.onReady(err => {
        if (err) {
          reject(err);
          return;
        }

        if (!this.cachedSerialization) {
          this.cachedSerialization = simpl.serialize(this.repository);
        }
        resolve(this.cachedSerialization);
      });
    });
  }
}
