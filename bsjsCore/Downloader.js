// Downloader (via XHR).

var JS_REDIRECT_OK = 0;
var JS_REDIRECT_LOOP = -1;
var JS_REDIRECT_ERR = -2;

// for use with Node:
if (typeof require == 'function') {
  XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
  ParsedURL = require('./ParsedURL.js');
}

var Downloader = (function() {
  // Options:
  //   domainIntervals: domain name => interval in millisecond
  function Downloader(options) {
    if (options && options.domainIntervals) {
      this.setDomainIntervals(options.domainIntervals);
    } else {
      this.setDomainIntervals({});
    }
    this.lastHits = {};
    return this;
  }

  Downloader.prototype.setDomainIntervals = function(domainIntervals) {
    if (typeof domainIntervals == 'object' && domainIntervals != null) {
      this.intervals = domainIntervals;
    }
  }

  // utility function
  // add newLocation to response, if not seen before
  // returns: true iff otherLocation is unseen and added to response
  Downloader.addNewLocation = function(response, newLocation) {
    if (newLocation && newLocation.length > 0) {
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
  Downloader.isContentTypeAcceptable = function(contentType, options) {
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
  Downloader.prototype.checkJsContentRedirect = function(xhr, response, options, callback) {
    if (typeof Document == 'undefined') { return JS_REDIRECT_ERR; } // not in browser

    if (xhr.response && xhr.response instanceof Document) {
      var heads = xhr.response.getElementsByTagName('head');
      if (heads.length > 0) {
        var scripts = heads[0].getElementsByTagName('script');
        for (var i in scripts) {
          var script = scripts[i];
          if (script.innerText) {
            var match = script.innerText.match(/location.replace\(\"(.*)\"\)/i);
            if (match && match[1]) {
              var url = match[1].replace(/\\/g, '');
              if (Downloader.addNewLocation(response, url)) {
                console.log("JavaScript redirect to: " + url);
                options.response = response;
                this.httpGet(url, options, callback);
                return JS_REDIRECT_OK;
              }
              else {
            	return JS_REDIRECT_LOOP; 
              }
            }
          }
        }
      }
    }
    return JS_REDIRECT_ERR;
  }

  Downloader.prototype.httpGet = function(location, options, callback) {
    var purl = new ParsedURL(location);
    var that = this;

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
      if (options && options.response) { response = options.response; }
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
              var newLocation = xhr.getResponseHeader('Location');
              if (Downloader.addNewLocation(response, newLocation)) {
                console.log("Redirect: " + location + " => " + newLocation);
                xhr.first300 = true;
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
              if (Downloader.isContentTypeAcceptable(response.contentType, options)) {
                ok = true;
              } else {
                err = new Error("Unsupported content type: " + response.contentType);
              }
            }
            if (!ok) {
              console.warn("Aborting XHR for ", location, ": ", xhr);
              xhr.abort();
              callback(err, null);
            }
            break;
          case xhr.DONE:
            if (xhr.status == 200) {
              Downloader.addNewLocation(response, xhr.responseURL);
              var retVal = that.checkJsContentRedirect(xhr, response, options, callback);
              if (retVal == JS_REDIRECT_LOOP) {
              	callback(new Error("Redirection loop using JS detected"), null);
              }
              else if (retVal != JS_REDIRECT_OK) {
                var err = null;
                try {
                  if (xhr.response) {
                    response.entity = xhr.response;
                  } else if (xhr.responseXML) {
                    response.xml = xhr.responseXML;
                  } else if (xhr.responseText) {
                    response.text = xhr.responseText;
                  } else {
                    err = new Error("Missing response body");
                  }
                } catch (exception) {
                  err = exception;
                }

                if (err) {
                  err.xhr = xhr;
                  callback(err, null);
                  return;
                }
                callback(null, response);
              } else {
            	  //retVal: JS_REDIRECT_OK
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
      if (location.indexOf("https://twitter.com") != 0 &&
    		  location.indexOf("http://twitter.com") != 0) { //temp. fix for twitter requests
    	  xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
      }
      xhr.send();
    }

    doHttpGet();
  }

  return Downloader;
})();

// for use in Node:
if (typeof module == 'object') {
  module.exports = Downloader;
}

