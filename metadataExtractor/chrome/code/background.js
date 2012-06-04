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
      					debugMmd: localStorage["debugMmd"],
      					debugMetadata: localStorage["debugMetadata"],
      					metadataInjection: localStorage["metadataInjection"]
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
	
	if (!options.debugMmd) {
	   	localStorage["debugMmd"] = "false";
	}
	
	if (!options.debugMetadata) {
	   	localStorage["debugMetadata"] = "false";
	}
	
	if (!options.metadataInjection) {
	   	localStorage["metadataInjection"] = "raw";
	}	  	
}

loadOptions();
