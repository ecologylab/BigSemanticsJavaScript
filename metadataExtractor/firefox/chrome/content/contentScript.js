/* Global Variables */
var settings = {};
var metadata = {};

window.addEventListener("load", function load(event){
    window.removeEventListener("load", load, false); //remove listener, no longer needed
    onWindowLoad();  
},false);

function onWindowLoad() {
    var appcontent = document.getElementById("appcontent");   // browser
    
    if(appcontent) {
	    appcontent.addEventListener("DOMContentLoaded", onPageLoad, true);
	}
}

function onPageLoad(aEvent) {
	var doc = aEvent.originalTarget;    
    
    if(doc.location != null && !endsWith(doc.location.href, ".js") && !endsWith(doc.location.href, ".css")) {
    	initDocumentMetadata(doc);
    }
}


function initDocumentMetadata(doc) {
		
	extractMetadataFromUrl(doc.URL, doc, function(data){
		metadata = data;
	
		//alert(getMetadataString(metadata));
		
		registerDragstart(doc, getMetadataString(metadata));
	});	
}

function registerDragstart(doc, data) {
	doc.addEventListener("dragstart", function(event) {
			    
	    event.dataTransfer.setData("application/json", data);
	});
}

function getMetadataString() {
	
	var data = {};
	data[metadata["mm_name"]] = getRawMetadata(metadata);
	return JSON.stringify(data);
	
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

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}