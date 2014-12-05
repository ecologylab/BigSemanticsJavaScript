function parentField(url, collectionList){
	this.url = url;
	this.facetedCollections = collectionList;
}

function facetedCollection(url, htmlContainer){
	this.url = url;
	this.htmlContainer = htmlContainer;
	this.termFilters = [];
	this.rangeFilters = [];
	this.sortBy = [];
	this.reverseSortOrder = false;
}

facetedCollection.prototype.addTermFilter = function(term){
	this.termFilters.push(term);
}

facetedCollection.prototype.addRangeFilter = function(range){
	this.termFilters.push(range);
}

facetedCollection.prototype.removeTermFilter = function(term){

	for (var i = 0; i < this.termFilters.length; i++){
		if(this.termFilters[i].term == term.term){
			this.termFilters.splice(i, 1);
		}
	}
}

facetedCollection.prototype.removeRangeFilter = function(range){
	for (var i = 0; i < this.rangeFilters.length; i++){
		if(this.rangeFilters[i].facetName == range.facetName){
			this.rangeFilters.splice(i, 1);
		}
	}
}


facetedCollection.prototype.setSortBy = function(sortBy, reverseOrder){
	this.sortBy = sortBy;
	this.reverseSortOrder = reverseOrder;
}

function termFilter(facetName, term){
	this.facetName = facetName;
	this.term = term;
}

function rangeFilter(facetName, lowerLimit, upperLimit){
	this.facetName = facetName;
	this.lowerLimit = lowerLimit;
	this.upperLimit = upperLimit;

}

function sortByFacet(facetName, reverseSortOrder){
	this.facetName = facetName;
	this.reverseSortOrder = reverseSortOrder;
}


function RowWrapper(url, row, styleInfo){
	this.url = url;
	this.row = row;
	this.styleInfo = styleInfo
}

