// ParsedURL.

function ParsedURL(url) {
  // parse hostSpec: [user[:password]@]host[:port]
  function parseHostSpec(self, hostSpec) {
    var p = hostSpec.indexOf('@');
    if (p >= 0) {
      var userPass = hostSpec.substr(0, p);
      var q = userPass.indexOf(':');
      if (q >= 0) {
        self.user = userPass.substr(0, q);
        self.password = userPass.substr(q+1);
      } else {
        self.user = userPass;
      }
      hostSpec = hostSpec.substr(p+1);
    }
    p = hostSpec.indexOf(':');
    if (p >= 0) {
      self.host = hostSpec.substr(0, p);
      self.port = Number(hostSpec.substr(p+1));
    } else {
      self.host = hostSpec;
    }
  }

  // parse query params.
  // from http://stackoverflow.com/questions/979975/how-to-get-the-value-from-the-url-parameter
  function parseQueryParams(query) {
    var result = {};
    if (query && query.length > 0) {
      if (query[0] == '?') { query = query.substr(1); }
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
    return result;
  }
  
  if (url) {
    this.raw = url;
    var matches = url.match(/^((https?)\:\/\/([^\/]+)([^?#]*))(\?[^#]*)?(#.*)?/);
    if (matches) {
      this.stripped = matches[1];
      this.scheme = matches[2];
      parseHostSpec(this, matches[3]);
      if (this.host.length >= 4 && this.host.substr(0, 4) == 'www.') {
        this.domain = this.host.substr(4);
      } else {
        this.domain = this.host;
      }
      // TODO get the top level domain, see
      // https://publicsuffix.org/list/public_suffix_list.dat
      this.path = matches[4];
      if (this.path.length == 0) {
        this.path = '/';
      }
      this.query = parseQueryParams(matches[5]);
      var fragId = matches[6];
      if (fragId) { this.fragmentId = fragId.substr(1); }
    }
  }
  return this;
}

// for use in Node:
if (module) {
  module.exports = ParsedURL;
}

