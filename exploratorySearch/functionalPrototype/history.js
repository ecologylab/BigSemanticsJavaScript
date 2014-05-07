/**
 * Contains the functions that create History objects and renders the history display for the functional prototype
 */


var History = {};
History.historyList = [];

function logHowdy(){
	console.log("Hellowdy");
}
function Entry(query, location, engine, isactive){
	this.query = query;
	this.location = location;
	this.engine = engine;
	this.weight = 1;
	this.active = true;

	if (isactive != null){
		this.active = isactive;
	}
	
}
/*
 * Adds whatever the current search query is to the history
 * by scanning the page for a query, location, and search engine data
 */
History.addHistory = function(query, location, engine){
	

	var history = new Entry(query, location, engine);
	
	History.display(history);
	//return history;
}

function getByValue(arr, attr, value) {

	  for (var i=0; i < arr.length;  i++) {
	    if (arr[i].attr == value) return arr[i];
	  }
	}
/*
 *	Here be the ways we take an entry from the history and restore it, gloriously, to the search results container
 */

//I assume that we want the item to remain in the history after being restored
History.restoreEntry = function (entryNode){
	
	
	var content = document.getElementById("content");
	var url = entryNode.getAttribute("location");
	
	var restoredEntry = new Entry(null, url);
	History.display(restoredEntry);
	
	Prototype.addMetadataDisplay(content, url, true);
	
}


/*
 *  Does the good work of placing histories on the page. 
 *  Adds history to list of histories, sorts the list, and then displays in sorted order
 *  Currently sorts in alphabetical order as a proof-of-concept
 */
History.sortHistory = function(){
	History.historyList.sort(
		function(a,b) {
			if(a.weight > b.weight) return -1;
			if(a.weight < b.weight) return 1;
			/*
			if(a.query < b.query) return -1;
			if(a.query > b.query) return 1;
			*/
			return 0;
			
		} 
	);
}

History.buildHistoryEntry = function(history){
	var historyEntry = document.createElement('div');
	historyEntry.className = "historyEntry";
	if (history.active){
		historyEntry.className += " active";
	}
	
	
	
	//Favicon
	var favicon = document.createElement('img');
	favicon.className = "faviconICE";
	favicon.src = "https://plus.google.com/_/favicon?domain_url=" + MetadataLoader.getHost(history.location);
	historyEntry.appendChild(favicon);
	//Query
	historyText = document.createTextNode(history.query);
	historyEntry.appendChild(historyText);
	
	historyEntry.setAttribute("onClick", "History.restoreEntry(this)");
	historyEntry.setAttribute("location", history.location);
	//Weight
	var weight = document.createElement('span');
	var weightLabel = document.createElement('span');
	weightLabel.className = 'weightLabel';
	weightLText = document.createTextNode("Weight:");
	weightLabel.appendChild(weightLText);
	weight.className = 'entryWeight';
	weightText = document.createTextNode(history.weight);
	
	
	weight.appendChild(weightText);
	historyEntry.appendChild(weight);
	historyEntry.appendChild(weightLabel);
	
	
	
	
	return historyEntry;
	
}

History.display = function (history){
	//Need more code to prevent duplicate entries
	var pushEntry = true;		
	for (var i = 0; i < History.historyList.length; i++){
		if (history.location == History.historyList[i].location){
			History.historyList[i].weight++;
			History.historyList[i].active = true;
			pushEntry = false;
		}
		else{
			History.historyList[i].active = false;
		}
	}
	History.sortHistory();

	
	if (pushEntry){
		History.historyList.unshift(history);
	}				
	
	
	
	var historyParent = document.getElementsByClassName('historyContainer')[0];
	
	//Remove previous history
	while (historyParent.hasChildNodes())
		historyParent.removeChild(historyParent.lastChild);
	

	
	for (var i = 0; i < History.historyList.length; i++){
		historyParent.appendChild(History.buildHistoryEntry(History.historyList[i]));
	}
	
	
}
