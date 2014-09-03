/**
 * 
 * 
 */

var searchBuilder = {};

searchBuilder.isField = function(fieldToMatchName, fieldToCheck){
	if (!fieldToCheck){
		return false;
	}
	else if (fieldToCheck['name'] == fieldToMatchName){
		return true;
	}
	return false;
}

searchBuilder.searchFromMetadata = function(metadataFields){
	
	//Selects the appropriate searchBuilder based on the search type

	/*
	 * Builds display for a search and adds it to the container for the SearchSet
	 */
	
	var query;
	var result_locations = [];
	var result_metadata = [];
	var type;
	var search_location;
	var search;
	console.log(metadataFields);
	//Iterates through fields and extracts data
	for(var i = 0; i < metadataFields.length; i++)
	{
		
		var metadataField = metadataFields[i];
		
		if(searchBuilder.isField('query', metadataField)){
			query = metadataField['value'];
			
		}
		else if(searchBuilder.isField('title', metadataField)){
			type = metadataField['parentMDType'];
		}
		else if (searchBuilder.isField('location', metadataField)){
			search_location = metadataField['value'];
		}
		
		else if (searchBuilder.isField('search_results', metadataField)){
			
			//When the location is in destination page
			if  (type=="research_gate_search"){
				result_locations = searchBuilder.getWrappedLocation(metadataField);
			}
			//When you want the data around the destination page
			else if(type == 'google_scholar_search'  || type == "google_search" ){
				result_metadata = searchBuilder.getWrapper(metadataField);
				result_locations = searchBuilder.getScholarLocation(metadataField);
			}
			//When the location is not in destination page
			else{
				result_locations = searchBuilder.getUnwrappedLocation(metadataField);
			}
			//If the we are not displaying the metadata around the results, here we go
			if(result_locations.length > 0 && query != null && result_metadata.length<=0){
				
				/*Uses the above information to start constructing
				 * searchResults, searches, and a SearchSet
				 */
				var searchResults = [];
				
				for(var k = 0; (k < result_locations.length)  && k <MAX_RESULTS; k++){
					var result = new SearchResult(result_locations[k], type);
					searchResults.push(result);
				}
				search = new Search(query, type, search_location, result_locations, searchResults);
					
				
			}
			//But if we are:
			else if(result_metadata.length > 0 && result_locations.length >0 && query != null){
				var searchResults = [];
				
				for(var k = 0; (k < result_locations.length)  && k <MAX_RESULTS && k<result_metadata.length; k++){
					var result = new SearchResult(result_locations[k], type, result_metadata[k]);
					searchResults.push(result);
				}
				search = new Search(query, type, search_location, result_locations, searchResults);
			}
		
		}
		else if (searchBuilder.isField('related_search', metadataField)){
			if (search != null){
				var rQueries = [];
				for (var k = 0; k < metadataField.value.length; k++){
					rQueries.push(metadataField.value[k].value[0].value);
				}
			
				search.relatedQueries = rQueries;
			}
		}
		
	}
	
	return search;
}
//used when the search_results have their own location
searchBuilder.getUnwrappedLocation = function(metadataField){
	
	var results = [];
	
	for (var j = 0; j < MAX_RESULTS && j < metadataField.value.length; j++){
		//console.log(metadataField.value[j].value[0].navigatesTo);
		if(metadataField.value[j].value[0] != null){
			results.push(toHTTPS(metadataField.value[j].value[0].navigatesTo));
		}else{
			results.push(toHTTPS("https://www.google.com"));
			
		}
		
		
		
	}
	return results;
}
//used when the search_results wrap around a composite that contains the result location
searchBuilder.getWrappedLocation = function(metadataField){
	var results = [];
	for (var k = 0; k < metadataField.value.length && k < MAX_RESULTS; k++){
		if(metadataField.value[k].value[0].value[0] != null){
			results.push(toHTTPS(metadataField.value[k].value[0].value[0].navigatesTo));
		}
		//This is essentially an error, but it looks prettier than if we leave a blank field
		else{
			result_locations.push(toHTTPS("https://www.google.com"));
			
		}
		
	}
	return results;
}
//used when the search_results wrap around a composite, but we want to show the wrapper
searchBuilder.getScholarLocation = function(metadataField){
	var results = [];
	for (var k = 0; k < metadataField.value.length && k < MAX_RESULTS; k++){
		if(metadataField.value[k].value[5]!= null){
			results.push(toHTTPS(metadataField.value[k].value[5].value[0].navigatesTo));
		}
		else{
			results.push(toHTTPS("https://www.google.com"));
			
		}
		
	}
	return results;
}
searchBuilder.getWrapper = function(metadataField){
	
	
	var wrappers = []
	for (var i = 0; i < metadataField.value.length; i++){
		wrappers.push(metadataField.value[i].value);
	}
	return wrappers;
}