/* Global Variables */
var settings = {};
var metadata = {};

// Adds the event listener so that onWindowLoad() is called whenever the window loads.
window.addEventListener("load", function load(event){
    window.removeEventListener("load", load, false); //remove listener, no longer needed
    onWindowLoad();  
},false);

/** onWindowLoad
 * When the window loads get the target document and add the DOMLoaded event.
 */
function onWindowLoad() {
	
	// get the correct DOM object, Firefox specific
    var appcontent = document.getElementById("appcontent");  
    
    if(appcontent) {
	    appcontent.addEventListener("DOMContentLoaded", onPageLoad, true);
	}
}

/** onPageLoad
 * Extracts the metadata once the DOM has loaded
 * @param aEvent, the DOM loaded event
 */
function onPageLoad(aEvent) {
	var doc = aEvent.originalTarget;    
    
    if(doc.location != null && !endsWith(doc.location.href, ".js") && !endsWith(doc.location.href, ".css")) {
    	initDocumentMetadata(doc);
    }
}

/** initDocumentMetadata
 * Loads the app settings and calls extractMetadataFromURL in mmdDomHelper.js
 * @param doc, the target DOM
 */
function initDocumentMetadata(doc) {
	
	// load add-on preferences
	var prefs = Components.classes["@mozilla.org/preferences-service;1"]  
         			.getService(Components.interfaces.nsIPrefService)  
         			.getBranch("extensions.extractor."); 
         				
	settings = 	{
      				service: prefs.getCharPref("service"),
      				serviceUrl: prefs.getCharPref("serviceUrl"),
      				metadataInjection: prefs.getCharPref("metadataInjection"),
      				dragInjection: prefs.getBoolPref("dragInjection"),
      				attributeInjection: "false",
      				selectionInjection: "false",
      				debugMmd: "false",
      				debugMetadata: "false"
      			};
      			
     if(settings.service == "infoComp")
     	settings.serviceUrl = "http://localhost:2107/";
     else if(settings.service == "ecologyLab") // needs changing
     	settings.serviceUrl = "http://128.194.143.75:8080/ecologylabSemanticService/mmd?url=";
      				
	extractMetadataFromUrl(doc.URL, doc, function(data){
		metadata = data;
		
		if(settings.dragInjection)
			registerDragstart(doc, getMetadataString(metadata));
	});	
}

/** registerDragstart
 * Sets the dragstart function to add the metadata to the dataTransfer object as "application/json"
 * @param doc, the target DOM
 * @param data, the metadata JSON string
 */
function registerDragstart(doc, data) {
	doc.addEventListener("dragstart", function(event) {			    
	    event.dataTransfer.setData("application/json", data);
	});
}

/** getMetadataString
 * Converts the metadata object into a JSON string.
 * @return metadata string
 */
function getMetadataString() {	
	var data = {};
	data[metadata["mm_name"]] = getRawMetadata(metadata);
	return JSON.stringify(data);	
}

/** getRawMetadata
 * Converts the full metadata object to a raw metadata object which only 
 * contains key / value pairs.
 * @param object, metadata or  metadata field object
 * @return the raw metadata object
 */
function getRawMetadata(object) {
	var raw = {};
	
	for(var i in object) {
		var child = getValues(object[i]);
		raw[i] = child;
	}

	return raw;
}

/** getValues
 * Extracts the value or values from a metadata field object.
 * @param object, metadata field object
 * @return value of the field as a simple string or as a raw metadata object
 */
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