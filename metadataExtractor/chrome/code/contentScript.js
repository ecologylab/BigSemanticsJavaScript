/* Global Variables */
var hasMetadata = false;
var metadata = {};
var settings = {};

// Retrieve the extension settings from the the background page.
chrome.extension.sendRequest({loadOptions: "all"}, function(response) {
  settings = response;
});

setTimeout(window.onload, 1000);

window.addEventListener("mouseup", function(event) { 
   injectContainer();
});

/** extractMetadata
 *  extract the metadata for this webpage and respond with the metadata and tabId
 */
window.onload = function() {
	if(!hasMetadata && settings != null) {
		hasMetadata = true;
		extractMetadataFromUrl(document.URL, function(data){
		    metadata = data;

		    if(settings.debugMetadata == "true") {
				console.log("Extracted metadata object:");
				console.log(metadata);
			}
					
			tagEachElementWithContainer();
			
		    if(metadata == null) {
		    	hasMetadata = false;
		    	setTimeout(window.onload, 1000);		    	
		    }
	    });
	}
}

function tagEachElementWithContainer() {
	var items = document.getElementsByTagName("*");
	for(i in items) {
		var item = items[i];
    	if(typeof(item) == "object")
        	item.setAttribute("metadata", getMetadataString());
	}
}

function injectContainer() {
	
	var oldFixtures = document.getElementsByClassName('injectedMetadata');
	
	for(var i = 0; i < oldFixtures.length; i++) {
	   var f = oldFixtures[i];
	   f.parentElement.removeChild(f);
	}
	
	var t = document.getSelection();
	
	if(t.type == "Range") {
		var injected = document.createElement('img');//span is a no go
		injected.setAttribute("metadata", getMetadataString());
		injected.setAttribute("class","injectedMetadata");
		
		var range = t.getRangeAt();
		range.insertNode(injected);
		document.getSelection().addRange(range);
	}
}

function getMetadataString() {
	
	if(settings.metadataInjection == "rich") {
		return JSON.stringify(metadata);
	}
	else if(settings.metadataInjection == "raw") {
		var data = {};
		data[metadata["mm_name"]] = getRawMetadata(metadata);
		return JSON.stringify(data);
	}
	return "{}";
}

function getRawMetadata(object) {
	var raw = {};
	
	for(var i in object) {
		var child = getValues(object[i]);
		raw[i] = child;
	}

	return raw;
}

function getValues(object) {	
	if(typeof(object.value) == "object") {
		return getRawMetadata(object.value);
	}
	else
		return object.value;
}