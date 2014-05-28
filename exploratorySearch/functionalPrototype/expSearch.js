var ExpSearchApp = {};
//maximum number of results to show
var MAX_RESULTS = 5;
var exploratorySearches = [];

/*
 * Collection of functions to render 
 */

/*
 * Eventually, this should also save the open/closed state of all metadata in the enclosed search
 * Additionally, mechanisms will be added to sort history based on various criteria
 */

/*
 * http://stackoverflow.com/questions/2959642/how-to-make-a-valid-string-for-xml-in-javascript
 */
function encodeXml(s) {
    return (s
        .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
        .replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\t/g, '&#x9;').replace(/\n/g, '&#xA;').replace(/\r/g, '&#xD;')
    );
}
  
/*
 * Creates ExpSearchApp object and renders it.  
 * Unlike the mice function, we assume that there are either 0 or 1 
 * renderings to initialize
 * 
 * For now, we're just going to let it start with ONE engine 
 */
ExpSearchApp.isQuery = function(metadataField){
	if (!metadataField){
		return false;
	}
	else if (metadataField['name'] == 'query'){
		return true;
	}
	
	return false;
}

ExpSearchApp.isLocation = function (metadataField){
	if (!metadataField){
		return false;
	}
	else if (metadataField['name'] == 'location'){
		return true;
	}
	
	return false;
}
ExpSearchApp.isResult = function (metadataField){
	
	if (!metadataField){
		return false;
	}
	else if (metadataField['name'] == 'search_results'){
		return true;
	}
	
	return false;
}
ExpSearchApp.isRelatedSearch = function(metadataField){
	if(!metadataField){
		return false;
	}
	else if(metadataField['name'] == 'related_searches'){
		return true;
	}
	return false;
}
ExpSearchApp.initialize = function(){
	
	var expRenderings = document.getElementsByClassName('expRendering');
	for (var i = 0; i < expRenderings.length; i++){
		var query = expRenderings[i].getElementsByTagName('a')[0].getAttribute("query");
		var location = expRenderings[i].getElementsByTagName('a')[0].href;
		var engines = expRenderings[i].getElementsByTagName('a')[0].getAttribute("engine");
		location = encodeXml(location);
		
		//Get search md from debi. Use it to build search results.

		MetadataLoader.render(ExpSearchApp.initialRender, expRenderings[i], location, true, null);
				
	}
	
}

function toGoogleUrl(searchString){
    
    
	var terms = searchString.split(" ");
	var url = "http://www.google.com/search?q=";
	for (var x in terms){
		url += terms[x];
		url += "+";
	}
    encodeURI(url);
    console.log(url);
    return url;
}

function toBingUrl(searchString){
    
    var terms = searchString.split(" ");
	var url = "http://www.bing.com/search?q=";
	for (var x in terms){
		url += terms[x];
		url += "+";
	}
    encodeURI(url);
    console.log(url);
    return url;
}
function toACMUrl(searchString){
    var url = "http://dl.acm.org/results.cfm?query=";

    
    var terms = searchString.split(" ");
	var url = "http://dl.acm.org/results.cfm?query=";
	for (var x in terms){
		url += terms[x];
		url += "+";
	}
    encodeURI(url);
    console.log(url);
    return url;
}

function toHTTPS(url){
	/*
	var patt = /https?/i;
	url = url.replace(patt, "https");
	*/
	return url;
}


/*
 *	Goes through the metadataFields returned and extractions the information needed to build a 
 *	search object
 *
 *  To-do: add support for storing title
 */

