/**
 * MetadataRenderer handles the loading of metadata and meta-metadata
 * and the creation and interaction of metadata display tables.
 */
var MetadataRenderer = {};

// The queue holds a list of containers which are waiting for metadata or meta-metadata from the service.
MetadataRenderer.queue = [];

// The documentMap contains a list of DocumentContainers for each found metadata object, both retrieved and not.
MetadataRenderer.documentMap = [];

MetadataRenderer.currentDocumentLocation = "";

// Needed to differentiate between standard MetadataRenderer and the WWW study version
var WWWStudy;

var SEMANTIC_SERVICE_URL = "http://ecology-service.cse.tamu.edu/BigSemanticsService/";

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
 * Retrieves the meta-metadata for incoming metadata, constructs the metadata table, and appends it to the container.
 * @param container, the HTML object which the final metadata rendering will be appended into
 * @param url, original url of the document
 * @param rawMetadata, metadata to be rendered
 * @param isRoot, true if this is the root metadata for the rendering,
 * 		needed because styling is slightly different for the root metadata rendering
 */
MetadataRenderer.addCachedMetadataDisplay = function(container, url, rawMetadata, isRoot)
{	
	// Add the rendering task to the queue
	MetadataRenderer.queue.push(new RenderingTask(url, container, isRoot));	
	
	// Sends the metadata for deserialization, to be matched with rendering task, and for MMD retrieval
	MetadataRenderer.setMetadata(rawMetadata);	
}

/**
 * Retrieves the metadata from the service using a JSON-p call.
 * When the service responds the callback function will be called.
 * @param url, url of the target document
 * @param callback, name of the function to be called from the JSON-p call
 */
