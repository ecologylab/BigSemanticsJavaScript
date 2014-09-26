/**
 * Filters keep track of searchResults that the do or do not want displayed
 */
var filterID = 0;
function Filter(term, ssId){
	
	var searchResults = currentExpSearch.currentSearchSet().searchResults;
	this.filterType = "termFilter";
	//List of ids for results that pass through the filter
	this.filteredResultIds = filterListByTerm(term, searchResults);
	this.term = term;
	this.id = 'filter' + filterID.toString();
	this.searchSetId = currentExpSearch.currentSearchSet().id;
	filterID++;
}
//Filters out anything that does not have one of the specified types
function TypeFilter(typeList, ssId){
	var searchResults = currentExpSearch.currentSearchSet().searchResults;
	this.filteredResultIds = filterByType(typeList, searchResults);
	this.filterType = "typeFilter";
	this.id = 'filter' + filterID.toString();
	this.searchSetId = currentExpSearch.currentSearchSet().id;
	for (var i = 0; i < typeList.length; i++){
		
	}
filterID++;
}
function filterByType(typeList, searchResults){
	var filteredIds = [];
	for (var i = 0; i < typeList.length; i++){
		for (var k = 0; k < searchResults.length; k++){
			if (searchResults[k].type == typeList[i]){
				filteredIds.push(searchResults[k].id);
			}
			
		}
		
	}
	return filteredIds;
}

function filterListByTerm(term, list){
	var filteredId = [];
	for(var i = 0; i < list.length; i++){
		var metadataRendering = document.getElementById(list[i].id);
		if(metadataRendering != null){
			var emptyList = [];
			//Gets all text (name and values)
			var metadata = recursiveTextHunter(metadataRendering, emptyList);
			
			//Iterates through and finds whether or not this particular item should pass
			for (var k = 0; k < metadata.length; k++){
				if (metadata[k].indexOf(term) > -1){
					filteredId.push(list[i].id);
					break;
				}
			}
		}
	}
	return filteredId;
}

function recursiveTextHunter(node, textList){
	
	if (node.childNodes.length > 0){ 
	    for (var j = 0; j < node.childNodes.length; j++) 
	    	textList = recursiveTextHunter(node.childNodes[j], textList);
	}
	if (node.nodeType == Node.TEXT_NODE && node.nodeValue != ''){
		textList.push(node.nodeValue);
		return textList;
	} 
	return textList;
		
}