// BigSemantics Service facade.

function BSService(serviceLocation) {
  var METADATA_PATH = '/BigSemanticsService/metadata.json';
  var MMD_PATH = '/BigSemanticsService/mmd.json';
  var STUB_PATH = '/BigSemanticsService/metadata_or_stub.json';

  var DEFAULT_SERVICE_LOCATION = {
    host: 'api.ecologylab.net',
    port: 80,
    securePort: 443
  };

  if (typeof serviceLocation == 'undefined' || serviceLocation == null) {
    serviceLocation = DEFAULT_SERVICE_LOCATION;
  }

  this.isReady = function() { return true; }

  this.onReady = function(callback) { callback(null, this); }

  this.downloader = new Downloader();
  var that = this;

  function getServiceUrl(path, options, params) {
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

  function getUnwrappedObj(response) {
    var obj = null;
    if (response.entity) {
      obj = response.entity;
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

  this.loadMetadata = function(location, options, callback) {
    var purl = new ParsedURL(location);

    var serviceUrl = getServiceUrl(METADATA_PATH, options, { url: location });
    var downloadOpts = { responseType: 'json' };
    this.downloader.httpGet(serviceUrl, downloadOpts, function(err, response) {
      if (err) { callback(err, null); return; }
      var metadata = getUnwrappedObj(response);
      var mmdName = metadata.meta_metadata_name;
      that.loadMmd(mmdName, options, function(err, mmd) {
        if (err) { callback(err, null); return; }
        callback(null, { metadata: metadata, mmd: mmd });
      });
    });
  }

  this.loadMmd = function(name, options, callback) {
    var serviceUrl = getServiceUrl(MMD_PATH, options, { name: name });
    var downloadOpts = { responseType: 'json' };
    this.downloader.httpGet(serviceUrl, downloadOpts, function(err, response) {
      if (err) { callback(err, null); return; }
      var mmd = getUnwrappedObj(response);
      callback(null, mmd);
    });
  }

  this.selectMmd = function(location, options, callback) {
    var serviceUrl = getServiceUrl(MMD_PATH, options, { url: location });
    var downloadOpts = { responseType: 'json' };
    this.downloader.httpGet(serviceUrl, downloadOpts, function(err, response) {
      if (err) { callback(err, null); return; }
      var mmd = getUnwrappedObj(response);
      callback(null, mmd);
    });
  }

  this.canonicalizeLocation = function(location, options, callback) {
    var serviceUrl = getServiceUrl(STUB_PATH, options, { url: location });
    var downloadOpts = { responseType: 'json' };
    this.downloader.httpGet(serviceUrl, downloadOpts, function(err, response) {
      if (err) { callback(err, null); return; }
      var metadata = getUnwrappedObj(response);
      callback(null, metadata.location);
    });
  }

  return this;
}
