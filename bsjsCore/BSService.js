// BigSemantics Service facade.

function BSService(serviceLocation, options) {
  Readyable.call(this);
	// constants:
  this.DEFAULT_SERVICE_LOCATION = {
	  host: 'api.ecologylab.net',
	  port: 80,
	  securePort: 443
	};
  this.METADATA_PATH = '/BigSemanticsService/metadata.json';
  this.MMD_PATH = '/BigSemanticsService/mmd.json';
  this.STUB_PATH = '/BigSemanticsService/metadata_or_stub.json';
  if (serviceLocation) {
    this.serviceLocation = serviceLocation;
  } else {
    this.serviceLocation = this.DEFAULT_SERVICE_LOCATION;
  }

  if (options) {
    this.downloader = options.downloader;
  }

  if (!this.downloader) {
    this.downloader = new Downloader();
  }

  this.setReady();
}
BSService.prototype = Object.create(Readyable.prototype);
BSService.prototype.constructor = BSService;



BSService.prototype.getServiceUrl = function(serviceLocation, path, options, params) {
  var scheme = 'http';
  var host = serviceLocation.host;
  var port = serviceLocation.port;
  if (options && options.useHttps) {
    scheme = 'https';
    port = serviceLocation.securePort;
  }
  var baseUrl = scheme + '://' + host + ':' + port + path;
  var paramsArray = [];
  for (var key in params) {
    paramsArray.push(key + "=" + encodeURIComponent(params[key]));
  }
  return baseUrl + '?' + paramsArray.join('&');
}

BSService.prototype.unwrapResponse = function(response) {
  var obj = null;
  if (response.entity) {
    obj = simpl.graphExpand(response.entity);
  } else if (response.text) {
    try {
      obj = simpl.deserialize(response.text);
    } catch (err) {
      console.warn("Cannot deserialize response!");
    }
  }
  if (obj) { return BSUtils.unwrap(obj); }
  return null;
}

BSService.prototype.loadMetadata = function(location, options, callback) {
  var purl = new ParsedURL(location);

  var serviceUrl = this.getServiceUrl(this.serviceLocation,
                                           this.METADATA_PATH,
                                           options,
                                           { url: location });
  var that = this;
  var downloadOpts = { responseType: 'json' };
  this.downloader.httpGet(serviceUrl, downloadOpts, function(err, response) {
    if (err) { callback(err, null); return; }
    var metadata = that.unwrapResponse(response);
    var mmdName = metadata.meta_metadata_name;
    that.loadMmd(mmdName, options, function(err, mmd) {
      if (err) { callback(err, null); return; }
      callback(null, { metadata: metadata, mmd: mmd });
    });
  });
}

BSService.prototype.loadMmd = function(name, options, callback) {
  var serviceUrl = this.getServiceUrl(this.serviceLocation,
                                           this.MMD_PATH,
                                           options,
                                           { name: name });
  var downloadOpts = { responseType: 'json' };
  var that = this;

  this.downloader.httpGet(serviceUrl, downloadOpts, function(err, response) {
    if (err) { callback(err, null); return; }
    var mmd = that.unwrapResponse(response);
    callback(null, mmd);
  });
}

BSService.prototype.selectMmd = function(location, options, callback) {
  var serviceUrl = this.getServiceUrl(this.serviceLocation,
                                           this.MMD_PATH,
                                           options,
                                           { url: location });
  var downloadOpts = { responseType: 'json' };
  this.downloader.httpGet(serviceUrl, downloadOpts, function(err, response) {
    if (err) { callback(err, null); return; }
    var mmd = that.unwrapResponse(response);
    callback(null, mmd);
  });
}

BSService.prototype.canonicalizeLocation = function(location, options, callback) {
  var serviceUrl = this.getServiceUrl(this.serviceLocation,
                                           this.STUB_PATH,
                                           options,
                                           { url: location });
  var downloadOpts = { responseType: 'json' };
  this.downloader.httpGet(serviceUrl, downloadOpts, function(err, response) {
    if (err) { callback(err, null); return; }
    var metadata = that.unwrapResponse(response);
    callback(null, metadata.location);
  });
}

