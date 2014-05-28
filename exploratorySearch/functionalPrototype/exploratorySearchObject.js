/**
 * A javascript object that contains all data used in an exploratory search session.
 * 
 * Eventually, it will have associated metadata that can be easily passed to other ecologyLab projects 
 * 
 * 
 */
Object.defineProperty( Array.prototype, "last", {
    enumerable: false,
    configurable: false,
    writable: false,
    value: function() {
        return this[ this.length - 1 ];
    }
} );
function ExploratorySearch(resultSetContainer, historyContainer){
	this.searchResultSets = [];
	this.history = new History();
	this.resultSetContainer = resultSetContainer;
	this.historyContainer = historyContainer;
}

ExploratorySearch.prototype.addSearchSet = function(searchSet){
	this.searchResultSets.push(searchSet);
	var newEntry = new Entry(searchSet);
	this.history.addEntry(newEntry);
}

ExploratorySearch.prototype.currentSearchSet = function(){
	return this.searchResultSets.last();
}

//Used to give a url to debi.js / check later to see if this strictly necessary
ExploratorySearch.prototype.currentUrl = function(){
	return this.searchResultSets.last().searches.last().location;
}
/*
 * Used to clean up the history after a multiple search
 * 
 */

ExploratorySearch.prototype.isSetAdded = function(searchSet){
	for(var i = 0; i < this.history.entryList.length; i++){
		if (searchSet.sameSet(this.history.entryList[i].SearchSet)){
			console.log(this.history.entryList[i].entryID);
			return this.history.entryList[i].entryID;
			
		}
	}
	return null;
}

