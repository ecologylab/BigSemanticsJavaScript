/* jshint browser:true, devel:true */

var DLL;

/**
 * A LRU cache used by the extension for caches md from tabs, iframes, httprequests, and service requests
 */
function MetadataCache(){
	
	var MAX = 10;
	
	var list = new DLL(MAX);
	var map = {};
	
	this.add = function(url, md){
		if (url in map){
			return;
		}
		var node = list.add(url, md);
		map[url] = node;
		
		//console.log('added to cache');
		
		//console.log('cache is this big: ' + list.length);
		
		//chop of the end if it is too big
		if(list.length > list.max){
			list.length--;
			list.delete(list.tail);
			delete map[url];
			//console.log('cache got too big and we deleted it');
		}

	};
	
	this.contains = function(url){
		return (url in map);
	};
	
	this.get = function(url){
		//console.log('recieved from cache and made a new node the head');
		list.makeHead(map[url]);
		return map[url].data;
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