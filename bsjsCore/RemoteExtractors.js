/* jshint browser:true, devel:true */
/* global PreFilter, chrome, Util */

/** 
 * Detailed spec: https://docs.google.com/document/d/1kjgonh8jp3vwLKajReEa2zfAYfodcKCc233n7kVu3tE
 */
function RemoteExtractor() {
	var WAIT_TIME = 30000; //we assume extraction failure after 30 seconds 

	var requests = {};
	var timeouts = {};
	
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
	
	/** create a new request or update a pending ones callbacks */
	this.extract = function(rawUrl, mmd, options, callback){	
	
		if (mmd.filter_location){
			rawUrl = PreFilter.filter(rawUrl, mmd.filter_location);
		}
		var url = sanitize(rawUrl);
		
		//case 1: new request (or request has already finished and been deleted. this happens for things we don't cache)
		if (!requests[url]){
			var req = new ExtractionRequest(rawUrl, mmd, callback);
			this.start(req, options);
			requests[url] = req;
			timeouts[url] = setTimeout(this.giveUp, WAIT_TIME, url);
		}
		//case 2: pending
		else if (requests[url].status == 'pending'){
			requests[url].callbacks.push(callback);
		}
	};
	
	/** clean up after finishing extraction */
	this.doneWith = function(url, md){
		url = sanitize(url);	
		clearTimeout(timeouts[url]);
		this.finish(requests[url], null, md);
		delete requests[url];
	};
	
	/** answer whether a newly loaded page needs to be extracted */
	this.extractNeeded = function(url){
		url = sanitize(url);
		return { needed: requests[url] !== undefined };
	};
	
	/** boradcast that extraction has failed and clean up */
	this.giveUp = function(url){
		this.finish(requests[url], {error: 'remote extraction timed out on url: ' + url + '. sumtin went wrong'}, null);
		delete requests[url];
	};
}

function ExtractionRequest(rawURL, metametadata, callback){
	this.status = 'pending';
	this.callbacks = [callback];
	this.mmd = metametadata;
	this.rawUrl = rawURL;
}

ExtractionRequest.prototype.cleanup = function(err, md){
	for (var i = 0; i < this.callbacks.length; i++){
		this.callbacks[i](err, md);
	}
	delete this.callbacks;

	this.status = (err) ?  'failed' : 'done';
};



//each remote extractor inherits from the parent and implements two functions, start and finish
//start creates the external extraction object (iframe or window)
//finish deletes that object, and calls other functions associated with the request finishing
function IframeExtractor(){
	this.start = function(request, options){
		request.iframe = document.createElement('iframe');
		request.iframe.setAttribute('src', request.rawUrl);
		document.body.appendChild(request.iframe);	
	};
	
	this.finish = function(request, err, md){
		if (request.iframe.parentNode){
			request.iframe.parentNode.removeChild(request.iframe);
		}
		delete request.iframe;
		request.cleanup(err, md);
	};
}
IframeExtractor.prototype = new RemoteExtractor();
IframeExtractor.constructor = IframeExtractor;



function PopUnderExtractor(){

	var focusOn;
	var ids = {};
	
	this.start = function(request, options){
		popBest(options.senderId, request.rawUrl);
	};
	
	this.finish = function(request, err, md){
		closeWindowOf(request.rawUrl);
		request.cleanup(err, md);		
	};
	
	function closeWindowOf(url){
		chrome.windows.remove(ids[url]);
	}
	
	function popMinimize(senderId, url){
		focusOn = senderId;
		chrome.windows.create({url: url, state : "minimized"}, onPopUnderLoad);
	}

	function popUnderAsPopup(senderId, url){
		focusOn = senderId;
		chrome.windows.getCurrent(function(win){
			var newTop = win.top + win.height - 200;
			var newLeft = win.left + win.width - 300;
			chrome.windows.create({url: url, type: "popup", state : "normal", focused: false, width: 10, height: 10, top: newTop, left: newLeft }, onPopUnderLoad);
		});
	}

	/** decide how to pop based on operating system */
	function popBest(senderId, url){
		focusOn = senderId;
		var os = Util.getOS();

		if (os.indexOf('Windows', 0) > -1){
			popMinimize(senderId, url);
		}
		else if(os.indexOf('Mac', 0) > -1){
			popUnderAsPopup(senderId, url);
		}
		//Ubuntu currently not supported
	}

	/** when a new window loads, refocus on the calling window */
	function onPopUnderLoad(win){
		ids[win.tabs[0].url] = win.id;
		chrome.windows.getLastFocused(function (window){  
			chrome.windows.update(focusOn, {focused:true});
		});
	}
}
PopUnderExtractor.prototype = new RemoteExtractor();
PopUnderExtractor.constructor = PopUnderExtractor;