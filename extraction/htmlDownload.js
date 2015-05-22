/*global setTimeout, setInterval, clearInterval, XMLHttpRequest, console, getDocumentMM, getDocumentMMbyMime
*/
var RETRY_WAIT_TIME = 125;
var DEFAULT_INTERVAL = 125;
var DOWNLOAD_INTERVALS = {};    //How long we should wait between requests for each site
var downloadQueue = [];         //Keep track of webpages to be downloaded
var recentlyRequested = [];     //This is a list of webpages that have recently been accessed

var downloadInterval = null;

function getDownloadDomain(url){
	return url.match(/:\/\/(www\.)?(.[^/:]+)/)[2];
}


//Simple function to retrieve that wait time from the array of know sites with delays. Otherwise, return a default interval
function getRequestWaitTime(domain){
    if(DOWNLOAD_INTERVALS.hasOwnProperty(domain)){
        return DOWNLOAD_INTERVALS[domain];
    }
	return DEFAULT_INTERVAL;
}


function loadWebpage(url, sendResponse, additionalUrls, mmd, callback)
{
	
	//if (mmd.hasOwnProperty('rewrite_location')){}
	
	//time needed to wait between requests	
	var domain = getDownloadDomain(url);
	
	var requestWaitTime = getRequestWaitTime(domain);
	
	//If we have not recently requested, then send the request, add the domain to recently requested, and set a timeout to remove it.
	if( recentlyRequested.indexOf(domain) == -1 ){
		
		sendLoadRequest(url, sendResponse, additionalUrls, mmd, callback);
		recentlyRequested.push(domain);
		setTimeout(removeRecentlyRequested, requestWaitTime, domain);
		
	}else{
		//Otherwise add to a queue of urls that are waiting.
		
		downloadQueue.push({url:url, waitTime:requestWaitTime});
		if( downloadInterval === null ){
			downloadInterval = setInterval(tryDownloadQueue, RETRY_WAIT_TIME, sendResponse, additionalUrls, mmd, callback);
		}
		
	}
	
}

//We use a polling solution to retrieve documents from the queue. The idea is that because the majority of documents will have equivalent wait times
//we can increase efficiency and simplicity simply be checking back with the queue every (DEFAULT_INTERVAL) milliseconds.
function tryDownloadQueue(sendResponse, additionalUrls, mmd, callback){
	
	//loop backwards so we can remove/splice elements cleanly
	for( var i = downloadQueue.length - 1; i > 0; i-=1 ){
		
		var url = downloadQueue[i].url;
		var domain = getDownloadDomain(url);
		
			if( recentlyRequested.indexOf(domain) == -1 ){
				
                var requestWaitTime = downloadQueue[i].waitTime;
                
				downloadQueue.splice(i, 1);
				
				sendLoadRequest(url, sendResponse, additionalUrls, mmd, callback);
				recentlyRequested.push(domain);
				setTimeout(removeRecentlyRequested, requestWaitTime, domain);
		
			}
			
	}
	
	//Otherwise, the queue is empty so stop polling.
	if( downloadQueue.length === 0 ){
		clearInterval(downloadInterval);
		downloadInterval = null;
	}
	
}

function removeRecentlyRequested(domain){	
	var index = recentlyRequested.indexOf(domain);
  	recentlyRequested.splice(index, 1);	
}

function isUrlRedirect(response, sendResponse, additionalUrls, mmd, callback)
{
	//check <script> tags in DOM <head>
	//containing "window.opener = null; location.replace(url)"
	var head_elt = response.getElementsByTagName("head");
	
	if (head_elt.length > 0)
	{
		var script_elts = head_elt[0].getElementsByTagName("script");
		for (var i = 0; i < script_elts.length; i++)
		{
			var str_index = 0;
			if (script_elts[i].innerText)
			{
				var url = script_elts[i].innerText.match(/location.replace\(\"(.*)\"\)/i);
				if (url && url[1])
				{
					url[1] = url[1].replace(/\\/g, "");
					if (!additionalUrls)
					{	
						additionalUrls = [];
					}
					// precautionary conditions to avoid loops
					if (url[1] != response.URL)
					{
						if (additionalUrls.indexOf(response.URL) == -1)
							additionalUrls.push(response.URL);
						if (additionalUrls.indexOf(url[1]) == -1)
							loadWebpage(url[1], sendResponse, additionalUrls, mmd, callback);
						return true;
					}
				}
			}
		}
	}
	return false;
}
//Do the work of sending the load request.
//*This code is not my own, but rather was retrieved and updated from the existing download code* - Cameron
function sendLoadRequest(url, sendResponse, additionalUrls, mmd, callback)
{
	var xhr = new XMLHttpRequest();
	if (mmd.parser !== "xpath"){
		xhr.responseType = "blob";
		xhr.onreadystatechange = function() {
			if (xhr.readyState==4 && xhr.status==200){				
				if (xhr.response !== null){
					
					//confirm that our request returned something binary
					var mimeMMD = getDocumentMMbyMime(xhr.response.type);
					if (mimeMMD && mimeMMD.parser !== "xpath"){
						sendResponse(mmd, xhr.responseURL, callback, additionalUrls);					
					}
					else {
						//if we requested a binary but got something else
						console.log("requested a binary but response was something else or something we don't have a wrapper");	
					}
				}
				
			}
		};
	}
	else {
		xhr.responseType = "document";
		xhr.onreadystatechange = function() {
			if (xhr.readyState==4 && xhr.status==200){			
				if (xhr.response !== null){
					
					if (!isUrlRedirect(xhr.response, sendResponse, additionalUrls, mmd, callback))		{	
						var mmd = getDocumentMM(url);
						sendResponse(mmd, xhr.response, callback, additionalUrls);
					}
					
				}
				else {
					//if we requested a document but the response is null it might have been a binary file
					console.log("requested html page but response was something else");	
				}
			}
		};
	}
	
	xhr.open("GET", url, true);
	xhr.send();
}

