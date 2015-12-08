// Repository Manager.

// for use in Node:
if (typeof require == 'function') {
  Readyable = require('./Readyable');
  ParsedURL = require('./ParsedURL');
  simpl = require('./simpl/simplBase');
}

var RepoMan = (function() {
  // Constructor of RepoMan
  //
  // object source: indicating where to load the repo. required.
  // object options: optional configurations.
  function RepoMan(source, options) {
    Readyable.call(this);

    if (!source) { throw new Error("source required!"); }

    if (options && options.defaultDocumentType) {
      this.defaultDocumentType = options.defaultDocumentType;
    }
    if (!this.defaultDocumentType) {
      this.defaultDocumentType = 'rich_document';
    }

    if (source.repo) {
      // when the repo has been prepared by the caller
      this.repo = source.repo;
      if (source.repo.meta_metadata_repository) {
        this.repo = source.repo.meta_metadata_repository;
      }
      this.initialize();
    } else if (source.file) {
      // only works in Node:
      var that = this;
      var fs = require('fs');
      fs.readFile(source.file, { encoding: 'utf8' }, function(err, content) {
        if (err) { that.setError(err); return; }
        try {
          that.repo = simpl.deserialize(content);
        } catch (err) {
          that.setError(err);
          return;
        }
        if (that.repo.meta_metadata_repository) {
          that.repo = that.repo.meta_metadata_repository;
        }
        that.initialize();
      });
    } else if (source.url) {
      var that = this;
      var downloader = null;
      if (options && options.downloader) {
        downloader = options.downloader;
      } else {
        downloader = new Downloader();
      }
      var dOpts = { responseType: 'json' };
      downloader.httpGet(source.url, dOpts, function(err, response) {
        if (err) { that.setError(err); return; }

        if (response.entity) {
          that.repo = simpl.graphExpand(response.entity);
        } else if (response.text) {
          try {
            that.repo = simpl.deserialize(response.text);
          } catch (err) {
            that.setError(err);
            return;
          }
        }
        if (that.repo && that.repo.meta_metadata_repository) {
          that.repo = that.repo.meta_metadata_repository;
        }
        
        if (that.repo) {
          that.initialize();
        } else {
          that.setError("Cannot obtain repository from " + source.url);
          return;
        }
      });
    }

    return this;
  }
  RepoMan.prototype = Object.create(Readyable.prototype);
  RepoMan.prototype.constructor = RepoMan;

  // selectorMap: key => Array of selectors
  // key: can be stripped url, domain, etc
  // selector: the selector to be added to selectorMap
  RepoMan.addToSelectorMap = function(selectorMap, key, selector) {
    if (key && key.length > 0) {
      if (!(key in selectorMap)) {
        selectorMap[key] = [];
      }
      selectorMap[key].push(selector);
    } else {
      console.warn("Missing key for selector: ", selector);
    }
  }

  // helper function for adding <url_stripped> selector.
  RepoMan.addUrlStripped = function(selectorMap, selector) {
    function removeLast(s, c) {
      if (s) {
        var l = s.length;
        if (l > 0 && s[l-1] == c) { return s.substr(0, l-1); }
      }
      return s;
    }
    selector.url_stripped = removeLast(selector.url_stripped, '?');
    RepoMan.addToSelectorMap(selectorMap, selector.url_stripped, selector);
  }

  // helper function for adding <url_path_tree> selector.
  RepoMan.addUrlPath = function(selectorMap, selector) {
    var domain = selector.domain;
    if (!domain) {
      domain = new ParsedURL(selector.url_path_tree).domain;
    }
    if (!domain) {
      console.warn("WARN: Missing domain: ", selector);
    } else {
      RepoMan.addToSelectorMap(selectorMap, domain, selector);
    }
  }

  // helper function for adding <url_regex> and <url_regex_fragment> selector.
  RepoMan.addUrlPattern = function(selectorMap, selector) {
    function prependIfMissing(s, c) {
      if (s) { if (s.length == 0 || s[0] != c) { return c+s; } }
      return s;
    }
    function appendIfMissing(s, c) {
      if (s) { var l = s.length; if (l == 0 || s[l-1] != c) { return s+c; } }
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

  // pre-condition: this.repo is loaded, e.g. deserialized from a JSON dump.
  // called in the end of this constructor.
  RepoMan.prototype.initialize = function() {
    if (!this.repo) { setError("No Repo Loaded!"); return; }
    if (!this.repo.repository_by_name) { setError("Invalid Repo!"); return; }

    this.mmds = {};
    for (var i = 0; i <  this.repo.repository_by_name.length; i++) {
      var mmd = this.repo.repository_by_name[i];
      this.mmds[mmd.name] = mmd;
    }
    if (this.repo.alt_names) {
      var altNames = this.repo.alt_names;
      for (var i =0; i < altNames.length; i++) {
        var name = altNames[i].name;
        var mmd = altNames[i].mmd;
        this.mmds[name] = mmd;
      }
    }

    this.userAgents = {}
    if (this.repo.user_agents) {
      for (var i = 0; i < this.repo.user_agents.length; i++) {
        var agent = this.repo.user_agents[i];
        if (agent.name && agent.string) {
          this.userAgents[agent.name] = agent.string;
        }
      }
    }

    // stripped url => Array of selector
    this.urlStripped = {};
    // domain => Array of selector (only for <url_path_tree>)
    this.urlPath = {};
    // domain => Array of selector (only for <url_regex>)
    this.urlRegex = {};

    // initialize location-based selector maps
    for (var name in this.mmds) {
      var mmd = this.mmds[name];
      if (mmd.selectors) {
        for (var i = 0; i < mmd.selectors.length; i++) {
          var selector = mmd.selectors[i];
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

  // callback: (err, mmd) => void
  RepoMan.prototype.loadMmd = function(name, options, callback) {
    if (this.mmds && name in this.mmds) {
      callback(null, { meta_metadata: this.mmds[name] });
    } else {
      callback(new Error("Cannot find target mmd"), null);
    }
  }

  // helper for matching using <url_stripped> selectors.
  RepoMan.matchUrlStripped = function(selectors, purl, options) {
    var results = [];
    if (selectors) {
      var stripped = purl.stripped;
      var relevant = selectors[stripped];
      for (var i in relevant) {
        var selector = relevant[i];
        if (selector.url_stripped == stripped) {
          results.push(selector);
        }
      }
    }
    return results;
  }

  // find the next path part from str, starting at start, using sep as the
  // separator.
  //
  // the part starts with a sep, ends with either a sep or the end of
  // str.
  //
  // the returned part does not include the sep at the beginning or end.
  RepoMan.nextPart = function(str, start, sep) {
    if (str && str.length > 0) {
      var i = start;
      while (i < str.length && str[i] != sep) { i++; }
      i++; // now i points to the next position that is not the sep
      if (i < str.length) {
        var j = i;
        while (j < str.length && str[j] != sep) { j++; }
        return { part: str.substring(i, j), nextPos: j }
      }
    }
    return { part: '', nextPos: start };
  }

  // takes the domain, the path tree spec, and the location; returns true if and
  // only if the location matches the path tree spec.
  RepoMan.matchUrlPathHelper = function(domain, path, location) {
    var m = path.indexOf(domain);
    var n = location.indexOf(domain);
    // here, m and n cannot be -1
    while (true) {
      var p1 = RepoMan.nextPart(path, m, '/');
      var p2 = RepoMan.nextPart(location, n, '/');
      m = p1.nextPos;
      n = p2.nextPos;
      if (p1.part.length == 0) {
        return true;
      }
      if (p1.part == '*' && p2.part.length == 0  ||
          p1.part != '*' && p1.part != p2.part) {
        return false;
      }
    }
    return false;
  }

  // helper for matching using <url_path_tree> selectors.
  RepoMan.matchUrlPath = function(selectors, purl, options) {
    var results = [];
    if (selectors) {
      var domain = purl.domain;
      var relevant = selectors[domain];
      for (var i in relevant) {
        var selector = relevant[i];
        if (selector.url_path_tree) {
          if (RepoMan.matchUrlPathHelper(domain, selector.url_path_tree, purl.raw)) {
            results.push(selector);
          }
        }
      }
    }
    return results;
  }

  // helper for matching using <url_regex> and <url_regex_fragment> selectors.
  RepoMan.matchUrlPattern = function(selectors, purl, options) {
    var results = [];
    if (selectors) {
      var domain = purl.domain;
      var relevant = selectors[domain];
      for (var i in relevant) {
        var selector = relevant[i];
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

  // takes the actual param values (from a location), and a set of param specs;
  // returns true if and only if the actual param values meet all param specs.
  RepoMan.checkForParams = function(actualParams, paramSpecs) {
    for (var i in paramSpecs) {
      var spec = paramSpecs[i];
      var val = actualParams[spec.name];
      if (!val) { val = ''; }
      if (spec.value && spec.value.length > 0) {
        var allowEmpty = String(spec.allow_empty_value) == 'true';
        var allowAndIsEmpty = allowEmpty && val.length == 0;
        if (!allowAndIsEmpty && !spec.value == val) { return false; }
      }
      if (spec.value_is_not && spec.value_is_not.length > 0) {
        if (spec.value_is_not == val) {
          return false;
        }
      }
    }
    return true;
  }

  // filter an array of selectors by <param> specs.
  RepoMan.filterByParams = function(selectors, purl) {
    var results = [];
    if (selectors && selectors.length > 0) {
      for (var i in selectors) {
        var selector = selectors[i];
        if (RepoMan.checkForParams(purl.query, selector.params)) {
          results.push(selector);
        }
      }
    }
    return results;
  }

  RepoMan.prototype.getDomainIntervals = function() {
    var result = {};
    for (var i in this.repo.sites) {
      var site = this.repo.sites[i];
      result[site.domain] = site.min_download_interval * 1000;
    }
    return result;
  }

  // callback: (err, mmd) => void
  RepoMan.prototype.selectMmd = function(location, options, callback) {
    var purl = new ParsedURL(location);
    var results = [];
    results = RepoMan.matchUrlStripped(this.urlStripped, purl, options);
    if (results.length == 0) {
      results = RepoMan.matchUrlPath(this.urlPath, purl, options);
    }
    if (results.length == 0) {
      results = RepoMan.matchUrlPattern(this.urlRegex, purl, options);
    }

    results = RepoMan.filterByParams(results, purl);

    // TODO content-based selection

    if (results.length == 0) {
      console.log("Use default document type for " + location);
      callback(null, { meta_metadata: this.mmds[this.defaultDocumentType] });
    } else if (results.length == 1) {
      this.loadMmd(results[0].targetType, options, callback);
    } else {
      console.warn("Multiple mmds matched for " + location + ": ", results);
      this.loadMmd(results[0].targetType, options, callback);
    }
  }

  return RepoMan;
})();

// for use in Node:
if (typeof module == 'object') {
  module.exports = RepoMan;
}

