var ExpSearchApp = {};
//maximum number of results to show
var MAX_RESULTS = 5;
var exploratorySearches = [];
var currentExpSearch = null;
var LOG_SERVICE_URL = "ecoarray0:3801/i/event_log/";
var ALL_ENGINES = ["google_search","google_scholar_search","acm_portal_search","research_gate_search", "bing_search_xpath"];
ExpSearchApp.toggledEngines = [];
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

ExpSearchApp.initialize = function(){
	
	if (document.URL.indexOf("http://localhost:") > -1){
		var hostname = window.location.hostname;
		var port = window.location.port;
		SEMANTIC_SERVICE_URL = "http://" + hostname + ":" + port + "/BigSemanticsService/";

	}
	else{
		SEMANTIC_SERVICE_URL = "http://ecology-service.cse.tamu.edu/BigSemanticsService/";
		FatherTime.init();
	}
	
	ExpSearchApp.updateToggledEngines();
	var expRenderings = document.getElementsByClassName('expRendering');
	for (var i = 0; i < expRenderings.length; i++){
		var query = expRenderings[i].getElementsByTagName('a')[0].getAttribute("query");
		var urlList = ExpSearchApp.prepareUrls(query);
		var resultSetHolder = document.getElementById("content");
		var historyHolder = document.getElementById("history_bar");
		var expSearch = new ExploratorySearch(resultSetHolder, historyHolder);
		
		exploratorySearches.push(expSearch);
		currentExpSearch = expSearch;
		
		ExpSearchApp.addQuery(query);
	}
	
}

