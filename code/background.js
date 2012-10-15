/** Chrome extension message listener
 * Registers a listener for a request contains 'loadOptions'
 * replies with the extension's options.
 * This is needed because in a Chrome extension the content scripts cannot access localStorage.
 */
chrome.extension.onRequest.addListener(
	function(request, sender, sendResponse) {
    	if (request.loadOptions != null)
      		sendResponse(getOptions());
      	if (request.test != null)
      		sendResponse(test());
	  	if (request.append_to_log != null)
      		sendResponse(append_to_log(request.append_to_log));
	}
);

chrome.history.onVisited.addListener(
	function(history_item) {
		append_to_log("FROM history item:"+history_item.title+" at "+history_item.url);
		chrome.history.getVisits(history_item, function(visitItems){
        append_to_log("FROM the refer id" + visitItems[0].referringVisitId); // here you can access it.
});

	}
);




function test()
{
	console.log("I am returning the number 15");
	return 15;
}

function append_to_log(tt)
{
	/*
	if (! log in localStorage) {
		localStorage['logg'] = "SOMETHING";
	}
	
	localStorage['logg'] += "Entry: "+tt;

	return localStorage.logg;
	*/
	if(!localStorage.hasOwnProperty("log_file"))
	{
		localStorage["log_file"] = "START...";
	}
	localStorage["log_file"] = localStorage["log_file"] + tt+"\n";
	return localStorage["log_file"];
}

/** getOptions
 * Builds a simple object representing the user preferences for the extension.
 * @return an object holding the preference values
 */
function getOptions() {
	var options = 	{
      					service: localStorage["service"],
      					serviceUrl: localStorage["serviceUrl"],
      					metadataInjection: localStorage["metadataInjection"],
      					attributeInjection: localStorage["attributeInjection"],
      					selectionInjection: localStorage["selectionInjection"],
      					debugMmd: localStorage["debugMmd"],
      					debugMetadata: localStorage["debugMetadata"]      					
      				};
     return options;
}
  
/** loadOptions
 * Loads the current preferences,
 * if none are set then they set to the default.
 */
function loadOptions() {
	var options = getOptions();
	
	/** Meta-Metadata Service **/
	
	if (!options.service) {
		
		// Default MMD service 
	   	localStorage["service"] = "infoComp";
	}
	
	if (!options.serviceUrl) {
	   	
	   	// Default MMD service URL
	   	localStorage["serviceUrl"] = "http://localhost:2107/";
	}
	
	/** Metadata Injection **/
	
	if (!options.metadataInjection) {
		
		// Default Metadata injection format
		// raw - just the metadata values
		// all - all metadata field information 
	   	localStorage["metadataInjection"] = "raw";
	}	
	
	if (!options.attributeInjection) {
		
		// Default Metadata attribute injection
		// attribute injections causes the extracted metadata to be
		// added to every HTML tag in the target DOM
		// as a new attribute "metadata=<value>"
		// where the value is the escaped JSON string of the metadata		
	   	localStorage["attributeInjection"] = "true";
	}
	
	if (!options.selectionInjection) {
		
		// Default Metadata selection injection
		// selection injections causes the extracted metadata to be
		// injected into an html selection range as an <img> tag with
		//  n attribute "metadata=<value>"
		// where the value is the escaped JSON string of the metadata
	   	localStorage["selectionInjection"] = "true";
	}
	
	/** Debug Statements **/
	
	if (!options.debugMmd) {
		
		// Default debug print option
		// debugMmd - prints the received MMD from the MMD service
	   	localStorage["debugMmd"] = "false";
	}
	
	if (!options.debugMetadata) {
		
		// Default debug print option
		// debugMetadata - prints the extracted metadata
	   	localStorage["debugMetadata"] = "false";
	}	  	
}

// loadOptions should be called whenever Chrome is started.
loadOptions();
