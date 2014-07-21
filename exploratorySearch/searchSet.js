
/*
 * I'm running into a problem: a need a better way of quickly looking up SearchSets
 * query + engines = SRS...what's the nest way to combine that info for quick lookups?
 * 
 * In the meantime, I'm assigning id's as follows:
 * query + rising index number
 * 
 */

var idIndex = 0;

Object.defineProperty( Array.prototype, "equals", {
    enumerable: false,
    configurable: false,
    writable: false,
    value: function( array ) {
  	  return this.length == array.length && 
      this.every( function(this_i,i) { return this_i == array[i] } )  
  }
} );
function SearchSet(query, searches, parentSetID){
	this.query = query;
	this.searches = searches;
	this.id = query + idIndex.toString();
	idIndex++;
	this.expansionState = null;
	this.parent = null;
	this.engines = [];
	this.parentSetID = parentSetID;
	for(var i = 0; i < searches.length; i++){
		this.engines.push(searches[i].type);
	}
	this.engines.sort();
	
}

SearchSet.prototype.sameSet = function(query, engineList, parentID){
	// SS's are equal if same engines and query
	// Don't bother sorting engine list unless needed
	
	if(parentID != null){
		if (this.query == query && this.parentSetID == parentID){
			return true;
		}
		else{
			return false;
		}
	}
	else if (this.query == query && engineList.equals(this.engines) && this.parent == null){
		return true;
	}
	else{
		return false;
	}
}

SearchSet.prototype.buildQueryRow = function(query, parent){
	
	var queryRow = document.createElement('div');
	queryRow.className = 'queryRow';
	parent.appendChild(queryRow);
	
	queryLabel = document.createElement('span');
	queryLabel.className = 'queryLabel';
	labelText = document.createTextNode("Query: ");
	queryLabel.appendChild(labelText);
	
	queryRow.appendChild(queryLabel);

	
	queryVal = document.createElement('span');
	queryVal.className = 'queryVal';
	queryText = document.createTextNode(query);
	queryVal.appendChild(queryText)

	
	queryRow.appendChild(queryVal);
	parent.appendChild(queryRow);
}
SearchSet.prototype.buildComparisonUI = function(query, parent, entryID){
	var comparisonRow = document.createElement('div');
	comparisonRow.className = 'headerRow';
	parent.appendChild(comparisonRow);
	
	comparisonLabel = document.createElement('span');
	comparisonLabel.className = 'comparisonLabel';
	labelText = document.createTextNode("Comparing to: ");
	comparisonLabel.appendChild(labelText);
	
	comparisonRow.appendChild(comparisonLabel);

	
	comparisonVal = document.createElement('span');
	comparisonVal.className = 'comparisonVal';
	comparisonText = document.createTextNode(query);
	comparisonVal.appendChild(comparisonText)
	
	var dismissButton = document.createElement('span');
	dismissButton.className = "comparisonDismissButton";
	dismissButton.innerHTML = "<button type='button' class='btn btn-default btn-lg'> <i class='icon-remove'></i> Close</button>";
	dismissButton.setAttribute("onclick", "ExpSearchApp.removeComparisonButton(event)");
	dismissButton.setAttribute("id", entryID)
	comparisonRow.appendChild(comparisonVal);
	comparisonRow.appendChild(dismissButton);
	parent.appendChild(comparisonRow);
	
}
SearchSet.prototype.addSearch = function(search){
	
	this.searches.push(search);
	this.engines.push(search.type);
	this.engines.sort();
	//this.addResultSetDisplay(this, this.parent);
}

SearchSet.prototype.buildExpandButton
/*
 * Builds the query row and asks Search to please build its own search objects. If isComparison, builds
 * an interface for comparison instead of primary display
 */


SearchSet.prototype.addResultSetDisplay = function(SearchSetX, parent, isComparison, entryID){
	
	//Builds the row where the query is displayed
	SearchSetX.parent = parent;
	if(isComparison){
		SearchSet.prototype.buildComparisonUI(SearchSetX.query, parent, entryID)

	}
	else{
		SearchSet.prototype.buildQueryRow(SearchSetX.query, parent);
	}

	//To-do: add logic to get for which search's should be expanded
	
	//Right now, searches don't know about being expanded or not.
	//Only SearchSets handle that
	console.log(SearchSetX);
	for(var i = 0; i < SearchSetX.searches.length; i++){
		
		var searchRendering = document.createElement('div');
		//Should change the name of that class
		searchRendering.className = 'searchSetContainer';
		searchRendering.setAttribute("searchSetID", SearchSetX.id);
		//searchRendering.appendChild(searchResultContainer);
		console.log(SearchSetX);
		for(var i = 0; i < SearchSetX.searches.length; i++){
			var searchContainer = document.createElement('div');
			searchContainer.className = 'searchContainer';
			searchRendering.appendChild(searchContainer);
			Search.prototype.addSearchDisplay(SearchSetX.searches[i], searchContainer);
			
		}
		
		
		parent.appendChild(searchRendering);
	}
	
				
}
		
		
	