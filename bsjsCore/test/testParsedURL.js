// Test ParsedURL.
// Must run in Node

var ParsedURL = require('../ParsedURL');

function assert(cond) {
  if (cond) { console.log("Assertion passed."); }
  else  { throw new Error("Assertion failed."); }
}

function testHost() {
  assert(new ParsedURL("http://www.youtube.com/watch?v=1234").host == 'www.youtube.com');
  assert(new ParsedURL("https://www.youtube.com/watch?v=1234").host == 'www.youtube.com');
  assert(new ParsedURL("http://mysite.com:1234/dir/file.txt").host == 'mysite.com');
  assert(new ParsedURL("http://yin_qu@mysite.com:1234/dir/file.txt").host == 'mysite.com');
  assert(new ParsedURL("http://yin_qu:mypass@mysite.com:1234/dir/file.txt").host == 'mysite.com');
}

function testStripped() {
  var url = "http://user:pass@mysite.com/path/to/file?q=query&start=10&n=100#item1";
  var stripped = "http://user:pass@mysite.com/path/to/file";
  assert(new ParsedURL(url).stripped, stripped);

  url = "http://user@mysite.com/path/to/file?q=query&start=10&n=100#item1";
  stripped = "http://user@mysite.com/path/to/file";
  assert(new ParsedURL(url).stripped, stripped);

  url = "http://mysite.com/path/to/file?q=query&start=10&n=100#item1";
  stripped = "http://mysite.com/path/to/file";
  assert(new ParsedURL(url).stripped, stripped);
}

function testQuery() {
  var url = "http://user:pass@mysite.com/path/to/file?q=query&start=10&n=100#item1";
  var q = new ParsedURL(url).query;
  assert(Object.keys(q).length == 3);
  assert('q' in q);
  assert('start' in q);
  assert('n' in q);
}

testHost();
testStripped();
testQuery();

