// Deals with the extension.
// Can only use in content script or webpages allowed to talk to the extension.

// string extId: the ID of the extension running BigSemantics in background.
//               when used from content script, this can be omitted.
//               when used from webpage, be sure to provide this ID.
function BSExtension(extId) {
  Readyable.call(this);

  this.extensionId = extId;

  var that = this;
  this.sendMessageToExt('hasExtension', null, function(err, result) {
    if (err) { that.setError(err); return; }
    console.log("Extension detected: " + JSON.stringify(result));
    that.setReady();
  });

  return this;
}
BSExtension.prototype = Object.create(Readyable.prototype);
BSExtension.prototype.constructor = BSExtension;

// Send message to extension, and listen for callabck.
//
// String method:
//   name of the method
// Object params:
//   params for the invocation
// (err, result)=>void callback:
//   callback to receive the result of the invocation.
BSExtension.prototype.sendMessageToExt = function(method, params, callback) {
  function onResponse(response) {
    callback(response.error, response.result);
  }
  var msg = { method: method, params: params };
  if (this.extensionId) {
    chrome.runtime.sendMessage(extid, msg, onResponse);
  } else {
    chrome.runtime.sendMessage(msg, onResponse);
  }
}

BSExtension.prototype.loadMetadata = function(location, options, callback) {
  var params = { location: location, options: options };
  this.sendMessageToExt('loadMetadata', params, function(err, serialResult) {
    callback(err, simpl.deserialize(serialResult));
  });
}

BSExtension.prototype.loadMmd = function(name, options, callback) {
  var params = { name: name, options: options };
  this.sendMessageToExt('loadMmd', params, function(err, serialResult) {
    callback(err, simpl.deserialize(serialResult));
  });
}

BSExtension.prototype.selectMmd = function(location, options, callback) {
  var params = { location: location, options: options };
  this.sendMessageToExt('selectMmd', params, function(err, serialResult) {
    callback(err, simpl.deserialize(serialResult));
  });
}

BSExtension.prototype.canonicalizeLocation = function(location, options, callback) {
  var params = { location: location, options: options };
  this.sendMessageToExt('canonicalizeLocation', params, callback);
}

