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

// Logging function
MetadataRenderer.LoggingFunction = null;

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
MetadataRenderer.addMetadataDisplay = function(container, url, isRoot, clipping)
{	
	// Add the rendering task to the queue
	var task = new RenderingTask(url, container, isRoot, clipping)
	MetadataRenderer.queue.push(task);	
	
	if(clipping != null && clipping.rawMetadata != null)
	{
		clipping.rawMetadata.deserialized = true;
		MetadataRenderer.setMetadata(clipping.rawMetadata);
	}
	else
	{	
		// Fetch the metadata from the service
		MetadataRenderer.getMetadata(url, "MetadataRenderer.setMetadata");	
	}
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
	if(typeof MDC_rawMetadata != "undefined")
	{
		MDC_rawMetadata = JSON.parse(JSON.stringify(rawMetadata));
		updateJSON(true);
	}
	
	
	var metadata = {};
	
	var deserialized = false;
	for(i in rawMetadata)
	{
		if(i != "simpl.id" && i != "simpl.ref" && i != "deserialized")
		{
			metadata = rawMetadata[i];		
			metadata.mm_name = i;
		}
		
		if(i == "deserialized")
		deserialized = true;
	}
	
	if(!deserialized)
		simplDeserialize(metadata);

	//console.log("Retreived metadata: "+metadata.location);
	
	// Match the metadata with a task from the queue
	var queueTasks = [];
	
	if(metadata.location)
		queueTasks = MetadataRenderer.getTasksFromQueueByUrl(metadata.location);

	// Check additional locations for more awaiting MICE tasks
	if(metadata["additional_locations"])
	{
		//console.log("checking additional locations");
		//console.log(MetadataRenderer.queue);
		//console.log(metadata["additional_locations"]);
		for(var i = 0; i < metadata["additional_locations"].length; i++)
		{
			var additional_location = metadata["additional_locations"][i]
			queueTasks = queueTasks.concat(MetadataRenderer.getTasksFromQueueByUrl(additional_location));			
		}
	}
	
	for(var i = 0; i < queueTasks.length; i++)
	{
		var queueTask = queueTasks[i];
		
		if(metadata["additional_locations"])
			queueTask.additionalUrls = metadata["additional_locations"];
		
		queueTask.metadata = metadata;
		queueTask.mmdType = metadata.mm_name;
	
		if(queueTask.clipping != null)
			queueTask.clipping.rawMetadata = rawMetadata;
				
		MetadataRenderer.getMMD(queueTask.mmdType, "MetadataRenderer.setMetaMetadata");
	}
	
	if(queueTasks.length < 0)
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
	if(typeof MDC_rawMMD != "undefined")
	{
		MDC_rawMMD = JSON.parse(JSON.stringify(mmd));
	}
	
	
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
	var metadataTable = MetadataRenderer.buildMetadataDisplay(task.isRoot, task.mmd, task.metadata, task.url)
	
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

MetadataRenderer.getTasksFromQueueByUrl = function(url)
{
	var list = [];
	for(var i = 0; i < MetadataRenderer.queue.length; i++)
		if(MetadataRenderer.queue[i].matches(url))
			list.push(MetadataRenderer.queue[i]);

	return list;
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
 * RenderingTask represents a metadata rendering that is in progress of being downloaded and parsed
 * @param url of the document
 * @param container, HTML container which will hold the rendering
 * @param isRoot, true if this is the root document for a metadataRendering
 */
function RenderingTask(url, container, isRoot, clipping)
{
	if(url != null)
		this.url = url.toLowerCase();
	
	this.container = container;
	this.clipping = clipping;
	
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
	this.mmdName = mmdField.name;
	this.value = "";
	this.value_as_label = "";
	
	this.layer = (mmdField.layer != null) ? mmdField.layer : 0.0;
	this.style_name = (mmdField.style_name != null) ? mmdField.style_name : "";
	
	this.hide_label = (mmdField.hide_label != null) ? mmdField.hide_label : false;
	this.label_at = mmdField.label_at;
	
	this.concatenates_to = mmdField.concatenates_to;
	this.concatenates = [];
	if (mmdField.concatenates != null)
	{
		for (var k = 0; k < mmdField.concatenates.length; k++)
			this.concatenates.push(mmdField.concatenates[k]);
	}
	this.extract_as_html = mmdField.extract_as_html;
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
 * looks up metadataFields collection for the instance, else creates new
 */
MetadataRenderer.getMetadataField = function(mmdField, metadataFields)
{
	for(var i = 0; i < metadataFields.length; i++)
	{
		if (metadataFields[i].mmdName == mmdField.name)
			return metadataFields[i];
	}
	return new MetadataField(mmdField);
}

/**
 * Iterates through the meta-metadata, creating MetadataFields by matching meta-metadata fields to metadata values 
 * @param mmdKids, array of meta-metadata fields
 * @param metadata, metadata object from the service
 * @param depth, current depth level
 */
MetadataRenderer.getMetadataFields = function(mmdKids, metadata, depth, child_value_as_label, taskUrl)
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
			if(MetadataRenderer.isFieldVisible(mmdField, metadata, taskUrl))
			{				
				// Is there a metadata value for this field?		
				var value = MetadataRenderer.getFieldValue(mmdField, metadata);				
				if(value)
				{	
					if (child_value_as_label != null)
						mmdField.use_value_as_label = child_value_as_label; 
										
					var field = MetadataRenderer.getMetadataField(mmdField, metadataFields);
										
					field.value = value;
					if (mmdField.use_value_as_label != null) 
						field.value_as_label = MetadataRenderer.getValueForProperty(mmdField.use_value_as_label, metadata, mmdKids, depth);
										
					field.scalar_type = mmdField.scalar_type;
					field.parentMDType = metadata.mm_name;	
								
					// Does the field have a navigation link?
					if(mmdField.navigates_to != null)
					{
						var navigationLink = metadata[mmdField.navigates_to];
						
						// Is there a value for the navigation link
						if(navigationLink != null && (navigationLink.toLowerCase() != taskUrl || depth == 0))
							field.navigatesTo = navigationLink;
					}
					
				
					
					if(mmdField.concatenates_to)
					{
						MetadataRenderer.concatenateField(field, metadataFields, mmdKids);
					}
					
					if (metadataFields.indexOf(field) == -1)
						metadataFields.push(field);
				}
			}
		}		
		else if(mmdField.composite)
		{
			mmdField = mmdField.composite;
			
			// Is this a visible field?
			if(MetadataRenderer.isFieldVisible(mmdField, metadata, taskUrl))
			{				
				// Is there a metadata value for this field?		
				var value = MetadataRenderer.getFieldValue(mmdField, metadata);	
				if(value)
				{	
					
					if (child_value_as_label != null)
						mmdField.use_value_as_label = child_value_as_label;
				
					// If there is an array of values						
					if(value.length != null)
					{						
						for(var i = 0; i < value.length; i++)
						{
							var field = new MetadataField(mmdField);
							
							field.value = MetadataRenderer.getMetadataFields(mmdField["kids"], value[i], depth + 1, null, taskUrl);
							if (mmdField.use_value_as_label != null)
								field.value_as_label = MetadataRenderer.getValueForProperty(mmdField.use_value_as_label, value[i], mmdField["kids"], depth + 1);
							
							field.composite_type = mmdField.type;
							field.parentMDType = metadata.mm_name;							
							MetadataRenderer.checkAndSetShowExpandedInitially(field, mmdField);
							MetadataRenderer.checkAndSetShowExpandedAlways(field, mmdField);
							
							metadataFields.push(field);
						}
					}
					else
					{
						var field = new MetadataField(mmdField);
												
						field.value = MetadataRenderer.getMetadataFields(mmdField["kids"], value, depth + 1, null, taskUrl);
						if (mmdField.use_value_as_label != null)
						{
							if (mmdField.child_value_as_label != null)
								field.value_as_label = MetadataRenderer.getValueForProperty(mmdField.use_value_as_label, value, mmdField["kids"], depth + 1);
							else
								field.value_as_label = MetadataRenderer.getValueForProperty(mmdField.use_value_as_label, metadata, mmdKids, depth + 1);
						}
						
						field.composite_type = mmdField.type;
						field.parentMDType = metadata.mm_name;						
						MetadataRenderer.checkAndSetShowExpandedInitially(field, mmdField);
						MetadataRenderer.checkAndSetShowExpandedAlways(field, mmdField);
						
						metadataFields.push(field);
					}
				}
			}
			else{
				if(value){
					MetadataRenderer.checkAndSetShowExpandedInitially(field, mmdField);
					MetadataRenderer.checkAndSetShowExpandedAlways(field, mmdField);
				}
			}
		}
		
		else if(mmdField.collection != null)
		{
			mmdField = mmdField.collection;	
			
			// Is this a visible field?
			if(MetadataRenderer.isFieldVisible(mmdField, metadata, taskUrl))
			{		
				//console.log(mmdField);			
				// Is there a metadata value for this field?	
				var value = MetadataRenderer.getFieldValue(mmdField, metadata);	
				if(value)
				{	
					if (child_value_as_label != null)
						mmdField.use_value_as_label = child_value_as_label;
					
					var field = new MetadataField(mmdField);
					
					field.child_type = (mmdField.child_tag != null) ? mmdField.child_tag : mmdField.child_type;
					field.parentMDType = metadata.mm_name;
											
					// If scalar collection
					if(mmdField.child_scalar_type != null)
					{		
						field.child_type = mmdField.child_scalar_type;			
												
						var newList = [];
						for(var k = 0; k < value.length; k++)
						{
							var scalarField = new MetadataField(mmdField);
								scalarField.value = value[k]; 
								scalarField.hide_label = true;
								scalarField.scalar_type = mmdField.child_scalar_type;
							newList.push(scalarField);
						}
						field.value = newList;
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
						MetadataRenderer.checkAndSetShowExpandedInitially(field, mmdField);
						MetadataRenderer.checkAndSetShowExpandedAlways(field, mmdField);
						
					}
					// Else, it must be a monomorphic collection
					else
					{
						var newObject = {};
						newObject[field.child_type] = value;
						value = newObject;	
						MetadataRenderer.checkAndSetShowExpandedInitially(field, mmdField);
						MetadataRenderer.checkAndSetShowExpandedAlways(field, mmdField);
						
					}
					
					if (mmdField.child_use_value_as_label != null)
						field.value = MetadataRenderer.getMetadataFields(mmdField["kids"], value, depth + 1, mmdField.child_use_value_as_label, taskUrl);
					else if(mmdField.child_scalar_type == null)
						field.value = MetadataRenderer.getMetadataFields(mmdField["kids"], value, depth + 1, null, taskUrl);
					
					if (mmdField.use_value_as_label != null) 
						field.value_as_label = MetadataRenderer.getValueForProperty(mmdField.use_value_as_label, metadata, mmdKids);
					
					metadataFields.push(field);
				}
			}
		}		
	}
		
	//Sort the fields by layer, higher layers first
	metadataFields.sort(function(a,b){return b.layer - a.layer - 0.5});
	return metadataFields;
}


