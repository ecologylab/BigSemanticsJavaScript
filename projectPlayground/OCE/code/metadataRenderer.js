/**
 * MetadataRenderer handles the loading of metadata and meta-metadata
 * and the creation and interaction of metadata display tables.
 */
var MetadataRenderer = {};

// The queue holds a list of containers which are waiting for metadata or meta-metadata from the service.
MetadataRenderer.queue = [];

// The documentMap contains a list of DocumentContainers for each found metadata object, both retrieved and not.
MetadataRenderer.documentMap = [];

var WWWStudy = null;

/**
 * Initializes the MetadataRenderings. Gets the containers and locations from the orginal document.  
 */
MetadataRenderer.initMetadataRenderings = function()
{
	var renderings = document.getElementsByClassName('metadataRendering');
	for(var i = 0; i < renderings.length; i++)
	{
		var location = renderings[i].getElementsByTagName('a')[0];
		if(location)
			MetadataRenderer.addMetadataDisplay(renderings[i], location.href, true);
	}
}

/**
 * Retrieves the target metadata and meta-metadata, constructs the metadata table, and appends it to the container.
 * @param container, the HTML object which the final metadata rendering will be appened into
 * @param url, url of the target document
 * @param isRoot, true if this is the root metadata for the rendering,
 * 		needed because styling is slightly different for the root metadata rendering
 */
MetadataRenderer.addMetadataDisplay = function(container, url, isRoot)
{	
	// Add the rendering task to the queue
	MetadataRenderer.queue.push(new RenderingTask(url, container, isRoot));	
	
	// Fetch the metadata from the service
	MetadataRenderer.getMetadata(url, "MetadataRenderer.setMetadata");	
}

/**
 * Retrieves the metadata from the service using a JSON-p call.
 * When the service responds the callback function will be called.
 * @param url, url of the target document
 * @param callback, name of the function to be called from the JSON-p call
 */
MetadataRenderer.getMetadata = function(url, callback)
{
	var serviceURL = "http://ecology-service/ecologylabSemanticService/metadata.jsonp?callback=" + callback + "&url=" + encodeURIComponent(url)
	MetadataRenderer.doJSONPCall(serviceURL);
	console.log("requesting semantics service for metadata: " + serviceURL);
}

/**
 * Retrieves the meta-metadata from the service using a JSON-p call.
 * When the service responds the callback function will be called.
 * @param type, name of the target meta-metadata
 * @param callback, name of the function to be called from the JSON-p call
 */
MetadataRenderer.getMMD = function(type, callback)
{
	MetadataRenderer.doJSONPCall("http://ecology-service/ecologylabSemanticService/mmd.jsonp?callback=" + callback + "&name=" + type);
}

/**
 * Do a JSON-P call by appending the jsonP url as a scrip object.
 * @param jsonpURL 
 */
MetadataRenderer.doJSONPCall = function(jsonpURL)
{
	var script = document.createElement('script');
	script.src = jsonpURL;
	document.head.appendChild(script);
}

/**
 * Deserializes the metadata from the service and matches the metadata with a queued RenderingTask
 * If the metadata matches then retrieve the needed meta-metadata
 * @param rawMetadata, JSON metadata string returned from the semantic service
 */
MetadataRenderer.setMetadata = function(rawMetadata)
{	
	var metadata = {};
	for(i in rawMetadata)
	{
		metadata = rawMetadata[i];		
		metadata.mm_name = i;
	}
	
	simplDeserialize(metadata);
	
	console.log(metadata);
	//console.log("Retreived metadata: "+metadata.location);
	
	// Match the metadata with a task from the queue
	var queueTask = null;
	
	if(metadata.location)
		queueTask = MetadataRenderer.getTaskFromQueueByUrl(metadata.location);

	// If no task found then check additional locations
	if(!queueTask && metadata["additional_locations"])
	{
		//console.log("checking additional locations");
		//console.log(MetadataRenderer.queue);
		//console.log(metadata["additional_locations"]);
		for(var i = 0; i < metadata["additional_locations"]["location"].length; i++)
		{
			var additional_location = metadata["additional_locations"]["location"][i]
			queueTask = MetadataRenderer.getTaskFromQueueByUrl(additional_location);
			
			if(queueTask)
				break;
		}
	}
	
	if(queueTask)
	{
		queueTask.metadata = metadata;
		queueTask.mmdType = metadata.mm_name;
		
		MetadataRenderer.getMMD(queueTask.mmdType, "MetadataRenderer.setMetaMetadata");
	}
	else
	{
		console.error("Retreived metadata: "+metadata.location+"  but it doesn't match a document from the queue.");
		console.log(MetadataRenderer.queue);
	}
}

