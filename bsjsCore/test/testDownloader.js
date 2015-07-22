// Test Downloader.
// Requires Node.js

var Downloader = require('../Downloader.js');

function assert(cond) {
  if (cond) { console.log("Assertion passed."); }
  else  { throw new Error("Assertion failed."); }
}

function testBasic() {
  var d = new Downloader();
  d.httpGet('https://www.google.com', {}, function(err, response) {
    if (err) { console.error(err); return; }

    assert(response.location == 'https://www.google.com');
    assert(response.code == 200);
    assert(response.contentType == 'text/html');
    assert(response.charset == 'UTF-8' || response.charset == 'ISO-8859-1');
    assert(response.text != null);
  });
}

// TODO test redirect:
// the xmlhttprequest package in Node currently only supports XMLHttpRequest
// level 1, which does not provide responseURL. Thus it cannot capture
// redirected locations.

testBasic();

