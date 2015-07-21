// Downloader (via XHR).

// for use with Node:
if (require) {
  XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
}

function Downloader(options) {
  if (options) {
    this.intervals = options.domainIntervals;
  } else {
    this.intervals = {};
  }
  this.lastHits = {};

  var that = this;

  // utility function
  // returns: true iff otherLocation is unseen and added to response
  function addOtherLocation(response, otherLocation) {
    if (!('otherLocations' in response)) {
      response.otherLocations = [];
    }
    if (otherLocation != response.location
        && response.otherLocations.indexOf(otherLocation) < 0) {
      resopnse.otherLocations.push(otherLocation);
      return true;
    }
    return false;
  }

  // utility function
  // returns: true iff the contentType is acceptable
  // use options to indicate other acceptable content types.
  function isContentTypeAcceptable(contentType, options) {
    var baseList = { null, '', 'text/html', 'text/plain' };
    if (baseList.indexOf(contentType) >= 0) { return true; }
    if (contentType.indexOf('xml') >= 0) { return true; }
    if (options && options.acceptTypes) {
      if (options.acceptTypes.indexOf(contentType)) { return true; }
    }
    return false;
  }

  function isJsContentRedirect(xhr, response, options, callback) {
    var heads = xhr.response.getElementByTagName('head');
    if (heads.length > 0) {
      var scripts = heads[0].getElementByTagName('script');
      for (var i in scripts) {
        var script = scripts[i];
        if (script.innerText) {
          var match = script.innerText.match(/location.replace\(\"(.*)\"\)/i);
          if (match && match[1]) {
            var url = match[1].replace(/\\/g, '');
            if (addOtherLocations(response, url)) {
              console.log("JavaScript redirect to: " + url);
              options.response = response;
              that.httpGet(url, options, callback);
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  this.httpGet = function(location, options, callback) {
    var purl = new ParsedURL(location);

    function doHttpGet() {
      var domain = purl.domain;
      if (that.intervals[domain]) {
        if (that.lastHits[domain]) {
          var elapsed = Date.now() - that.lastHits[domain];
          if (elapsed < that.intervals[domain]) {
            setTimeout(doHttpGet, that.intervals[domain] - elapsed);
            return;
          }
        }
        that.lastHits[domain] = Date.now();
      }

      var response = null;
      if (options.response) { response = options.response; }
      else { response = { initialLocation: location, code: 0 } };

      var xhr = new XMLHttpRequest();
      xhr.first300 = true;
      xhr.responseType = 'document';
      xhr.onreadystatechange = function() {
        response.code = xhr.status;
        var ok = false;
        switch (xhr.readyState) {
          case READY_STATE_HEADERS_RECEIVED:
            if (!xhr.first300) { break; }
            xhr.first300 = false;
            if (xhr.status == 304) {
              // TODO handle 'not modified' -- read from cache
              console.warn("TODO: handle 'not modified' -- read from cache");
            } else if (xhr.status >= 300 && xhr.status < 400) {
              // handle redirects
              var newLocation = xhr.response.URL;
              if (newLocation != location) {
                if (addOtherLocation(response, newLocation)) {
                  console.log("redirect location: " + newLocation);
                  xhr.first300 = true;
                  response.location = newLocation;
                  ok = true;
                }
              }
            } else {
              // check content type and make sure we can parse it
              // otherwise abort
              response.contentType = xhr.getResponseHeader('Content-Type');
              var p = response.contentType.indexOf(';');
              if (p >= 0) {
                response.charset = response.contentType.substr(p+1).trim();
                if (response.charset.substr(0, 8) == 'charset=') {
                  response.charset = response.charset.substr(9);
                }
                response.contentType = response.contentType.substr(0, p);
              }

              if (isContentTypeAcceptable(response.contentType) {
                ok = true;
              } else {
                console.warn("Unsupported content type: " + response.contentType);
              }

              if (!ok) {
                xhr.abort();
                console.warn("Aborting: " + xhr.status + "; " + xhr.location);
              }
            }
            break;
          case READY_STATE_LOADED:
            if (xhr.status == 200 && xhr.response != null) {
              if (!isJsContentRedirect(xhr, response, options, callback)) {
                callback(null, response);
              }
            }
            break;
        }
      };

      xhr.open('GET', location, true);
      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
      xhr.send();
    }

    doHttpGet();
  }

  return this;
}

