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
	
	var mmd2 = getDocumentMM(url);
	if (extractWithService(mmd2, url)){
		window.postMessage({
			sender: "EXT", 
			type:"RET_MD_SERVICE", 
			url: url, 
			callback: callback, 
			reload: true, 
			source: null
		}, "*");
	}
	else{
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

function addAdditionalUrl(additionalUrls, newUrl)
{
	var doit	= additionalUrls.indexOf(newUrl) == -1;
	// precautionary conditions to avoid loops
	if (doit)
		additionalUrls.push(newUrl);
	return doit;	// if false, circular reference -- quit!
}

function isJsContentRedirect(xhr, sendResponse, additionalUrls, mmd, callback)
{
	//check <script> tags in DOM <head>
	//containing "window.opener = null; location.replace(url)"
	var response = xhr.response;
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
						{
							console.log("JsContentRedirect: " + response.URL + "\t-> " + url[1]);
							loadWebpage(url[1], sendResponse, additionalUrls, mmd, callback);
						}
						return true;
					}
				}
			}
		}
	}
	
	if(xhr.response.URL != xhr.responseURL){
	
		if (!additionalUrls)
		{	
			additionalUrls = [];
		}
		additionalUrls.push(xhr.response.URL);
		loadWebpage(xhr.responseURL, sendResponse, additionalUrls, mmd, callback);
		return true;
	}
	
	
	
	
	return false;
}

/*
 * For more info, see http://www.w3.org/TR/2006/WD-XMLHttpRequest-20060405/
 */
var READY_STATE_RECEIVING	= 3;	// before message body. all http headers have been received
var READY_STATE_LOADED		= 4;	// data transfer complete. body received.

//Do the work of sending the load request.
//*This code is not my own, but rather was retrieved and updated from the existing download code* - Cameron
function sendLoadRequest(url, sendResponse, additionalUrls, mmd, callback)
{
	var xhr = new XMLHttpRequest();
	xhr.first300	= true;
	//FIXME -- (1) responseType field should not be set based on our assumptions! use content-type (2) handling should be more consistent
	xhr.onreadystatechange = function() 
	{
		var	ok			= false;
		var status		= xhr.status;
		switch (xhr.readyState)
		{
			case READY_STATE_RECEIVING:
				if (!xhr.first300)
					break;
				xhr.first300	= false;
				if (status == 304)
				{
					//FIXME handle not modified, should read from cache here!!!
					ok		= true; // continue load for now
				}
				else if (status >= 300 && status < 400)
				{
					// handle redirects
					var newURL	= xhr.response.URL;
					if (newURL != url )
					{
						if (additionalUrls == null)
							addtionalUrls	= [];
						if (addAdditionalUrl(addtionalUrls, newURL))
						{	// redirect good
//								mmd	= getMMD(newURL);
							//FIXME see if the new mmd is more specific than the old!?
							console.log("sendLoadRequest() "+url + "\t-> " + newURL);
							xhr.first300	= true;
							url				= newURL;
							ok	= true;
						}			
					}
				}
				else
				{
					// check content type and make sure we can parse it; otherwise, abort!
					var contentType	= xhr.getResponseHeader("Content-Type");
					//remove any secondary types ('charset=')
					var firstSemicolonIndex = contentType.indexOf(';');
					
					if(firstSemicolonIndex > 0){
						contentType = contentType.slice(0, firstSemicolonIndex);
					}
					// we think its html
					if (contentType == null || contentType == "" || contentType =="text/html" || contentType == "text/plain" 
						|| contentType.indexOf("xml") != -1)  //TODO -- RSS, OPML, other types using xml?
					{
							if (mmd.parser == "xpath")
							{
								ok		= true;
							}
							else
							{ // ERROR
							}
					}
					else if (contentType == "application/javascript" || contentType == "application/json" || (contentType == "text/javascript"))
					{
							if (mmd.parser == "jsonpath")
							{
								ok		= true;
							}
							else
							{ // ERROR
							}
					}
					/*
					else if (contentType == "text/xml" || (contentType == "application/xml"))
					{
							if (mmd.parser == "xpath")
							{
								ok	= true;
							}
							else // includes parser="direct"
							{ // ERROR
							}
					} */
					else
					{	// something we don't currently parse!
						//TODO setup parse of JPEG headers here, using parser type "jpeg"
						if (contentType == "image/jpeg" && mmd.parser == "jpeg")
						{
						}
					}
				}
				if (!ok)
				{
					xhr.abort();
					console.log("Aborting as no meta-metadata: " + xhr.status + " " + xhr.location);
				}
			break;
			
			case READY_STATE_LOADED:
//		xhr.responseType = "blob";
//					xhr.responseType = "document";
				if (xhr.status==200 && xhr.response !== null)
				{							
					if (!isJsContentRedirect(xhr, sendResponse, additionalUrls, mmd, callback))		
					{	// normal case
						var mmd1 = getDocumentMM(xhr.response.URL);
						simplGraphCollapse({mmdObj: mmd1});
						sendResponse(mmd1, xhr.response, callback, additionalUrls);
					}
				}
			break;
		}
	};
	
	xhr.open("GET", url, true);
	xhr.send();
}

