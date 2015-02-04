var RETRY_WAIT_TIME = 125;
var DEFAULT_INTERVAL = 125;
//Keep track of webpages to be downloaded
var downloadQueue = [];

//This is a list of webpages that have recently been accessed
var recentlyRequested = [];

var downloadInterval = null;

function getDomain(url){
	return url.match(/:\/\/(www\.)?(.[^/:]+)/)[2];
}


//Simple function to retrieve that wait time from the array of know sites with delays. Otherwise, return a default interval
function getRequestWaitTime(domain, delaySites){
	
	for( var i = 0; i < delaySites.length; ++i ){
		if( delaySites[i].domain == domain ){
			return delaySites[i].min_download_interval;
		}
	}
	return DEFAULT_INTERVAL;
}


function loadWebpage(url, sendResponse, additionalUrls, delaySites)
{
	
	//time needed to wait between requests
	
	var domain = getDomain(url);
	
	var requestWaitTime = getRequestWaitTime(domain, delaySites);
	
	//If we have not recently requested, then send the request, add the domain to recently requested, and set a timeout to remove it.
	if( recentlyRequested.indexOf(domain) == -1 ){
		
		sendLoadRequest(url, sendResponse, additionalUrls);
		recentlyRequested.push(domain);
		setTimeout(removeRecentlyRequested, requestWaitTime, domain);
		
	}else{
		
		//Otherwise add to a queue of urls that are waiting.
		
		downloadQueue.push({url:url, waitTime:requestWaitTime});
		if( downloadInterval == null ){
			downloadInterval = setInterval(tryDownloadQueue, RETRY_WAIT_TIME);
		}
		
	}
	
}

//We use a polling solution to retrieve documents from the queue. The idea is that because the majority of documents will have equivalent wait times
//we can increase efficiency and simplicity simply be checking back with the queue every (DEFAULT_INTERVAL) milliseconds.
function tryDownloadQueue(){
	
	//loop backwards so we can remove/splice elements cleanly
	for( var i = downloadQueue.length - 1; i > 0; i-=1 ){
		
		var url = downloadQueue[i].url;
		var domain = getDomain();
		
			if( recentlyRequested.indexOf(domain) == -1 ){
				
				downloadQueue.splice(i, 1);
				
				var requestWaitTime = downloadQueue[i].waitTime;
				
				sendLoadRequest(url, sendResponse, additionalUrls);
				recentlyRequested.push(domain);
				setTimeout(removeRecentlyRequest, requestWaitTime, domain);
		
			}
			
	}
	
	//Otherwise, the queue is empty so stop polling.
	if( downloadQueue.length == 0 ){
		clearInterval(downloadInterval);
		downloadInterval = null;
	}
	
}

function removeRecentlyRequested(domain){
	
	var index = recentlyRequested.indexOf(domain);
  	recentlyRequested.splice(index, 1);
	
}

//Do the work of sending the load request.
//*This code is not my own, but rather was retrieved and updated from the existing download code* - Cameron
function sendLoadRequest(url, sendResponse, additionalUrls)
{
	var xhr = new XMLHttpRequest();
	xhr.responseType = "document";
	//xhr.followRedirects = true;
	
	xhr.onreadystatechange = function() {
		
		//console.log("state: " + xhr.readyState + " status: " + xhr.status);
		
		if (xhr.readyState==4 && xhr.status==200)
	    {
			//console.log(xhr.response);
			//var headers = xhr.getAllResponseHeaders();
			if (!isUrlRedirect(xhr.response, sendResponse, additionalUrls))			
				getMetaMetadata(url, xhr.response, sendResponse, additionalUrls);
	    }
	};
	
	xhr.open("GET", url, true);
	xhr.send();
}

