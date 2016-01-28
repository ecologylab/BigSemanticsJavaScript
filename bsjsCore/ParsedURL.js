// ParsedURL.

var ParsedURL = (function() {
  function ParsedURL(url) {
    if (url) {
      this.raw = url;
      var matches = url.match(/^((https?)\:\/\/([^\/?#]+)([^?#]*))(\?[^#]*)?(#.*)?/);
      if (matches) {
        this.stripped = matches[1];

        this.scheme = matches[2];

        var hostSpec = ParsedURL.parseHostSpec(matches[3]);
        this.user = hostSpec.user;
        this.password = hostSpec.password;
        this.host = hostSpec.host;
        this.port = hostSpec.port;

        // TODO a better way of getting the top level domain, see
        // https://publicsuffix.org/list/public_suffix_list.dat
        if (this.host.length >= 4 && this.host.substr(0, 4) == 'www.') {
          this.domain = this.host.substr(4);
        } else {
          this.domain = this.host;
        }
		  
        this.path = matches[4];
        if (this.path.length == 0) {
          this.path = '/';
        }

        this.query = ParsedURL.parseQueryParams(matches[5]);

        var fragId = matches[6];
        if (fragId) { this.fragmentId = fragId.substr(1); }
      }
    }
    return this;
  }

  ParsedURL.prototype.toString = function() {
    if (this.scheme && this.host) {
      var result = this.scheme + '://';
      if (this.user !== undefined && this.user != null) {
        result += encodeURIComponent(this.user);
        if (this.password !== undefined && this.password != null) {
          result += ':' + encodeURIComponent(this.password);
        }
        result += '@';
      }
      result += this.host;
      if (this.port) {
        result += ':' + this.port;
      }
      if (this.path) {
        result += this.path;
      }
      if (typeof this.query == 'object' && this.query != null) {
        var keys = Object.keys(this.query).sort();
        if (keys.length > 0) {
          var parts = new Array();
          for (var i in keys) {
            var key = keys[i];
            var val = this.query[key];
            if (val instanceof Array) {
              for (var j in val) {
                parts.push(key + '=' + encodeURIComponent(val[j]));
              }
            } else {
              parts.push(key + '=' + encodeURIComponent(val));
            }
          }
          result += '?' + parts.join('&');
        }
      }
      if (this.fragmentId !== undefined && this.fragmentId != null) {
        result += '#' + this.fragmentId;
      }
      return result;
    }
    return this.raw;
  }

  // parse hostSpec: [user[:password]@]host[:port]
  ParsedURL.parseHostSpec = function(hostSpec) {
    var result = {};
    var p = hostSpec.indexOf('@');
    if (p >= 0) {
      var userPass = hostSpec.substr(0, p);
      var q = userPass.indexOf(':');
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

  // parse query params.
  // from http://stackoverflow.com/questions/979975/how-to-get-the-value-from-the-url-parameter
  ParsedURL.parseQueryParams = function(query) {
    var result = {};
    if (query && query.length > 0) {
      if (query[0] == '?') { query = query.substr(1); }
      var parts = query.split('&');
      for (var i = 0; i < parts.length; i++) {
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
    return result;
  }
  
  return ParsedURL;
})();
  
// for use in Node:
if (typeof module == 'object') {
  module.exports = ParsedURL;
}

