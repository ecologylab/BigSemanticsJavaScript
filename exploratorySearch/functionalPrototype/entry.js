
function Entry(SearchResultSet){
	
	this.weight = 1;
	this.active = true;
	this.compared = false;
	this.query = SearchResultSet.query;
	this.SearchSet = SearchResultSet;
	this.id = SearchResultSet.id;
}

Entry.prototype.toggleActive = function(){
	this.active = !this.active;
}

Entry.prototype.increaseWeight = function(additionalWeight){
	this.weight += additionalWeight;
	var entryHTML = document.getElementById(this.id);
	var weight = entryHTML.childNodes[2];
	weight.innerHTML = this.weight;
}


