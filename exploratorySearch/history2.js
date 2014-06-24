
function History = ()
{
	this.historyList = [];
	this.container = document.getElementsByClassName('historyContainer')[0];
	
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
History.prototype.addHistoryEntry = function(query, location, engine){
	

	var historyEntry = new Entry(query, location, engine);
	
	History.prototype.display(history);
	
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
History.prototype.restoreEntry = function (entryNode){
	
	
	var content = document.getElementById("content");
	var url = entryNode.getAttribute("location");
	
	var restoredEntry = new Entry(null, url);
	History.prototype.buildAndDisplay(restoredEntry);
	
	ExpSearchApp.addMetadataDisplay(content, url, true);
	
}


/*
 *  Does the good work of placing histories on the page. 
 *  Adds history to list of histories, sorts the list, and then displays in sorted order
 *  Currently sorts in alphabetical order as a proof-of-concept
 */
History.prototype.sortHistory = function(){
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

History.prototype.buildHistoryEntry = function(history){
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

History.prototype.buildAndDisplay = function (entry){
	//Need more code to prevent duplicate entries
	var pushEntry = true;		
	for (var i = 0; i < this.historyList.length; i++){
		if (entry.location == this.historyList[i].location){
			this.historyList[i].weight++;
			this.historyList[i].active = true;
			pushEntry = false;
		}
		else{
			this.historyList[i].active = false;
		}
	}
	this.sortHistory();

	
	if (pushEntry){
		this.historyList.unshift(entry);
	}				

	while (this.container.hasChildNodes())
		this.container.removeChild(this.container.lastChild);
	

	
	for (var i = 0; i < this.historyList.length; i++){
		this.container.appendChild(this.buildHistoryEntry(t.historyList[i]));
	}
	
	
}

 * 
*/