MetadataRenderer.checkAndSetShowExpandedInitially = function(field, mmdField)
{
	if (mmdField.show_expanded_initially != null) {
		field.show_expanded_initially = mmdField.show_expanded_initially;
	} else if (mmdField.inherited_mmd != null
			   && mmdField.inherited_mmd.show_expanded_initially != null) {
		field.show_expanded_initially = mmdField.inherited_mmd.show_expanded_initially;
	}
}

MetadataRenderer.checkAndSetShowExpandedAlways = function(field, mmdField)
{
	if (mmdField.show_expanded_always != null) {
		field.show_expanded_always = mmdField.show_expanded_always;
	} else if (mmdField.inherited_mmd != null
			   && mmdField.inherited_mmd.show_expanded_always != null) {
		field.show_expanded_always = mmdField.inherited_mmd.show_expanded_always;
	}
}

MetadataRenderer.isFieldVisible = function(mmdField, metadata, url)
{
	if (mmdField["styles"])
	{
		var style = mmdField["styles"][0];
		var location = metadata[mmdField["name"]].location; 
		if (style.is_child_metadata == "true" && style.hide == "true" 
				&& url && location && location.toLowerCase() == url)
			return false;
	}
	
	return mmdField.hide == null || mmdField.hide == false || mmdField.always_show == "true";
}

