var MAX_RELATED = 9;
function onlyUnique(value, index, self) { 
    return self.indexOf(value) === index;
}

function Search(query, type, location, result_locations, searchResults){
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

Search.prototype.addSearchExpandCollapseButton = function(searchX){
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
	return searchCollapseButton;
}

Search.prototype.addSearchDisplay = function(searchX, parent, filters){
	
	//Builds a header for each search
	var searchHeader = document.createElement('div');
	searchHeader.className = "searchHeader";
	searchHeader.setAttribute("searchtype", searchX.type);	
	parent.appendChild(searchHeader);
	
	
	//Builds a placeholder for representing a collapsed search
	var collapsedRepresentation = document.createElement('div');
	collapsedRepresentation.className = 'collapsedSearch';
	
	searchHeader.appendChild(Search.prototype.addSearchExpandCollapseButton(searchX));
	
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
	var filteredResults = [];
	for(var i = 0; i <searchX.searchResults.length; i++){
		filteredResults.push(searchX.searchResults[i]);
	}
	if (filters.length > 0){
		for(var i = 0; i < searchX.searchResults.length; i++){
			for(var j = 0; j < filters.length; j++){
				var ids = filters[j].filteredResultIds;
				var doesItPass = false;
				for (var k = 0; k < ids.length; k++){
					if(searchX.searchResults[i] == null){
						console.log('eww');
					}
					if (searchX.searchResults[i].id == ids[k]){
						doesItPass = true;
					}
				}
				if(!doesItPass){
					var index = filteredResults.indexOf(searchX.searchResults[i]);
					if (index > -1) {
					    filteredResults.splice(index, 1);
					}
	
				}
			}
		}
	}
	for (var i = 0; i < filteredResults.length; i++){
		SearchResult.prototype.addSearchResultDisplay(filteredResults[i], searchResultsContainer);
	}
	parent.setAttribute("searchtype", searchX.type);	
	parent.appendChild(searchResultsContainer);
	parent.appendChild(collapsedRepresentation);
	parent.appendChild(searchFooter);
	
}


