// Facade of BigSemantics.

// for use in Node:
if (typeof require === 'function') {
  Readyable = require('./Readyable');
  RepoMan = require('./RepoMan');
  PreFilter = require('./FieldOps').PreFilter;
  BSService = require('./BSService');
  BSUtils = require('./BSUtils');
}

var BigSemantics = (function() {
  /**
   * A BigSemantics Facade.
   * @constructor
   * @param {Object} repoSource
   *   Same as the first argument to RepoMan.
   * @param {Object} options
   *   Additional options. Can contain 'downloader', 'extractor', or 'repoMan'.
   */
  function BigSemantics(repoSource, options) {
    Readyable.call(this);

    if (options) {
      this.downloader = options.downloader;
      this.extractor = options.extractor;
      this.repoMan = options.repoMan;
    }
    if (!this.downloader) {
      this.downloader = new Downloader();
    }
    if (!this.extractor) {
      this.extractor = extractMetadata;
    }
    this.bss = new BSService();
    if (!this.repoMan) {
      this.repoMan = new RepoMan(repoSource, options);
      var that = this;
      this.repoMan.onReady(function(err, repoMan) {
        if (err) { that.setError(err); return; }
        that.downloader.setDomainIntervals(repoMan.getDomainIntervals());
        that.setReady();
      });
    } else {
      this.setReady();
    }

    if (typeof MetadataCache === 'function' && MetadataCache){
      this.metadataCache = new MetadataCache();
    }

    if (typeof IframeExtractor === 'function' && IframeExtractor){
        this.iframeExtractor = new IframeExtractor();
    }

    if (typeof PopUnderExtractor === 'function' && PopUnderExtractor){
        this.popUnderExtractor = new PopUnderExtractor();
    }

    return this;
  }
  BigSemantics.prototype = Object.create(Readyable.prototype);
  BigSemantics.prototype.constructor = BigSemantics;

  BigSemantics.prototype.loadMetadata = function(location, options, callback) {
    var that = this;
    if (!options) { options = {}; }

    // mmdCallback: (err, mmd) => void
    function getMmd(mmdCallback) {
      if (options.mmd) {
        mmdCallback(null, options.mmd);
      } else if (options.mmdName) {
        that.loadMmd(options.mmdName, options, mmdCallback);
      } else {
        that.selectMmd(location, options, mmdCallback);
      }
    }

    getMmd(function(err, mmd) {
      if (err) { callback(err, null); return; }

      mmd = BSUtils.unwrapMmd(mmd);

      if (mmd.filter_location) {
        location = PreFilter.filter(location, mmd.filter_location);
      }

      if (that.metadataCache && that.metadataCache.contains(location) && !options.noCache){
        callback(null, { metadata: that.metadataCache.get(location), mmd: mmd });
        return;
      }

      if (mmd.extract_with == "service"){
        options.useHttps = (window.location.protocol == 'https:'); //use Https if we are on an https page
        that.bss.loadMetadata(location, options, callback);
      }
      else if (options.page && that.extractor) {
        // we already have the DOM
        var response = {
          location: location,
          entity: options.page
        };
        that.extractor(response, mmd, that, options, function(err, metadata) {
          if (err) { callback(err, null); return; }
          callback(null, { metadata: metadata, mmd: mmd });
          if (!mmd.no_cache && that.metadataCache) {
            that.metadataCache.add(location, metadata);
          }
        });
      }
      else {
        // we don't really have the DOM
        if (mmd.user_agent_string) {
          options.userAgent = mmd.user_agent_string;
        }
        else if (mmd.user_agent_name && mmd.user_agent_name in that.repoMan.userAgents) {
          options.userAgent = that.repoMan.userAgents[mmd.user_agent_name];
        }

        if (mmd.extract_with == 'iframe') {
          that.iframeExtractor.extract(location, mmd, options, function(err, metadata){
            if (err) { callback(err, null); return; }
            callback(null, { metadata: metadata, mmd: mmd });
          });
        }
        else if (mmd.extract_with == 'popUnder') {
          that.popUnderExtractor.extract(location, mmd, options, function(err, metadata){
            if (err) { callback(err, null); return; }
            callback(null, { metadata: metadata, mmd: mmd });
          });
        }
        else {
          that.downloader.httpGet(location, options, function(err, response) {
            if (err) { callback(err, null); return; }

            that.extractor(response, mmd, that, options, function(err, metadata) {
              if (err) { callback(err, null); return; }
              callback(null, { metadata: metadata, mmd: mmd });
              if (!mmd.no_cache && that.metadataCache) {
                that.metadataCache.add(location, metadata);
              }
            });
          });
        }
      }
    });
  };

  BigSemantics.prototype.loadInitialMetadata = function(location, options, callback) {
    this.repoMan.selectMmd(location, options, function(err, mmd) {
      if (err) { callback(err, null); return; }
      if (mmd.filter_location) {
        location = PreFilter.filter(location, mmd.filter_location);
      }
      var result = { mm_name: mmd.name, location: location };
      callback(null, result);
    });
  };

  BigSemantics.prototype.loadMmd = function(name, options, callback) {
    this.repoMan.loadMmd(name, options, callback);
  };

  BigSemantics.prototype.selectMmd = function(location, options, callback) {
    this.repoMan.selectMmd(location, options, callback);
  };

  BigSemantics.prototype.getRepo = function() {
    return this.repoMan.getRepo();
  };

  return BigSemantics;
})();

// for use in Node:
if (typeof module === 'object') {
  module.exports = BigSemantics;
  module.exports.default = BigSemantics;
}
