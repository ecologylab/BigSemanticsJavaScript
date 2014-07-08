

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
	
	if (entry.childEntries.length > 0){
		var buttonContainer = document.createElement('div');
		buttonContainer.className = "buttonContainer";
		
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
		historyEntryContainer.appendChild(buttonContainer);
	}
	else{
		historyEntryContainer.style.marginLeft = '20px';
	}
	
	
	//Favicons
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
	addSearchContainer.innerHTML = "<i class='icon-plus' style='margin-left: 9px; margin-top: 8px;'></i>";
	var click = "ExpSearchApp.newEntrySearch(event, " + depth.toString() + ")";
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
	
	
	while (exploratorySearches.last().history.container.hasChildNodes())
		exploratorySearches.last().history.container.removeChild(exploratorySearches.last().history.container.lastChild);
	
	var rootEntries = exploratorySearches.last().history.rootEntries;
	//Add in the new ones :)
	for (var i = 0; i < rootEntries.length; i++){
		
		var rootEntryContainer = document.createElement('div');
		rootEntryContainer.className = "rootEntryContainer";
		
		exploratorySearches.last().history.buildEntry(rootEntries[i], rootEntryContainer, 0);
		
		exploratorySearches.last().history.container.appendChild(rootEntryContainer);
	}
	
	
	
}

History.prototype.addEntry = function(entry){
	//adds entry to list, sorts list, and calls addHistoryDisplay
	
	this.sortRootEntryList();
	//Deactivates previous entries
	for (var i = 0; i < exploratorySearches.last().history.entryList.length; i++){
		exploratorySearches.last().history.entryList[i].active = false;
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
	
	this.sortRootEntryList();
	this.addHistoryDisplay();
	//Put the correct searchSet in back
	
	exploratorySearches.last().SearchSets.splice(exploratorySearches.last().SearchSets.indexOf(entry.SearchSet), 1);
	exploratorySearches.last().SearchSets.push(entry.SearchSet);
	ExpSearchApp.displaySearchSet(exploratorySearches.last());
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