ExpSearchApp.updateToggledEngines = function(){
	//Check for which searches are toggled
	var checkboxes = document.getElementsByClassName('searchToggle');
	var engines = [];
	for (var i = 0; i < checkboxes.length; i++){
		if (checkboxes[i].checked){
			engines.push(checkboxes[i].name);
		}
	}
	ExpSearchApp.toggledEngines = engines;
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
function toGScholarUrl(searchString){
	var terms = searchString.split(" ");
	var url = "http://scholar.google.com/scholar?q=";
	for (var x in terms){
		url += terms[x];
		url += "+";
	}
    encodeURI(url);
    console.log(url);
    return url;
}
function toResearchGateUrl(searchString){
	var terms = searchString.split(" ");
	var url = "http://www.researchgate.net/publicliterature.PublicLiterature.search.html?type=keyword&search-keyword=";
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



/*
 * Adds new SearchSet to ExpSearch, redraws searchRenderings and History
 * Query - query to be searched
 * Engines - list of engines to search with
 * parentSearchSetID - optional, specifies if a searchSet came from another
 */
ExpSearchApp.prepareUrls = function(query){

	/*
	 * I'm still in need of a good general solution. For now, the code
	 * checks for google and acm searches and manually creates the appropriate URL
	 */
	var urlList = [];
	for (var i = 0; i < ALL_ENGINES.length ; i++){
		
       
    	if (ALL_ENGINES[i]=="google_search"){
    		url = toGoogleUrl(query);
    	}
    	else if (ALL_ENGINES[i] == 'bing_search_xpath'){
    		url = toBingUrl(query);
    		ALL_ENGINES[i] = "bing_search_xpath";
    	}
    	else if (ALL_ENGINES[i] == "acm_portal_search"){
    		url = toACMUrl(query);
    	}
    	else if (ALL_ENGINES[i] == "google_scholar_search"){
    		url = toGScholarUrl(query);
    	}else if (ALL_ENGINES[i] == "research_gate_search"){
    		url = toResearchGateUrl(query);
    	}
    	
    	urlList.push(url);
    
	}
	return urlList;
}
ExpSearchApp.addQuery = function(query, parentSearchSetID){
	
	
	if (currentExpSearch == null){
		return "error";
	}
	var searchSet;
	var urlList = ExpSearchApp.prepareUrls(query);
	var parentID = parentSearchSetID;
	console.log(query);

	
	
	
	var visual = document.createElement('div');
	visual.className = "metadataContainer";
	
	
	for (var i = 0; i < currentExpSearch.SearchSets.length; i++){
		if (currentExpSearch.SearchSets[i].query == query){
			currentExpSearch.history.restoreEntry(currentExpSearch.SearchSets[i].id);
			return;
		}
		
	}
	var ss = new SearchSet(query, []);
	ss.engines = ALL_ENGINES;
	if (parentSearchSetID != null){
		ss.parentSetID = parentSearchSetID;
		//Increase weight of parent SS
		var entries = currentExpSearch.history.entryList;
		for (var i = 0; i < entries.length; i++){
			if(entries[i].id == parentSearchSetID){
				entries[i].increaseWeight(1);
			}
		}
	}

	currentExpSearch.addSearchSet(ss);
	ss.engines = [];
	
	for (var i = 0; i < ALL_ENGINES.length ; i++){
		MetadataLoader.render(ExpSearchApp.renderNewMultipleSearch, visual, urlList[i], true, null);
	}
	
	console.log(exploratorySearches);
	currentExpSearch.resultSetContainer.appendChild(visual);
}

/*
 * 
 */
ExpSearchApp.newSearchFromRelatedQuery = function(event){
	var query = event.currentTarget.id;
	if(query == null){
		query = event.target.parentNode.id;
	}
	var searchContainer = document.getElementsByClassName("searchSetContainer")[0];
	
	ExpSearchApp.addQuery(query,ExpSearchApp.getEngines(), searchContainer.getAttribute("searchSetID"));
	var previousID = document.getElementsByClassName("searchSetContainer")[0].getAttribute("searchsetid")
	var previousQuery = currentExpSearch.getQueryForID(previousID);
	var searchEngines = ExpSearchApp.getEngines();
	var depth = currentExpSearch.history.getSearchSetDepth(previousID)+1;
	//logging
	var time = new Date().getTime();
	eventObj = {
		related_search: {
	  		timestamp: time,
	  		query: query,
	  		previous_query: previousQuery,
	  		depth: depth,
	  		search_engine: searchEngines
	  	}
	 };
	 TheRecord.addEvent(eventObj);
	
}
ExpSearchApp.renderNewMultipleSearch = function(task, metadataFields){
	
	
	
	
		var newSearch = searchBuilder.searchFromMetadata(metadataFields);
		if (currentExpSearch.currentSearchSet().query == newSearch.query){
			
			currentExpSearch.currentSearchSet().addResults(newSearch.searchResults);
			ExpSearchApp.filterByType(currentExpSearch.currentSearchSet().id);
			ExpSearchApp.displaySearchSet(currentExpSearch);

		}
		
		else{
		
			ExpSearchApp.displaySearchSet(currentExpSearch);

		}
	

	
	
	
}
/*
 * Matches from single searches to searchSets based on shared queries
 */
ExpSearchApp.renderNewSingleSearch= function(task, metadataFields){
	var newSearch = searchBuilder.searchFromMetadata(metadataFields);
	
	var newSS = new SearchSet(newSearch.query, newSearch.searchResults);
	currentExpSearch.addSearchSet(newSS);
	ExpSearchApp.displaySearchSet(currentExpSearch);
	MetadataLoader.queue.splice(MetadataLoader.queue.indexOf(task), 1);
}

ExpSearchApp.initialRender = function(task, metadataFields){
	var search = searchBuilder.searchFromMetadata(metadataFields).searchResults;
	
	var searchSet = new SearchSet(search.query, search.searchResults);
	
	if (searchSet != null){
		var expSearch = new ExploratorySearch()
		
		
		expSearch = new ExploratorySearch(task.container);
		exploratorySearches.push(expSearch);
		currentExpSearch = expSearch;
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
	//MICE.documentMap.push( new DocumentContainer(expSearch.currentUrl(), null, expSearch.resultSetContainer, true));
 
	
	
	SearchSet.prototype.addResultSetDisplay(expSearch.SearchSets.last(), visual);
	
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
	
	var searchEngine = button.parentNode.getAttribute("searchtype") ;
	var query = document.getElementsByClassName("queryVal")[0].innerHTML;
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
		//logging
		var time = new Date().getTime();
		eventObj = {
			expand_search: {
		  		timestamp: time,
		  		query: query,
		  		search_engine: searchEngine
		  	}
		 };
		 TheRecord.addEvent(eventObj);

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
		//logging
		var time = new Date().getTime();
		eventObj = {
			collapse_search: {
		  		timestamp: time,
		  		query: query,
		  		search_engine: searchEngine
		  	}
		 };
		 TheRecord.addEvent(eventObj);
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
	
	//finds the first value in the associated metadataRendering
	var preTitle= button.parentNode.parentNode.nextSibling.childNodes[0].childNodes[0].childNodes[0].childNodes[1].childNodes[0]
	var title;
	if(preTitle.childNodes[1] != null){
		title = preTitle.childNodes[1].innerHTML;
	}else{
		title = preTitle.childNodes[0].innerHTML;
	}
	var type = button.parentNode.parentNode.nextSibling.childNodes[0].getAttribute('mdtype');
	
	
	/*
	 * Hides/restores all but the first row
	*/
	if(expandSymbol.style.display == "block")
	{
		expandSymbol.style.display = "none";	
		button.className = "searchResultCollapseButton ";
		if(searchType != null)
		
		var rendering = button.parentNode.parentNode.nextSibling.childNodes[0];
		var tableDiv = rendering.childNodes[0];
		var tableRows = tableDiv.childNodes;
		for (var i = 1; i < tableRows.length; i++){
			tableRows[i].style.display = 'table-row';
		}
		
		
		//logging
		var time = new Date().getTime();
		eventObj = {
			expand_result: {
		  		timestamp: time,
		  		result_type: type,
		  		result_title: title
		  	}
		 };
		 TheRecord.addEvent(eventObj);

	}
	else if(expandSymbol.style.display == "none")
	{
		expandSymbol.style.display = "block";			
		button.className = "searchResultExpandButton ";
		if(searchType != null)
			button.className += searchType;
	
		var rendering = button.parentNode.parentNode.nextSibling.childNodes[0];
		var tableDiv = rendering.childNodes[0];
		var tableRows = tableDiv.childNodes;
		for (var i = 1; i < tableRows.length; i++){
			tableRows[i].style.display = 'none';
		
		}
		//logging
		var time = new Date().getTime();
		eventObj = {
			collapse_result: {
		  		timestamp: time,
		  		result_type: type,
		  		result_title: title
		  	}
		 };
		 TheRecord.addEvent(eventObj);
	}	
}

ExpSearchApp.expandCollapseEntry = function(event){
	var button = event.target;
	
	if(button.className.indexOf("entryCollapseSymbol") > -1  ||button.className.indexOf("entryExpandSymbol") > -1 )
		button = button.parentElement;
		var expandSymbol = button.getElementsByTagName("div")[0];
	
	button.className;
	//Find the searchSetID for the entry
	var searchSetID = button.parentNode.nextSibling.getAttribute("id");
	var query = currentExpSearch.getQueryForID(searchSetID);
	var depth = currentExpSearch.history.getSearchSetDepth(searchSetID);	    
	/*
	 * Expand all kids
	*/
	if(expandSymbol.style.display == "block")
	{
		
		expandSymbol.style.display = "none";	
		button.className = "entryCollapseButton ";
		button = button.parentNode;

		var childContainer = button.parentNode.nextSibling;
		while(childContainer != null){
			var renderings = childContainer.childNodes;
			if (renderings != null){
				for (var i = 0; i < renderings.length; i++){
					renderings[i].style.display = 'block';
				}
			}
			childContainer = childContainer.nextSibling;
		}
		
		
		//logging
		var time = new Date().getTime();
		eventObj = {
			expand_history_entry: {
		  		timestamp: time,
		  		query: query,
		  		depth: depth
		  	}
		 };
		 TheRecord.addEvent(eventObj);
	}
	//Hide all kids
	else if(expandSymbol.style.display == "none")
	{
		
		expandSymbol.style.display = "block";			
		button.className = "entryExpandButton ";
		button = button.parentNode;

		var childContainer = button.parentNode.nextSibling;
		while(childContainer != null){
			var renderings = childContainer.childNodes;
			if (renderings != null){
				for (var i = 0; i < renderings.length; i++){
					renderings[i].style.display = 'none';
				}
			}
			childContainer = childContainer.nextSibling;
		}
		//logging
		var time = new Date().getTime();
		eventObj = {
			collapse_history_entry: {
		  		timestamp: time,
		  		query: query,
		  		depth: depth
		  	}
		 };
		 TheRecord.addEvent(eventObj);
	}	

}
ExpSearchApp.displayComparison = function(entryID, entry){
	
	var searchSet;
		for(var i = 0; i < currentExpSearch.history.entryList.length; i++){
		if (currentExpSearch.history.entryList[i].id == entryID){
			currentExpSearch.history.entryList[i].compared = true;
			currentExpSearch.history.entryList[i].weight++;
			currentExpSearch.history.addHistoryDisplay();
			searchSet = currentExpSearch.history.entryList[i].SearchSet;
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
		SearchSet.prototype.addResultSetDisplay(searchSet, comparisonContainer, true, entryID);
	}
	 
}

ExpSearchApp.removeComparisonButton = function(event){
	ExpSearchApp.removeComparisonDisplay(event.target.parentNode.id, event.target);
	ExpSearchApp.addDropHint();
}
ExpSearchApp.addDropHint = function(phrase){
	var compContainer = document.getElementById("comp");
	
	if(phrase != null){
		comp.innerHTML = "<div class='comparisonContainer' ondragover='comparisonDragOver(event)' ondrop='comparisonDrop(event)' ondragenter='comparisonDragEnter(event)' ondragleave='comparisonDragLeave(event)'> " +
		"<span class='dragCenteringMechanism'> <span class='dragHint'>" + phrase + "</span> </span>";
		
	}
	else{
		comp.innerHTML = "<div class='comparisonContainer' ondragover='comparisonDragOver(event)' ondrop='comparisonDrop(event)' ondragenter='comparisonDragEnter(event)' ondragleave='comparisonDragLeave(event)'> " +
		"<span class='dragCenteringMechanism'> <span class='dragHint'>Drag a history entry here</span> </span>";
	}
	
}
ExpSearchApp.removeComparisonDisplay = function(entryID, parent){
	
	for(var i = 0; i < currentExpSearch.history.entryList.length; i++){
		currentExpSearch.history.entryList[i].compared = false;
		var entryHTML = document.getElementById(entryID);

		entryHTML.classList.remove('compared');

		if (currentExpSearch.history.entryList[i].id == entryID){
			currentExpSearch.history.entryList[i].compared = false;
			var entryHTML = document.getElementById(entryID);
		
			entryHTML.classList.remove('compared');
		}
	}
	currentExpSearch.history.addHistoryDisplay();
		//Remove all nodes
	while (parent.hasChildNodes())
		parent.removeChild(parent.lastChild);	
}



ExpSearchApp.iframeDenied = function(event){
	var comp = document.getElementById("comp");
	while (comp.hasChildNodes())
		comp.removeChild(comp.lastChild);
	ExpSearchApp.addDropHint("Page host refuses external loading of specified page");
	
}

ExpSearchApp.entrySearch = function(event){
	 if(event && event.keyCode == 13)
	   {
	     var id = event.target.getAttribute("parentSet"); 
		 var query = document.getElementById('newEntry').value;
	      var container = event.target.parentNode;
	      container.removeChild(event.target);
	      
	      container.parentNode.removeChild(container);
	      ExpSearchApp.addQuery(query, id);
	      //Logging event builder
	      
	      var depth = 1 + currentExpSearch.history.getSearchSetDepth(id);
	      var time = new Date().getTime();
	      eventObj = {
	  			append_query_submit: {
	  				query: query,
	  				depth: depth,
	  				timestamp: time
	  			}
	  		};
	      TheRecord.addEvent(eventObj);
	   }
	
}
ExpSearchApp.removeSearchField = function(event){
	
	
	var button = event.target;
	if (event.target.className == "icon-remove"){
		button = button.parentNode;
	}
	var parentID = button.previousSibling.getAttribute("parentset")
	var formContainer = button.parentNode;
	while(formContainer.hasChildNodes()){
		formContainer.removeChild(formContainer.lastChild);
	}
	
	//Logging
	var parentQuery = currentExpSearch.getQueryForID(parentID);
	var depth = currentExpSearch.history.getSearchSetDepth(parentID) + 1;
	var time = new Date().getTime();
	eventObj = {
		append_query_cancel: {
	  		parent_query: parentQuery,
	  		depth: depth,
	  		timestamp: time
	  	}
	 };
	 TheRecord.addEvent(eventObj);
	
}
ExpSearchApp.appendQuery = function(event, level){
	
	
	//get parent id
	var historyEntry = event.target.previousSibling;
	if(historyEntry == null){
		historyEntry = event.target.parentNode.previousSibling;
		
	}
	var children = historyEntry.childNodes;
	var queryNode;
	//finds node that holds the query
	for (var i = 0; i < children.length; i++){
		if (children[i].classList.contains('entryQuery')){
			queryNode = children[i];
		}
	}
	var query;
	if(queryNode != null){
		query = queryNode.innerText;
		console.log(queryNode);
	}
	
	//If there is an already made form, kill it with holy fire
	var previousForm = document.getElementById('newEntry');
	if(previousForm != null){
		var container = previousForm.parentNode;
		while(container.hasChildNodes()){
			container.removeChild(container.lastChild);
		}
	}
	
	var formContainer = document.createElement('div');
	formContainer.className = "childEntryContainer";
	var levelPlus = Number(level)+1;
	if (levelPlus > 4)
		levelPlus = 4;
		
	var depth = "level" + levelPlus.toString();
	formContainer.classList.add(depth);
	
	var entryForm = document.createElement('input');
	entryForm.setAttribute('id', 'newEntry');
	entryForm.setAttribute('parentSet', historyEntry.id);
	entryForm.className = "newEntryForm " + depth;
	var keypress = 'ExpSearchApp.entrySearch(event)';
	entryForm.setAttribute('onkeypress', keypress);
	entryForm.setAttribute('type', 'search');
	entryForm.defaultValue = query;
	entryForm.setAttribute("autofocus", "");
	//Dismissal Button
	var removeSearchButton = document.createElement('div');
	
	removeSearchButton.className = "newSearchDismissButton";
	removeSearchButton.innerHTML = "<i class='icon-remove' style='margin-top: 8px; margin-left: 6px;'></i>";
	removeSearchButton.setAttribute("onclick", "ExpSearchApp.removeSearchField(event)");
	formContainer.appendChild(entryForm);
	formContainer.appendChild(removeSearchButton);

	historyEntry.parentNode.appendChild(formContainer);
	var parentID = historyEntry.getAttribute("id");
	var depth = currentExpSearch.history.getSearchSetDepth(parentID) + 1;
	//logging
	var time = new Date().getTime();
	eventObj = {
		append_query: {
	  		parent_search: query,
	  		depth: depth,
	  		timestamp: time
	  	}
	 };
	 TheRecord.addEvent(eventObj);
}
//Returns the list of serach engines currently toggled
ExpSearchApp.getEngines = function(){
	var checkboxes = document.getElementsByClassName('searchToggle');
	var engineList = [];
	for (var i = 0; i < checkboxes.length; i++){
		if(checkboxes[i].checked){
			engineList.push(checkboxes[i].getAttribute('name'));
		}	
	} 
	return engineList;
}

/*
 * taken from stack overflow
 * http://stackoverflow.com/questions/4652734/return-html-from-a-user-selected-text/4652824#4652824
 */
function getSelectionHtml() {
    var html = "";
    if (typeof window.getSelection != "undefined") {
        var sel = window.getSelection();
        if (sel.rangeCount) {
            var container = document.createElement("div");
            for (var i = 0, len = sel.rangeCount; i < len; ++i) {
                container.appendChild(sel.getRangeAt(i).cloneContents());
            }
            html = container.innerHTML;
        }
    } else if (typeof document.selection != "undefined") {
        if (document.selection.type == "Text") {
            html = document.selection.createRange().htmlText;
        }
    }
    return html;
}
//MOUSEDOWN
ExpSearchApp.removeQuerySearchBox = function(event){
	if(event != null){
		if(event.target.className == "toQueryBox" || event.target.className == "icon-search toQueryIcon"){
			return;
		}
	}
	if(event!=null){
		if (event.target.tagName == "P"){
			//Removes any existing query boxes
			var queryBox = document.getElementById('toQueryBox');
			if (queryBox != null){
				queryBox.parentNode.removeChild(queryBox);
			}
		}
		else{
			draggedElement = event.target;
			var t = event.target;
			while (t.className != "indResultContainer"){
				t = t.parentNode;
			}
			t.draggable=true;
		}
		
	}
	
	
	

	
}
ExpSearchApp.textSelected = function(event){
	document.addEventListener("mousedown", ExpSearchApp.removeQuerySearchBox);
	ExpSearchApp.removeQuerySearchBox();
	
	//Client has pressed the mouse button without releasing it...
       //Check if text is selected
   var sel = window.getSelection();
   console.log(sel);
   
   //I'm only worries about supporting Chrome/ this function behaves oddly in IE 10
   if (sel.rangeCount && sel.type == 'Range' && sel.toString() != ""){
	   console.log(sel.toString());
	 
	   //Positions query one line above the middle of the selected text
	   var oRange = sel.getRangeAt(0);
	   oRect = oRange.getBoundingClientRect();
	  
	   
	   var parent = event.target.parentNode;
	   var toQueryBox = document.createElement('div');
	   
	   
	   toQueryBox.className = "toQueryBox";
	   toQueryBox.removeEventListener('mousedown', ExpSearchApp.removeQuerySearchBox);
	   toQueryBox.innerHTML = "<i class='icon-search toQueryIcon'></i>"
	   
	  
       toQueryBox.style.position = "absolute";
	   toQueryBox.style.top = (oRect.top - 22 + $(document).scrollTop());
	   toQueryBox.style.left = ((oRect.left + oRect.right )/ 2) - 20; 
	   toQueryBox.id = "toQueryBox";
	   //needs to know which search is its parent
	   var ssc = document.getElementsByClassName('searchSetContainer')[0];
	   var parent = ssc.getAttribute('searchsetid');
	   
	   var textToQuery = 'ExpSearchApp.textToQuery("' + ExpSearchApp.cleanQuery(sel.toString()) + '", "' + parent + '")';
	   console.log(textToQuery);
	   toQueryBox.setAttribute('onclick', textToQuery);
	   document.body.appendChild(toQueryBox);
		var data = ExpSearchApp.cleanQuery(sel.toString());
		var length = data.length;
		//logging
		var time = new Date().getTime();
		eventObj = {
			metadata_highlighted: {
		  		timestamp: time,
		  		data: data,
		  		length: length
		  	}
		 };
		 TheRecord.addEvent(eventObj);   
   }
   	  //If selected, extract text
   		//And find somewhere to build the query button
        //Build the query button
      //Else, just end
          
}
ExpSearchApp.textToQuery = function(query, id){
	//Removes textToQueryBox
	ExpSearchApp.removeQuerySearchBox();
	//Adds query
	ExpSearchApp.addQuery(query, ExpSearchApp.getEngines(), id);
	//logging
	var time = new Date().getTime();
	var engines = ExpSearchApp.getEngines();
	var query_length = query.length;
	eventObj = {
		search_from_metadata: {
	  		query: query,
	  		engine_list: engines,
	  		query_length: length,
	  		timestamp: time
	  	}
	 };
	 TheRecord.addEvent(eventObj);

}
ExpSearchApp.buildMetadataToQueryButton = function(parent, query){

}
ExpSearchApp.cleanQuery = function(query){
	var cleanerQuery = MetadataLoader.removeLineBreaksAndCrazies(query);
	cleanerQuery = cleanerQuery.trim();
	return cleanerQuery;
	
}

ExpSearchApp.newExpSearch = function(){
	//Clear the display of the previous search
	var historyContainer = document.getElementsByClassName("historyContainer")[0]
	while (historyContainer.hasChildNodes())
		historyContainer.removeChild(historyContainer.lastChild);
	var resultSetContainer = document.getElementById("content");
	while (resultSetContainer.hasChildNodes())
		resultSetContainer.removeChild(resultSetContainer.lastChild);
	var comparisonDisplay = document.getElementById('comp');
	while (comparisonDisplay.hasChildNodes())
		comparisonDisplay.removeChild(comparisonDisplay.lastChild);
	ExpSearchApp.addDropHint();
	//Make new search object
	var newExpSearch = new ExploratorySearch(resultSetContainer, historyContainer);
	exploratorySearches.push(newExpSearch);
	console.log(exploratorySearches);
	//logging
	var time = new Date().getTime();
	eventObj = {
		new_exploratory_search: {
	  		timestamp: time
	  	}
	 };
	 TheRecord.addEvent(eventObj);
	 currentExpSearch = newExpSearch;
	//Display said search object	
}


/*
 * Functions pertaining to maximum metadata mc.filtering
 */

ExpSearchApp.onEnterFilter = function (event){
	 if(event.keyCode == 13){
		 var ssContainer = document.getElementsByClassName('searchResultsContainer')[0];
		 var id = ssContainer.getAttribute('searchsetid');
		 ExpSearchApp.buildFilter(document.getElementById('filterInput').value, id);
	 }
	
}
ExpSearchApp.onToggleFilter = function(event){
	 var ssContainer = document.getElementsByClassName('searchResultsContainer')[0];
	 var id = ssContainer.getAttribute('searchsetid');
	 
	 if (event.target.className != "searchToggle"){
		 return false;
	 }
	 else{
		 ExpSearchApp.filterByType(id);
	 }
}
ExpSearchApp.filterByType = function(ssId){
	 ExpSearchApp.updateToggledEngines();
		var filter = new TypeFilter(ExpSearchApp.toggledEngines, ssId);
		var searchSet;
		for (var i = 0; i < currentExpSearch.SearchSets.length; i++){
			if (currentExpSearch.SearchSets[i].id == ssId){
				searchSet = currentExpSearch.SearchSets[i];
			}
		}
		searchSet.removeTypeFilter();
		searchSet.addFilter(filter);
		ExpSearchApp.displaySearchSet(currentExpSearch);
}
ExpSearchApp.buildFilter = function(term, ssId){
	var filter = new Filter(term, ssId);
	var searchSet;
	for (var i = 0; i < currentExpSearch.SearchSets.length; i++){
		if (currentExpSearch.SearchSets[i].id == ssId){
			searchSet = currentExpSearch.SearchSets[i];
		}
	}
	searchSet.addFilter(filter);
	ExpSearchApp.displaySearchSet(currentExpSearch);
}

ExpSearchApp.removeFilter = function(event){
	var button = event.target;
	while (button.getAttribute('filterid') == "" || button.getAttribute('filterid') == null){
		button = button.parentNode;
	}
	var filterId = button.getAttribute("filterid");
	var ss = currentExpSearch.SearchSets.last();
	ss.removeFilter(filterId);
	ExpSearchApp.displaySearchSet(currentExpSearch);
	
}



