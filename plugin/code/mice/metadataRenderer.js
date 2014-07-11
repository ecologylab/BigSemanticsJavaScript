/**
 * MetadataRenderer handles the loading of metadata and meta-metadata
 * and calls the given renderer
 */
var MetadataRenderer = {};
var WWWStudy;
// The queue holds a list of containers which are waiting for metadata or meta-metadata from the service.
MetadataRenderer.queue = [];
//The URL for the document being loaded
MetadataRenderer.currentDocumentLocation = "";

var SEMANTIC_SERVICE_URL = "http://ecology-service.cse.tamu.edu/BigSemanticsService/";

//Logging function
MetadataRenderer.LoggingFunction = null;


/**
 * Requests metadata and metametadata. When done it calls the given rendering function
 */
MetadataRenderer.render = function(renderer, container, url, isRoot, clipping){
	
	// Add the rendering task to the queue
	var task = new RenderingTask(url, container, isRoot, clipping, renderer);
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
};



/**
 * Retrieves the metadata from the service using a JSON-p call.
 * When the service responds the callback function will be called.
 * @param url, url of the target document
 * @param callback, name of the function to be called from the JSON-p call
 */
MetadataRenderer.getMetadata = function(url, callback)
{
	var serviceURL = SEMANTIC_SERVICE_URL + "metadata.jsonp?callback=" + callback + "&url=" + encodeURIComponent(url);
	MetadataRenderer.doJSONPCall(serviceURL);
	console.log("requesting semantics service for metadata: " + serviceURL);
};

/**
 * Retrieves the meta-metadata from the service using a JSON-p call.
 * When the service responds the callback function will be called.
 * @param type, name of the target meta-metadata
 * @param callback, name of the function to be called from the JSON-p call
 */

MetadataRenderer.getMMD = function(type, callback)
{
	MetadataRenderer.doJSONPCall(SEMANTIC_SERVICE_URL + "mmd.jsonp?callback=" + callback + "&name=" + type);
};


/**
 * Do a JSON-P call by appending the jsonP url as a scrip object.
 * @param jsonpURL 
 */
MetadataRenderer.doJSONPCall = function(jsonpURL)
{
	var script = document.createElement('script');
	script.src = jsonpURL;
	document.head.appendChild(script);
};
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
			var additional_location = metadata["additional_locations"][i];
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
};

/**
 * Deserializes the meta-metadata, attempts to matche it with any awaiting tasks
 * If the meta-metadata gets matched then 
 * @param mmd, raw meta-metadata json returned from the service
 */
MetadataRenderer.setMetaMetadata = function (mmd)
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
			/**
			 * CALLS APPROPRIATE RENDERER, HUMAN SCUM!!
			 */
			// if the task has both metadata and meta-metadata then create and display the rendering
			if(tasks[i].metadata && tasks[i].mmd)	
				var metadataFields = MetadataRenderer.createMetadata(tasks[i].isRoot, tasks[i].mmd, tasks[i].metadata, tasks[i].url);
				// Is there any visable metadata?
				if(MetadataRenderer.hasVisibleMetadata(metadataFields))
					// If so, then build the HTML table	
					tasks[i].renderer(tasks[i], metadataFields);
	
		}
	}
	else
		console.error("Retreived meta-metadata: " + mmd["meta_metadata"].name + "  but it doesn't match a document from the queue.");
};

MetadataRenderer.createMetadata = function(isRoot, mmd, metadata, taskUrl){
	var metadataFields = MetadataRenderer.getMetadataFields(mmd["meta_metadata"]["kids"], metadata, 0, null, taskUrl);
	return metadataFields;
};
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
};

MetadataRenderer.getTasksFromQueueByUrl = function(url)
{
	var list = [];
	for(var i = 0; i < MetadataRenderer.queue.length; i++)
		if(MetadataRenderer.queue[i].matches(url))
			list.push(MetadataRenderer.queue[i]);

	return list;
};


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
};

/**
 * Searches the document map for the given url
 * @param url, url to search for in the document map
 * @return true, if the url exists in the document map, false otherwise
 */
MetadataRenderer.isRenderedDocument = function(url)
{
	for(var i = 0; i < MICE.documentMap.length; i++)
		if(MICE.documentMap[i].matches(url) && MICE.documentMap[i].rendered)
			return true;
			
	return false;
};

/**
 * RenderingTask represents a metadata rendering that is in progress of being downloaded and parsed
 * @param url of the document
 * @param container, HTML container which will hold the rendering
 * @param isRoot, true if this is the root document for a metadataRendering
 */
function RenderingTask(url, container, isRoot, clipping, renderer) //asdf
{
	if(url != null)
		this.url = url.toLowerCase();
	
	this.container = container;
	this.clipping = clipping;
	
	this.metadata = null;	
	this.mmd = null;
	
	this.isRoot = isRoot;
	 
	this.renderer = renderer;
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
};

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
};

/**
 * Searches an array of MetadataFields to find the document's location 
 * @param metadata, array of MetadataFields
 */
MetadataRenderer.guessDocumentLocation = function(metadata)
{
	var location = "";
	
	for(var i = 0; i < metadata.length; i++)
		// the document's location is typically the navigation target of the 'title' or 'name' field
		if(metadata[i].mmdName == "title" || metadata[i].mmdName == "name")
			if(metadata[i].navigatesTo != null)
				location = metadata[i].navigatesTo;
	
	//console.log("guessing document location: " + location);
	return location;
};

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
};

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
	metadataFields.sort(function(a,b){return b.layer - a.layer - 0.5;});
	return metadataFields;
};


MetadataRenderer.checkAndSetShowExpandedInitially = function(field, mmdField)
{
	if (mmdField.show_expanded_initially != null) {
		field.show_expanded_initially = mmdField.show_expanded_initially;
	}
};

MetadataRenderer.checkAndSetShowExpandedAlways = function(field, mmdField)
{
	if (mmdField.show_expanded_always != null) {
		field.show_expanded_always = mmdField.show_expanded_always;
	}
};

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
};

MetadataRenderer.getFieldValue = function(mmdField, metadata)
{
	var valueName = (mmdField.tag != null) ? mmdField.tag : mmdField.name;				
	return metadata[valueName];
};

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
};

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
};


MetadataRenderer.getImageSource = function(mmdField)
{
	for (var i = 0; i < mmdField.length; i++)
		if (mmdField[i].name == "location")
			return mmdField[i].value;
	
	return null;
};
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
};

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
};

MetadataRenderer.clearDocumentCollection = function()
{
	MetadataRenderer.queue = [];
	MetadataRenderer.documentMap = [];
};


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
};





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

		////console.info("recursing[" + level + "] Parent and currentObj:"); //Too detailed prints.
		//console.log(parentObj);
		//console.log(currentObj);
		
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
					var index = parentObj.indexOf(currentObj);
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
