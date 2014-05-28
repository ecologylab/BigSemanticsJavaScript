

function History()
{
	this.entryList = [];
	this.container = document.getElementsByClassName('historyContainer')[0];
	
}

//maps search engines to urls. This lets us grab favicons
//Can't use search url's, because that would make the favicons appear after
//a history has been made, which would be a bit odd
function engineURL(engine){
	if (engine == "bing_search_xpath"){
		return MetadataLoader.getHost("http://www.bing.com");
	}
	else if (engine == "google_search"){
		return MetadataLoader.getHost("http://www.google.com");
	}
	
}

History.prototype.buildEntry = function(entry){
	
	var historyEntry = document.createElement('div');
	historyEntry.className = "historyEntry";
	historyEntry.setAttribute("draggable", "true");
	if (entry.active){
		historyEntry.className += " active";
	}
	

	//Favicon - I need to switch to a multi-search approach
	/*
	var favicon = document.createElement('img');
	favicon.className = "faviconICE";
	favicon.src = "https://plus.google.com/_/favicon?domain_url=" + MetadataLoader.getHost(history.location);
	historyEntry.appendChild(favicon);
	*/
	
	var engines = entry.SearchSet.engines;
	for (var i = 0; i < engines.length; i++){
		var favicon = document.createElement('img');
		favicon.className = "faviconICE";
		favicon.src = "https://plus.google.com/_/favicon?domain_url=" + engineURL(engines[i]);
		historyEntry.appendChild(favicon);
	}
	//Query
	var historyText = document.createElement('span');
	historyText.className = "entryQuery";
	historyText.innerHTML = entry.query;
		
	historyEntry.appendChild(historyText);
	var restoreCommand = "History.prototype.restoreEntry('";
	restoreCommand += entry.id;
	restoreCommand += "')";
	
	historyEntry.setAttribute("onClick", restoreCommand);
	historyEntry.setAttribute("ondragstart", "entryDragStart(event)")
	historyEntry.setAttribute("ondragend", "entryDragEnd(event)")
	historyEntry.setAttribute("id", entry.id);
	
	//Weight
	var weight = document.createElement('span');
	var weightLabel = document.createElement('span');
	weightLabel.className = 'weightLabel';
	weightLText = document.createTextNode("Weight:");
	weightLabel.appendChild(weightLText);
	weight.className = 'entryWeight';
	weightText = document.createTextNode(entry.weight);
	
	
	weight.appendChild(weightText);
	historyEntry.appendChild(weight);
	historyEntry.appendChild(weightLabel);
	
	if(entry.compared){
		historyEntry.classList.add('compared');
	}
	return historyEntry;
	
}

History.prototype.addHistoryDisplay = function(){
	//Renders its historylist
	//Remove all current nodes
	while (exploratorySearches.last().history.container.hasChildNodes())
		exploratorySearches.last().history.container.removeChild(exploratorySearches.last().history.container.lastChild);
	//Add in the new ones :)
	for (var i = 0; i < exploratorySearches.last().history.entryList.length; i++){
		exploratorySearches.last().history.container.appendChild(exploratorySearches.last().history.buildEntry(exploratorySearches.last().history.entryList[i]));
	}
}

History.prototype.addEntry = function(entry){
	//adds entry to list, sorts list, and calls addHistoryDisplay
	
	//check to see if entry is already in list

	this.sortEntryList();
	//A new entry always starts at the top of the list
	for (var i = 0; i < exploratorySearches.last().history.entryList.length; i++){
		exploratorySearches.last().history.entryList[i].active = false;
	}
	
	this.entryList.unshift(entry);
				
	this.addHistoryDisplay();
}

History.prototype.restoreEntry = function(entryID){
	//updates entry, sorts list, and calls addHistoryDisplay
	
	var entry;		
	for (var i = 0; i < exploratorySearches.last().history.entryList.length; i++){
		if (entryID == exploratorySearches.last().history.entryList[i].id){
			exploratorySearches.last().history.entryList[i].weight++;
			exploratorySearches.last().history.entryList[i].active = true;
			entry = exploratorySearches.last().history.entryList[i];
		}
		else{
			exploratorySearches.last().history.entryList[i].active = false;
		}
	}
	
	this.sortEntryList();
	this.addHistoryDisplay();
	//Put the correct searchSet in back
	
	exploratorySearches.last().searchResultSets.splice(exploratorySearches.last().searchResultSets.indexOf(entry.SearchSet), 1);
	exploratorySearches.last().searchResultSets.push(entry.SearchSet);
	ExpSearchApp.displaySearchSet(exploratorySearches.last());
}

History.prototype.sortEntryList = function(){
	exploratorySearches.last().history.entryList.sort(
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