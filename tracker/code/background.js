/** Chrome extension message listener
 * Registers a listener for a request contains 'loadOptions'
 * replies with the extension's options.  Has a function form implementing 
 * This is needed because in a Chrome extension the content scripts cannot access localStorage.
 */
chrome.extension.onRequest.addListener(
	function(request, sender, sendResponse) {
    	if (request.loadOptions != null)
      		sendResponse(getOptions());
//      	if (request.test != null)
//      		sendResponse(test());
		if (request.updateVisitWithTitle != null)
		      updateVisitWithTitle(request.url,request.title);
	  	if (request.append_to_log != null)
      		sendResponse(append_to_log(JSON.parse(request.item), request.type));
	}
);

var last_updated = new Date().getTime();
var last_url = "";
var last_title = "";

var waitingCombinedItems = {};


function logSelectedTabWindowUrl()
{
	chrome.windows.getLastFocused({populate:true}, function(with_tabs)
	{
		//console.log("With tabs:");
		//console.log(with_tabs);
		for(var tab in with_tabs.tabs)
		{
			tab = with_tabs.tabs[tab];
			//console.log(tab);
			if(tab.active && tab.selected)
			{
				
				if(last_url != tab.url)
				{
					var new_updated = new Date().getTime();
					var duration_seconds = (new_updated-last_updated) / 1000;
					if(last_url != "")
					{
						//console.log(last_url + " from "+last_updated + " to " + new_updated + " a totla of " + duration_seconds + " seconds");
						append_to_log({url:last_url, title:last_title, start:last_updated, end:new_updated, duration_seconds: duration_seconds},"tab_focus_event");
					}
					last_url = tab.url;
					last_updated = new_updated;
					last_title = tab.title;
				}
			}
		}
	}
);}

chrome.tabs.onActivated.addListener(function(activeInfo) {
});

chrome.tabs.onHighlighted.addListener(function(activeInfo) {
	logSelectedTabWindowUrl();
});

chrome.windows.onFocusChanged.addListener(function(windowId) {
	logSelectedTabWindowUrl();
});

chrome.tabs.onUpdated.addListener(function( tabId , info ) {
    if ( info.status == "complete" ) {
      // console.log("Updated!!!");
       //console.log(info);
       chrome.tabs.get(tabId,
       	function(tab)
   		{
   			//console.log("tab is");
   			//console.log(tab);
   			updateVisitWithTitle(tab.url,tab.title);
   		}
       );
    }
});


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

function combinedToHistoryCrumb(combined)
{
	var history_crumb = Object();
	history_crumb.timestamp = new Date().getTime();
	history_crumb.source = {title:combined.title , url:combined.url}
	history_crumb.parents = [];
	
	//add parents
	var hist = getHist();
	var retString = "";
	var item = hist[combined.parent_id];
	while(item)
	{
		history_crumb.parents.push({title:item.title, url: item.url});
		item = hist[item.parent_id];
	}
	return history_crumb;
}

function addVisitAction(visit_item, history_item)
{
	var combined = Object();
	combined.id = history_item.visitId;
	combined.timestamp = visit_item.visitTime;
	combined.url = visit_item.url;
	combined.title = visit_item.title;
	combined.transition = history_item.transition;
	combined.parent_id = history_item.referringVisitId;

	var hist = getHist();
	hist[combined.id] = combined;
	setHist(hist);
	waitingCombinedItems[combined.url] = combined;
	//append_to_log(combined, "page_load_raw");
	//append_to_log(combinedToHistoryCrumb(combined),"page_load_crumb");
}

function updateVisitWithTitle(url, title)
{
	if(waitingCombinedItems[url])
	{
		waitingCombinedItems[url].title = title;
		var combined = waitingCombinedItems[url];
		var hist = getHist();
		hist[combined.id] = combined;
		setHist(hist);
		append_to_log(combined, "page_load_raw");
		append_to_log(combinedToHistoryCrumb(combined),"page_load_crumb");
	}
}


chrome.history.onVisited.addListener(
	function(visit_item) {
		chrome.history.getVisits({url:visit_item.url}, function(dddd)
		{
			var last = "";
			for(i in dddd)
			    last = dddd[i]; 
			addVisitAction(visit_item,last);
		});
      logSelectedTabWindowUrl();
	}
);


//from http://www.mediacollege.com/internet/javascript/number/random.html
function randomString() {
	var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
	var string_length = 8;
	var randomstring = '';
	for (var i=0; i<string_length; i++) {
		var rnum = Math.floor(Math.random() * chars.length);
		randomstring += chars.substring(rnum,rnum+1);
	}
	return randomstring;
}


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
	options = getOptions();
	if(options.is_on=='no')
	    return "";
	var uid = options.uid;
	var note = options.note;
	var logstamp = new Date().getTime();
	var hash = randomString();
	var log_me = JSON.stringify( {uid:uid, note:note, timestamp: logstamp, hash:hash, type:type, item:item} );
	localStorage["log_file"] = localStorage["log_file"] + log_me+"\n";
	return localStorage["log_file"];
}

/** getOptions
 * Builds a simple object representing the user preferences for the extension.
 * @return an object holding the preference values
 */
function initOptionsIfNull()
{
	if(!localStorage['log_file'])
		localStorage['log_file'] = "";
	if(!localStorage[HIST])
		getHist();
	if(!localStorage['is_on'])
		localStorage['is_on'] ='yes';
	if(!localStorage['uid'])
		localStorage['uid'] = "";
	if(!localStorage['note'])
		localStorage['note'] = ""; 
}
function getOptions() {
	initOptionsIfNull();
	var options = 	{
						logs: localStorage['log_file'],
						is_on: localStorage['is_on'],
						uid: localStorage['uid'],
						note: localStorage['note'],    					
      				};
     return options;
}

function clearLogFile()
{
	localStorage['log_file'] = "";
}

function clearAll()
{
	delete localStorage['log_file'];
	delete localStorage['is_on'];
	delete localStorage['uid'];
	delete localStorage['note'];
	delete localStorage[HIST];
}

function setOptions(opts)
{
	for(i in opts)
	{
		//console.log("set "+i+" to "+opts[i])
		localStorage[i] = opts[i];
	}
	getOptions();
}
  
/** loadOptions
 * Loads the current preferences,
 * if none are set then they set to the default.
 */
function loadOptions() {
	var options = getOptions();
}

loadOptions();
