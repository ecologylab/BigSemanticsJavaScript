// BigSemantics Service facade.

var BSService = (function() {
  // serviceLocation: {
  //   host: the host name
  //   port: normal HTTP port (e.g. 80)
  //   securePort: secure HTTP port (e.g. 443)
  // }
  function BSService(serviceLocation, options) {
    Readyable.call(this);

    if (serviceLocation) {
      this.serviceLocation = serviceLocation;
    } else {
      this.serviceLocation = BSService.DEFAULT_SERVICE_LOCATION;
    }

    if (options && options.downloader) {
      this.downloader = options.downloader;
    }
    if (!this.downloader && typeof Downloader == 'function') {
      this.downloader = new Downloader();
    }

    this.setReady();
  }
  BSService.prototype = Object.create(Readyable.prototype);
  BSService.prototype.constructor = BSService;

  // constants:
  BSService.DEFAULT_SERVICE_LOCATION = {
    host: 'api.ecologylab.net',
    port: 80,
    securePort: 443
  };
  BSService.METADATA_PATH = '/BigSemanticsService/metadata.json';
  BSService.MMD_PATH = '/BigSemanticsService/mmd.json';
  BSService.STUB_PATH = '/BigSemanticsService/metadata_or_stub.json';

  BSService.getServiceUrl = function(serviceLocation, path, options, params) {
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

  BSService.prepResponse = function(response) {
    var obj = null;
    if (response.entity) {
      obj = simpl.graphExpand(response.entity);
    } else if (response.text) {
      try {
        obj = simpl.deserialize(response.text);
      } catch (err) {
        console.warn("Cannot deserialize response: ", response);
      }
    }
    return obj;
  }

  BSService.prototype.loadMetadata = function(location, options, callback) {
    var purl = new ParsedURL(location);

    var serviceUrl = BSService.getServiceUrl(this.serviceLocation,
                                             BSService.METADATA_PATH,
                                             options,
                                             { url: location });
    var that = this;
    var downloadOpts = { responseType: 'json' };
    this.downloader.httpGet(serviceUrl, downloadOpts, function(err, response) {
      if (err) { callback(err, null); return; }
      var metadata = BSService.prepResponse(response);
      var unwrappedMetadata = BSUtils.unwrap(metadata);
      var mmdName = unwrappedMetadata.meta_metadata_name;
      that.loadMmd(mmdName, options, function(err, mmd) {
        if (err) { callback(err, null); return; }
        callback(null, { metadata: metadata, mmd: mmd });
      });
    });
  }

  BSService.prototype.loadInitialMetadata = function(location, options, callback) {
    var serviceUrl = BSService.getServiceUrl(this.serviceLocation,
                                             BSService.STUB_PATH,
                                             options,
                                             { url: location });
    var downloadOpts = { responseType: 'json' };
    this.downloader.httpGet(serviceUrl, downloadOpts, function(err, response) {
      if (err) { callback(err, null); return; }
      var metadata = BSService.prepResponse(response);
      callback(null, metadata);
    });
  }

  BSService.prototype.loadMmd = function(name, options, callback) {
    var serviceUrl = BSService.getServiceUrl(this.serviceLocation,
                                             BSService.MMD_PATH,
                                             options,
                                             { name: name });
    var downloadOpts = { responseType: 'json' };
    this.downloader.httpGet(serviceUrl, downloadOpts, function(err, response) {
      if (err) { callback(err, null); return; }
      var mmd = BSService.prepResponse(response);
      callback(null, mmd);
    });
  }

  BSService.prototype.selectMmd = function(location, options, callback) {
    var serviceUrl = BSService.getServiceUrl(this.serviceLocation,
                                             BSService.MMD_PATH,
                                             options,
                                             { url: location });
    var downloadOpts = { responseType: 'json' };
    this.downloader.httpGet(serviceUrl, downloadOpts, function(err, response) {
      if (err) { callback(err, null); return; }
      var mmd = BSService.prepResponse(response);
      callback(null, mmd);
    });
  }

  return BSService;
})();

