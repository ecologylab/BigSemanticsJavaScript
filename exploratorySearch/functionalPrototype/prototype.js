/**
 * 
 */




var Prototype = {};
var search_types = ['google_search'];

/*
 * Collection of functions to render 
 */

/*
 * Eventually, this should also save the open/closed state of all metadata in the enclosed search
 * Additionally, mechanisms will be added to sort history based on various criteria
 */


Prototype.initialize = function(){
	var prototypeRenderings = document.getElementsByClassName('searchRendering');
	for(var i = 0; i < prototypeRenderings.length; i++)
	{
		var query = prototypeRenderings[i].getElementsByTagName('a')[0].getAttribute("query");
		var location = prototypeRenderings[i].getElementsByTagName('a')[0].href;
		var engine = prototypeRenderings[i].getElementsByTagName('a')[0].getAttribute(engine);
		
		if(location)
			History.addHistory(query, location, engine);
			MetadataLoader.render(Prototype.render, prototypeRenderings[i], location, true);
	}
}
Prototype.isQuery = function(metadataField){
	if (!metadataField){
		return false;
	}
	else if (metadataField['name'] == 'query'){
		return true;
	}
	
	return false;
}

Prototype.isLocation = function (metadataField){
	if (!metadataField){
		return false;
	}
	else if (metadataField['name'] == 'location'){
		return true;
	}
	
	return false;
}
Prototype.displayQuery = function(query){
	
	queryVal = document.createElement('span');
	queryVal.className = 'queryVal';
	queryText = document.createTextNode(query['value']);
	queryVal.appendChild(queryText)
	queryVal.setAttribute("engine", query['parentMDType']);
	if(query.style_name != null){
		queryVal.className += " " + query.style_name;
	}	
	
	return queryVal;

}
Prototype.displayLocation = function(location){
	
	
	queryLocation = document.createElement('a');
	queryLocation.className = 'queryLocation';
	locationText = document.createTextNode(location['value']);
	queryLocation.setAttribute("href", location['value']);
	queryLocation.appendChild(locationText);
	
	return queryLocation;
	
}
Prototype.isResult = function (metadataField){
	
	if (!metadataField){
		return false;
	}
	else if (metadataField['name'] == 'search_results'){
		return true;
	}
	
	return false;
}
Prototype.buildMetadataTable = function(table, isChildTable, isRoot, metadataFields, fieldCount, tableParent){
	
	var queryRow = document.createElement('div');
	queryRow.className = 'queryRow';
	tableParent.appendChild(queryRow);
	
	queryLabel = document.createElement('span');
	queryLabel.className = 'queryLabel';
	labelText = document.createTextNode("Query: ");
	queryLabel.appendChild(labelText);
	
	queryRow.appendChild(queryLabel);
	
	console.log(isRoot);
	if(!table)
	{
		table = document.createElement('div');
		table.className = "metadataTableDiv";
		
	}
	var result_locations = [];
	for(var i = 0; i < metadataFields.length; i++)
	{
		var metadataField = metadataFields[i];
	
		console.log(metadataField);
		
		if(Prototype.isQuery(metadataField)){
			queryRow.appendChild(Prototype.displayQuery(metadataField));
			
			
		}
		else if (Prototype.isLocation(metadataField)){
			queryRow.appendChild(Prototype.displayLocation(metadataField));
		}
		/*
		 * Extracts locations and feeds them to MICE to render. Consider changing this to metadata - Ask Yin
		 * This is hard-coded atm for Google Search - will look for more general method ASAP
		 */
		
		else if (Prototype.isResult(metadataField)){
			
			console.log("Is results");
			if (metadataField.parentMDType == "google_search"){
				for (var i = 0; i < metadataField.value.length; i++){
					console.log(metadataField.value[i].value[0].value[0].navigatesTo);
					result_locations.push(metadataField.value[i].value[0].value[0].navigatesTo);
					
				}
			}
			else{
				for (var i = 0; i < metadataField.value.length; i++){
					console.log(metadataField.value[i].value[0].navigatesTo);
					result_locations.push(metadataField.value[i].value[0].navigatesTo);
					
				}
			}
			
			
		}
		
	}
	console.log(result_locations);
	
	/*
	 * Currently feeds URLS to debi, but preferably would send metadata clippings...including the snippet we're used to getting.
	 * Also, this is currently realllllly slow right now. Hopefully using clippings will solve the problem.
	 */
	
	for(var i = 0; (i < result_locations.length)  && i <7; i++){
		var newRender = document.createElement('div');
		
		newRender.className = "metadataRendering";
	
		tableParent.appendChild(newRender);
		MetadataLoader.render(MICE.render, newRender, result_locations[i], true);
	}
	
	console.log(table);
	return table;
}

Prototype.render = function(task, metadataFields){
	// Create the interior HTML container
	task.visual = document.createElement('div');
	task.visual.className = "metadataContainer";
	
	
	// Build the HTML table for the metadata
	MetadataLoader.currentDocumentLocation = task.url;
	
	
	
		// Clear out the container so that it will only contain the new metadata table
		console.log(task.container);
		while (task.container.hasChildNodes())
		   task.container.removeChild(task.container.lastChild);
		    
		// Add the HTML5 canvas for the drawing of connection lines
		var canvas = document.createElement("canvas");
			canvas.className = "lineCanvas";
		
	
		task.visual.appendChild(canvas);
		
		// Add the interior container to the root contianer
		task.container.appendChild(task.visual);
		
		// Create and add a new DocumentContainer to the list
		MICE.documentMap.push( new DocumentContainer(task.url, task.additionalUrls, task.container, true));
	
		// Remove any highlighting of documents as the addition of the new table will cause the connection-lines to be out of place
		MICE.unhighlightDocuments(null);
		
		// For the WWW study, log the expansion of metadata
		if(WWWStudy)
			// Log the addition of the metadata rendering so that metadata expansions can be tracked
			WWWStudy.logExpansion(task.metadata, task.container);		
		
	
	var metadataTable = Prototype.buildMetadataTable(null, false, task.isRoot, metadataFields, FIRST_LEVEL_FIELDS, task.visual);
	MetadataLoader.queue.splice(MetadataLoader.queue.indexOf(task), 1);

	
}


Prototype.addMetadataDisplay = function(container, url, isRoot, clipping){
	// Add the rendering task to the queue
	var task = new RenderingTask(url, container, isRoot, clipping, Prototype.render)
	MetadataLoader.queue.push(task);	
	
	if(clipping != null && clipping.rawMetadata != null)
	{
		clipping.rawMetadata.deserialized = true;
		MetadataLoader.setMetadata(clipping.rawMetadata);
	}
	else
	{	
		// Fetch the metadata from the service
		MetadataLoader.getMetadata(url, "MetadataLoader.setMetadata");	
	}
}