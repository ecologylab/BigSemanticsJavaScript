
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
    		return true;	// async response    		
	}
);

function loadWebpage(url, sendResponse)
{
//	var bgDocument = chrome.extension.getBackgroundPage().document;
//	
//	var iframe = bgDocument.createElement('iframe');
//	iframe.src = url;
//	bgDocument.body.appendChild(iframe);
//	
//	return bgDocument;
	
	var xhr = new XMLHttpRequest();
	xhr.responseType = "document";
	
	xhr.onreadystatechange = function() {
		
		if (xhr.readyState==4 && xhr.status==200)
	    {
			console.log(xhr.response);
			
			getMetaMetadata(url, xhr.response, sendResponse);
			
			//var doc = xhr.response;
			//var result = doc.evaluate("//h1[@class='fullname editable-group']/span", doc, null, XPathResult.STRING_TYPE, null);
			//console.log(result.stringValue);
	    }
	};
	
	xhr.open("GET", url, true);
	xhr.send();
}
