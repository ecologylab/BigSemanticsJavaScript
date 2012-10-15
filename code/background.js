/** Chrome extension message listener
 * Registers a listener for a request contains 'loadOptions'
 * replies with the extension's options.
 * This is needed because in a Chrome extension the content scripts cannot access localStorage.
 */
chrome.extension.onRequest.addListener(
	function(request, sender, sendResponse) {
    	if (request.loadOptions != null)
      		sendResponse(getOptions());
//      	if (request.test != null)
//      		sendResponse(test());
	  	if (request.append_to_log != null)
      		sendResponse(append_to_log(request.append_to_log));
	}
);


var HIST = "hister";

function getHist()
{
	if(!localStorage.hasOwnProperty(HIST))
	{
		localStorage[HIST] = JSON.stringify({});
	}
	return JSON.parse(localStorage[HIST]);
}

function setHist(hist)
{
	localStorage[HIST] = JSON.stringify(hist);
}

function visitIdToString(id)
{
	var hist = getHist();
	var retString = "";
	var item = hist[id+""];
	while(item)
	{
		retString = item.title+"->"+retString;
		
		item = hist[item.parent_id];
	}
	return retString;
}

function addVisitAction(visit_item, history_item)
{
	

	//localStorage[HIST] = localStorage[HIST] + tt+"\n";
	//return localStorage["HIST"];
	//*/
	var combined = Object();
	combined.id = history_item.visitId;
	combined.timestamp = visit_item.visitTime;
	combined.url = visit_item.url;
	combined.title = visit_item.url;
	combined.transition = history_item.transition;
	combined.parent_id = history_item.referringVisitId;

	//console.log("adding visit item...");
	//console.log(combined);
	var hist = getHist();
	hist[combined.id] = combined;
	setHist(hist);
	append_to_log(combined, "page_loaded");
}


chrome.history.onVisited.addListener(
	function(visit_item) {
		//addVisitAction(visit_item);
//		append_to_log("FROM history item:"+visit_item.title+" at "+visit_item.url);
//			chrome.history.getVisits(visit_item);
//	     append_to_log("END"); // here you can access it.	
//console.log ("In the log...");
//console.log (visit_item.url);
chrome.history.getVisits({url:visit_item.url}, function(dddd)
{
	//console.log("results?");
	//console.log(dddd);
	////console.log("most recent");
	var last = "";
	for(i in dddd)
	    last = dddd[i]; 
	//console.log("start ..");
	//console.log(visit_item);
	//console.log(last);
	addVisitAction(visit_item,last);
	console.log(visitIdToString(last.visitId));
	//console.log("end ..");
	
});
      //console.log(visit_item);
	}
);




function test()
{
	console.log("I am returning the number 15");
	return 15;
}

function append_to_log(item, type)
{
	if(!localStorage.hasOwnProperty("log_file"))
	{
		localStorage["log_file"] = "";
	}
	var uid = "user21";
	var note = "This is a note about the study and conditions."
	var logstamp = new Date().getTime();
	var log_me = JSON.stringify( {uid:uid, note:note, timestamp: logstamp, type:type, item:item} );
	localStorage["log_file"] = localStorage["log_file"] + log_me+"\n";
	return localStorage["log_file"];
}

/** getOptions
 * Builds a simple object representing the user preferences for the extension.
 * @return an object holding the preference values
 */
function getOptions() {
	var options = 	{
						logs: localStorage['log_file'],
						hist: localStorage[HIST]
      					// service: localStorage["service"],
      					// serviceUrl: localStorage["serviceUrl"],
      					// metadataInjection: localStorage["metadataInjection"],
      					// attributeInjection: localStorage["attributeInjection"],
      					// selectionInjection: localStorage["selectionInjection"],
      					// debugMmd: localStorage["debugMmd"],
      					// debugMetadata: localStorage["debugMetadata"]      					
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
