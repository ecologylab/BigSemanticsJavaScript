/* jshint browser:true */
/* global PreFilter */

/** 
 * Detailed spec: https://docs.google.com/document/d/1kjgonh8jp3vwLKajReEa2zfAYfodcKCc233n7kVu3tE
 */
function RemoteExtractor() {
	var WAIT_TIME = 30000; //we assume extraction failure after 30 seconds 

	var requests = {};
	var timeouts = {};
		
	//implemented by subclasses
	this.ExtractionRequest = function(){};
	
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
	
	this.extract = function(rawUrl, mmd, callback){	
	
		if (mmd.meta_metadata.filter_location){
			rawUrl = PreFilter.filter(rawUrl, mmd.meta_metadata.filter_location);
		}
		var url = sanitize(rawUrl);
		
		//case 1: new request
		if (!requests[url]){
			var req = new this.ExtractionRequest(rawUrl, mmd, callback);
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
		requests[url].finish(null, md);
	};
	
	/** answer whether a newly loaded page needs to be extracted */
	this.extractNeeded = function(url){
		url = sanitize(url);
		return { needed: requests[url] !== undefined };
	};
	
	/** boradcast that extraction has failed and clean up */
	this.giveUp = function(url){
		requests[url].finish({error: 'remote extraction timed out on url: ' + url + '. sumtin went wrong'}, null);
	};
}

/*
function ExtractionRequest(rawURL, metametadata, callback, onStart, onFinish){
	this.status = 'pending';
	this.callbacks = [callback];

	var mmd = metametadata;
	var rawUrl = rawURL;

	onStart();
	
	this.iframe = document.createElement('iframe');
	this.iframe.setAttribute('src', rawUrl);
	document.body.appendChild(this.iframe);

	this.finish = function(err, md){
		for (var i = 0; i < this.callbacks.length; i++){
			this.callbacks[i](err, md);
		}
		delete this.callbacks;

		onFinish();

		this.status = (err) ?  'failed' : 'done';
	};
};
*/

function IframeExtractor(){
	
	//this.ExtractionRequest = new ExtractionRequest();
	
	//TODO OOP THIS
	
	this.ExtractionRequest = function(rawURL, metametadata, callback){
		this.status = 'pending';
		this.callbacks = [callback];

		var mmd = metametadata;
		var rawUrl = rawURL;

		this.iframe = document.createElement('iframe');
		this.iframe.setAttribute('src', rawUrl);
		document.body.appendChild(this.iframe);

		this.finish = function(err, md){
			for (var i = 0; i < this.callbacks.length; i++){
				this.callbacks[i](err, md);
			}
			delete this.callbacks;

			if (this.iframe.parentNode){
				this.iframe.parentNode.removeChild(this.iframe);
			}
			delete this.iframe;

			this.status = (err) ?  'failed' : 'done';
		};
	};
}
IframeExtractor.prototype = new RemoteExtractor();
IframeExtractor.constructor = IframeExtractor;

function PopUnderExtractor(){
	
	this.ExtractionRequest = function(rawURL, metametadata, callback){
		this.status = 'pending';
		this.callbacks = [callback];

		var mmd = metametadata;
		var rawUrl = rawURL;

		//TODO CREATE POPUNDER AND REFOCUS

		this.finish = function(err, md){
			for (var i = 0; i < this.callbacks.length; i++){
				this.callbacks[i](err, md);
			}
			delete this.callbacks;

			//TODO CLOSE POPUNDER
			
			this.status = (err) ?  'failed' : 'done';
		};
	};
}
PopUnderExtractor.prototype = new RemoteExtractor();
PopUnderExtractor.constructor = PopUnderExtractor;