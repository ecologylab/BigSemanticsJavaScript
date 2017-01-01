/**
 * Test bigsemantics-core in PhantomJS.
 */

var fs = require('fs');
var webpage = require('webpage');

var path = {
  join: function() {
    var base = arguments[0];
    for (var i = 1; i < arguments.length; ++i) {
      var item = arguments[i];
      if (base[base.length - 1] === fs.separator) {
        base = base + item;
      } else {
        base = base + fs.separator + item;
      }
    }
    return base;
  },

  parent: function(item) {
    var i = item.lastIndexOf(fs.separator);
    return item.substr(0, i);
  }
};

var repoFile = path.join(phantom.libraryPath, 'repo-all-160711.json');
var serializedRepo = fs.read(repoFile);

var bundleFile = path.join(path.parent(phantom.libraryPath), 'build', 'bigsemantics-core.bundle.js');

var page = webpage.create();
page.open('https://www.amazon.com/TCL-32S3800-32-Inch-Smart-Model/dp/B00UB9UJBA', function(status) {
  console.log("page status: " + status);

  page.onConsoleMessage = function(msg, lineNum, sourceId) {
    console.log('CONSOLE: ' + msg + ' (from line #' + lineNum + ' in "' + sourceId + '")');
  };

  page.onError = function(msg, trace) {
    var msgStack = ['ERROR: ' + msg];
    if (trace && trace.length) {
      msgStack.push('TRACE:');
      trace.forEach(function(t) {
        msgStack.push(' -> ' + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function +'")' : ''));
      });
    }
    console.error(msgStack.join('\n'));
  };

  if (page.injectJs(bundleFile)) {
    page.evaluate(function(serializedRepo) {
      console.log("evaluating specified function");

      var repository = bigsemantics.deserialize(serializedRepo);
      console.log("repository deserialized");

      var options = {
        appId: 'bs-phantom-test',
        appVer: '0.0.0',
        repository: repository
      };

      var bs = new bigsemantics.BSDefault();
      bs.load(options);
      console.log("BSDefault loaded");

      bs.loadMetadata(document.location.href, {
        response: {
          code: 200,
          entity: document,
          location: document.location.href
        }
      }).then(function(result) {
        console.log(bigsemantics.serialize(result.metadata));
      }).catch(function(err) {
        console.error(err);
      });
    }, serializedRepo);

  } else {
    console.error("cannot inject bigsemantics-core.bundle.js");
  }
});