ExpSearchApp.searchFromMetadata = function(metadataFields){
	
	/*
	 * Builds display for a search and adds it to the container for the searchResultSet
	 */
	
	var query;
	var result_locations = [];
	var type;
	var search_location;
	var search;
	console.log(metadataFields);
	for(var i = 0; i < metadataFields.length; i++)
	{
		
		 console.log(i);
		var metadataField = metadataFields[i];
		if(ExpSearchApp.isQuery(metadataField)){
			query = metadataField['value'];
			type = metadataField['parentMDType'];
		}
		
		else if (ExpSearchApp.isLocation(metadataField)){
			search_location = metadataField['value'];
		}
		
		else if (ExpSearchApp.isResult(metadataField)){
			
			if (metadataField.parentMDType == "google_search"){
				for (var k = 0; k < metadataField.value.length && k < MAX_RESULTS; k++){
					console.log(metadataField.value[k].value[0].value[0].navigatesTo);
					result_locations.push(toHTTPS(metadataField.value[k].value[0].value[0].navigatesTo));
					
				}
			}
			else{
				for (var j = 0; j < metadataField.value.length && j < MAX_RESULTS; j++){
					console.log(metadataField.value[j].value[0].navigatesTo);
					result_locations.push(toHTTPS(metadataField.value[j].value[0].navigatesTo));
					
				}
			}

			if(result_locations.length > 0 && query != null){
				
				/*Uses the above information to start constructing
				 * searchResults, searches, and a searchResultSet
				 */
				var searchResults = [];
				for(var k = 0; (k < result_locations.length)  && k <MAX_RESULTS; k++){
					var result = new SearchResult(result_locations[k], type);
					searchResults.push(result);
				}
				search = new Search(query, type, search_location, result_locations, searchResults);
					
				
			}
		
		}
		else if (ExpSearchApp.isRelatedSearch(metadataField)){
			if (search != null){
				var rQueries = [];
				for (var k = 0; k < metadataField.value.length; k++){
					rQueries.push(metadataField.value[k].value[0].value);
				}
				console.log(rQueries);
				search.relatedQueries = rQueries;
			}
		}
		
	}
	
	return search;
}

/*
 * Adds new searchResultSet to ExpSearch, redraws searchRenderings and History
 */
ExpSearchApp.addQuery = function(query, engineList){
	console.log(engineList);
	if (exploratorySearches.last() == null){
		return "error";
	}
	var searchSet;
	var urlList = [];
	console.log(query);
	console.log(engineList);
	
	/*
	 * I'm still in need of a good general solution. For now, the code
	 * checks for google and acm searches and manually creates the appropriate URL
	 */
	for (var i = 0; i < engineList.length ; i++){
		
       
    	if (engineList[i]=="google_search"){
    		url = toGoogleUrl(query);
    	}
    	else if (engineList[i] == 'bing'){
    		url = toBingUrl(query);
    		engineList[i] = "bing_search_xpath";
    	}
    	else if (engineList[i] == "acm"){
    		url = toACMUrl(query);
    	}
    	
    	urlList.push(url);
    
	}
	
	var visual = document.createElement('div');
	visual.className = "metadataContainer";
	//If only one search engine is used, no special logic is needed to handle history conflicts
	if(urlList.length == 1){
		MetadataLoader.render(ExpSearchApp.renderNewSingleSearch, visual, urlList[0], true, null);
	}
	//With multisearch, we need to check before rendering if the searchSet has already been looked up
	else{
		
		engineList.sort();
		console.log(engineList);
		for (var i = 0; i < exploratorySearches.last().searchResultSets.length; i++){
			if (exploratorySearches.last().searchResultSets[i].sameSet(query, engineList)){
				exploratorySearches.last().history.restoreEntry(exploratorySearches.last().searchResultSets[i].id);
				return;
			}
			
		}
		var ss = new SearchResultSet(query, []);
		ss.engines = engineList;
		exploratorySearches.last().addSearchSet(ss);
		ss.engines = [];
		for (var i = 0; i < engineList.length ; i++){
			MetadataLoader.render(ExpSearchApp.renderNewMultipleSearch, visual, urlList[i], true, null);
		}
		
		
	}
	console.log(exploratorySearches);
	exploratorySearches.last().resultSetContainer.appendChild(visual);
}
ExpSearchApp.newSearchFromRelatedQuery = function(event){
	var query = event.currentTarget.id;
	if(query == null){
		query = event.target.parentNode.id;
	}
	ExpSearchApp.addQuery(query,['bing', 'google_search']);
}
ExpSearchApp.renderNewMultipleSearch = function(task, metadataFields){
	
	var newSearch = ExpSearchApp.searchFromMetadata(metadataFields);
	//Checks the current query used by the most recent ExploratorySearch
	
	if (exploratorySearches.last().currentSearchSet().query == newSearch.query){
		
		exploratorySearches.last().currentSearchSet().addSearch(newSearch);
		ExpSearchApp.displaySearchSet(exploratorySearches.last());

	}
	
	else{
	
		ExpSearchApp.displaySearchSet(exploratorySearches.last());

	}
	
	//Redraws display
	
	MetadataLoader.queue.splice(MetadataLoader.queue.indexOf(task), 1);
	
}
/*
 * Matches from single searches to searchSets based on shared queries
 */
