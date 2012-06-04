chrome.extension.onRequest.addListener(
	function(request, sender, sendResponse) {
    	if (request.loadOptions != null)
      		sendResponse(getOptions());
	}
);

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
  
  
function loadOptions() {
	var options = getOptions();
	
	if (!options.service) {
	   	localStorage["service"] = "infoComp";
	}
	
	if (!options.serviceUrl) {
	   	localStorage["serviceUrl"] = "http://localhost:2107/";
	}
	
	
	
	if (!options.metadataInjection) {
	   	localStorage["metadataInjection"] = "raw";
	}	
	
	if (!options.attributeInjection) {
	   	localStorage["attributeInjection"] = "true";
	}
	
	if (!options.selectionInjection) {
	   	localStorage["selectionInjection"] = "true";
	}
	
	
	
	if (!options.debugMmd) {
	   	localStorage["debugMmd"] = "false";
	}
	
	if (!options.debugMetadata) {
	   	localStorage["debugMetadata"] = "false";
	}
	
	  	
}

loadOptions();
