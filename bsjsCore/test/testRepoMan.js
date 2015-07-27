// Test new RepoMan.
// Must run in Node

var RepoMan = require('../RepoMan');

function assert(cond) {
  if (cond) { console.log("Assertion passed."); }
  else  { throw new Error("Assertion failed."); }
}

// test load mmd by name
function testLoadMmd() {
  var repoMan = new RepoMan({ file: '../simpl/test/testRepo.json' });
  repoMan.onReady(function(err, repo) {
    if (err) { console.error(err); return; }
    repo.loadMmd('amazon_product', {}, function(err, mmd) {
      if (err) { console.error(err); return; }
      assert(typeof mmd == 'object');
      assert(mmd != null);
      assert(mmd.name == 'amazon_product');
    });
  });
}

// test select mmd by location, url_stripped
function testSelectStripped() {
  var repoMan = new RepoMan({ file: '../simpl/test/testRepo.json' });
  repoMan.onReady(function(err, repo) {
    if (err) { console.error(err); return; }
    var url = 'http://www.newegg.com/Product/Product.aspx?Item=N82E16813128532';
    repo.selectMmd(url, {}, function(err, mmd) {
      if (err) { console.error(err); return; }
      assert(typeof mmd == 'object');
      assert(mmd != null);
      assert(mmd.name == 'newegg_product');
    });
  });
}

// test select mmd by location, url_path_tree
function testSelectPath() {
  var repoMan = new RepoMan({ file: '../simpl/test/testRepo.json' });
  repoMan.onReady(function(err, repo) {
    if (err) { console.error(err); return; }
    var url = 'http://www.samsclub.com/sams/cortina-pub-back-reclining-living-room-3-pcs/prod2360758.ip?navAction=push';
    repo.selectMmd(url, {}, function(err, mmd) {
      if (err) { console.error(err); return; }
      assert(typeof mmd == 'object');
      assert(mmd != null);
      assert(mmd.name == 'samsclub_product');
    });
  });
}

// test select mmd by location, url_regex
function testSelectRegex() {
  var repoMan = new RepoMan({ file: '../simpl/test/testRepo.json' });
  repoMan.onReady(function(err, repo) {
    if (err) { console.error(err); return; }
    var url = 'http://www.citeulike.org/user/jsun/author/Hofmann:T';
    repo.selectMmd(url, {}, function(err, mmd) {
      if (err) { console.error(err); return; }
      assert(typeof mmd == 'object');
      assert(mmd != null);
      assert(mmd.name == 'citeulike_author');
    });
  });
}

// test select mmd by location, url_regex_fragment
function testSelectRegexFrag() {
  var repoMan = new RepoMan({ file: '../simpl/test/testRepo.json' });
  repoMan.onReady(function(err, repo) {
    if (err) { console.error(err); return; }
    var url = 'http://www.tate.org.uk/art/artists/cy-twombly-2079';
    repo.selectMmd(url, {}, function(err, mmd) {
      if (err) { console.error(err); return; }
      assert(typeof mmd == 'object');
      assert(mmd != null);
      assert(mmd.name == 'tate_artist');
    });
  });
}

// test select mmd by location, filter by params
function testSelectParams() {
  var repoMan = new RepoMan({ file: '../simpl/test/testRepo.json' });
  repoMan.onReady(function(err, repo) {
    if (err) { console.error(err); return; }
    var url = 'https://www.google.com/search?tbm=isch&hl=en&q=watergate';
    repo.selectMmd(url, {}, function(err, mmd) {
      if (err) { console.error(err); return; }
      assert(typeof mmd == 'object');
      assert(mmd != null);
      assert(mmd.name == 'google_image_search');
    });
  });
}

// TODO test loadInitialMetadata

testLoadMmd();
testSelectStripped();
testSelectPath();
testSelectRegex();
testSelectRegexFrag();
testSelectParams();

