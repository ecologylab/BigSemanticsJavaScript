
chrome.tabs.onUpdated.addListener(
		function(tabId, changeInfo, tab) {
			if (changeInfo.url) {
				chrome.tabs.sendMessage(tabId, {url: changeInfo.url});
			}
		}
	);

function getMetaMetadata(url, document, sendResponse)
{
	var serviceUrl = "http://ecology-service.cs.tamu.edu/BigSemanticsService/mmd.json?url=" + encodeURIComponent(url);
	
	var xhr = new XMLHttpRequest();
	
	xhr.onreadystatechange = function() {
		
		if (xhr.readyState==4 && xhr.status==200)
	    {
			console.log(xhr.response);
			
			var resp = jQuery.parseJSON(xhr.response);
			var metadata = extractMetadata(document, resp.meta_metadata);
			console.log(JSON.stringify(metadata));
			
			// mice looks for a metadata collection response
			sendResponse({doc: metadata, mmd: resp});
	    }
	};
	
	xhr.open("GET", serviceUrl, true);
	xhr.send();
}

chrome.extension.onRequest.addListener(
	function(request, sender, sendResponse) {
    	if (request.load != null)
      		loadWebpage(request.load, sendResponse);
    	else if (request.loadOptions != null)
    		getOptions(sendResponse);
    	return true;	// async response    		
	}
);

function loadWebpage(url, sendResponse)
{
	var xhr = new XMLHttpRequest();
	xhr.responseType = "document";
	
	xhr.onreadystatechange = function() {
		
		if (xhr.readyState==4 && xhr.status==200)
	    {
			console.log(xhr.response);
			
			getMetaMetadata(url, xhr.response, sendResponse);
	    }
	};
	
	xhr.open("GET", url, true);
	xhr.send();
}

function generateUserId()
{
	var id = "";
    var charSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 5; i++ )
        id += charSet.charAt(Math.floor(Math.random() * charSet.length));

    return id;
}

function getUserId(cookie)
{
	var userid = null;
	if (cookie)
		userid = cookie.value;
	else
		usedid = generateUserId();
	
	localStorage["tweetBubbleUserId"] = userid;
	//console.log(localStorage.getItem('condition'));
}

function getStudyCondition(cookie)
{
	var studyCondition = null;
	if (cookie)
		studyCondition = cookie.value;
	else
		studyCondition = "mice";
	
	localStorage["tweetBubbleStudyCondition"] = studyCondition;
}

function getOptions(sendResponse)
{
	if (!localStorage["tweetBubbleUserId"])
	{
		chrome.cookies.get({url: "https://requestersandbox.mturk.com/hit_templates/921095354/preview",
			name: "tweetBubbleUserId"},	getUserId);
	}
	
	if (!localStorage["tweetBubbleStudyCondition"])
	{
		chrome.cookies.get({url: "https://requestersandbox.mturk.com/hit_templates/921095354/preview",
			name: "tweetBubbleStudyCond"},	getStudyCondition);
	}
	
	var checkAndSend = setInterval(function()
		{
			if (localStorage["tweetBubbleUserId"] && localStorage["tweetBubbleStudyCondition"])
			{
				clearInterval(checkAndSend);
				sendResponse({userid: localStorage["tweetBubbleUserId"], condition: localStorage["tweetBubbleStudyCondition"]});
			}
		}, 1000);
}