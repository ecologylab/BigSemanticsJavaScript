// Automatically switching between extension-based and service-based BS
// implementation. By default, this implementation uses the production service.
// If the extension is detected, it will automatically switch to using the
// extension.

var BSAutoSwitch = (function() {
  // extId:
  //   extension ID
  // serviceLocation:
  //   service spec (see BSService)
  function BSAutoSwitch(idList, serviceLocation, options) {
    Readyable.call(this);

    // BSService object is immediately available -- we assume the service is
    // always available.
    this.bsSvc = new BSService(serviceLocation, options);
    this.bsImpl = this.bsSvc;
    
    // If the extension is available, switch to it.
    var that = this;
    var bsExt = new BSExtension(idList, options);
    bsExt.onReady(function(err, bsExt) {
      if (!err && bsExt && bsExt.isReady()) {
        that.bsImpl = bsExt;
        that.setReady();
      }
    });
   
    var timeoutForExtension = 1000;
    if (options && options.timeoutForExtension) {
      timeoutForExtension = options.timeoutForExtension;
    }
    setTimeout(function() {
      if (!that.isReady()) {
        that.setReady();
      }
    }, timeoutForExtension);
  }
  BSAutoSwitch.prototype = Object.create(Readyable.prototype);
  BSAutoSwitch.prototype.constructor = BSAutoSwitch;

  // delegate calls to the underlying implementation

  BSAutoSwitch.prototype.loadMetadata = function(location, options, callback) {
    var that = this;
    this.bsImpl.onReady(function(err, bs) {
      if (err) {
        if (that.bsImpl instanceof BSExtension) { bs = that.bsSvc; }
        else { callback(err, null); return; }
      }
      if(!options){
    	  options = {};
      }
	  options.useHttps = (window.location.protocol == 'https:');		
      bs.loadMetadata(location, options, callback);
    });
  }

  BSAutoSwitch.prototype.loadInitialMetadata = function(location, options, callback) {
    var that = this;
    this.bsImpl.onReady(function(err, bs) {
      if (err) {
        if (that.bsImpl instanceof BSExtension) { bs = that.bsSvc; }
        else { callback(err, null); return; }
      }
      bs.loadInitialMetadata(location, options, callback);
    });
  }

  BSAutoSwitch.prototype.loadMmd = function(name, options, callback) {
    var that = this;
    this.bsImpl.onReady(function(err, bs) {
      if (err) {
        if (that.bsImpl instanceof BSExtension) { bs = that.bsSvc; }
        else { callback(err, null); return; }
      }
      if(!options){
    	  options = {};
      }

	  options.useHttps = (window.location.protocol == 'https:');
      bs.loadMmd(name, options, callback);
    });
  }

  BSAutoSwitch.prototype.selectMmd = function(location, options, callback) {
    var that = this;
    this.bsImpl.onReady(function(err, bs) {
      if (err) {
        if (that.bsImpl instanceof BSExtension) { bs = that.bsSvc; }
        else { callback(err, null); return; }
      }
      bs.selectMmd(location, options, callback);
    });
  }

  return BSAutoSwitch;
})();

