// Deals with the extension.
// Can only use in content script or webpages allowed to talk to the extension.

var BSExtension = (function() {
  // Array<String> extIds:
  //   A list (array) of IDs of extensions running BigSemantics in background.
  //   will be tried one by one in the constructor, and the first detected
  //   extension will be used for all subsequent requests. 
  //   - When used from content script, can be null.
  //   - When used from webpage, must NOT be null.
  // Object options:
  //   Optional configurations.
  function BSExtension(extIds, options) {
    Readyable.call(this);

    this.extIds = extIds || new Array();
    if (options) {
      this.extractor = options.extractor;
    }
    if (!this.extractor && typeof extractMetadata == 'function') {
      this.extractor = extractMetadata;
    }
	
	this.bss = new BSService();
	  
    var that = this;
    var extensionsLeftToCheck = this.extIds.length;
    function testExt(index) {
      that.sendMessageToExt(that.extIds[index], 'extensionInfo', null, function(err, result) {
        if (err) {
          if (extensionsLeftToCheck > 0) {
            extensionsLeftToCheck--;
          } else {
            return that.setError(err);
          }
        } else {
          console.log("Extension detected: ", result);
          that.extensionId = that.extIds[index];
          return that.setReady();
        }
        testExt(index+1);
      });
    }
    testExt(0);

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
  // String extId:
  //   (optional) the ID of the target extension
  // String method:
  //   name of the method
  // Object params:
  //   params for the invocation
  // (err, result)=>void callback:
  //   callback to receive the result of the invocation.
  BSExtension.prototype.sendMessageToExt = function(extId, method, params, callback) {
    if (arguments.length === 3 && typeof params === 'function') {
      // shift arguments when extId is omitted
      callback = params;
      params = method;
      method = extId;
      extId = this.extensionId;
    }

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
    try {
      if (extId) {
        chrome.runtime.sendMessage(extId, msg, onResponse);
      } else {
        chrome.runtime.sendMessage(msg, onResponse);
      }
    } catch (err) {
      callback(err, null);
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

		if (mmd.meta_metadata.filter_location){
			location = PreFilter.filter(location, mmd.meta_metadata.filter_location);
		}
        var response = { location: location, entity: options.page };
        console.log("Extracting in content script: " + location);
		
		if (mmd.meta_metadata.extract_with == "service"){ 
			that.usedService = true; //so we can display in the slideout
			options.useHttps = (window.location.protocol == 'https:'); //use Https if we are on an https page
			that.bss.loadMetadata(location, options, callback);
		}
		else {  
			that.usedService = false;
			that.extractor(response, mmd, that, options, function(err, metadata) {
			  if (err) { callback(err, null); return; }
			  callback(null, { metadata: metadata, mmd: mmd });
			});
		}
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

