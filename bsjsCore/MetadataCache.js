/* jshint browser:true, devel:true */
/* global chrome */

var DLL;

/**
 * A LRU cache used by the extension for caches md from tabs, iframes, httprequests, and service requests
 */
function MetadataCache(){
	
	var MAX = 256;
	
	var list = new DLL(MAX);
	var map = {};
	
	var hitCount = 0;
	var missCount = 0;
	
	//interface with the extension to adjust size and keep track of cache hits and misses
	var defaultOpts = {
		developerMode: false,
		cacheSize: 256
	};
	chrome.storage.local.get(defaultOpts, function(opts) {
		console.log('cache size set to ' + opts.cacheSize);
		MAX = opts.cacheSize;
	});
	
	this.add = function(url, md){
		if (url in map){
			console.log('tried to cache ' + url + ' but it was already in cache');
			return;
		}
		var node = list.add(url, md);
		map[url] = node;
		
		console.log('added md for ' + url + ' to cache');
		
		console.log('cache is this big: ' + list.length);
		
		//chop of the end if it is too big
		if(list.length > list.max){
			list.length--;
			list.delete(list.tail);
			delete map[list.tail.key];
			console.log('cache got too big and we deleted tail, which was ' + list.tail.key);
		}

	};
	
	this.contains = function(url){
		var hit = url in map;
		
		if (hit) {
			console.log('cahe hit for ' + url);
			hitCount++;
		}
		else {
			console.log('cahe miss for ' + url);
			missCount++;
		}
				
		return hit;
	};
	
	this.get = function(url){
		console.log('fetched md for ' + url + ' from cache and made a that node the head');
		list.makeHead(map[url]);
		return map[url].data;
	};
	
	this.getInfo = function(){
		var hitRate = (hitCount / (hitCount + missCount) * 100) % 100 + '%' ;
		return {
			hitCount: hitCount,
			missCount: missCount,
			hitRate: hitRate,
			size: list.length
		};
	};
	
}

(function(){
	
/**
 * Doubly linked list. 
 */
DLL = function(m){
	this.length = 0;
	this.max = m;
	this.head = null;
	this.tail = null;
};

function DLLNode(key, value){
	this.key = key;
	this.data = value;
	this.previous = null;
	this.next = null;
}

DLL.prototype.add = function(key, value) {
    var node = new DLLNode(key, value);
 
    if (this.length !== 0) {
        this.tail.next = node;
        node.previous = this.tail;
        this.tail = node;
    } else {
        this.head = node;
        this.tail = node;
    }
 
    this.length++;
    return node;
};

DLL.prototype.delete = function(node){
	if (node.previous)
		node.previous.next = node.next;
	
	if (node.next)
		node.next.previous = node.previous;
};
	
DLL.prototype.makeHead = function(node){
	if (node == this.head){
		return;
	}
	
	if (node.previous)
		node.previous.next = node.next;
	
	if (node.next)
		node.next.previous = node.previous;
	
	node.previous = null;
	node.next = this.head;
	this.head = node;	
};
	
})();