/* jshint browser:true */

function IframeExtractor() {
	var toExtract = {};
	var callbacks = {};
	var frames = {};
	
	//TODO handle failure
	
	/** 
	 * for http/https and www issues. not ideal, eventually needs to handle tougher redirects 
	 */
	function sanitize(url){
		var strippedURL = url.replace(/.*?:\/\//g, "");
		if (strippedURL.length >= 4 && strippedURL.substr(0, 4) == 'www.') {
			strippedURL = strippedURL.substr(4);
		}
		return strippedURL;
	}
	
	this.extract = function(rawUrl, callback){
		var url = sanitize(rawUrl);
		toExtract[url] = true;
		callbacks[url] = callback;
		var iframe = document.createElement('iframe');
		iframe.setAttribute('src', rawUrl);
		document.body.appendChild(iframe);
		frames[url] = iframe;
	};
	
	this.doneWith = function(url, md){
		url = sanitize(url);		
		delete toExtract[url];
		callbacks[url](null, md);
		delete callbacks[url];
		document.body.removeChild(frames[url]);
		delete frames[url];
	};
	
	this.extractNeeded = function(url){
		url = sanitize(url);
		return { needed: toExtract[url] !== undefined };
	};
}