MetadataRenderer.getFieldValue = function(mmdField, metadata)
{
	var valueName = (mmdField.tag != null) ? mmdField.tag : mmdField.name;				
	return metadata[valueName];
}

/**
 * 
 */
MetadataRenderer.getValueForProperty = function(valueAsLabelStr, metadata, mmdKids, depth, taskUrl)
{
	var nestedFields = valueAsLabelStr.split(".");
	var fieldValue = metadata;
	var fieldType = "";
	for (var i = 0; i < nestedFields.length; i++)
	{
		fieldValue = fieldValue[nestedFields[i]];
		// if value is to be read from a collection, then use first element
		// TODO: define semantics for selection
		if (fieldValue.length != null)
			fieldValue = fieldValue[0];
		
		for (var key in mmdKids)
		{
			var mmdField = mmdKids[key];
			if (mmdField.scalar)
			{
				mmdField = mmdField.scalar;
				fieldType = "scalar";
				if (mmdField.name == nestedFields[i])
					break;				
			}
			else if (mmdField.composite)
			{
				mmdField = mmdField.composite;
				fieldType = mmdField.type;
				if (mmdField.name == nestedFields[i])
				{
					mmdKids = mmdField["kids"];
					depth = depth + 1;
					break;
				}
			}
			else if (mmdField.collection)
			{
				mmdField = mmdField.collection;
				fieldType = (mmdField.child_tag != null) ? mmdField.child_tag : mmdField.child_type;
				if (mmdField.name == nestedFields[i])
				{
					mmdKids = mmdField["kids"];

					// get the child type; as directly selecting the first child above
					mmdField = mmdKids[0];
					if (mmdField.scalar)
						mmdField = mmdField.scalar;
					else if (mmdField.composite)
						mmdField = mmdField.composite;
					
					mmdKids = mmdField["kids"];
					depth = depth + 1;
					
					break;
				}
			}			
		}
	}
	
	// TODO: define caching structure
	if (mmdField.metadataFields)
		return {value: mmdField.metadataFields, type: fieldType};
	else
	{
		if (fieldType == "scalar")
		{
			return {value: fieldValue, type: fieldType};
		}
		else	
		{
			var metadataFields = MetadataRenderer.getMetadataFields(mmdKids, fieldValue, depth, null, taskUrl);
			return {value: metadataFields, type: fieldType};
		}				
	}	
}

/**
 * 
 */
