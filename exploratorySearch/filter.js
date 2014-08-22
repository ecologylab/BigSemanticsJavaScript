/**
 * Filters keep track of searchResults that the do or do not want displayed
 */
var filterID = 0;
function Filter(term, ssId){
	
	var searches = currentExpSearch.currentSearchSet().searches;
	var searchResults = [];
	for (var k = 0; k < searches.length; k++){
		for (var i = 0; i < searches[k].searchResults.length; i++){
			searchResults.push(searches[k].searchResults[i]);
		}
	}
	//List of ids for results that pass through the filter
	this.filteredResultIds = filterList(term, searchResults);
	this.term = term;
	this.id = 'filter' + filterID.toString();
	this.searchSetId = ssId;
	filterID++;
}

function filterList(term, list){
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