ExpSearchApp.renderNewSingleSearch= function(task, metadataFields){
	var newSearch = ExpSearchApp.searchFromMetadata(metadataFields);
	
	var newSS = new SearchResultSet(newSearch.query, [newSearch]);
	exploratorySearches.last().addSearchSet(newSS);
	ExpSearchApp.displaySearchSet(exploratorySearches.last());
	MetadataLoader.queue.splice(MetadataLoader.queue.indexOf(task), 1);
}

ExpSearchApp.initialRender = function(task, metadataFields){
	var searchList = [ExpSearchApp.searchFromMetadata(metadataFields)];
	var searchSet = new SearchResultSet(searchList[0].query ,searchList);
	
	if (searchSet != null){
		var expSearch = new ExploratorySearch()
		
		
		expSearch = new ExploratorySearch(task.container);
		exploratorySearches.push(expSearch);

		expSearch.addSearchSet(searchSet);
			
		if (expSearch != null){
			ExpSearchApp.displaySearchSet(expSearch);
		}
	}
	else{
		console.log("Exploratory search not created");
	}
	MetadataLoader.queue.splice(MetadataLoader.queue.indexOf(task), 1);
	
}
/*
 * Draws the latest searchSet. 
 * 
 */
ExpSearchApp.displaySearchSet = function(expSearch){
	
	var visual = document.createElement('div');
	visual.className = "metadataContainer";

	// Clear out the container so that it will only contain the new metadata table
	console.log(expSearch.resultSetContainer);
	while (expSearch.resultSetContainer.hasChildNodes())
		expSearch.resultSetContainer.removeChild(expSearch.resultSetContainer.lastChild);
	    
	// Add the HTML5 canvas for the drawing of connection lines
	var canvas = document.createElement("canvas");
	canvas.className = "lineCanvas";
	visual.appendChild(canvas);
	
	// Add the interior container to the root contianer
	expSearch.resultSetContainer.appendChild(visual);
	
	// Create and add a new DocumentContainer to the list
	MICE.documentMap.push( new DocumentContainer(expSearch.currentUrl(), null, expSearch.resultSetContainer, true));

	// Remove any highlighting of documents as the addition of the new table will cause the connection-lines to be out of place
	MICE.unhighlightDocuments(null);
	
	
	SearchResultSet.prototype.addResultSetDisplay(expSearch.searchResultSets.last(), visual);
	
}




/*
 * Handlers for prototype-specific events
 */
ExpSearchApp.expandCollapseSearch = function(event)
{
	
	var button = event.target;
	
	if(button.className.indexOf("searchCollapseSymbol") > -1  ||button.className.indexOf("searchExpandSymbol") > -1 )
		button = button.parentElement;
	//Find what search type it is
	var classes = button.className.split(" ");
	var searchType = classes[1];
	// Use the symbol to check if the table should expand or collapse
	var expandSymbol = button.getElementsByTagName("div")[0];
	var searchRep = button.parentNode.nextSibling.nextSibling;
	var searchFooter = button.parentNode.parentNode.childNodes[3];
	if(expandSymbol.style.display == "block")
	{
		expandSymbol.style.display = "none";	
		button.className = "searchCollapseButton ";
		if(searchType != null)
			button.className += searchType;
		console.log('expand!');
		/*
		If a collapsedSearchRepresentation has been created, stop displaying it
		Set all renderings back to being able to display themselves.
		*/
		var renderings = button.parentNode.nextSibling.childNodes;
		for (var i = 0; i < renderings.length; i++){
			renderings[i].style.display = 'block';
		}
		
		searchRep.style.display = 'none';
		searchFooter.style.display = 'block';
		

	}
	else if(expandSymbol.style.display == "none")
	{
		expandSymbol.style.display = "block";			
		button.className = "searchExpandButton ";
		if(searchType != null)
			button.className += searchType;
		console.log('collapse!');
		/*
		 * Set display: none for all renderings.
		 * If no collapsedSearchRepresentation has been created, make it and display
		 * Else, display premade collapsedSearch
		 */
		var renderings = button.parentNode.nextSibling.childNodes;
		for (var i = 0; i < renderings.length; i++){
			renderings[i].style.display = 'none';
		}
		searchRep.style.display = 'block';
		searchFooter.style.display = 'none';

	}	
}