MetadataRenderer.getMetadata = function(url, callback)
{
	var serviceURL = SEMANTIC_SERVICE_URL + "metadata.jsonp?callback=" + callback + "&url=" + encodeURIComponent(url)
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
	MetadataRenderer.doJSONPCall(SEMANTIC_SERVICE_URL + "mmd.jsonp?callback=" + callback + "&name=" + type);
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
	MDC_rawMetadata = JSON.parse(JSON.stringify(rawMetadata));
	updateJSON(true);
	
	var metadata = {};
	for(i in rawMetadata)
	{
		metadata = rawMetadata[i];		
		metadata.mm_name = i;
	}
	
	simplDeserialize(metadata);

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
		for(var i = 0; i < metadata["additional_locations"].length; i++)
		{
			var additional_location = metadata["additional_locations"][i]
			queueTask = MetadataRenderer.getTaskFromQueueByUrl(additional_location);
			
			if(queueTask)
				break;
		}
	}
	
	if(queueTask)
	{
		if(metadata["additional_locations"])
			queueTask.additionalUrls = metadata["additional_locations"];
		
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
	MDC_rawMMD = JSON.parse(JSON.stringify(mmd));
	//updateJSON(false);
	
	simplDeserialize(mmd);
	
	//console.log("Retrieved meta-metadata: " + mmd["meta_metadata"].name);
	var tasks = MetadataRenderer.getTasksFromQueueByType(mmd["meta_metadata"].name);
	
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
		console.error("Retreived meta-metadata: " + mmd["meta_metadata"].name + "  but it doesn't match a document from the queue.");
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
	MetadataRenderer.currentDocumentLocation = task.url;
	var metadataTable = MetadataRenderer.buildMetadataDisplay(task.isRoot, task.mmd, task.metadata)
	
	if(metadataTable)
	{
		// Clear out the container so that it will only contain the new metadata table
		while (task.container.hasChildNodes())
		    task.container.removeChild(task.container.lastChild);
		    
		// Add the HTML5 canvas for the drawing of connection lines
		var canvas = document.createElement("canvas");
			canvas.className = "lineCanvas";
		
		// Add the table and canvas to the interior container
		task.visual.appendChild(metadataTable);
		task.visual.appendChild(canvas);
		
		// Add the interior container to the root contianer
		task.container.appendChild(task.visual);
		
		// Create and add a new DocumentContainer to the list
		MetadataRenderer.documentMap.push( new DocumentContainer(task.url, task.additionalUrls, task.container, true));
	
		// Remove any highlighting of documents as the addition of the new table will cause the connection-lines to be out of place
		MetadataRenderer.unhighlightDocuments(null);
		
		// For the WWW study, log the expansion of metadata
		if(WWWStudy)
			// Log the addition of the metadata rendering so that metadata expansions can be tracked
			WWWStudy.logExpansion(task.metadata, task.container);		
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
	for(var i = 0; i < MetadataRenderer.documentMap.length; i++)
		if(MetadataRenderer.documentMap[i].matches(url) && MetadataRenderer.documentMap[i].rendered)
			return true;
			
	return false;
}

/**
 * Iterates through the simpl Object to match up the simpl IDs and simpl references
 * @param simplObj, object to deserialize
 */
function simplDeserialize(simplObj)
{
	var simplReferences = [];
	var simplId = "simpl.id";
	var simplRef = "simpl.ref";
	var idCount = 0;
	var refCount = 0;

	function recurse(currentObj, parentObj, parentFieldName, level)
	{
		var skipRecursion = false;
		
		if((typeof currentObj) != 'object' || currentObj == null)
		{
			return;
		}
		
		if(simplId in currentObj)
		{
			//console.info(parentFieldName + " ------------ Adding ref: " + currentObj[simplId] + " [" + ++idCount +"]");
			simplReferences[currentObj[simplId]] = currentObj;
			delete currentObj[simplId];
		}
		
		else if(simplRef in currentObj)
		{
			var ref = currentObj[simplRef];
			if(ref in simplReferences)
			{
				//console.info(parentFieldName + "---------- Resolving Ref: " + ref + " [" + ++refCount +"]");
				//Replace field in the parent with the simplRef
				if(parentObj instanceof Array) //Never happens?
				{
					//console.info("parentObj is an Array!");
					var index = parentObj.indexOf(currentObj)
					if(index == -1)
					{
						//console.info("Item not found in parent!");
					}
					else
					{
						//console.info("Replacing item at index: " + index);
						parentObj[index] = simplReferences[ref];
					}					
				}
				else
				{
					//console.info("Replacing item with name: " + parentFieldName + " with reference" + ref);
					parentObj[parentFieldName] = simplReferences[ref];
				}
			}
			else 
				//console.info("No Such Reference: " + ref);
				
			skipRecursion = true;
		}

		if(!skipRecursion)
		{
			for(var fieldName in currentObj)
			{
				if(!currentObj.hasOwnProperty(fieldName))
				{
					//console.info("Found shitty props");
					continue;
				}
				var field = currentObj[fieldName];
				if(field instanceof Array)
				{
					for(var i = 0; i < field.length; i++)// arrayItem in field)
					{
						recurse(field[i], field, fieldName, level + 1);
					}
				}
				else if(field instanceof Object)
				{
					recurse(field, currentObj, fieldName, level + 1);
				}
			}
		}
	}	
    recurse(simplObj, null, null, 0);
}

/**
 * RenderingTask represents a metadata rendering that is in progress of being downloaded and parsed
 * @param url of the document
 * @param container, HTML container which will hold the rendering
 * @param isRoot, true if this is the root document for a metadataRendering
 */
function RenderingTask(url, container, isRoot)
{
	if(url != null)
		this.url = url.toLowerCase();
	
	this.container = container;
	
	this.metadata = null;	
	this.mmd = null;
	
	this.isRoot = isRoot;
}

/**
 * Does the given url match the RenderingTask's url?
 * @param url, url to check against the RenderingTask
 */
RenderingTask.prototype.matches = function(url)
{
	url = url.toLowerCase();
	if(this.url.indexOf(url) == 0)
		return true;
		
	else if(url.indexOf(this.url) == 0)
		return true;

	return false;
}

/** MetadataField and related functions **/

// Constant for how deep to recurse through the metadata
var METADATA_FIELD_MAX_DEPTH = 7;

/**
 * MetadataField represents a parsed metadata field combining presentation/interaction rules from
 * meta-metadata with the metadata value
 * @param mmdField, meta-metadata field object
 */
function MetadataField(mmdField)
{
	this.name = (mmdField.label != null) ? mmdField.label : mmdField.name;
	this.value = "";
					
	this.layer = (mmdField.layer != null) ? mmdField.layer : 0.0;
	this.style = (mmdField.style != null) ? mmdField.style : "";
}

/**
 * Checks if the given list of MetadataFields has any visible fields 
 * @param metadata, array of MetadataFields to search for visible fields
 * @return true if there are visible fields, false otherwise
 */
MetadataRenderer.hasVisibleMetadata = function(metadata)
{
	for(var key in metadata)	
		if(metadata[key].value)
		{
			// if the field is an array with at least one element
			if(metadata[key].value.length != null && metadata[key].value.length > 0)
				return true;

			// if the field is not an array
			else if(metadata[key].value.length == null)
				return true;
		}
	
	return false;
}

/**
 * Searches an array of MetadataFields to find the document's location 
 * @param metadata, array of MetadataFields
 */
MetadataRenderer.guessDocumentLocation = function(metadata)
{
	var location = "";
	
	for(var i = 0; i < metadata.length; i++)
		// the document's location is typically the navigation target of the 'title' or 'name' field
		if(metadata[i].name == "title" || metadata[i].name == "name")
			if(metadata[i].navigatesTo != null)
				location = metadata[i].navigatesTo;
	
	//console.log("guessing document location: " + location);
	return location;
}

/**
 * Iterates through the meta-metadata, creating MetadataFields by matching meta-metadata fields to metadata values 
 * @param mmdKids, array of meta-metadata fields
 * @param metadata, metadata object from the service
 * @param depth, current depth level
 */
MetadataRenderer.getMetadataFields = function(mmdKids, metadata, depth)
{
	var metadataFields = [];
	
	// Stop recursing at the max depth
	if(depth >= METADATA_FIELD_MAX_DEPTH)
		return metadataFields;
		
	for(var key in mmdKids)
	{		
		var mmdField = mmdKids[key];
		
		if(mmdField.scalar)
		{
			mmdField = mmdField.scalar;
			
			// Is this a visible field?
			if(MetadataRenderer.isFieldVisible(mmdField))
			{				
				// Is there a metadata value for this field?		
				var value = MetadataRenderer.getFieldValue(mmdField, metadata);				
				if(value)
				{		
					var field = new MetadataField(mmdField);
					
					field.value = value; 
										
					field.scalar_type = mmdField.scalar_type;
					field.parentMDType = metadata.mm_name;	
								
					// Does the field have a navigation link?
					if(mmdField.navigates_to != null)
					{
						var navigationLink = metadata[mmdField.navigates_to];
						
						// Is there a value for the navigation link
						if(navigationLink != null && (navigationLink.toLowerCase() != MetadataRenderer.currentDocumentLocation || depth == 0))
							field.navigatesTo = navigationLink;
					}
								
					metadataFields.push(field);
				}
			}
		}		
		else if(mmdField.composite)
		{
			mmdField = mmdField.composite;
			
			// Is this a visible field?
			if(MetadataRenderer.isFieldVisible(mmdField))
			{				
				// Is there a metadata value for this field?		
				var value = MetadataRenderer.getFieldValue(mmdField, metadata);	
				if(value)
				{		
					// If there is an array of values						
					if(value.length != null)
					{						
						for(var i = 0; i < value.length; i++)
						{
							var field = new MetadataField(mmdField);
							
							field.value = MetadataRenderer.getMetadataFields(mmdField["kids"], value[i], depth + 1);
							
							field.composite_type = mmdField.type;
							field.parentMDType = metadata.mm_name;							
							
							metadataFields.push(field);
						}
					}
					else
					{
						var field = new MetadataField(mmdField);
						
						field.value = MetadataRenderer.getMetadataFields(mmdField["kids"], value, depth + 1);
						
						field.composite_type = mmdField.type;
						field.parentMDType = metadata.mm_name;						
						
						metadataFields.push(field);
					}
				}
			}
		}
		
		else if(mmdField.collection != null)
		{
			mmdField = mmdField.collection;	
			
			// Is this a visible field?
			if(MetadataRenderer.isFieldVisible(mmdField))
			{		
				// Is there a metadata value for this field?		
				var value = MetadataRenderer.getFieldValue(mmdField, metadata);	
				if(value)
				{				
					var field = new MetadataField(mmdField);
					
					field.child_type = (mmdField.child_tag != null) ? mmdField.child_tag : mmdField.child_type;
					field.parentMDType = metadata.mm_name;
											
					// If scalar collection
					if(mmdField.child_scalar_type != null)
					{
						console.log("scalar collectiohdc");
						
						var newObject = {};
						newObject[field.child_type] = value;
						value = newObject;	
						
						console.log(value);
					}		
					// Else if it's a polymorphic collection
					else if(mmdField.polymorphic_scope != null)
					{						
						var newObject = {};
						var newArray = [];
						
						for(var i = 0; i < value.length; i++)
						{
							for(k in value[i])
							{
								newArray.push(value[i][k]);
								continue;
							}
						}
						
						newObject[field.child_type] = newArray;
						value = newObject;	
					}
					// Else, it must be a monomorphic collection
					else
					{
						var newObject = {};
						newObject[field.child_type] = value;
						value = newObject;						
					}
					
					field.value = MetadataRenderer.getMetadataFields(mmdField["kids"], value, depth + 1);
					
					
					metadataFields.push(field);
				}
			}
		}		
	}
		
	//Sort the fields by layer, higher layers first
	metadataFields.sort(function(a,b){return b.layer - a.layer});
	return metadataFields;
}

MetadataRenderer.isFieldVisible = function(mmdField)
{
	return mmdField.hide == null || mmdField.hide == false;
}

MetadataRenderer.getFieldValue = function(mmdField, metadata)
{
	var valueName = (mmdField.tag != null) ? mmdField.tag : mmdField.name;				
	return metadata[valueName];
}

/** Functions related to the interactions of the metadata HTML **/

/**
 * Expand or collapse a collection or composite field table.
 * @param event, mouse click event 
 */
MetadataRenderer.expandCollapseTable = function(event)
{
	var button = event.target;
	
	if(button.className == "collapseSymbol" || button.className == "expandSymbol")
		button = button.parentElement;
		
	// Use the symbold to check if the table should expand or collapse
	var expandSymbol = button.getElementsByTagName("div")[0];
	if(expandSymbol.style.display == "block")
	{
		expandSymbol.style.display = "none";		
		MetadataRenderer.expandTable(MetadataRenderer.getTableForButton(button));
	}
	else if(expandSymbol.style.display == "none")
	{
		expandSymbol.style.display = "block";					
		MetadataRenderer.collapseTable(MetadataRenderer.getTableForButton(button));
	}	
}

/**
 * Get the table that corresponds to the given button through the DOM
 * @param button, HTML object of the button
 * @return corresponding table HTML object  
 */
MetadataRenderer.getTableForButton = function(button)
{
	var table = button.parentElement.parentElement.parentElement.getElementsByTagName("td")[1];
		
	while(table.rows == null)
		table = table.firstChild;
		
	while(table.rows.length == 0)
		table = table.getElementsByTagName("table")[0];
		
	return table;
}

/**
 * Expand the table, showing all of its rows
 * @param table to expand 
 */
MetadataRenderer.expandTable = function(table)
{
	for (var i = 0; i < table.rows.length; i++)
		table.rows[i].style.display = "table";

	// Remove any loading rows, just to be sure 	
	MetadataRenderer.clearLoadingRows(table);
	
	// Unlight the documents because the connection lines will be in the wrong place
	MetadataRenderer.unhighlightDocuments(null);
	
	// Check for More and expand it
	if(table.lastChild.lastChild.lastChild.className == "moreButton")
		MetadataRenderer.morePlease({"target": table.lastChild.lastChild.lastChild});
}

/**
 * Collapse the table, showing only the first row
 * @param table to collapse 
 */
MetadataRenderer.collapseTable = function(table)
{
	for (var i = 0; i < table.rows.length; i++)
	{
		if(i == 0)
			table.rows[i].style.display = "table";
		else
			table.rows[i].style.display = "none";
	}
	
	// Remove any loading rows, just to be sure 	
	MetadataRenderer.clearLoadingRows(table);
	
	// Unlight the documents because the connection lines will be in the wrong place
	MetadataRenderer.unhighlightDocuments(null);
}

/**
 * Remove any loadingRows from the container
 * @param container to remove loadingRows from
 */
MetadataRenderer.clearLoadingRows = function(container)
{
	var divs = container.getElementsByTagName("div");
	for( var i = 0; i < divs.length; i++)
		if(divs[i].className == "loadingRow")
			divs[i].parentElement.removeChild(divs[i]);
}

/**
 * Queue the target document for downloading and display
 * @param event, mouse click event
 */
MetadataRenderer.downloadAndDisplayDocument = function(event)
{
	var button = event.target;
	
	if(button.className == "collapseSymbol" || button.className == "expandSymbol")
		button = button.parentElement;
	
	// Update button visuals
	var expandSymbol = button.getElementsByTagName("div")[0];
		expandSymbol.style.display = "none";
	
	// Change the onclick function of the button to expand/collapse the table
	button.onclick = MetadataRenderer.expandCollapseTable;
	
	var table = MetadataRenderer.getTableForButton(button);
		
	// Search the table for the document location
	var location = null;
	for (var i = 0; i < table.rows.length; i++)
	{
		var valueCol = table.rows[i].getElementsByTagName("td")[1];
		if(valueCol)
		{
			var valueDiv = valueCol.getElementsByTagName("div")[0];
			if(valueDiv)
				for (var j = 0; j < valueDiv.childNodes.length; j++)
					if(valueDiv.childNodes[j].href != null && valueDiv.childNodes[j].className != "citeULikeButton" && location == null)
						location = valueDiv.childNodes[j].href;
		}
	}

	// Did the table have a document location?
	if(location)
	{
		// Add a loadingRow for visual feedback that the metadata is being downloaded / parsed
		table.appendChild(MetadataRenderer.createLoadingRow());
		
		MetadataRenderer.addMetadataDisplay(table.parentElement, location, false);
	}
	// If there was no document location then the table must be a non-document composite in which case just expand
	else
		MetadataRenderer.expandTable(table);
}

/**
 * Finds matching documents, highlights them, and draws connecting lights
 * @param event, mouse enter event 
 */
MetadataRenderer.highlightDocuments = function(event)
{
	var row = event.srcElement;
	if(row.className == "expandButton")
		row = row.parentElement;
	
	// Only fieldLabelContainer or fieldLabelContainerOpened rows can be highlighted
	if(row.className == "fieldLabelContainerOpened" || row.className == "fieldLabelContainer")
	{
		// Highlight row
		MetadataRenderer.highlightLabel(row);
		
		var table = row.parentElement.parentElement.getElementsByTagName("td")[1];
		
		// Search the table for a document location
		var location = null;
		
		var aTags = table.getElementsByTagName("a");
		for (var i = 0; i < aTags.length; i++)
		{
			if(aTags[i].className == "fieldValue")
			{
				location = aTags[i].href;
				break;
			}
		}
		// Did the table have a document location?
		if(location != null)
		{	
			MetadataRenderer.clearAllCanvases();		
						
			// Find matches in the DocumentMap
			var matches = [];
			for(var i = 0; i < MetadataRenderer.documentMap.length; i++)
			{
				if(MetadataRenderer.documentMap[i].matches(location))
				{
					if(MetadataRenderer.documentMap[i].container.style.display != "none")
						matches.push(MetadataRenderer.documentMap[i].container);
				}	
			}
			
			//console.log(location);
			// Draw the lines to each match
			for(var i = 0; i < matches.length; i++)			
			{
				MetadataRenderer.drawConnectionLine(matches[i], row);		
			}			
		}
	}
	return false;
}

/**
 * Highlights the given label
 * @param label, HTML object to add the styling to 
 */
MetadataRenderer.highlightLabel = function(label)
{
	label.style.background = "white";
	label.style.border = "1px solid #555";
	label.style.minHeight = "15px";
	label.style.height = "17px";	
}

/**
 * Unhighlights the given label
 * @param label, HTML object to change the styling of
 */
MetadataRenderer.unhighlightLabel = function(label)
{
	label.style.background = "#666";
	label.style.border = "";
	label.style.minHeight = "19px";	
}

// Constant offsets for the connection-lines
var METADATA_LINE_X_OFFSET = 6;
var METADATA_LINE_Y_OFFSET = 9;

/**
 * Draw a line connecting the target to the source
 * @param target HTML object
 * @param source HTML source
 */
MetadataRenderer.drawConnectionLine = function(target, source)
{
	// Get the first label of the target
	var label = target.getElementsByClassName("fieldLabel")[0];
	
	// Highlight the target label
	MetadataRenderer.highlightLabel(label.parentElement);

	// Get the canvas
	var canvas = null;
	
	if(WWWStudy)
		canvas = document.getElementById("bigLineCanvas");
	
	else
	{
		var canvases = document.getElementsByClassName("lineCanvas");
		
		// TODO - fix canvas finding, needs to find the least common canvas,
		// the smallest canvas that contains both target and source
		/*
		for(var i = canvases.length - 1; i >= 0; i--)
		{	
			canvases[i];	
		}
		*/
		// for the moment just use the biggest canvas
		canvas = canvases[canvases.length - 1];		
	}
		
	var startRect = label.getClientRects()[0];
	var endRect = source.getClientRects()[0];	
		
	// Don't draw the line if the source and target are in the same container
	if(canvas != null && Math.abs(startRect.top - endRect.top) > 12)
	{	
		var ctx = canvas.getContext('2d');
			
		var containerRect = canvas.parentElement.getClientRects()[0];
						
		ctx.moveTo(startRect.left - containerRect.left + METADATA_LINE_X_OFFSET, startRect.top - containerRect.top + METADATA_LINE_Y_OFFSET);
		ctx.lineTo(1, startRect.top - containerRect.top + METADATA_LINE_Y_OFFSET);
		ctx.lineTo(1, endRect.top - containerRect.top + METADATA_LINE_Y_OFFSET);
		ctx.lineTo(endRect.left - containerRect.left + METADATA_LINE_X_OFFSET, endRect.top - containerRect.top + METADATA_LINE_Y_OFFSET);
		ctx.strokeStyle = "rgba(200, 44, 4, 0.4)";
		ctx.lineWidth = 3;
		ctx.lineCap = "round";
		ctx.stroke();
	}
}

MetadataRenderer.clearAllCanvases = function()
{
	if(WWWStudy)
		WWWStudy.clearBigCanvas();
	else
	{
		var canvases = document.getElementsByClassName("lineCanvas");
		for(var i = 0; i < canvases.length; i++)
		{
			var containerRect =  canvases[i].parentElement.getClientRects()[0];
			
			if(containerRect != null)
			{
				canvases[i].width = containerRect.width;
				canvases[i].height = containerRect.height;
			}
		}
	}
}

/**
 * Unhighlights all documents, reverting highlight styling and clearing canvases 
 * @param event, mouse exit event
 */
MetadataRenderer.unhighlightDocuments = function(event)
{
	var labels = document.getElementsByClassName("fieldLabelContainerOpened");
	for(var i = 0; i < labels.length; i++)
	{
		MetadataRenderer.unhighlightLabel(labels[i]);
		labels[i].style.background = "white";
	}
	
	labels = document.getElementsByClassName("fieldLabelContainer");
	for(var i = 0; i < labels.length; i++)
		MetadataRenderer.unhighlightLabel(labels[i]);
	
	MetadataRenderer.clearAllCanvases();
}

/**
 * Creat the HTML for the laadingRow
 * @return HTML TR object for the lodaing row
 */
MetadataRenderer.createLoadingRow = function()
{
	var row = document.createElement('tr');
	
	var loadingRow = document.createElement('div');
		loadingRow.className = "loadingRow";
		loadingRow.innerText = "Loading document...";
		loadingRow.textContent = "Loading document...";
		
	row.appendChild(loadingRow);
	return row;
}

MetadataRenderer.morePlease = function(event)
{
	var moreData = JSON.parse(event.target.lastChild.textContent);
	
	var parentRow =  event.target.parentElement.parentElement;
	var parentTable = parentRow.parentElement;
	
	//remove More Button	
	parentTable.removeChild(parentRow);
	
	// Build and add extra rows
	MetadataRenderer.buildMetadataTable(parentTable, moreData.isChild, false, moreData.data, moreData.fields);		
}

/**
 * DocumentContain represents a document that is part of a MetadataRendering
 * @param url, location of the document, serves as the document ID
 * @param container, HTML object which contains the rendering of this document
 * @param rendered, true if the document has been downloaded and displayed, false otherwise
 */
function DocumentContainer(url, additionalUrls, container, rendered)
{
	this.urls = [];
	this.urls.push(url.toLowerCase());
	
	if(additionalUrls)
	{
		for(var i = 0; i < additionalUrls.length; i++)
		{
			this.urls.push(additionalUrls[i].toLowerCase());
		}
	}
		
	this.container = container;
	this.rendered = rendered;
}

/**
 * Does the given url match the DocumentContainer's?
 * @param url, url to check against the DocumentContainer
 */
DocumentContainer.prototype.matches = function(url)
{
	url = url.toLowerCase();
	for(var i = 0; i < this.urls.length; i++)
	{
		if(this.urls[i].length > 1)
		{		
			if(this.urls[i].indexOf(url) == 0)
			{
				return true;
			}
			else if(url.indexOf(this.urls[i]) == 0)
			{
				return true;
			}
		}
	}
	return false;
}

var FIRST_LEVEL_FIELDS = 20;
var FIELDS_TO_EXPAND = 10;

/** Functions related to the creation of the metadata HTML **/

/**
 * Converts the metadata into a set of metadataFields using the meta-metadata.
 * If there is visible metadata then create and return the HTML table.
 * @param isRoot, is the metadata the root document in the container (for styling)
 * @param mmd, meta-metadata for the given metadata
 * @param metadata, metadata to display
 * @return table, HTML table for the metadata or null if there is no metadata to display
 */
MetadataRenderer.buildMetadataDisplay = function(isRoot, mmd, metadata)
{
	// Convert the metadata into a list of MetadataFields using the meta-metadata.
	var metadataFields = MetadataRenderer.getMetadataFields(mmd["meta_metadata"]["kids"], metadata, 0);
	
	// Is there any visable metadata?
	if(MetadataRenderer.hasVisibleMetadata(metadataFields))
		// If so, then build the HTML table	
		return MetadataRenderer.buildMetadataTable(null, false, isRoot, metadataFields, FIRST_LEVEL_FIELDS);		
		
	else
		// The metadata doesn't contain any visible fields so there is nothing to display
		return null;	
}

/**
 * Build the HTML table for the list of MetadataFields
 * @param table, the table that the metadata fields should be rendered to, null if the table should be created
 * @param isChildTable, true if the table belongs to a collection table, false otherwise
 * @param isRoot, true if table is the root table of the MetadataRendering
 * @param metadataFields, array of MetadataFields to be displayed
 * @param fieldCount, the number of fields to render before cropping with a "More" button
 * @return HTML table of the metadata display
 */
MetadataRenderer.buildMetadataTable = function(table, isChildTable, isRoot, metadataFields, fieldCount)
{
	if(!table)
	{
		table = document.createElement('table');
		
		if(!isRoot)
			table.className = "metadataTable";
	}
	
	// Iterate through the metadataFields which are already sorted into display order
	for(var i = 0; i < metadataFields.length; i++)
	{			
		
		var row = document.createElement('tr');
		var nameCol = document.createElement('td');
			nameCol.className = "labelCol";
			
		var valueCol = document.createElement('td');
			valueCol.className = "valueCol";
			
			
		// if the maximum number of fields have been rendered then stop rendering and add a "More" expander
		if(fieldCount <= 0)
		{
			//TODO - add "more" expander
			var moreCount = metadataFields.length - i;
			
			var fieldValueDiv = document.createElement('div');
				fieldValueDiv.className = "moreButton";
				fieldValueDiv.textContent = "More... ("+moreCount+")";
				fieldValueDiv.onclick = MetadataRenderer.morePlease;
						
			var moreData = {
				"fields": FIELDS_TO_EXPAND,
				"isChild": isChildTable,
				"data": metadataFields.slice(i, metadataFields.length)
			};
			
			
			
			var detailsSpan = document.createElement('span');
				detailsSpan.className = "hidden";
				detailsSpan.textContent = JSON.stringify(moreData);
			
			fieldValueDiv.appendChild(detailsSpan);
			
			valueCol.appendChild(fieldValueDiv);
								
			row.appendChild(nameCol);
			row.appendChild(valueCol);				
			
			table.appendChild(row);
			
			break;
		} 
			
		var metadataField = metadataFields[i];
		
		if(metadataField.value)
		{
			// If the field is an empty array then move on to the next field
			if(	metadataField.value.length != null && metadataField.value.length == 0)
				continue;
			
			if(metadataField.scalar_type)
			{				
				// Currently it only rendered Strings, Dates, Integers, and ParsedURLs
				if(metadataField.scalar_type == "String" || metadataField.scalar_type == "Date" ||metadataField.scalar_type == "Integer" || metadataField.scalar_type == "ParsedURL")
				{	
					if(metadataField.name)
					{
						var fieldLabel = document.createElement('p');
							fieldLabel.className = "fieldLabel";
							fieldLabel.innerText = MetadataRenderer.toDisplayCase(metadataField.name);
							fieldLabel.textContent = MetadataRenderer.toDisplayCase(metadataField.name);
						
						var fieldLabelDiv = document.createElement('div');
							fieldLabelDiv.className = "fieldLabelContainer";
						
						fieldLabelDiv.appendChild(fieldLabel);
						nameCol.appendChild(fieldLabelDiv);
					}
					
					// If the field is a URL then it should show the favicon and an A tag
					if(metadataField.scalar_type == "ParsedURL")
					{
						// Uses http://getfavicon.appspot.com/ to resolve the favicon
						var favicon = document.createElement('img');
							favicon.className = "favicon";
							favicon.src = "http://g.etfv.co/" + MetadataRenderer.getHost(metadataField.navigatesTo);
						
						var aTag = document.createElement('a');
						aTag.innerText = MetadataRenderer.removeLineBreaksAndCrazies(metadataField.value);
						aTag.textContent = MetadataRenderer.removeLineBreaksAndCrazies(metadataField.value);
						
						aTag.href = metadataField.value;
						aTag.className = "fieldValue";
					
						var fieldValueDiv = document.createElement('div');
							fieldValueDiv.className = "fieldValueContainer";
						
						fieldValueDiv.appendChild(favicon);
						fieldValueDiv.appendChild(aTag);
						valueCol.appendChild(fieldValueDiv);
					}
				
					// If the field navigates to a link then it should show the favicon and an A tag
					else if( metadataField.navigatesTo)
					{				
						// Uses http://getfavicon.appspot.com/ to resolve the favicon
						var favicon = document.createElement('img');
							favicon.className = "favicon";
							favicon.src = "http://g.etfv.co/" + MetadataRenderer.getHost(metadataField.navigatesTo);
						
						var aTag = document.createElement('a');
							aTag.className = "fieldValue";
							aTag.target = "_blank";
							aTag.innerText = MetadataRenderer.removeLineBreaksAndCrazies(metadataField.value);
							aTag.textContent = MetadataRenderer.removeLineBreaksAndCrazies(metadataField.value);
							
							aTag.href = metadataField.navigatesTo;
						
						var fieldValueDiv = document.createElement('div');
							fieldValueDiv.className = "fieldValueContainer";						
						
						// For the current WWW study the rendering should have incontext CiteULike bookmarklets for specific types of metadata
						if(WWWStudy)				
							WWWStudy.addCiteULikeButton(fieldValueDiv, metadataField.parentMDType, metadataField.navigatesTo)						
						
						fieldValueDiv.appendChild(favicon);
						fieldValueDiv.appendChild(aTag);
						valueCol.appendChild(fieldValueDiv);
					}
					
					// If there is no navigation then just display the field value as text
					else
					{
						var fieldValue = document.createElement('p');
							fieldValue.className = "fieldValue";
							fieldValue.innerText = MetadataRenderer.removeLineBreaksAndCrazies(metadataField.value);
							fieldValue.textContent = MetadataRenderer.removeLineBreaksAndCrazies(metadataField.value);
							
						var fieldValueDiv = document.createElement('div');
							fieldValueDiv.className = "fieldValueContainer";
						
						fieldValueDiv.appendChild(fieldValue);
						valueCol.appendChild(fieldValueDiv);
					}
															
					row.appendChild(nameCol);
					row.appendChild(valueCol);
					
					fieldCount--;
				}		
			}
			
			else if(metadataField.composite_type != null)
			{
				/** Label Column **/
				var childUrl = MetadataRenderer.guessDocumentLocation(metadataField.value);
				
				var fieldLabelDiv = document.createElement('div');
					fieldLabelDiv.className = "fieldLabelContainer";
					fieldLabelDiv.style.minWidth = "36px";					
					
				// Is the document already rendered?								
				if(childUrl != "" && MetadataRenderer.isRenderedDocument(childUrl) )
				{
					// If so, then don't allow the document to be expaned, to prevent looping						
					fieldLabelDiv.className = "fieldLabelContainerOpened";				
				}
				else
				{
					// If the document hasn't been download then display a button that will download it
					var expandButton = document.createElement('div');
						expandButton.className = "expandButton";
						
					expandButton.onclick = MetadataRenderer.downloadAndDisplayDocument;
					
					if(childUrl != "")
					{
						expandButton.onmouseover = MetadataRenderer.highlightDocuments;
						expandButton.onmouseout = MetadataRenderer.unhighlightDocuments;
					}
							
					var expandSymbol = document.createElement('div');
						expandSymbol.className = "expandSymbol";
						expandSymbol.style.display = "block";
						
					var collapseSymbol = document.createElement('div');
						collapseSymbol.className = "collapseSymbol";
						collapseSymbol.style.display = "block";						
										
					expandButton.appendChild(expandSymbol);
					expandButton.appendChild(collapseSymbol);
					fieldLabelDiv.appendChild(expandButton);
				}
				
				if(metadataField.name)
				{													
					//If the table isn't a child table then display the label for the composite
					if(!isChildTable)
					{
						var fieldLabel = document.createElement('p');
							fieldLabel.className = "fieldLabel";
							fieldLabel.innerText = MetadataRenderer.toDisplayCase(metadataField.name);
							fieldLabel.textContent = MetadataRenderer.toDisplayCase(metadataField.name);
						
						fieldLabelDiv.appendChild(fieldLabel);
					}
				}
				
				nameCol.appendChild(fieldLabelDiv);
				
				/** Value Column **/
				
				var fieldValueDiv = document.createElement('div');
					fieldValueDiv.className = "fieldCompositeContainer";

				// Build the child table for the composite
				var childTable =  MetadataRenderer.buildMetadataTable(null, false, false, metadataField.value, 1);
				
				// If the childTable has more than 1 row, collapse table
				if(metadataField.value.length > 1)
					MetadataRenderer.collapseTable(childTable);			
				
				fieldValueDiv.appendChild(childTable);				
				
				var nestedPad = document.createElement('div');
					nestedPad.className = "nestedPad";
				
				nestedPad.appendChild(childTable);
				
				fieldValueDiv.appendChild(nestedPad);
				
				valueCol.appendChild(fieldValueDiv);
				
				// Add the unrendered document to the documentMap
				if(childUrl != "")
					MetadataRenderer.documentMap.push(new DocumentContainer(childUrl, null, row, false));
				
				// Add event handling to highlight document connections	
				if(childUrl != "")
				{	
					nameCol.onmouseover = MetadataRenderer.highlightDocuments;
					nameCol.onmouseout = MetadataRenderer.unhighlightDocuments;
				}
				
				row.appendChild(nameCol);
				row.appendChild(valueCol);
				
				fieldCount--;
			}
			
			else if(metadataField.child_type != null)
			{		
				if(metadataField.name != null)
				{
					var fieldLabel = document.createElement('p');
						fieldLabel.className = "fieldLabel";
						fieldLabel.innerText = MetadataRenderer.toDisplayCase(metadataField.name) + "(" + metadataField.value.length + ")";
						fieldLabel.textContent = MetadataRenderer.toDisplayCase(metadataField.name) + "(" + metadataField.value.length + ")";
												
					var fieldLabelDiv = document.createElement('div');
							fieldLabelDiv.className = "fieldLabelContainer";
					
					// does it need to expand / collapse
					if(metadataField.value.length > 1)
					{
						var expandButton = document.createElement('div');
							expandButton.className = "expandButton";
							
							expandButton.onclick = MetadataRenderer.expandCollapseTable;
							
							var expandSymbol = document.createElement('div');
								expandSymbol.className = "expandSymbol";
								expandSymbol.style.display = "block";
								
							var collapseSymbol = document.createElement('div');
								collapseSymbol.className = "collapseSymbol";
								collapseSymbol.style.display = "block";						
						
							expandButton.appendChild(expandSymbol);
							expandButton.appendChild(collapseSymbol);
							
						fieldLabelDiv.appendChild(expandButton);
					}						
					fieldLabelDiv.appendChild(fieldLabel);
					nameCol.appendChild(fieldLabelDiv);
				}
					
				var fieldValueDiv = document.createElement('div');
					fieldValueDiv.className = "fieldChildContainer";
				
				var childTable =  MetadataRenderer.buildMetadataTable(null, true, false, metadataField.value, 1);
				if(metadataField.value.length > 1)
				{
					MetadataRenderer.collapseTable(childTable);			
				}					
					
				var nestedPad = document.createElement('div');
					nestedPad.className = "nestedPad";
				
				nestedPad.appendChild(childTable);
				
				fieldValueDiv.appendChild(nestedPad);
				
				valueCol.appendChild(fieldValueDiv);
								
				row.appendChild(nameCol);
				row.appendChild(valueCol);
				
				fieldCount--;
			}		
			table.appendChild(row);
		}
	}	
	return table;
}

/** 
 * Make the string prettier by replacing underscores with spaces  
 * @param string to make over
 * @return hansome string, a real genlteman
 */
MetadataRenderer.toDisplayCase = function(string)
{	
	var strings = string.split('_');
	var display = "";
	for(var s in strings)
		display += strings[s].charAt(0).toLowerCase() + strings[s].slice(1) + " ";

	return display;
}

/**
 * Remove line breaks from the string and any non-ASCII characters
 * @param string
 * @return a string with no line breaks or crazy characters
 */
MetadataRenderer.removeLineBreaksAndCrazies = function(string)
{
	string = string.replace(/(\r\n|\n|\r)/gm," ");	
	var result = "";
	for (var i = 0; i < string.length; i++)
        if (string.charCodeAt(i) < 128)
            result += string.charAt(i);
 
	return result;
}

/**
 * Gets the host from a URL
 * @param url, string of the target URL
 * @return host as a string
 */
MetadataRenderer.getHost = function(url)
{
	if(url)
	{
		var host = url.match(/:\/\/(www\.)?(.[^/:]+)/)[2];
		return "http://" + host;
	}
}