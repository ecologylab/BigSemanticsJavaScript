// Facade of BigSemantics.

var BigSemantics = (function() {
  function BigSemantics(options) {
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
    if (!this.repoMan) {
      this.repoMan = new RepoMan(options);
      var that = this;
      this.repoMan.onReady(function(err, repoMan) {
        if (err) { that.setError(err); return; }
        that.downloader.setDomainIntervals(repoMan.getDomainIntervals());
        that.setReady();
      });
    } else {
      this.setReady();
    }

    return this;
  }
  BigSemantics.prototype = Object.create(Readyable.prototype);
  BigSemantics.prototype.constructor = BigSemantics;

  BigSemantics.prototype.loadMetadata = function(location, options, callback) {
    var that = this;

    // mmdCallback: (err, mmd) => void
    function getMmd(mmdCallback) {
      if (options && options.mmd) {
        mmdCallback(null, options.mmd);
      } else if (options && options.mmdName) {
        that.loadMmd(options.mmdName, options, mmdCallback);
      } else {
        that.selectMmd(location, options, mmdCallback);
      }
    }

    getMmd(function(err, mmd) {
      if (err) { callback(err, null); return; }

      if (mmd.filter_location) {
        location = PreFilter.filter(location, mmd.filter_location);
      }

      if (options && options.page && that.extractor) {
        // we already have the DOM
        var response = {
          location: location,
          entity: options.page
        };
        that.extractor(response, mmd, that, options, function(err, metadata) {
          if (err) { callback(err, null); return; }
          callback(null, { metadata: metadata, mmd: mmd });
        });
      } else {
        // we don't really have the DOM
        that.downloader.httpGet(location, options, function(err, response) {
          if (err) { callback(err, null); return; }

          that.extractor(response, mmd, that, options, function(err, metadata) {
            if (err) { callback(err, null); return; }
            callback(null, { metadata: metadata, mmd: mmd });
          });
        });
      }
    });
  }

  BigSemantics.prototype.loadMmd = function(name, options, callback) {
    this.repoMan.loadMmd(name, options, callback);
  }

  BigSemantics.prototype.selectMmd = function(location, options, callback) {
    this.repoMan.selectMmd(location, options, callback);
  }

  BigSemantics.prototype.canonicalizeLocation = function(location, options, callback) {
    this.repoMan.canonicalizeLocation(location, options, callback);
  }

  return BigSemantics;
})();

