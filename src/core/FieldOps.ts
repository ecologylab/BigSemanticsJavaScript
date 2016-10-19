/**
 * String operations that can be applied to field values.
 * Location filters also use these ops.
 */

import ParsedURL from './ParsedURL';
import Scope from './Scope';
import {
  FieldOp,
  TypedFieldOp,
  MatchOp,
  ReplaceOp,
  SetParamOp,
  SubstringOp,
  FilterLocation,
  ConcatenateValue,
} from './types';

/**
 * Semantics that transforms locations for managing variability in Document
 * locations.
 *
 * @author kade
 */
export class PreFilter {
  static filter(location: string, filterLocation: FilterLocation): string {
    let newLocation = location;
    for (let i in filterLocation.ops){
      let fieldOp = filterLocation.ops[i];
      newLocation = FieldOps.operateOne(newLocation, fieldOp);
    }
    return newLocation;
  };
}

/**
 * Operations that transform extracted scalar values (in strings, before
 * interpreted as other scalar types).
 */
export class FieldOps {
  static operate(str: string, fieldOps: TypedFieldOp[]): string {
    if (fieldOps instanceof Array) {
      for (let i in fieldOps) {
        let op = fieldOps[i];
        let result = FieldOps.operateOne(str, op);
        str = result;
      }
      return str;
    } else {
      return FieldOps.operateOne(str, fieldOps);
    }
  }

  static operateOne(str: string, fieldOp: TypedFieldOp): string {
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
  static append(str: string, value: string): string {
    return str ? (str + value) : value;
  }

  // Decode URL (when a URL is used as a URL parameter in another URL).
  static decodeUrl(str: string): string {
    return decodeURIComponent(str);
  }

  // Retrieve parameter from URL if exists.
  static getParam(url: string, name: string, otherwise: string): string {
    if (url && name) {
      let purl = new ParsedURL(url);
      if (purl.query && name in purl.query) {
        let val = purl.query[name];
        if (val instanceof Array) {
          return val.join(',');
        }
        return val as string;
      } else if (otherwise) {
        return otherwise;
      }
    }
    return url;
  }

  // Regex Match. You can use on_match, on_find, and on_fail to specify special
  // values instead of the match result.
  static match(str: string, matchOp: MatchOp): string {
    if (str && matchOp && matchOp.pattern) {
      let result = str.match(new RegExp(matchOp.pattern));
      if (matchOp.on_match && result) {
        return matchOp.on_match;
      }
      if (result) {
        if (matchOp.on_find) {
          return matchOp.on_find;
        } else {
          return result[matchOp.group ? Number(matchOp.group) : 0];
        }
      }
      if (matchOp.on_fail) {
        return matchOp.on_fail;
      }
    }
    return str;
  }

  // Replaces params before the # with the ones after.
  static overrideParams(url: string): string {
    if (url) {
      let purl = new ParsedURL(url);
      if (purl.fragmentId) {
        let fragParams = ParsedURL.parseQueryParams(purl.fragmentId);
        if (fragParams && Object.keys(fragParams).length > 0) {
          if (!purl.query) {
            purl.query = {};
          }
          for (let name in fragParams) {
            purl.query[name] = fragParams[name];
          }
          return purl.toString();
        }
      }
    }
    return url;
  }

  // Prepend value to str.
  static prepend(str: string, value: string): string {
    return str ? (value + str) : value;
  }

  // Replace pattern with specified value.
  static replace(str: string, replaceOp: ReplaceOp): string {
    if (str && replaceOp && replaceOp.pattern) {
      if (replaceOp.first_only) {
        return str.replace(new RegExp(replaceOp.pattern), replaceOp.to);
      } else {
        return str.replace(new RegExp(replaceOp.pattern, 'g'), replaceOp.to);
      }
    }
    return str;
  }

  // Set given parameter to a specified value for a URL.
  static setParam(url: string, opts: SetParamOp): string {
    if (url && opts && opts.name && opts.value) {
      let purl = new ParsedURL(url);
      let onlyWhenNotSet = opts.only_when_not_set;
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
  static strip(str: string, anyOf: string): string {
    if (str) {
      if (anyOf && anyOf.length > 0) {
        let containsAny = function(s, c) {
          return s.indexOf(c) >= 0;
        }
        let a = 0, b = str.length - 1;
        while (a <= b && containsAny(anyOf, str[a])) { a++; }
        while (b >= a && containsAny(anyOf, str[b])) { b--; }
        return (a <= b) ? str.substring(a, b+1) : '';
      }
      return str.trim();
    }
    return str;
  }

  // Strip parameter from URL.
  static stripParam(url: string, paramName: string): string {
    if (url && paramName) {
      let purl = new ParsedURL(url);
      if (paramName in purl.query) {
        delete purl.query[paramName];
      }
      return purl.toString();
    }
    return url;
  }

  // Keep specified parameters and strip all other parameters off a URL.
  static stripParamsBut(url: string, paramNames: string[]): string {
    if (url && paramNames instanceof Array) {
      let purl = new ParsedURL(url);
      let keys = Object.keys(purl.query).slice(); // slice in case it changes
      for (let i in keys) {
        let key = keys[i];
        if (paramNames.indexOf(key) < 0) {
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
  static substring(str: string, substringOp: SubstringOp): string {
    if (str) {
      let a = 0;
      if (substringOp.after) {
        let p = str.indexOf(substringOp.after);
        if (p >= 0) {
          a = p + substringOp.after.length;
        }
      } else if (substringOp.inclusive_after) {
        let p = str.indexOf(substringOp.inclusive_after);
        if (p >= 0) {
          a = p;
        }
      } else {
        a = substringOp.begin;
      }

      let b = str.length;
      if (substringOp.before) {
        let p = str.lastIndexOf(substringOp.before);
        if (p >= 0) {
          b = p;
        }
      } else if (substringOp.inclusive_before) {
        let p = str.lastIndexOf(substringOp.inclusive_before);
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

  static concatenateValues(values: ConcatenateValue[], scope: Scope): string {
    if (values instanceof Array) {
      let result = new Array();
      for (let i in values) {
        let value = values[i];
        if (value.from_scalar) {
          let v = scope.trace(value.from_scalar, 'value');
          if (v) { result.push(v); }
        }
        else if (value.from_var) {
          let v = scope.trace(value.from_var, 'vars');
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
}
