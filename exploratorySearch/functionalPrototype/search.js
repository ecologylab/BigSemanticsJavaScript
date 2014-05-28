var MAX_RELATED = 9;
function onlyUnique(value, index, self) { 
    return self.indexOf(value) === index;
}
function Search(query, type, location, result_locations, searchResults ){
	this.query = query;
	this.type = type;
	this.location = location;
	this.result_locations = result_locations;
	if(searchResults != null){
		this.searchResults = searchResults;
		console.log("");
	}
	else{
		this.searchResults = [];

	}
	this.relatedQueries = [];
}

function SearchResult(location, type, title){
	this.location = location;
	this.type = type;
	//this.title = title;
}
Search.prototype.addSearchDisplay = function(searchX, parent){
	
	//Builds a header for each search
	var searchHeader = document.createElement('div');
	searchHeader.className = "searchHeader";
		
	parent.appendChild(searchHeader);
	//Builds the button for expanding and collapsing a search
	var searchCollapseButton = document.createElement('div');
	searchCollapseButton.className = 'searchCollapseButton ';
	searchCollapseButton.className += searchX.type;
	searchCollapseButton.onclick = ExpSearchApp.expandCollapseSearch;
	var searchCollapseSymbol = document.createElement('div');
	searchCollapseSymbol.className = 'searchCollapseSymbol ';
	searchCollapseSymbol.className += searchX.type;
	searchCollapseSymbol.style.display = 'block';
	var searchExpandSymbol = document.createElement('div');
	searchExpandSymbol.className = 'searchExpandSymbol ';
	searchExpandSymbol.className += searchX.type;
	searchExpandSymbol.style.display = 'none';
	
	
	searchCollapseButton.appendChild(searchExpandSymbol);
	searchCollapseButton.appendChild(searchCollapseSymbol);
	
	//Builds a placeholder for representing a collapsed search
	var collapsedRepresentation = document.createElement('div');
	collapsedRepresentation.className = 'collapsedSearch';
	
	searchHeader.appendChild(searchCollapseButton);
	
	var searchLabel = document.createElement('span');
	searchLabel.className = "searchLabel";
	
	searchHeader.appendChild(searchLabel);
	var favicon = document.createElement('img');
	favicon.className = "faviconICE";
	favicon.src = "https://plus.google.com/_/favicon?domain_url=" + engineURL(searchX.type);
	searchLabel.appendChild(favicon);
	var labelSpan= document.createElement('span');
	labelSpan.className = 'labelSpan';
	labelSpan.innerHTML = searchX.type;
	searchLabel.appendChild(labelSpan);
	
	parent.appendChild(collapsedRepresentation);
	
	//Builds a footer for the search
	var searchFooter = document.createElement('div');
	searchFooter.className = "searchFooter";
	if(searchX.relatedQueries != null){
		var relatedQueriesContainer = document.createElement('div');
		relatedQueriesContainer.className = "relatedQueriesContainer";
		var uniqueQueries = searchX.relatedQueries.filter(onlyUnique);
		for (var i = 0; i < uniqueQueries.length && i < MAX_RELATED; i++){
			var relatedQueryContainer = document.createElement('div');
			relatedQueryContainer.className = "relatedQueryContainer";
			var queryText = document.createTextNode(uniqueQueries[i]);
			var queryTextContainer = document.createElement('span')
			queryTextContainer.className = "relatedQueryTextContainer";
				
			queryTextContainer.appendChild(queryText);
			relatedQueryContainer.setAttribute("onclick", "ExpSearchApp.newSearchFromRelatedQuery(event)");
			relatedQueryContainer.id = uniqueQueries[i];
			relatedQueryContainer.appendChild(queryTextContainer);
			relatedQueriesContainer.appendChild(relatedQueryContainer);
		}
		searchFooter.appendChild(relatedQueriesContainer);
	}
	
	var searchResultsContainer = document.createElement('div');
	searchResultsContainer.className = 'searchResultContainer ';
	searchResultsContainer.className += searchX.type;
	parent.appendChild(searchResultsContainer);
	console.log(searchX);
	for(var i = 0; (i < searchX.searchResults.length)  && i <7; i++){
		SearchResult.prototype.addSearchResultDisplay(searchX.searchResults[i], searchResultsContainer);
	}
	
	parent.appendChild(searchResultsContainer);
	parent.appendChild(collapsedRepresentation);
	parent.appendChild(searchFooter);
	
}

SearchResult.prototype.addSearchResultDisplay = function(searchResultX, parent){
	var newSearchDisplay = document.createElement('div');
	newSearchDisplay.className = "indResultContainer";
	parent.appendChild(newSearchDisplay);

	var searchRCollapseButton = document.createElement('div');
	searchRCollapseButton.className = 'searchResultCollapseButton ';
	searchRCollapseButton.onclick = ExpSearchApp.expandCollapseSearchResult;
	var searchRCollapseSymbol = document.createElement('div');
	searchRCollapseSymbol.className = 'searchResultCollapseSymbol ';

	searchRCollapseSymbol.style.display = 'block';
	var searchRExpandSymbol = document.createElement('div');
	searchRExpandSymbol.className = 'searchResultExpandSymbol ';
	searchRExpandSymbol.style.display = 'none';
	
	
	searchRCollapseButton.appendChild(searchRExpandSymbol);
	searchRCollapseButton.appendChild(searchRCollapseSymbol);
	
	
	
	
	
	
	
	
	var miceContainer = document.createElement('div');
	miceContainer.className = "metadataRendering";
	newSearchDisplay.appendChild(searchRCollapseButton);
	newSearchDisplay.appendChild(miceContainer);
	
	MetadataLoader.render(MICE.render, miceContainer, searchResultX.location, true);
}