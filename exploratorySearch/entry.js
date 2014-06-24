
function Entry(SearchSet){
	
	this.weight = 1;
	this.active = true;
	this.compared = false;
	this.query = SearchSet.query;
	this.SearchSet = SearchSet;
	this.id = SearchSet.id;
	this.childEntries = [];
	
	if(SearchSet.parentSetID == null){
		this.rootEntry = true;
		this.parentEntry = null;
	}
	else{
		this.rootEntry = false;
		var entries = exploratorySearches.last().history.entryList;
		for (var i = 0; i < entries.length; i++){
			if (SearchSet.parentSetID == entries[i].id){
				this.parentEntry = entries[i];
				entries[i].childEntries.push(this);
			}
		}
	}
}

Entry.prototype.toggleActive = function(){
	this.active = !this.active;
}
//Increases node's weight and updates display. Recursively updates its parents as well
Entry.prototype.increaseWeight = function(additionalWeight){
	this.weight += additionalWeight;
	var entryHTML = document.getElementById(this.id);
	var weight = entryHTML.childNodes[2];
	
	weight.innerHTML = this.weight;
	
	if(this.parentEntry != null){
		this.parentEntry.increaseWeight(1);
	}
}




