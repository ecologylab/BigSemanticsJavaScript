// For use in Node.js

if (typeof require == 'function' && typeof module == 'object') {
  var ParsedURL = require('./ParsedURL');
  var Readyable = require('./Readyable');
  var RepoMan = require('./RepoMan');
  var BigSemantics = require('./BigSemantics');
  var BSUtils = require('./BSUtils');

  module.exports = {
    ParsedURL: ParsedURL,
    Readyable: Readyable,
    RepoMan: RepoMan,
    BigSemantics: BigSemantics,
    BSUtils: BSUtils,
  }
}