MetadataRenderer.concatenateField = function(field, metadataFields, mmdKids)
{
	var metadataField = "";	
	for(var i = 0; i < metadataFields.length; i++)
	{
		if (metadataFields[i].mmdName == field.concatenates_to)
		{
			metadataField = metadataFields[i];
			metadataField.concatenates.push(field);
			break;
		}
	}
	
	if (metadataField == "")
	{
		for (var key in mmdKids)
		{
			var mmdField = mmdKids[key];
			
			if (mmdField.scalar)
				mmdField = mmdField.scalar;
			else if (mmdField.composite)
				mmdField = mmdField.composite;
			else if (mmdField.collection)
				mmdField = mmdField.collection;
			
			var name = mmdField.name;
				//(mmdField.label != null) ? mmdField.label : mmdField.name;
			
			if (name == field.concatenates_to)
			{
				metadataField = new MetadataField(mmdField);
				metadataField.concatenates.push(field);
				metadataFields.push(metadataField);
			}
		}
	}
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
		button.className = "collapseButton";
		
		if (button.nextSibling && button.nextSibling.className == "fieldLabelImage")
			button.nextSibling.style.display = "";
		
		var table = MetadataRenderer.getTableForButton(button);
		MetadataRenderer.expandTable(table);
		
		if(MetadataRenderer.LoggingFunction)
		{			
			var eventObj = {};
			if(typeof button.location === "undefined")
			{
				if(button.parentElement.childNodes[1])
				{
					eventObj = {
						expand_metadata: {
							field_name: button.parentElement.childNodes[1].innerText,
							parent_doc: MetadataRenderer.getLocationForParentTable(button.parentElement)
						}
					};
				}
				else
				{
					eventObj = {
						expand_metadata: {
							parent_doc: MetadataRenderer.getLocationForParentTable(button.parentElement)
						}
					};
				}
			}
			else
			{
				eventObj = {
					expand_metadata: {
						target_doc: MetadataRenderer.getLocationForChildTable(button.parentElement.parentElement.parentElement)
					}
				};
			}
			MetadataRenderer.LoggingFunction(eventObj);
		}
	}
	else if(expandSymbol.style.display == "none")
	{
		expandSymbol.style.display = "block";			
		button.className = "expandButton";
		
		if (button.nextSibling && button.nextSibling.className == "fieldLabelImage")
			button.nextSibling.style.display = "none";
		
		var table = MetadataRenderer.getTableForButton(button);
		MetadataRenderer.collapseTable(table);
		
		if(MetadataRenderer.LoggingFunction)
		{
			var eventObj = {};
			if(typeof button.location === "undefined")
			{
				if (button.parentElement.childNodes[1])
				{
					eventObj = {
						collapse_metadata: {
							field_name: button.parentElement.childNodes[1].innerText,
							parent_doc: MetadataRenderer.getLocationForParentTable(button.parentElement)
						}
					};
				}
				else
				{
					eventObj = {
						collapse_metadata: {
							parent_doc: MetadataRenderer.getLocationForParentTable(button.parentElement)
						}
					};
				}
			}
			else
			{
				
				eventObj = {
					collapse_metadata: {
						target_doc: MetadataRenderer.getLocationForChildTable(button.parentElement.parentElement.parentElement)
					}
				};
			}
			MetadataRenderer.LoggingFunction(eventObj);
		}	
	}	
}

/**
 * Get the table that corresponds to the given button through the DOM
 * @param button, HTML object of the button
 * @return corresponding table HTML object  
 */

MetadataRenderer.getTableForButton = function(button)
{
	var table = button.parentElement.parentElement.parentElement.getElementsByClassName("valueCol")[0];
	
	// label_at top or bottom
	if (table == null)
	{
		var sibling = (button.parentElement.parentElement.parentElement.nextSibling == null) ?
			button.parentElement.parentElement.parentElement.previousSibling : 
			button.parentElement.parentElement.parentElement.nextSibling; 
		table = sibling.getElementsByClassName("valueCol")[0];
	}
	
	do
	{
		var rowsFound = false;
		var elts = table.childNodes;
		for (var i = 0; i < elts.length; i++)
		{
			if (elts[i].className == "metadataRow")
			{
				rowsFound = true;
				break;
			}
		}
		
		if (rowsFound)
			break;
		else
			table = table.firstChild;
		
	} while (table);
		
	return table;
}

/**
 * Expand the table, showing all of its rows
 * @param table to expand 
 */
