

function History()
{
	this.entryList = [];
	this.rootEntries = [];
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

History.prototype.buildEntry = function(entry, parent, depth){
	
	var historyEntryContainer = document.createElement('div');
	historyEntryContainer.className = 'historyEntryContainer';
	var historyEntry = document.createElement('div');
	historyEntry.className = "historyEntry";
	
	if (depth > 4){
		depth = 4;
	}
	var depthLevel = "level" + depth.toString();
	parent.classList.add(depthLevel);
	historyEntry.classList.add(depthLevel);
	historyEntry.setAttribute("draggable", "true");
	
	
	
	//Expand/collapse buttons
	
	
	var buttonContainer = document.createElement('div');
	buttonContainer.className = "buttonContainer";
	
	historyEntryContainer.appendChild(buttonContainer);
	if (entry.childEntries.length > 0){

		var entryCollapseButton = document.createElement('div');
		entryCollapseButton.className = 'entryCollapseButton ';
		
		entryCollapseButton.onclick = ExpSearchApp.expandCollapseEntryKids;
		var entryCollapseSymbol = document.createElement('div');
		entryCollapseSymbol.className = 'entryCollapseSymbol ';

		entryCollapseSymbol.style.display = 'block';
		var entryExpandSymbol = document.createElement('div');
		entryExpandSymbol.className = 'entryExpandSymbol ';
		entryExpandSymbol.style.display = 'none';
		
		
		entryCollapseButton.appendChild(entryExpandSymbol);
		entryCollapseButton.appendChild(entryCollapseSymbol);
		entryCollapseButton.onclick = ExpSearchApp.expandCollapseEntry;
		buttonContainer.appendChild(entryCollapseButton);
	}
	
	//Query
	var historyText = document.createElement('span');
	historyText.className = "entryQuery";
	historyText.classList.add(depthLevel);
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
	
	//Add search button
	
	var addSearchContainer = document.createElement('div');
	addSearchContainer.className = 'addSearchContainer';
	if(entry.compared){
		historyEntry.classList.add('compared');
		addSearchContainer.classList.add('compared');
	}
	addSearchContainer.innerHTML = "<i class='icon-plus' style='margin-left: 9px; margin-top: 7px;'></i>";
	var click = "ExpSearchApp.appendQuery(event, " + depth.toString() + ")";
	addSearchContainer.setAttribute("onclick", click);
	if (entry.active){
		historyEntry.className += " active";
		addSearchContainer.classList.add('active');
	}
	historyEntryContainer.appendChild(historyEntry);
	historyEntryContainer.appendChild(addSearchContainer);
	//If it has kids, draw them
	parent.appendChild(historyEntryContainer);
	for (var i = 0; i < entry.childEntries.length; i++){
		var childEntryContainer = document.createElement('div');
		childEntryContainer.className = "childEntryContainer";
		History.prototype.buildEntry(entry.childEntries[i], childEntryContainer, depth+1);
		parent.appendChild(childEntryContainer);
	}
	
	
	
}
History.prototype.addHistoryDisplay = function(){
	//Renders its historylist
	//Remove all current nodes
	
	
	while (currentExpSearch.history.container.hasChildNodes())
		currentExpSearch.history.container.removeChild(exploratorySearches.last().history.container.lastChild);
	
	var rootEntries = currentExpSearch.history.rootEntries;
	//Add in the new ones :)
	for (var i = 0; i < rootEntries.length; i++){
		
		var rootEntryContainer = document.createElement('div');
		rootEntryContainer.className = "rootEntryContainer";
		
		currentExpSearch.history.buildEntry(rootEntries[i], rootEntryContainer, 0);
		
		currentExpSearch.history.container.appendChild(rootEntryContainer);
	}
	
	
	
}

History.prototype.addEntry = function(entry){
	//adds entry to list, sorts list, and calls addHistoryDisplay
	
	this.sortRootEntryList();
	//Deactivates previous entries
	for (var i = 0; i < currentExpSearch.history.entryList.length; i++){
		currentExpSearch.history.entryList[i].active = false;
	}
	//If a child entry, adds to the correct parent
	if (entry.rootEntry){
		this.rootEntries.push(entry);
		this.entryList.unshift(entry);
	}
	else{
		this.entryList.push(entry);
	}
				
	this.addHistoryDisplay();
}

History.prototype.restoreEntry = function(entryID){
	//updates entry, sorts list, and calls addHistoryDisplay
	
	var entry;
	var previousQuery;		
	for (var i = 0; i < exploratorySearches.last().history.entryList.length; i++){
		if(exploratorySearches.last().history.entryList[i].active == true){
			previousQuery = exploratorySearches.last().history.entryList[i].query;
		}
		if (entryID == exploratorySearches.last().history.entryList[i].id){
			exploratorySearches.last().history.entryList[i].weight++;
			exploratorySearches.last().history.entryList[i].active = true;
			entry = exploratorySearches.last().history.entryList[i];
		}
		else{
			exploratorySearches.last().history.entryList[i].active = false;
		}
	}
	
	this.sortRootEntryList();
	this.addHistoryDisplay();
	//Put the correct searchSet in back
	
	exploratorySearches.last().SearchSets.splice(exploratorySearches.last().SearchSets.indexOf(entry.SearchSet), 1);
	exploratorySearches.last().SearchSets.push(entry.SearchSet);
	ExpSearchApp.displaySearchSet(exploratorySearches.last());
	//logging
	var query = currentExpSearch.getQueryForID(entryID);
	var depth = currentExpSearch.history.getSearchSetDepth(entryID);
	var time = new Date().getTime();
	eventObj = {
		revisit_history_entry: {
	  		timestamp: time,
	  		query: query,
	  		previous_query: previousQuery,
	  		depth: depth
	  	}
	 };
	 TheRecord.addEvent(eventObj);
}

History.prototype.getSearchSetDepth = function(searchSetID){
	for (var i = 0; i < this.entryList.length; i++){
		if (this.entryList[i].id == searchSetID){
			var depth = 0;
			var target = this.entryList[i];
			while(target.parentEntry != null){
				depth++;
				target = target.parentEntry;
			}
			return depth;
		}
	}	
}







History.prototype.sortRootEntryList = function(){
	//First, sorts ONLY entries that are roots
	
	exploratorySearches.last().history.rootEntries.sort(
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