ExpSearchApp.expandCollapseSearchResult = function(event){
	var button = event.target;
	
	if(button.className.indexOf("searchResultCollapseSymbol") > -1  ||button.className.indexOf("searchresultExpandSymbol") > -1 )
		button = button.parentElement;
	//Find what search type it is
	var classes = button.className.split(" ");
	var searchType = classes[1];
	// Use the symbol to check if the table should expand or collapse
	var expandSymbol = button.getElementsByTagName("div")[0];
	
	button.className += searchType;
	/*
	 * Hides/restores all but the first row
	*/
	if(expandSymbol.style.display == "block")
	{
		expandSymbol.style.display = "none";	
		button.className = "searchResultCollapseButton ";
		if(searchType != null)
		
		var rendering = button.nextSibling.childNodes[0];
		var tableDiv = rendering.childNodes[0];
		var tableRows = tableDiv.childNodes;
		for (var i = 1; i < tableRows.length; i++){
			tableRows[i].style.display = 'table-row';
		}
		
		
		

	}
	else if(expandSymbol.style.display == "none")
	{
		expandSymbol.style.display = "block";			
		button.className = "searchResultExpandButton ";
		if(searchType != null)
			button.className += searchType;
	
		var rendering = button.nextSibling.childNodes[0];
		var tableDiv = rendering.childNodes[0];
		var tableRows = tableDiv.childNodes;
		for (var i = 1; i < tableRows.length; i++){
			tableRows[i].style.display = 'none';
		
		}
	}	
}

ExpSearchApp.displayComparison = function(entryID, entry){
	
	var searchSet;
		for(var i = 0; i < exploratorySearches.last().history.entryList.length; i++){
		if (exploratorySearches.last().history.entryList[i].id == entryID){
			exploratorySearches.last().history.entryList[i].compared = true;
			exploratorySearches.last().history.entryList[i].weight++;
			exploratorySearches.last().history.addHistoryDisplay();
			searchSet = exploratorySearches.last().history.entryList[i].SearchSet;
		}
		
		entry.className += " compared";
		
	}
	if(searchSet != null){
		var comparisonContainer = document.createElement('div');
		comparisonContainer.className = "comparisonContainer";
		comparisonContainer.setAttribute("id", entryID);
		comparisonContainer.setAttribute("ondragover", "comparisonDragOver(event)");
		comparisonContainer.setAttribute("ondrop", "comparisonDrop(event)");
		comparisonContainer.setAttribute("ondragenter", "comparisonDragEnter(event)");
		comparisonContainer.setAttribute("ondragleave", "comparisonDragLeave(event)");
		comparisonContainer.setAttribute("style", "height: 100%;");
		
		var compDiv = document.getElementById("comp")
		while (compDiv.hasChildNodes())
			compDiv.removeChild(compDiv.lastChild);	
		compDiv.appendChild(comparisonContainer);
		SearchResultSet.prototype.addResultSetDisplay(searchSet, comparisonContainer, true, entryID);
	}
	 
}

ExpSearchApp.removeComparisonButton = function(event){
	ExpSearchApp.removeComparisonDisplay(event.target.parentNode.id, event.target);
	ExpSearchApp.addDropHint();
}
ExpSearchApp.addDropHint = function(){
	var compContainer = document.getElementById("comp");
	comp.innerHTML = "<div class='comparisonContainer' ondragover='comparisonDragOver(event)' ondrop='comparisonDrop(event)' ondragenter='comparisonDragEnter(event)' ondragleave='comparisonDragLeave(event)'> " +
			"<span class='dragCenteringMechanism'> <span class='dragHint'>Drag a history entry here</span> </span>";
}
ExpSearchApp.removeComparisonDisplay = function(entryID, parent){
	//Remove comparison tag from event
	for(var i = 0; i < exploratorySearches.last().history.entryList.length; i++){
		exploratorySearches.last().history.entryList[i].compared = false;
		var entryHTML = document.getElementById(entryID);

		entryHTML.classList.remove('compared');

		if (exploratorySearches.last().history.entryList[i].id == entryID){
			exploratorySearches.last().history.entryList[i].compared = false;
			var entryHTML = document.getElementById(entryID);
		
			entryHTML.classList.remove('compared');
		}
	}
	exploratorySearches.last().history.addHistoryDisplay();
		//Remove all nodes
	while (parent.hasChildNodes())
		parent.removeChild(parent.lastChild);	
}




