MetadataRenderer.expandTable = function(table)
{
	var rows = [];
	var elts = table.childNodes;
	
	for (var i = 0; i < elts.length; i++)
		if (elts[i].className == "metadataRow")
			rows.push(elts[i]);
	
	for (var i = 0; i < rows.length; i++)
	{
		rows[i].style.display = "table-row";
	}

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
	var rows = [];
	var elts = table.childNodes;
	
	for (var i = 0; i < elts.length; i++)
		if (elts[i].className == "metadataRow")
			rows.push(elts[i]);
	
	for (var i = 0; i < rows.length; i++)
	{
		if(i == 0)
			rows[i].style.display = "table-row";
		else
			rows[i].style.display = "none";
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
		
		button.className = "collapseButton";
		
	
	// Change the onclick function of the button to expand/collapse the table
	button.onclick = MetadataRenderer.expandCollapseTable;
	
	var table = MetadataRenderer.getTableForButton(button);
		
	// Search the table for the document location
	var location = null;
	var rows = [];
	var elts = table.childNodes;
	
	for (var i = 0; i < elts.length; i++)
		if (elts[i].className == "metadataRow")
			rows.push(elts[i]);
	
	for (var i = 0; i < rows.length; i++)
	{
		var valueCol = rows[i].childNodes[1];
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
		button.location = location;
		
		// Add a loadingRow for visual feedback that the metadata is being downloaded / parsed
		table.appendChild(MetadataRenderer.createLoadingRow());
		
		MetadataRenderer.addMetadataDisplay(table.parentElement, location, false);
	}
	// If there was no document location then the table must be a non-document composite in which case just expand
	else
		MetadataRenderer.expandTable(table);
	
	
	// Grow the In-Context Metadata Display
	if(MetadataRenderer.updateInContextStyling)
		MetadataRenderer.updateInContextStyling(table);
	
	
	if(MetadataRenderer.LoggingFunction)
	{			
		var eventObj = {};
			
		if(location == null)
		{	
			if (button.parentElement.childNodes[1])
			{
				eventObj = {
					expand_metadata: {
						field_name: button.parentElement.childNodes[1].innerText,
						parent_doc: MetadataRenderer.getLocationForParentTable(button.parentElement)
					}
				};
			}
			else
			{
				eventObj = {
					expand_metadata: {
						parent_doc: MetadataRenderer.getLocationForParentTable(button.parentElement)
					}
				};
			}
		}
		else
		{
			eventObj = {
				expand_metadata: {
					target_doc: MetadataRenderer.getLocationForChildTable(button.parentElement.parentElement.parentElement)
				}
			};
		}
		MetadataRenderer.LoggingFunction(eventObj);
	}
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
	if(row.className.indexOf("fieldLabelContainerOpened") == 0 || row.className.indexOf("fieldLabelContainer") == 0)
	{
		// Highlight row
		MetadataRenderer.highlightLabel(row);
		
		var table = row.parentElement.parentElement.getElementsByClassName("valueCol")[0];
		
		// label_at top or bottom
		if (table == null)
		{
			var sibling = (button.parentElement.parentElement.nextSibling == null) ?
				button.parentElement.parentElement.previousSibling : 
				button.parentElement.parentElement.nextSibling; 
			table = sibling.getElementsByClassName("valueCol")[0];
		}

		
		// Search the table for a document location
		var location = null;
		
		var aTags = table.getElementsByTagName("a");
		for (var i = 0; i < aTags.length; i++)
		{
			if(aTags[i].className.indexOf("fieldValue") != -1)
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
	var labelClassName = label.className.split(" ", 1)[0];
	label.className = labelClassName + " highlight";
}

/**
 * Unhighlights the given label
 * @param label, HTML object to change the styling of
 */
MetadataRenderer.unhighlightLabel = function(label)
{
	var labelClassName = label.className.split(" ", 1)[0];
	label.className = labelClassName + " unhighlight";
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
	// Don't draw connection lines in ideaMACHE
	if(typeof session != "undefined")
	{
		return;
	}
	
	
	// Get the first label of the target
	var labelCol = target.getElementsByClassName("labelCol")[0];
	// access fieldLabel from labelCol and not metadataRow which can return a nested value
	// if this label was not rendered due to hide_label=true
	var label = labelCol.getElementsByClassName("fieldLabel")[0];
	
	// Highlight the target label
	if (label)
		MetadataRenderer.highlightLabel(label.parentElement);
	else // if label is hidden
		label = target.getElementsByClassName("valueCol")[0];

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
	if(canvas != null && startRect && Math.abs(startRect.top - endRect.top) > 12)
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
	
	// TODO add logging for the 'More' button
	
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
			return this.urls[i].localeCompare(url) == 0;
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
MetadataRenderer.buildMetadataDisplay = function(isRoot, mmd, metadata, taskUrl)
{
	// Convert the metadata into a list of MetadataFields using the meta-metadata.
	var metadataFields = MetadataRenderer.getMetadataFields(mmd["meta_metadata"]["kids"], metadata, 0, null, taskUrl);
	
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
		table = document.createElement('div');
		table.className = "metadataTableDiv";
		
		//if(!isRoot)
		//	table.className = "metadataTable";
	}
	
	console.log(metadataFields);
	
	// Iterate through the metadataFields which are already sorted into display order
	for(var i = 0; i < metadataFields.length; i++)
	{			
		
		var row = document.createElement('div');
		row.className = 'metadataRow';
					
		// if the maximum number of fields have been rendered then stop rendering and add a "More" expander
		if(fieldCount <= 0)
		{
			var nameCol = document.createElement('div');
				nameCol.className = "labelCol showDiv";
							
			var valueCol = document.createElement('div');
				valueCol.className = "valueCol showDiv";
			
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
			
			if (metadataField.concatenates_to != null)
				continue;
			
			var expandButton = null;
			var fieldObj = MetadataRenderer.buildMetadataField(metadataField, isChildTable, fieldCount, row);
			expandButton = fieldObj.expand_button;

			var fieldObjs = [];
			fieldObjs.push(fieldObj);

			var innerRow = null;
			if (metadataField.concatenates.length > 0)
			{
				innerRow = document.createElement('div');
				innerRow.className = 'metadataRow';
			}
			else
				innerRow = row;
			
			for (var j = 0; j < metadataField.concatenates.length; j++)
			{
				fieldObj = MetadataRenderer.buildMetadataField(metadataField.concatenates[j], isChildTable, fieldCount, row);
				fieldObjs.push(fieldObj);
			}
			
			for (var j = 0; j < fieldObjs.length; j++)
			{
				var nameCol = fieldObjs[j].name_col;
				var valueCol = fieldObjs[j].value_col;
				fieldCount = fieldObjs[j].count;
				
				// append name and value in the needed order
				if (metadataField.label_at != null)
				{
					if (metadataField.label_at == "top" || metadataField.label_at == "bottom")
					{
						var innerTable = document.createElement('div');
						var row1 = document.createElement('div');
						var row2 = document.createElement('div');
						innerTable.style.display = 'table';
						row1.className = 'metadataRow';
						row2.className = 'metadataRow';
						if (metadataField.label_at == "top")
						{
							row1.appendChild(nameCol);							
							row2.appendChild(valueCol);
						}
						else
						{
							row1.appendChild(valueCol);							
							row2.appendChild(nameCol);
						}
						innerTable.appendChild(row1);
						innerTable.appendChild(row2);
						
						var td = document.createElement('div');
						td.style.display = 'table-cell';
						td.appendChild(innerTable);
						
						// to still make labels align well with fields having label_at left
						if (metadataField.concatenates.length == 0)
						{
							var tdDummy = document.createElement('div');
							tdDummy.style.display = 'table-cell';						
							innerRow.appendChild(tdDummy);
						}
						innerRow.appendChild(td);
					}						
					else if (metadataField.label_at == "right")
					{
						innerRow.appendChild(valueCol);
						innerRow.appendChild(nameCol);
					}
					else
					{
						innerRow.appendChild(nameCol);
						innerRow.appendChild(valueCol);
					}
				}
				else
				{
					innerRow.appendChild(nameCol);
					innerRow.appendChild(valueCol);
				}
			}
			
			if (metadataField.concatenates.length > 0)
			{
				// new table for inner row
				var outerTable = document.createElement('div');
				outerTable.style.display = 'table';
				outerTable.appendChild(innerRow);
				
				var tdOuter = document.createElement('div');
				tdOuter.style.display = 'table-cell';						
				tdOuter.appendChild(outerTable);
				
				var tdDummy1 = document.createElement('div');
				tdDummy1.style.display = 'table-cell';						

				row.appendChild(tdDummy1);
				row.appendChild(tdOuter);
			}
			table.appendChild(row);
			
			if (expandButton != null && metadataField.show_expanded_initially == "true") {
				var fakeEvent = {};
				fakeEvent.target = expandButton;
				console.log("fake event ready");
				MetadataRenderer.expandCollapseTable(fakeEvent);
			}
		}
	}	
	return table;
}

/**
 * Build the HTML representation for MetadataField
 * @param metadataField, MetadataField to be rendered
 * @param isChildTable, true if the field is child of a collection table, false otherwise
 * @param fieldCount, the number of fields that are rendered before cropping with a "More" button
 * @param row, the containing element
 * @return HTML representation of the metadata field, and related properties
 */
MetadataRenderer.buildMetadataField = function(metadataField, isChildTable, fieldCount, row)
{
	
	var nameCol = document.createElement('div');
	if (!metadataField.show_expanded_always ){	
		nameCol.className = "labelCol showDiv";
	}
	else if(metadataField.composite_type != null && metadataField.composite_type != "image"){
		nameCol.className = "labelCol noShow";
		nameCol.style.display = "none";
	}
	var valueCol = document.createElement('div');
	
		valueCol.className = "valueCol";
	
	if(metadataField.composite_type != null && metadataField.composite_type != "image"){
		valueCol.className = "valueCol";
		valueCol.style.position = "relative";
		valueCol.style.left = "-9px";
	}
	
	var expandButton = null;	
	
	if(metadataField.scalar_type)
	{				
		// Currently it only rendered Strings, Dates, Integers, and ParsedURLs
		if(metadataField.scalar_type == "String" || metadataField.scalar_type == "Date" ||metadataField.scalar_type == "Integer" || metadataField.scalar_type == "ParsedURL")
		{	
			
			
			if(metadataField.name && !metadataField.hide_label)
			{
				var fieldLabelDiv = document.createElement('div');
					fieldLabelDiv.className = "fieldLabelContainer unhighlight";
					
				var label = (metadataField.value_as_label == "" || (metadataField.value_as_label.type != "scalar"
					&& metadataField.value_as_label.type != "image"))? metadataField.name : metadataField.value_as_label.value;
				if (metadataField.value_as_label == "" || metadataField.value_as_label.type != "image")
				{
					var fieldLabel = document.createElement('p');
						fieldLabel.className = "fieldLabel";
						fieldLabel.innerText = MetadataRenderer.toDisplayCase(label);
						fieldLabel.textContent = MetadataRenderer.toDisplayCase(label);
						
					fieldLabelDiv.appendChild(fieldLabel);	
				}
				else if (metadataField.value_as_label.type == "image")
				{
					var img = document.createElement('img');
						img.className = "fieldLabelImage";
						img.src = MetadataRenderer.getImageSource(label);
						
					fieldLabelDiv.appendChild(img);	
				}			
				
				nameCol.appendChild(fieldLabelDiv);
			}
			
			// If the field is a URL then it should show the favicon and an A tag
			if(metadataField.scalar_type == "ParsedURL")
			{
				// Uses http://getfavicon.appspot.com/ to resolve the favicon
				var favicon = document.createElement('img');
					favicon.className = "faviconICE";
					favicon.src = "https://plus.google.com/_/favicon?domain_url=" + MetadataRenderer.getHost(metadataField.navigatesTo);
				
				var aTag = document.createElement('a');
				aTag.innerText = MetadataRenderer.removeLineBreaksAndCrazies(metadataField.value);
				aTag.textContent = MetadataRenderer.removeLineBreaksAndCrazies(metadataField.value);
				
				aTag.href = metadataField.value;
				aTag.onclick = MetadataRenderer.logNavigate;
				
				aTag.className = "fieldValue";
						
				if(metadataField.style != null)
					aTag.className += " "+metadataField.style;
			
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
					favicon.className = "faviconICE";
					favicon.src = "https://plus.google.com/_/favicon?domain_url=" + MetadataRenderer.getHost(metadataField.navigatesTo);
				
				var aTag = document.createElement('a');
					aTag.className = "fieldValue";
					aTag.target = "_blank";
					aTag.innerText = MetadataRenderer.removeLineBreaksAndCrazies(metadataField.value);
					aTag.textContent = MetadataRenderer.removeLineBreaksAndCrazies(metadataField.value);
					
					aTag.href = metadataField.navigatesTo;
					aTag.onclick = MetadataRenderer.logNavigate;
										
					if(metadataField.style != null)
						aTag.className += " "+metadataField.style;
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
					
				if (metadataField.extract_as_html)
				{
					fieldValue.innerHTML = MetadataRenderer.removeLineBreaksAndCrazies(metadataField.value);
				}
				else
				{
					fieldValue.innerText = MetadataRenderer.removeLineBreaksAndCrazies(metadataField.value);
					fieldValue.textContent = MetadataRenderer.removeLineBreaksAndCrazies(metadataField.value);
				}
					
				if(metadataField.style_name != null){
					fieldValue.className += " " + metadataField.style_name;
				}		
				var fieldValueDiv = document.createElement('div');
					fieldValueDiv.className = "fieldValueContainer";
				
				fieldValueDiv.appendChild(fieldValue);
				valueCol.appendChild(fieldValueDiv);
			}
			
			fieldCount--;
		}		
	}
	
	else if (metadataField.composite_type != null && metadataField.composite_type == "image")
	{
		if(metadataField.name && !metadataField.hide_label)
		{
			var fieldLabelDiv = document.createElement('div');
				fieldLabelDiv.className = "fieldLabelContainer unhighlight";
			
			if (bgColorObj && bgColorObj.bFirstField)
				fieldLabelDiv.style.background = bgColorObj.color;
			
			var label = (metadataField.value_as_label == "" || (metadataField.value_as_label.type != "scalar"
				&& metadataField.value_as_label.type != "image"))? metadataField.name : metadataField.value_as_label.value;
			if (metadataField.value_as_label == "" || metadataField.value_as_label.type != "image")
			{
				var fieldLabel = document.createElement('p');
					fieldLabel.className = "fieldLabel";
					fieldLabel.innerText = MetadataRenderer.toDisplayCase(label);
					fieldLabel.textContent = MetadataRenderer.toDisplayCase(label);
				
				fieldLabelDiv.appendChild(fieldLabel);	
			}
			else if (metadataField.value_as_label.type == "image")
			{
				var img = document.createElement('img');
					img.className = "fieldLabelImage";
					img.src = MetadataRenderer.getImageSource(label);

				fieldLabelDiv.appendChild(img);
			}		
			
			nameCol.appendChild(fieldLabelDiv);
		}
		
		var img1 = document.createElement('img');
			img1.src = MetadataRenderer.getImageSource(metadataField.value);
		
		var fieldValueDiv = document.createElement('div');
			fieldValueDiv.className = "fieldValueContainer";
		
		fieldValueDiv.appendChild(img1);
		valueCol.appendChild(fieldValueDiv);
	}
	
	else if(metadataField.composite_type != null && metadataField.composite_type != "image")
	{
		
		
		
		/** Label Column **/
		var childUrl = MetadataRenderer.guessDocumentLocation(metadataField.value);
		
			var fieldLabelDiv = document.createElement('div');
				fieldLabelDiv.className = "fieldLabelContainer unhighlight";
				fieldLabelDiv.style.minWidth = "30px";					
				
			// Is the document already rendered?								
			if(childUrl != "" && MetadataRenderer.isRenderedDocument(childUrl) )
			{
				
				// If so, then don't allow the document to be expaned, to prevent looping						
				fieldLabelDiv.className = "fieldLabelContainerOpened unhighlight";			
			}
			else
			{
				
				
		
					
					
				// If the document hasn't been download then display a button that will download it
				expandButton = document.createElement('div');
					expandButton.className = "expandButton X";
					
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
				var imageLabel = (metadataField.value_as_label == "") ?	false : metadataField.value_as_label.type == "image";
				//If the table isn't a child table then display the label for the composite
				
				if((!isChildTable || imageLabel) && !metadataField.hide_label)
				{				
					var label = (metadataField.value_as_label == "" || (metadataField.value_as_label.type != "scalar"
						&& metadataField.value_as_label.type != "image"))? metadataField.name : metadataField.value_as_label.value;
					if (metadataField.value_as_label == "" || metadataField.value_as_label.type != "image")
					{
						var fieldLabel = document.createElement('p');
							fieldLabel.className = "fieldLabel";
							fieldLabel.innerText = MetadataRenderer.toDisplayCase(label);
							fieldLabel.textContent = MetadataRenderer.toDisplayCase(label);
						
						fieldLabelDiv.appendChild(fieldLabel);
					}
					else if (metadataField.value_as_label.type == "image")
					{
						var img = document.createElement('img');
							img.className = "fieldLabelImage";
							img.src = MetadataRenderer.getImageSource(label);
	
						fieldLabelDiv.appendChild(img);
					}
				}
			}
			
			nameCol.appendChild(fieldLabelDiv);
		
		
		/** Value Column **/
		
		var fieldValueDiv = document.createElement('div');
			fieldValueDiv.className = "fieldCompositeContainer";

		// Build the child table for the composite
		var childTable =  MetadataRenderer.buildMetadataTable(null, false, false, metadataField.value, 1);
		
		// If the childTable has more than 1 row, collapse table
		
		if(metadataField.value.length > 1 && !metadataField.show_expanded_always){
			MetadataRenderer.collapseTable(childTable);			
		}
		if(metadataField.show_expanded_always){
			MetadataRenderer.expandTable(childTable);
		}
		
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
		
		fieldCount--;
	}
	
	else if(metadataField.child_type != null)
	{		
		if(metadataField.name != null)
		{
			var fieldLabelDiv = document.createElement('div');
					fieldLabelDiv.className = "fieldLabelContainer unhighlight";
					
			// does it need to expand / collapse
			
			
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
			
			
			var label = (metadataField.value_as_label == "" || (metadataField.value_as_label.type != "scalar"
				&& metadataField.value_as_label.type != "image"))? metadataField.name : metadataField.value_as_label.value;
			if (metadataField.value_as_label == "" || metadataField.value_as_label.type != "image")
			{
				var fieldLabel = document.createElement('p');
					fieldLabel.className = "fieldLabel";
					fieldLabel.innerText = MetadataRenderer.toDisplayCase(label) + "(" + metadataField.value.length + ")";
					fieldLabel.textContent = MetadataRenderer.toDisplayCase(label) + "(" + metadataField.value.length + ")";
					
				if (!metadataField.hide_label)
					fieldLabelDiv.appendChild(fieldLabel);
			}
			else if (metadataField.value_as_label.type == "image")
			{
				var img = document.createElement('img');
					img.className = "fieldLabelImage";
					img.src = MetadataRenderer.getImageSource(label);

				if (!metadataField.hide_label)
					fieldLabelDiv.appendChild(img);
			}		
			
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
						
		fieldCount--;
	}
	return {name_col: nameCol, value_col: valueCol, count: fieldCount, expand_button: expandButton};
}

MetadataRenderer.getImageSource = function(mmdField)
{
	for (var i = 0; i < mmdField.length; i++)
		if (mmdField[i].name == "location")
			return mmdField[i].value;
	
	return null;
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
	if(url){
	var host = url.match(/:\/\/(www\.)?(.[^/:]+)/)[2];
	return "http://www." + host;
	}
}

MetadataRenderer.logNavigate = function(event)
{
	if(MetadataRenderer.LoggingFunction)
	{
		var eventObj = {
			navigate_from_metadata: {
				target_doc: event.target.href
			}
		}
		MetadataRenderer.LoggingFunction(eventObj);
	}
}

MetadataRenderer.getLocationForParentTable = function(element)
{
	while(element.className != "metadataTableDiv" && element.className != "rootMetadataTableDiv")
	{
		element = element.parentElement;
	}
	
	var aTags = element.getElementsByTagName("a");
	if(aTags.length > 0)
	{
		console.log("parentTable loc: " + aTags[0].href);
		return aTags[0].href;	
	}	
	return "none";
}

MetadataRenderer.getLocationForChildTable = function(element)
{
	var valueCol = element.getElementsByClassName("valueCol")[0];
	
	// label_at top or bottom
	if (valueCol == null)
	{
		var sibling = (element.nextSibling == null) ? element.previousSibling : element.nextSibling; 
		valueCol = sibling.getElementsByClassName("valueCol")[0];
	}
	
	if (valueCol)
	{
		var tables = valueCol.getElementsByClassName("rootMetadataTableDiv");
		
		if (tables.length > 0)
		{
			table = tables[0];
			
			var aTags = table.getElementsByTagName("a");
			if(aTags.length > 0)
			{
				return aTags[0].href;
			}
		}
	}
	return "none";
}

MetadataRenderer.clearDocumentCollection = function()
{
	MetadataRenderer.queue = [];
	MetadataRenderer.documentMap = [];
}