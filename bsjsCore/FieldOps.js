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
    newLocation = FieldOps.operateOne(newLocation, fieldOp);
  }
  return newLocation;
};

/**
 * Operations that transform extracted scalar values (in strings, before
 * interpreted as other scalar types).
 */
var FieldOps = {};

FieldOps.operate = function(str, fieldOps) {
  if (fieldOps instanceof Array) {
    for (var i in fieldOps) {
      var op = fieldOps[i];
      var result = FieldOps.operateOne(str, op);
      str = result;
    }
    return str;
  } else {
    return FieldOps.operateOne(str, fieldOps);
  }
}

FieldOps.operateOne = function(str, fieldOp) {
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
  return str ? (str + value) : value;
}

// Decode URL (when a URL is used as a URL parameter in another URL).
FieldOps.decodeUrl = function(str) {
  return decodeURIComponent(str);
}

// Retrieve parameter from URL if exists.
FieldOps.getParam = function(url, name, otherwise) {
  if (url && name) {
    var purl = new ParsedURL(url);
    if (purl.query && name in purl.query) {
      return purl.query[name];
    } else if (otherwise) {
      return otherwise;
    }
  }
  return url;
}

// Regex Match. You can use on_match, on_find, and on_fail to specify special
// values instead of the match result.
FieldOps.match = function(str, opts) {
  if (str && opts && opts.pattern) {
    var result = str.match(new RegExp(opts.pattern));
    if (opts.on_match && result) {
      return opts.on_match;
    }
    if (result) {
      if (opts.on_find) {
        return opts.on_find;
      } else {
        return result[opts.group ? Number(opts.group) : 0];
      }
    }
    if (opts.on_fail) {
      return opts.on_fail;
    }
  }
  return str;
}

// Replaces params before the # with the ones after.
FieldOps.overrideParams = function(url) {
  if (url) {
    var purl = new ParsedURL(url);
    if (purl.fragmentId) {
      var fragParams = ParsedURL.parseQueryParams(purl.fragmentId);
      if (fragParams && Object.keys(fragParams).length > 0) {
        purl.query = purl.query || new Object();
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
  return str ? (value + str) : value;
}

// Replace pattern with specified value.
FieldOps.replace = function(str, opts) {
  if (str && opts && opts.pattern) {
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
  if (url && opts && opts.name && opts.value) {
    var purl = new ParsedURL(url);
    var onlyWhenNotSet = opts.only_when_not_set;
    if (typeof onlyWhenNotSet === 'string') {
      onlyWhenNotSet = (onlyWhenNotSet === 'true')||(onlyWhenNotSet === 'yes');
    }
    if (!(onlyWhenNotSet && opts.name in purl.query)) {
      purl.query[opts.name] = opts.value;
    }
    return purl.toString();
  }
  return url;
}

// Strip characters off the head and tail of the given str.
FieldOps.strip = function(str, anyOf) {
  if (str) {
    if (anyOf && anyOf.length > 0) {
      var containsAny = function(s, c) {
        return s.indexOf(c) >= 0;
      }
      var a = 0, b = str.length - 1;
      while (a <= b && containsAny(anyOf, str[a])) { a++; }
      while (b >= a && containsAny(anyOf, str[b])) { b--; }
      return (a <= b) ? str.substring(a, b+1) : '';
    }
    return str.trim();
  }
  return str;
}

// Strip parameter from URL.
FieldOps.stripParam = function(url, name) {
  if (url && name) {
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
  if (url && names instanceof Array) {
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
  if (str) {
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

FieldOps.concatenateValues = function(values, scope) {
  if (values instanceof Array) {
    var result = new Array();
    for (var i in values) {
      var value = values[i];
      if (value.from_scalar) {
        var v = scope.trace(value.from_scalar, 'value');
        if (v) { result.push(v); }
      }
      else if (value.from_val) {
        var v = scope.trace(value.from_val, 'vars');
        if (v) { result.push(v); }
      }
      else if (value.constant_value) {
        result.push(value.constant_value);
      }
    }
    return result.join('');
  }
  return null;
}

// for use in Node:
if (typeof module == 'object') {
  module.exports = {
    PreFilter: PreFilter,
    FieldOps: FieldOps,
  }
}
