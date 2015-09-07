// Deals with the extension.
// Can only use in content script or webpages allowed to talk to the extension.

var BSExtension = (function() {
  // String extId:
  //   the ID of the extension running BigSemantics in background.  when used from
  //   content script, this can be omitted.  when used from webpage, be sure to
  //   provide this ID.
  // Object options:
  //   Optional configurations.
  function BSExtension(idList, options) {
    Readyable.call(this);

    //this.extensionId = extId;
    if(idList){
          this.extensionsLeftToCheck = idList.length;

    }
    if (options) {
      this.extractor = options.extractor;
    }
    if (!this.extractor && typeof extractMetadata == 'function') {
      this.extractor = extractMetadata;
    }

    var that = this;
    this.sendMessageToExt('extensionInfo', null, function(err, result) {
      if (err) { 
        if (that.extensionsLeftToCheck > 0) {
          that.extensionLeftToCheck--;
        } else {
          that.setError(err);
          return;
        }
      } else {
        console.log("Extension detected: ", result);
        if (!that.ready) {
          that.setReady();
        }
      }
    }, idList);

    return this;
  }
  BSExtension.prototype = Object.create(Readyable.prototype);
  BSExtension.prototype.constructor = BSExtension;

  BSExtension.prototype.onReady = function(callback) {
    if (this.isReady()) {
      var that = this;
      this.sendMessageToExt('extensionInfo', null, function(err, result) {
        if (err) { callback(err, null); return; }
        callback(null, that);
      });
    } else {
      Readyable.prototype.onReady.call(this, callback);
    }
  }

  // Send message to extension, and listen for callabck.
  //
  // String method:
  //   name of the method
  // Object params:
  //   params for the invocation
  // (err, result)=>void callback:
  //   callback to receive the result of the invocation.
  BSExtension.prototype.sendMessageToExt = function(method, params, callback, idList) {
    function onResponse(response) {
      if (response) {
        if (response.result && typeof response.result == 'string') {
          response.result = simpl.deserialize(response.result);
        }
        callback(response.error, response.result);
      } else {
        callback(new Error("No response from extension"), null);
      }
    }
    
    var msg = { method: method, params: simpl.serialize(params) };
    if (idList) {
      for (var i = 0; i < idList.length; i++) {
        try {
          var that = this;
          (function(index) {
            chrome.runtime.sendMessage(idList[index], msg, function (response, currentID){
              if (response) {
                if (response.result && typeof response.result == 'string') {
                  response.result = simpl.deserialize(response.result);
                }
                if(that.extensionId == null){
                  that.extensionId = idList[index];
                }
                callback(response.error, response.result);
              } else {
                callback(new Error("No response from extension"), null);
              }
            });
          })(i);
        } catch (err) {
          callback(err, null);
        }
      }
    } else {
      try {
        if (this.extensionId) {
          chrome.runtime.sendMessage(this.extensionId, msg, onResponse);
        } else {
          chrome.runtime.sendMessage(msg, onResponse);
        }
      } catch (err) {
        callback(err, null);
      }
    }
  }

  BSExtension.prototype.loadMetadata = function(location, options, callback) {
    var that = this;

    // mmdCallback: (err, mmd) => void
    function getMmd(mmdCallback) {
      if (options && options.mmd) {
        mmdCallback(null, options.mmd);
      } else if (options && options.mmdName) {
        var params = { name: options.mmdName, options: options };
        that.sendMessageToExt('loadMmd', params, function(err, mmd) {
          if (err) { mmdCallback(err, null); return; }
          mmdCallback(null, mmd);
        });
      } else {
        var params = { location: location, options: options };
        that.sendMessageToExt('selectMmd', params, function(err, mmd) {
          if (err) { mmdCallback(err, null); return; }
          mmdCallback(null, mmd);
        });
      }
    }

    if (options && options.page && this.extractor) {
      // we already have the DOM (in options.page)
      getMmd(function(err, mmd) {
        if (err) { callback(err, null); return; }

        var response = { location: location, entity: options.page };
        console.log("Extracting in content script: " + location);
        that.extractor(response, mmd, that, options, function(err, metadata) {
          if (err) { callback(err, null); return; }
          callback(null, { metadata: metadata, mmd: mmd });
        });
      });
    } else {
      // we don't have the DOM
      var params = { location: location, options: options };
      this.sendMessageToExt('loadMetadata', params, function(err, result) {
        callback(err, result);
      });
    }
  }

  BSExtension.prototype.loadInitialMetadata = function(location, options, callback) {
    var params = { location: location, options: options };
    this.sendMessageToExt('loadInitialMetadata', params, callback);
  }

  BSExtension.prototype.loadMmd = function(name, options, callback) {
    var params = { name: name, options: options };
    this.sendMessageToExt('loadMmd', params, function(err, result) {
      callback(err, result);
    });
  }

  BSExtension.prototype.selectMmd = function(location, options, callback) {
    var params = { location: location, options: options };
    this.sendMessageToExt('selectMmd', params, function(err, result) {
      callback(err, result);
    });
  }

  return BSExtension;
})();

