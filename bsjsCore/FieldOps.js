// Field Operations.
//
// Location filters also use these ops.

// for use in Node:
if (typeof require == 'function') {
  ParsedURL = require('./ParsedURL');
}

/**
 * Semantics that transforms locations for managing variability in Document
 * locations.
 * 
 * @author kade
 */
var PreFilter = {};

PreFilter.filter = function(location, filterObj) {
  var newLocation = location;
  for (var i in filterObj.ops){
    var fieldOp = filterObj.ops[i];
    newLocation = FieldOps.operate(newLocation, fieldOp);
  }
  return newLocation;
};

/**
 * Operations that transform extracted scalar values (in strings, before
 * interpreted as other scalar types).
 */
var FieldOps = {};

FieldOps.operate = function(str, fieldOp){
  try {
    if (fieldOp.append)
      str = FieldOps.append(str, fieldOp.append.value);
    else if (fieldOp.decode_url)
      str = FieldOps.decodeUrl(str);
    else if (fieldOp.get_param)
      str = FieldOps.getParam(str, fieldOp.get_param.name, fieldOp.get_param.otherwise);
    else if (fieldOp.match)
      str = FieldOps.match(str, fieldOp.match)
    else if (fieldOp.override_params)
      str = FieldOps.overrideParams(str);
    else if (fieldOp.prepend)
      str = FieldOps.prepend(str, fieldOp.prepend.value);
    else if (fieldOp.replace)
      str = FieldOps.replace(str, fieldOp.replace);
    else if (fieldOp.set_param)
      str = FieldOps.setParam(str, fieldOp.set_param);
    else if (fieldOp.strip)
      str = FieldOps.strip(str, fieldOp.strip.any_of);
    else if (fieldOp.strip_param)
      str = FieldOps.stripParam(str, fieldOp.strip_param.name);
    else if (fieldOp.strip_params_but)
      str = FieldOps.stripParamsBut(str, fieldOp.strip_params_but.names);
    else if (fieldOp.substring)
      str = FieldOps.substring(str, fieldOp.substring);
  } catch (exception) {
    console.warn("Exception when applying ", fieldOp, " on ", str);
  }
  return str;
};

// Append value to str
FieldOps.append = function(str, value) {
  if (str === undefined || str == null) { return value; }
  return str + value;
}

// Decode URL (when a URL is used as a URL parameter in another URL).
FieldOps.decodeUrl = function(str) {
  return decodeURIComponent(str);
}

// Retrieve parameter from URL if exists.
FieldOps.getParam = function(url, name, otherwise) {
  if (typeof url == 'string' && typeof name == 'string') {
    var purl = new ParsedURL(url);
    if (purl.query && name in purl.query) {
      return purl.query[name];
    } else if (otherwise !== undefined && otherwise !== null) {
      return otherwise;
    }
  }
  return url;
}

// Regex Match. You can use on_match, on_find, and on_fail to specify special
// values instead of the match result.
FieldOps.match = function(str, opts) {
  if (typeof str == 'string' && opts && typeof opts.pattern == 'string') {
    var result = str.match(new RegExp(opts.pattern));
    if (typeof opts.on_match == 'string' && result) {
      return opts.on_match;
    }
    if (result) {
      if (typeof opts.on_find == 'string') {
        return opts.on_find;
      } else {
        if (typeof opts.group != 'undefined' && opts.group != null) {
          return result[Number(opts.group)];
        } else {
          return result[0];
        }
      }
    }
    if (typeof opts.on_fail == 'string') {
      return opts.on_fail;
    }
  }
  return str;
}

// Replaces params before the # with the ones after. 
FieldOps.overrideParams = function(url) {
  if (typeof url == 'string') {
    var purl = new ParsedURL(url);
    var frag = purl.fragmentId;
    if (typeof frag == 'string') {
      var fragParams = ParsedURL.parseQueryParams(frag);
      if (fragParams != null && Object.keys(fragParams).length > 0) {
        if (purl.query === undefined || purl.query == null) {
          purl.query = new Object();
        }
        for (var name in fragParams) {
          purl.query[name] = fragParams[name];
        }
        return purl.toString();
      }
    }
  }
  return url;
}

