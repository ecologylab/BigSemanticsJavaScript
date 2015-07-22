// Downloader (via XHR).

// for use with Node:
if (typeof require == 'function') {
  XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
  ParsedURL = require('./ParsedURL.js');
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
  // add newLocation to response, if not seen before
  // returns: true iff otherLocation is unseen and added to response
  function addNewLocation(response, newLocation) {
    if (newLocation) {
      if (newLocation != response.location) {
        if (!response.otherLocations) { response.otherLocations = []; }
        if (response.otherLocations.indexOf(newLocation) < 0) {
          var prevLocation = response.location;
          response.location = newLocation;
          response.otherLocations.push(prevLocation);
          return true;
        }
      }
    }
    return false;
  }

  // utility function
  // returns: true iff the contentType is acceptable
  // use options to indicate other acceptable content types.
  function isContentTypeAcceptable(contentType, options) {
    var baseList = [ null, '', 'text/html', 'text/plain' ];
    if (baseList.indexOf(contentType) >= 0) { return true; }
    if (contentType.indexOf('xml') >= 0) { return true; }
    if (options && options.responseType) {
      if (options.responseType == 'json' && contentType.indexOf('json') >= 0) {
        return true;
      }
    }
    if (options && options.acceptTypes) {
      if (options.acceptTypes.indexOf(contentType)) { return true; }
    }
    return false;
  }

  // utility function
  // do JS redirection, if not resulting in infinite loop
  // returns: true iff JS redirection detected and is happening.
  function isJsContentRedirect(xhr, response, options, callback) {
    if (typeof Document == 'undefined') { return false; }
    if (xhr.response && xhr.response instanceof Document) {
      var heads = xhr.response.getElementByTagName('head');
      if (heads.length > 0) {
        var scripts = heads[0].getElementByTagName('script');
        for (var i in scripts) {
          var script = scripts[i];
          if (script.innerText) {
            var match = script.innerText.match(/location.replace\(\"(.*)\"\)/i);
            if (match && match[1]) {
              var url = match[1].replace(/\\/g, '');
              if (addNewLocations(response, url)) {
                console.log("JavaScript redirect to: " + url);
                options.response = response;
                that.httpGet(url, options, callback);
                return true;
              }
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
      else { response = { location: location, code: 0 } };

      var xhr = new XMLHttpRequest();
      xhr.first300 = true;
      xhr.responseType = 'document';
      if (options && options.responseType) {
        xhr.responseType = options.responseType;
      }
      xhr.onreadystatechange = function() {
        response.code = xhr.status;
        var ok = false;
        var err = null;
        switch (xhr.readyState) {
          case xhr.HEADERS_RECEIVED:
            if (!xhr.first300) { break; }
            xhr.first300 = false;
            if (xhr.status == 304) {
              // TODO handle 'not modified' -- read from cache
              err = new Error("TODO: handle 'not modified' -- read from cache");
            } else if (xhr.status >= 300 && xhr.status < 400) {
              // handle redirects
              var newLocation = xhr.response.URL;
              if (addNewLocation(response, newLocation)) {
                console.log("redirect location: " + newLocation);
                xhr.first300 = true;
                response.location = newLocation;
                ok = true;
              } else {
                err = new Error("Redirection loop detected");
              }
            } else {
              // check content type and make sure we can parse it
              // otherwise abort
              var contentType = xhr.getResponseHeader('Content-Type');
              var matches = contentType.match(/([^;]+)(;\s*charset=(.*))?/);
              if (matches) {
                response.contentType = matches[1];
                response.charset = matches[3];
              }

              if (isContentTypeAcceptable(response.contentType, options)) {
                ok = true;
              } else {
                err = new Error("Unsupported content type: " + response.contentType);
              }
            }
            if (!ok) {
              console.warn("Aborting: " + xhr.status + "; " + xhr.location);
              xhr.abort();
              callback(err, null);
            }
            break;
          case xhr.DONE:
            if (xhr.status == 200) {
              addNewLocation(response, xhr.responseURL);
              if (!isJsContentRedirect(xhr, response, options, callback)) {
                if (xhr.response) {
                  response.entity = xhr.response;
                } else if (xhr.responseXML) {
                  response.xml = xhr.responseXML;
                } else if (xhr.responseText) {
                  response.text = xhr.responseText;
                } else {
                  var err = new Error("Missing response body");
                  err.xhr = xhr;
                  callback(err, null);
                  return;
                }
                callback(null, response);
              } else {
                callback(new Error("Redirection loop using JS detected"), null);
              }
            } else {
              var err = new Error("Error in response");
              err.xhr = xhr;
              callback(err, null);
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

// for use in Node:
if (typeof module == 'object') {
  module.exports = Downloader;
}

