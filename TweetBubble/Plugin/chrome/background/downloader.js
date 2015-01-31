
chrome.extension.onRequest.addListener(
	function(request, sender, sendResponse) {
    	if (request.load != null)
      		loadWebpage(request.load, sendResponse);
    	else if (request.userInfo != null)
    		getUserInfo(request.userInfo, sendResponse);
    	
    	return true;	// async response    		
	}
);

chrome.tabs.onUpdated.addListener(
		function(tabId, changeInfo, tab) {
			if (changeInfo.url) {
				chrome.tabs.sendMessage(tabId, {url: changeInfo.url});
			}
		}
	);

function getMetaMetadata(url, document, sendResponse, additionalUrls)
{
	var serviceUrl = "http://ecology-service.cs.tamu.edu/BigSemanticsService/mmd.json?url=" + encodeURIComponent(url);
	
	var xhr = new XMLHttpRequest();
	
	xhr.onreadystatechange = function() {
		
		if (xhr.readyState==4 && xhr.status==200)
	    {
			//console.log(xhr.response);
			
			var resp = jQuery.parseJSON(xhr.response);
			var metadata = extractMetadata(document, resp.meta_metadata, additionalUrls);
			//console.log(JSON.stringify(metadata));
			
			// mice looks for a metadata collection response
			sendResponse({doc: metadata, mmd: resp});
	    }
	};
	
	xhr.open("GET", serviceUrl, true);
	xhr.send();
}

function loadWebpage(url, sendResponse, additionalUrls)
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

function isUrlRedirect(response, sendResponse, additionalUrls)
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
							loadWebpage(url[1], sendResponse, additionalUrls);
						return true;
					}
				}
			}
		}
	}
	return false;
}


function getUserInfo(username, sendResponse)
{
	var url = "https://twitter.com/" + username;
	// make conditional on success of loadWebpage?
	localStorage["username"] = username;
	loadWebpage(url, sendResponse);
}
