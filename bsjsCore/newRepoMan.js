// Repository Manager.

// interface RepoSource {
//   url?: string;
//   file?: string;
// }

// should move to BSUtilities:

// get the domain (without leading 'www')
function getDomain(url) {
  if (url) {
    var matches = url.match(/^https?\:\/\/(www\.)?([^\/?#:]+)(:\d+)?(?:[\/?#]|$)/i);
    if (matches) {
      return matches[2];
    }
  }
  return null;
  // tests:
  //   console.log(getDomain("http://www.youtube.com/watch?v=1234"));
  //   console.log(getDomain("https://www.youtube.com/watch?v=1234"));
  //   console.log(getDomain("http://websitename.com:1234/dir/file.txt"));
}

// strip the query and anchor part off the url
function stripUrl(url) {
  if (url) {
    var p = url.indexOf('?');
    var q = url.indexOf('#');
    if (p < q) { p = q; }
    if (p >= 0) { return url.substring(0, p); }
    else { return url; }
  }
  return null;
}

// from http://stackoverflow.com/questions/979975/how-to-get-the-value-from-the-url-parameter
function getQueryParams(url) {
  var result = {};
  if (url) {
    var p = url.indexOf('?');
    if (p >= 0) {
      query = url.substr(p+1);
      var parts = query.split('&');
      for (var i in parts) {
        var pair = parts[i].split('=');
        var name = pair[0];
        var val = decodeURIComponent(pair[1]);
        if (typeof result[name] == 'undefined') {
          // first entry with this name
          result[name] = val;
        } else if (typeof result[name] == 'string') {
          // second entry with this name
          var arr = [ result[name], val ];
          result[name] = arr;
        } else {
          // third or later entry with this name
          result[name].push(val);
        }
      }
    }
  }
  return result;
}

// Constructor of RepoMan
//
// @param source: a RepoSource object indicating where to load the repo.
// @param options: object containing option key-value pairs.
function RepoMan(source, options) {
  // the repository, deserialized from JSON files.
  this.repo = null;
  this.mmds = {};

  // stripped url => Array of selector
  this.urlStripped = {};
  // domain => Array of selector (only for <url_path_tree>)
  this.urlPath = {};
  // domain => Array of selector (only for <url_regex>)
  this.urlRegex = {};

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
    queue.forEach(function(f) { f(err, repoMan); });
    queue = [];
  }

  // pre-condition: this.repo is loaded, e.g. deserialized from a JSON dump.
  // called in the end of this constructor.
  function initRepo() {
    for (var i in this.repo.repository_by_name) {
      var mmd = this.repo.repository_by_name[i];
      this.mmds[mmd.name] = mmd;
    }

    if (this.repo.alt_names) {
      var altNames = this.repo.alt_names;
      for (var i in altNames) {
        var name = altNames[i].name;
        var mmd = altNames[i].mmd;
        this.mmds[name] = mmd;
      }
    }

    initSelectorMaps();
  }

  // initialize location-based selector maps
  function initSelectorMaps() {
    for (var name in this.mmds) {
      var mmd = this.mmds[name];
      if (mmd.selectors) {
        for (var i in mmd.selectors) {
          var selector = mmd.selectors[i];
          selector.targetType = mmd.name;
          if (selector.url_stripped) {
            addUrlStripped(this.urlStripped, selector);
          } else if (selector.url_path_tree) {
            addUrlPath(this.urlPath, selector);
          } else if (selector.url_regex || selector.url_regex_fragment) {
            addUrlPattern(this.urlRegex, selector);
          } // TODO more cases: mime types, suffixes, etc ...
        }
      }
    }
  }

  // selectorMap: key => Array of selectors
  // key: can be stripped url, domain, etc
  // selector: the selector to be added to selectorMap
  function addToSelectorMap(selectorMap, key, selector) {
    if (key) {
      if (!selectorMap[key]) {
        selectorMap[key] = [];
      }
      selectorMap[key].push(selector);
    } else {
      console.warn("Missing key for selector: " + JSON.stringify(selector));
    }
  }

  // helper function for adding <url_stripped> selector.
  function addUrlStripped(selectorMap, selector) {
    addToSelectorMap(selectorMap, selector.url_stripped, selector);
  }

  // helper function for adding <url_path_tree> selector.
  function addUrlPath(selectorMap, selector) {
    var domain = selector.domain;
    if (!domain) {
      domain = getDomain(selector.url_path_tree);
    }
    if (!domain) {
      console.warn("WARN: Missing domain: " + JSON.stringify(selector));
    } else {
      addToSelectorMap(selectorMap, domain, selector);
    }
  }

  // helper function for adding <url_regex> and <url_regex_fragment> selector.
  function addUrlPattern(selectorMap, selector) {
    try {
      if (selector.url_regex) {
        selector.urlRegex = new Regex(selector.url_regex);
      } else if (selector.url_regex_fragment) {
        selector.urlRegexFrag = new Regex(selector.url_regex_fragment);
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
    var results = [];
    results = matchUrlStripped(location, options);
    if (results.length == 0) {
      results = matchUrlPath(location, options);
    }
    if (results.length == 0) {
      results = matchUrlPattern(location, options);
    }

    if (results.length == 0) {
      callback(new Error("Cannot find type!", null));
    } else if (results.length == 1) {
      loadMmd(results[0].targetType, options, callback);
    } else {
      results = selectByParams(results, location);
      if (results.length == 0) {
        callback(new Error("Cannot find type!", null));
      } else if (results.length == 1) {
        loadMmd(results[0].targetType, options, callback);
      } else {
        callback(new Error("Cannot resolve type!", null));
      }

      // TODO content-base selection

      console.warn("WARN: more than 1 types matched: " + location);
      loadMmd(results[0].targetType, options, callback);
    }
  }

  // helper for matching using <url_stripped> selectors.
  function matchUrlStripped(location, options) {
    var results = [];
    if (this.urlStripped) {
      var stripped = stripUrl(location);
      var selectors = this.urlStripped[stripped];
      for (var i in selectors) {
        var selector = selectors[i];
        if (selector.url_stripped == stripped) {
          results.push(selector);
        }
      }
    }
    return results;
  }

  // helper for matching using <url_path_tree> selectors.
  function matchUrlPath(location, options) {
    var results = [];
    if (this.urlPath) {
      var domain = getDomain(location);
      var selectors = this.urlPath[domain];
      for (var i in selectors) {
        var selector = selectors[i];
        if (selector.url_path_tree) {
          if (matchUrlPathHelper(domain, selector.url_path_tree, location)) {
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
  function matchUrlPattern(location, options) {
    var results = [];
    if (this.urlRegex) {
      var domain = getDomain(location);
      var selectors = this.urlRegex[domain];
      for (var i in selectors) {
        var selector = selectors[i];
        if (selector.url_regex) {
          if (selector.urlRegex.test(location) {
            results.push(selector);
          }
        } else if (selector.url_regex_fragment) {
          if (selector.urlRegexFrag.exec(location)) {
            results.push(selector);
          }
        }
      }
    }
    return results;
  }

  // filter an array of selectors by <param> specs.
  function selectByParams(selectors, location) {
    var results = [];
    if (selectors && selectors.size() > 0) {
      var actualParams = getQueryParams(location); // name => value
      for (var i in selectors) {
        var selector = selectors[i];
        if (checkForParams(actualParams, selector.params)) {
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
      var val = actualparams[spec.name];
      if (!val) { val = ''; }
      if (spec.value && spec.value.length > 0) {
        var allowAndIsEmpty = spec.allow_empty_value == true && val.length == 0;
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
    initRepo();
    processCallbacks(null, this);
  } else if (source.file) {
    // this only works in Node, on the server side
    var fs = require('fs');
    fs.readFile(source.file, { encoding: 'utf8' }, function(err, content) {
      if (err) {
        callback(err, null);
      } else {
        try {
          this.repo = JSON.parse(content).meta_metadata_repository;
        } catch (err) {
          callback(err, null);
        }
        initRepo();
        processCallbacks(null, this);
      }
    });
  } else if (source.url) {
    // TODO get repository from source.url, initRepo, call back
  }
  return this;
}