// Prepend value to str.
FieldOps.prepend = function(str, value) {
  if (str === undefined || str == null) { return value; }
  return value + str;
}

// Replace pattern with specified value.
FieldOps.replace = function(str, opts) {
  if (typeof str == 'string' && opts && typeof opts.pattern == 'string') {
    if (opts.first_only) {
      return str.replace(new RegExp(opts.pattern), opts.to);
    } else {
      return str.replace(new RegExp(opts.pattern, 'g'), opts.to);
    }
  }
  return str;
}

// Set given parameter to a specified value for a URL.
FieldOps.setParam = function(url, opts) {
  if (typeof url == 'string' && opts
      && typeof opts.name == 'string' && typeof opts.value == 'string') {
    var purl = new ParsedURL(url);
    var onlyWhenNotSet = opts.only_when_not_set === 'false'
                         || opts.only_when_not_set === false;
    if (!onlyWhenNotSet || !(opts.name in purl.query)) {
      purl.query[opts.name] = opts.value;
    }
    return purl.toString();
  }
  return url;
}

// Strip characters off the head and tail of the given str.
FieldOps.strip = function(str, anyOf) {
  if (typeof str == 'string') {
    if (anyOf === undefined || anyOf == null || anyOf == '') {
      return str.trim();
    }

    var containsAny = function(s, c) {
      return s.indexOf(c) >= 0;
    }

    var a = 0, b = str.length - 1;
    while (a <= b && containsAny(anyOf, str[a])) { a++; }
    while (b >= a && containsAny(anyOf, str[b])) { b--; }
    return (a <= b) ? str.substring(a, b+1) : '';
  }
  return str;
}

// Strip parameter from URL.
FieldOps.stripParam = function(url, name) {
  if (typeof url == 'string' && typeof name == 'string') {
    var purl = new ParsedURL(url);
    if (name in purl.query) {
      delete purl.query[name];
    }
    return purl.toString();
  }
  return url;
}

// Keep specified parameters and strip all other parameters off a URL.
FieldOps.stripParamsBut = function(url, names) {
  if (typeof url == 'string' && names instanceof Array) {
    var purl = new ParsedURL(url);
    var keys = Object.keys(purl.query).slice(); // slice in case it changes
    for (var i in keys) {
      var key = keys[i];
      if (names.indexOf(key) < 0) {
        delete purl.query[key];
      }
    }
    return purl.toString();
  }
  return url;
}

// Get substring. Options:
//   after: get content after a given part, to the end.
//   before: get content before a given part, from the beginning.
//   inclusive_after: get content after a given part, to the end, including that
//                    part itself.
//   inclusive_before: get content before a given part, from the beginning,
//                     including that part itself.
//   begin: index of the beginning position.
//   end: index of the position immediately past the last position.
FieldOps.substring = function(str, substringOp) {
  if (typeof str == 'string') {
    var a = 0;
    if (substringOp.after) {
      var p = str.indexOf(substringOp.after);
      if (p >= 0) {
        a = p + substringOp.after.length;
      }
    } else if (substringOp.inclusive_after) {
      var p = str.indexOf(substringOp.inclusive_after);
      if (p >= 0) {
        a = p;
      }
    } else {
      a = substringOp.begin;
    }

    var b = str.length;
    if (substringOp.before) {
      var p = str.lastIndexOf(substringOp.before);
      if (p >= 0) {
        b = p;
      }
    } else if (substringOp.inclusive_before) {
      var p = str.lastIndexOf(substringOp.inclusive_before);
      if (p >= 0) {
        b = p + substringOp.inclusive_before.length;
      }
    } else {
      b = (substringOp.end === 0) ? str.length : substringOp.end;
    }
    return str.substring(a, b);
  }
  return str;
}

// for use in Node:
if (typeof module == 'object') {
  module.exports = {
    PreFilter: PreFilter,
    FieldOps: FieldOps
  }
}

