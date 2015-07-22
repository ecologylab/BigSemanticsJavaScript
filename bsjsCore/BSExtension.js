// Deals with the extension.
// Can only use in content script or webpages allowed to talk to the extension.

// string extId: the ID of the extension running BigSemantics in background.
//               when used from content script, this can be omitted.
//               when used from webpage, be sure to provide this ID.
function BSExtension(extId) {
  var ready = false;
  this.isReady = function() { return ready; }

  var queue = [];
  this.onReady = function(callback) {
    if (this.isReady()) { callback(null, this); }
    else { queue.push(callback); }
  }
  function processCallbacks(err, bs) {
    for (var i in queue) {
      var callback = queue[i];
      callback(err, bs);
    }
    queue = [];
  }

  var that = this;

  // string method: name of the method
  // object params: params for the invocation
  // (err, result)=>void callback: callback to receive the result of the
  //                               invocation.
  function sendMessageToExt(method, params, callback) {
    var msg = { method: method, params: params };
    var onResponse = function(response) {
      callback(response.error, response.result);
    }
    if (extId) {
      chrome.runtime.sendMessage(extid, msg, onResponse);
    } else {
      chrome.runtime.sendMessage(msg, onResponse);
    }
  }

  sendMessageToExt('hasExtension', null, function(err, result) {
    if (err) { console.error(err); return; }
    console.log("Extension detected: " + JSON.stringify(result));

    that.loadMetadata = function(location, options, callback) {
      var params = { location: location, options: options };
      sendMessageToExt('loadMetadata', params, callback);
    };

    that.loadMmd = function(name, options, callback) {
      var params = { name: name, options: options };
      sendMessageToExt('loadMmd', params, callback);
    };

    that.selectMmd = function(location, options, callback) {
      var params = { location: location, options: options };
      sendMessageToExt('selectMmd', params, callback);
    };

    that.canonicalizeLocation = function(location, options, callback) {
      var params = { location: location, options: options };
      sendMessageToExt('canonicalizeLocation', params, callback);
    };

    ready = true;
    processCallbacks(null, that);
  });

  return this;
}

