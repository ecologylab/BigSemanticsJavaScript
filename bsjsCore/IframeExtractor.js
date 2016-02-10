/* jshint browser:true */

function IframeExtractor() {
	var toExtract = {};
	var callbacks = {};
	var frames = {};
	var timeouts = {};
	
	var WAIT_TIME = 30000; //we assume extraction failure after 30 seconds 
	
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
		timeouts[url] = setTimeout(this.giveUp, WAIT_TIME, url);
	};
	
	/** clean up after finishing extraction */
	this.doneWith = function(url, md){
		clearTimeout(timeouts[url]);
		url = sanitize(url);		
		delete toExtract[url];
		callbacks[url](null, md);
		delete callbacks[url];
		document.body.removeChild(frames[url]);
		delete frames[url];
	};
	
	/** answer whether a newly loaded page needs to be extracted */
	this.extractNeeded = function(url){
		url = sanitize(url);
		return { needed: toExtract[url] !== undefined };
	};
	
	/** boradcast that extraction has failed and clean up */
	this.giveUp = function(url){
		callbacks[url]({error: 'iframe extraction timed out on url: ' + url + '. sumtin went wrong'}, null);
		delete toExtract[url];
		delete callbacks[url];
		if (frames[url].parentNode){
			frames[url].parentNode.removeChild(frames[url]);
		}
		delete frames[url];
	};
}