/**
 * Deserializes the meta-metadata, attempts to matche it with any awaiting tasks
 * If the meta-metadata gets matched then 
 * @param mmd, raw meta-metadata json returned from the service
 */
MetadataRenderer.setMetaMetadata = function(mmd)
{
	simplDeserialize(mmd);
	
	var tasks = MetadataRenderer.getTasksFromQueueByType(mmd.wrapper.name);
	
	if(tasks.length > 0)
	{
		for(var i = 0; i < tasks.length; i++)
		{
			tasks[i].mmd = mmd;
			
			// if the task has both metadata and meta-metadata then create and display the rendering
			if(tasks[i].metadata && tasks[i].mmd)	
				MetadataRenderer.createAndRenderMetadata(tasks[i]);
		}
	}
	else
		console.error("Retreived meta-metadata: " + mmd.wrapper.name + "  but it doesn't match a document from the queue.");
}

/**
 * Create the metadataRendering, add it to the HTML container, and complete the RenderingTask
 * @param task, RenderingTask to complete 
 */
MetadataRenderer.createAndRenderMetadata = function(task)
{	
	// Create the interior HTML container
	task.visual = document.createElement('div');
	task.visual.className = "metadataContainer";
	
	// Build the HTML table for the metadata
	var metadataTable = MetadataRenderer.buildMetadataDisplay(task.isRoot, task.mmd, task.metadata)
	
	if(metadataTable)
	{
		// Clear out the container so that it will only contain the new metadata table
		while (task.container.hasChildNodes())
		    task.container.removeChild(task.container.lastChild);
		    
		
		// Add the table and canvas to the interior container
		task.visual.appendChild(metadataTable);
				
		// Add the interior container to the root contianer
		task.container.appendChild(task.visual);
		
		task.container.onmousedown = MetadataRenderer.startDragMove;
		
		// Create and add a new DocumentContainer to the list
		MetadataRenderer.documentMap.push( new DocumentContainer(task.url, task.container, true));
	
		// Remove any highlighting of documents as the addition of the new table will cause the connection-lines to be out of place
		MetadataRenderer.unhighlightDocuments(null);
			
	}
	
	// If there isn't a metadata table to display then keep the old visual and remove the loading indicator
	else
		MetadataRenderer.clearLoadingRows(task.container);
	
	// Remove the RenderingTask from the queue
	MetadataRenderer.queue.splice(MetadataRenderer.queue.indexOf(task), 1);
}

/**
 * Get a matching RenderingTask from the queue 
 * @param url, target url to attempt to match to any tasks in the queue
 * @return a matching RenderingTask, null if no matches are found
 */
MetadataRenderer.getTaskFromQueueByUrl = function(url)
{
	url = encodeURI(url);
	for(var i = 0; i < MetadataRenderer.queue.length; i++)
		if(MetadataRenderer.queue[i].matches(url))
			return MetadataRenderer.queue[i];

	return null;
}

/**
 * Get all tasks from the queue which are waiting for given meta-metadata type
 * @param type, meta-metadata type to search for
 * @return array of RenderingTasks, empty if no matches found
 */
MetadataRenderer.getTasksFromQueueByType = function(type)
{
	var tasks = [];
	for(var i = 0; i < MetadataRenderer.queue.length; i++)
		if(MetadataRenderer.queue[i].mmdType == type)
			tasks.push(MetadataRenderer.queue[i]);
			
	return tasks;
}

/**
 * Searches the document map for the given url
 * @param url, url to search for in the document map
 * @return true, if the url exists in the document map, false otherwise
 */
MetadataRenderer.isRenderedDocument = function(url)
{
	url = encodeURI(url);
	for(var i = 0; i < MetadataRenderer.documentMap.length; i++)
		if(MetadataRenderer.documentMap[i].matches(url) && MetadataRenderer.documentMap[i].rendered)
			return true;
			
	return false;
}