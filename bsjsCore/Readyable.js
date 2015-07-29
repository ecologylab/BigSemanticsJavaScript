// A base class that has an onReady() function.

var Readyable = (function() {
  function Readyable() {
    this.ready = false;
    this.callbackQueue = [];
    this.error = null;
    return this;
  }

  Readyable.prototype.isReady = function() {
    return this.ready;
  }

  Readyable.prototype.onReady = function(callback) {
    if (this.error) { callback(this.error, null); return; }
    if (this.ready) { callback(null, this); return; }
    this.callbackQueue.push(callback);
  };

  Readyable.prototype.setReady = function() {
    this.ready = true;
    this.error = null;
    for (var i in this.callbackQueue) {
      var callback = this.callbackQueue[i];
      callback(null, this)
    }
    this.callbackQueue = [];
  }

  Readyable.prototype.setError = function(err) {
    this.ready = false;
    if (typeof err == 'string') { this.error = new Error(msg); }
    else { this.error = err; }
    for (var i in this.callbackQueue) {
      var callback = this.callbackQueue[i];
      callback(this.error, null);
    }
    this.callbackQueue = [];
  }

  return Readyable;
})();

// for use in Node:
if (typeof module == 'object') {
  module.exports = Readyable;
}

