// Repository Manager.

// interface RepoSource {
//   url?: string;
//   file?: string;
// }

// for use in Node:
if (require) {
  ParsedURL = require('./ParsedURL');
  simpl = require('./simpl/simplBase');
}

// Constructor of RepoMan
//
// @param source: a RepoSource object indicating where to load the repo.
// @param options: object containing option key-value pairs.
function RepoMan(source, options) {
  // if repo has been loaded
  var ready = false;
  this.isReady = function() { return ready; }

  // callbacks arrived before repo is loaded.
  var queue = [];
  // callback: (err, repoMan) => void
  // if this repoMan is not ready yet, cache the callback and call later.
  this.onReady = function(callback) {
    if (this.isReady()) { callback(null, this); }
    else { queue.push(callback); }
  }
  // call the callbacks cached when onReady() was called before the repoMan gets
  // ready.
  function processCallbacks(err, repoMan) {
    for (var i in queue) {
      var callback = queue[i];
      callback(err, repoMan);
    }
    queue = [];
  }

  // pre-condition: this.repo is loaded, e.g. deserialized from a JSON dump.
  // called in the end of this constructor.
  function initRepo(that) {
    that.mmds = {};
    for (var i in that.repo.repository_by_name) {
      var mmd = that.repo.repository_by_name[i];
      that.mmds[mmd.name] = mmd;
    }

    if (that.repo.alt_names) {
      var altNames = that.repo.alt_names;
      for (var i in altNames) {
        var name = altNames[i].name;
        var mmd = altNames[i].mmd;
        that.mmds[name] = mmd;
      }
    }

    initSelectorMaps(that);

    ready = true;
  }

  // initialize location-based selector maps
  function initSelectorMaps(that) {
    // stripped url => Array of selector
    that.urlStripped = {};
    // domain => Array of selector (only for <url_path_tree>)
    that.urlPath = {};
    // domain => Array of selector (only for <url_regex>)
    that.urlRegex = {};

    for (var name in that.mmds) {
      var mmd = that.mmds[name];
      if (mmd.selectors) {
        for (var i in mmd.selectors) {
          var selector = mmd.selectors[i];
          selector.targetType = mmd.name;
          if (selector.url_stripped) {
            addUrlStripped(that.urlStripped, selector);
          } else if (selector.url_path_tree) {
            addUrlPath(that.urlPath, selector);
          } else if (selector.url_regex || selector.url_regex_fragment) {
            addUrlPattern(that.urlRegex, selector);
          } // TODO more cases: mime types, suffixes, etc ...
        }
      }
    }
  }

  // selectorMap: key => Array of selectors
  // key: can be stripped url, domain, etc
  // selector: the selector to be added to selectorMap
  function addToSelectorMap(selectorMap, key, selector) {
    if (key && key.length > 0) {
      if (!(key in selectorMap)) {
        selectorMap[key] = [];
      }
      selectorMap[key].push(selector);
    } else {
      console.warn("Missing key for selector: " + JSON.stringify(selector));
    }
  }

  // helper function for adding <url_stripped> selector.
  function addUrlStripped(selectorMap, selector) {
    function removeLast(s, c) {
      if (s) {
        var l = s.length;
        if (l > 0 && s[l-1] == c) { return s.substr(0, l-1); }
      }
      return s;
    }
    selector.url_stripped = removeLast(selector.url_stripped, '?');
    addToSelectorMap(selectorMap, selector.url_stripped, selector);
  }

  // helper function for adding <url_path_tree> selector.
  function addUrlPath(selectorMap, selector) {
    var domain = selector.domain;
    if (!domain) {
      domain = new ParsedURL(selector.url_path_tree).domain;
    }
    if (!domain) {
      console.warn("WARN: Missing domain: " + JSON.stringify(selector));
    } else {
      addToSelectorMap(selectorMap, domain, selector);
    }
  }

  // helper function for adding <url_regex> and <url_regex_fragment> selector.
  function addUrlPattern(selectorMap, selector) {
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
      addToSelectorMap(selectorMap, selector.domain, selector);
    } catch (err) {
      console.warn("WARN: Malformed: " + JSON.stringify(selector) + "; " + err);
    }
  }

  // callback: (err, mmd) => void
  this.loadMmd = function(name, options, callback) {
    callback(null, this.mmds[name]);
  }

  // callback: (err, mmd) => void
  this.selectMmd = function(location, options, callback) {
    var purl = new ParsedURL(location);
    var results = [];
    results = matchUrlStripped(this.urlStripped, purl, options);
    if (results.length == 0) {
      results = matchUrlPath(this.urlPath, purl, options);
    }
    if (results.length == 0) {
      results = matchUrlPattern(this.urlRegex, purl, options);
    }

    results = filterByParams(results, purl);

    // TODO content-based selection

    if (results.length == 0) {
      callback(new Error("Cannot find type!", null));
    } else if (results.length == 1) {
      this.loadMmd(results[0].targetType, options, callback);
    } else {
      console.warn("WARN: more than 1 types matched: " + location
                   + "; they are: " + JSON.stringify(results));
      this.loadMmd(results[0].targetType, options, callback);
    }
  }

  // helper for matching using <url_stripped> selectors.
  function matchUrlStripped(selectors, purl, options) {
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

  // helper for matching using <url_path_tree> selectors.
  function matchUrlPath(selectors, purl, options) {
    var results = [];
    if (selectors) {
      var domain = purl.domain;
      var relevant = selectors[domain];
      for (var i in relevant) {
        var selector = relevant[i];
        if (selector.url_path_tree) {
          if (matchUrlPathHelper(domain, selector.url_path_tree, purl.raw)) {
            results.push(selector);
          }
        }
      }
    }
    return results;
  }

  // takes the domain, the path tree spec, and the location;
  // returns true if and only if the location matches the path tree spec.
  function matchUrlPathHelper(domain, path, location) {
    var m = path.indexOf(domain);
    var n = location.indexOf(domain);
    // here, m and n cannot be -1
    while (true) {
      var p1 = nextPart(path, m, '/');
      var p2 = nextPart(location, n, '/');
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

  // find the next part from str, starting at start, using sep as the separator.
  // the part starts with a sep, ends with either a sep or the end of str.
  // the returned part does not include the sep at the beginning or end.
  function nextPart(str, start, sep) {
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

  // helper for matching using <url_regex> and <url_regex_fragment> selectors.
  function matchUrlPattern(selectors, purl, options) {
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

  // filter an array of selectors by <param> specs.
  function filterByParams(selectors, purl) {
    var results = [];
    if (selectors && selectors.length > 0) {
      for (var i in selectors) {
        var selector = selectors[i];
        if (checkForParams(purl.query, selector.params)) {
          results.push(selector);
        }
      }
    }
    return results;
  }

  // takes the actual param values (from a location), and a set of param specs;
  // returns true if and only if the actual param values meet all param specs.
  function checkForParams(actualParams, paramSpecs) {
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

  // callback: (err, canonicalLocation) => void
  this.canonicalizeLocation = function(location, options, callback) {
    this.selectMmd(location, options, function(err, mmd) {
      // TODO apply location filters from mmd to location, and call back
    });
  }

  if (source.repo) {
    // when the repo has been deserialized / loaded by the user of this class
    this.repo = source.repo;
    if (source.repo.meta_metadata_repository) {
      this.repo = source.repo.meta_metadata_repository;
    }
    initRepo(this);
    processCallbacks(null, this);
  } else if (source.file) {
    // this only works in Node
    var that = this;
    var fs = require('fs');
    fs.readFile(source.file, { encoding: 'utf8' }, function(err, content) {
      if (err) {
        processCallbacks(err, null);
        return;
      }
      try {
        that.repo = simpl.deserialize(content).meta_metadata_repository;
      } catch (err) {
        processCallbacks(err, null);
        return;
      }
      initRepo(that);
      processCallbacks(null, that);
    });
  } else if (source.url) {
    // TODO get repository from source.url, initRepo, processCallbacks 
  }
  return this;
}

// for use in Node:
if (module) {
  module.exports = RepoMan;
}

