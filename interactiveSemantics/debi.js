/**
 * This file handles the loading of metadata and meta-metadata for general
 * Dynamic Exploratory Browsing Interfaces.
 * A renderer can be passed in to render loaded metadata in customed ways.
 */

// The constant that points to the BigSemantics service.
var SEMANTIC_SERVICE_URL = "http://ecology-service.cse.tamu.edu/BigSemanticsService/";

// Constant for how deep to recurse through the metadata
var METADATA_FIELD_MAX_DEPTH = 7;
// The main namespace.
var MetadataLoader = {};

// The queue holds a list of containers which are waiting for metadata or
// meta-metadata from the service.
MetadataLoader.queue = [];

// The URL for the document being loaded.
MetadataLoader.currentDocumentLocation = "";

// Logger
MetadataLoader.logger = function(message) { /* null default implementation */ };

MetadataLoader.extensionMetadataDomains = ["twitter.com"];

MetadataLoader.onloadCallback = function(urls, url) { /* null default implementation */ };


/**
 * Requests metadata of the given URL and the corresponding meta-metadata from
 * the BigSemantics service, then calls the given callback for rendering.
 *
 * @param renderer:
 *     The rendering callback.
 * @param container:
 * @param url:
 *     The URL to the requested document.
 * @param isRoot:
 *     Is 'true' when this metadata is a top level one in the current context.
 * @param clipping:
 *     Used to specify special clipping structure for special use.
 */

MetadataLoader.render = function(renderer, container, url, isRoot, clipping)
{
  // Add the rendering task to the queue
  

  var task = new RenderingTask(url, container, isRoot, clipping, renderer)
  MetadataLoader.queue.push(task);  
  
  if (clipping != null && clipping.rawMetadata != null)
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

/**
 * Retrieves the metadata from the service using a JSON-p call.
 * When the service responds the callback function will be called.
 *
 * @param url, url of the target document
 * @param callback, name of the function to be called from the JSON-p call
 */
MetadataLoader.getMetadata = function(url, callback, reload)
{
	var serviceURL; 
	if(reload == true){
		serviceURL = SEMANTIC_SERVICE_URL + "metadata.jsonp?reload=true&callback=" + callback
        + "&url=" + encodeURIComponent(url);
	}
	else{
		serviceURL = SEMANTIC_SERVICE_URL + "metadata.jsonp?callback=" + callback
        + "&url=" + encodeURIComponent(url);
	}
  MetadataLoader.doJSONPCall(serviceURL);
  console.log("requesting semantics service for metadata: " + serviceURL);
}

/**
 * Retrieves the meta-metadata from the service using a JSON-p call.
 * When the service responds the callback function will be called.
 *
 * @param url, the URL of the document the requested meta-metadata is for.
 * @param callback, name of the function to be called from the JSON-p call
 */
MetadataLoader.getMMD = function(name, callback)
{
  var serviceURL = SEMANTIC_SERVICE_URL + "mmd.jsonp?reload=true&callback=" + callback
      + "&name=" + name;
	
  
  MetadataLoader.doJSONPCall(serviceURL);
  console.log("requesting semantics service for mmd: " + serviceURL);
}

/**
 * Do a JSON-P call by appending the jsonP url as a scrip object.
 * @param jsonpURL 
 */
MetadataLoader.doJSONPCall = function(jsonpURL)
{
  var script = document.createElement('script');
  script.src = jsonpURL;
  document.head.appendChild(script);
}

/**
 * Deserializes the metadata from the service and matches the metadata with a
 * queued RenderingTask If the metadata matches then retrieve the needed
 * meta-metadata.
 *
 * @param rawMetadata, JSON metadata string returned from the semantic service
 */
MetadataLoader.setMetadata = function(rawMetadata, requestMmd)
{  
  // TODO move MDC related code to mdc.js
  if (typeof MDC_rawMetadata != "undefined")
  {
    MDC_rawMetadata = JSON.parse(JSON.stringify(rawMetadata));
    updateJSON(true);
  }
  
  var metadata = {};
  
  var deserialized = false;
  
  for (i in rawMetadata)
  {
    if (i != "simpl.id" && i != "simpl.ref" && i != "deserialized")
    {
      metadata = rawMetadata[i];    
      // metadata.meta_metadata_name = i;
    }
    
    if (i == "deserialized")
    {
      deserialized = true;
    }
  }
  
  if (!deserialized)
  {
    simplDeserialize(metadata);
  }

  // Match the metadata with a task from the queue
  var queueTasks = [];
  
  if (metadata.location)
  {
    queueTasks = MetadataLoader.getTasksFromQueueByUrl(metadata.location);
  }

  // Check additional locations for more awaiting MICE tasks
  if (metadata["additional_locations"])
  {
    for (var i = 0; i < metadata["additional_locations"].length; i++)
    {
      var additional_location = metadata["additional_locations"][i];
      var tasks = MetadataLoader.getTasksFromQueueByUrl(additional_location);
      queueTasks = queueTasks.concat(tasks);      
    }
  }
  
  for (var i = 0; i < queueTasks.length; i++)
  {
    var queueTask = queueTasks[i];
    
    if (metadata["additional_locations"])
    {
      queueTask.additionalUrls = metadata["additional_locations"];
      queueTask.url = metadata["location"].toLowerCase();
    }
    
    queueTask.metadata = metadata;
    queueTask.mmdType = metadata.meta_metadata_name;
  
    if (queueTask.clipping != null)
    {
    	
      	queueTask.clipping.rawMetadata = rawMetadata;
      
      	MetadataLoader.onloadCallback(queueTask.additionalUrls, queueTask.url);
      
    }
    
    if (typeof requestMmd === "undefined" || requestMmd == true) 
    	MetadataLoader.getMMD(queueTask.mmdType, "MetadataLoader.setMetaMetadata");
  }
  
  if (queueTasks.length < 0)
  {
    console.error("Retreived metadata: " + metadata.location
                  + "  but it doesn't match a document from the queue.");
    console.log(MetadataLoader.queue);
  }
}

/**
 * Deserializes the meta-metadata, attempts to matche it with any awaiting
 * tasks. If the meta-metadata gets matched then renders it.
 *
 * @param mmd, raw meta-metadata json returned from the service
 */
MetadataLoader.setMetaMetadata = function (mmd)
{
  console.log("Received mmd: " + mmd);

  // TODO move MDC related code to mdc.js
  if (typeof MDC_rawMMD != "undefined")
  {
    MDC_rawMMD = JSON.parse(JSON.stringify(mmd));
  }
  
  simplDeserialize(mmd);
  
  var tasks = MetadataLoader.getTasksFromQueueByType(mmd["meta_metadata"].name);
  
  if (tasks.length > 0)
  {
    for (var i = 0; i < tasks.length; i++)
    {
      tasks[i].mmd = mmd;

      // if the task has both metadata and meta-metadata then create and display
      // the rendering
      if (tasks[i].metadata && tasks[i].mmd)  
      {
        var metadataFields =
          MetadataLoader.createMetadata(tasks[i].isRoot, tasks[i].mmd,
                                        tasks[i].metadata, tasks[i].url);
        // Is there any visable metadata?
        if (MetadataLoader.hasVisibleMetadata(metadataFields))
        {	
          // If so, then build the HTML table	
          var miceStyles = InterfaceStyle.getMiceStyleDictionary(mmd["meta_metadata"].name);	
         //Adds the metadata type as an attribute to the first field in the MD
          metadataFields[0].parentMDType = mmd["meta_metadata"].name;
          tasks[i].renderer(tasks[i], metadataFields, {styles: miceStyles, type: mmd["meta_metadata"].name});
        }
      }
    }
  }
  else
  {
    console.error("Retreived meta-metadata: " + mmd["meta_metadata"].name
                  + "  but it doesn't match a document from the queue.");
  }
}

/**
 *
 */
MetadataLoader.createMetadata = function(isRoot, mmd, metadata, taskUrl)
{
  var metadataFields =
    MetadataLoader.getMetadataViewModel(mmd["meta_metadata"], mmd["meta_metadata"]["kids"], metadata,
                                        0, null, taskUrl);
  
  return metadataFields;
}

/**
 * Get a matching RenderingTask from the queue 
 * @param url, target url to attempt to match to any tasks in the queue
 * @return a matching RenderingTask, null if no matches are found
 */
MetadataLoader.getTaskFromQueueByUrl = function(url)
{
  for (var i = 0; i < MetadataLoader.queue.length; i++)
  {
    if (MetadataLoader.queue[i].matches(url))
    {
      return MetadataLoader.queue[i];
    }
  }
  return null;
}

/**
 *
 */
MetadataLoader.getTasksFromQueueByUrl = function(url)
{
  var list = [];
  for (var i = 0; i < MetadataLoader.queue.length; i++)
  {
    if (MetadataLoader.queue[i].matches(url))
    {
      list.push(MetadataLoader.queue[i]);
    }
    
    else if(MetadataLoader.queue[i].additionalUrls != null){
    	//Checks to see if MMD matches any additionalLocations
    	  for (var j = 0; j < MetadataLoader.queue[i].additionalUrls.length; j++){
    		  if (MetadataLoader.queue[i].additionalUrls[j] == url){
    			  list.push(MetadataLoader.queue[i]);
    		  }
    	  }
    }
    
  }
  return list;
}

/**
 * Get all tasks from the queue which are waiting for given meta-metadata type.
 *
 * @param type, meta-metadata type to search for
 * @return array of RenderingTasks, empty if no matches found
 */
MetadataLoader.getTasksFromQueueByType = function(type)
{
  var tasks = [];
  for (var i = 0; i < MetadataLoader.queue.length; i++)
  {
    if (MetadataLoader.queue[i].mmdType == type)
    {
      tasks.push(MetadataLoader.queue[i]);
    }
  }
  return tasks;
}

/**
 * Get all tasks from the queue which are waiting for given meta-metadata type.
 *
 * @param domain, site domain to search for
 * @return array of RenderingTasks, empty if no matches found
 */
MetadataLoader.getTasksFromQueueByDomain = function(domain)
{
  var tasks = [];
  for (var i = 0; i < MetadataLoader.queue.length; i++)
  {
    if (MetadataLoader.queue[i].url.indexOf(domain) != -1)
    {
      tasks.push(MetadataLoader.queue[i]);
    }
  }
  return tasks;
}

/**
 * @returns bool, to request extension for metadata or not
 */
MetadataLoader.toRequestMetadataFromService = function(location)
{
	return !MetadataLoader.isExtensionMetadataDomain(location);
}

MetadataLoader.isExtensionMetadataDomain = function(location)
{
	for (var i = 0; i < MetadataLoader.extensionMetadataDomains.length; i++)
	{
		if (location.indexOf(MetadataLoader.extensionMetadataDomains[i]) != -1)
			return true;
	}
	return false;
}

MetadataLoader.checkForMetadataFromExtension = function()
{
	for (var i = 0; i < MetadataLoader.extensionMetadataDomains.length; i++)
	{
		var tasks = MetadataLoader.getTasksFromQueueByDomain(MetadataLoader.extensionMetadataDomains[i]);
		for (var j = 0; j < tasks.length; j++)
		{
			MetadataLoader.getMetadata(tasks[i].url, "MetadataLoader.setMetadata");
		}
	}
}

/**
 * RenderingTask represents a metadata rendering that is in progress of being
 * downloaded and parsed.
 *
 * @param url of the document
 * @param container, HTML container which will hold the rendering
 * @param isRoot, true if this is the root document for a metadataRendering
 */
function RenderingTask(url, container, isRoot, clipping, renderer)
{
  if (url != null)
  {
    this.url = url.toLowerCase();
  }
  
  this.container = container;
  this.clipping = clipping;
  
  this.metadata = null;  
  this.mmd = null;
  
  this.isRoot = isRoot;
   
  this.renderer = renderer;
}

/**
 * Does the given url match the RenderingTask's url?
 *
 * @param url, url to check against the RenderingTask
 */
RenderingTask.prototype.matches = function(url)
{
  url = url.toLowerCase();
  return this.url === url;
}

/* MetadataField and related functions */

/**
 * MetadataField represents a parsed metadata field combining
 * presentation/interaction rules from meta-metadata with the metadata value
 *
 * @param mmdField, meta-metadata field object
 */
function MetadataViewModel(mmdField)
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
    {
      this.concatenates.push(mmdField.concatenates[k]);
    }
  }
  this.extract_as_html = mmdField.extract_as_html;

  if (mmdField.dont_show_expanded_initially != "true" && mmdField.show_expanded_initially != null)
  {
    this.show_expanded_initially = mmdField.show_expanded_initially;
  }

  if (mmdField.show_expanded_always != null)
  {
    this.show_expanded_always = mmdField.show_expanded_always;
  }
}

/**
 * Checks if the given list of MetadataFields has any visible fields.
 *
 * @param metadata, array of MetadataFields to search for visible fields
 * @return true if there are visible fields, false otherwise
 */
MetadataLoader.hasVisibleMetadata = function(metadata)
{
  for (var key in metadata)  
  {
    if (metadata[key].value)
    {
      if (metadata[key].value.length != null && metadata[key].value.length > 0)
      {
        // if the field is an array with at least one element
        return true;
      }
      else if (metadata[key].value.length == null)
      {
        // if the field is not an array
        return true;
      }
    }
  }
  return false;
}

/**
 * Searches an array of MetadataFields to find the document's location.
 *
 * @param metadata, array of MetadataFields
 */
MetadataLoader.guessDocumentLocation = function(metadata)
{
  var location = "";
  for (var i = 0; i < metadata.length; i++)
  {
    // the document's location is typically the navigation target of the 'title'
    // or 'name' field
    if (metadata[i].mmdName == "title" || metadata[i].mmdName == "name")
    {
      if (metadata[i].navigatesTo != null)
      {
        location = metadata[i].navigatesTo;
      }
    }
  }
  return location;
}

/**
 * looks up metadataFields collection for the instance, else creates new
 */
MetadataLoader.getMetadataField = function(mmdField, metadataFields)
{
  for (var i = 0; i < metadataFields.length; i++)
  {
    if (metadataFields[i].mmdName == mmdField.name)
    {
      return metadataFields[i];
    }
  }
  return new MetadataViewModel(mmdField);
}

/**
 * Iterates through the meta-metadata, creating MetadataViewModel by matching
 * meta-metadata fields to metadata values.
 *
 * @param mmdKids, array of meta-metadata fields
 * @param metadata, metadata object from the service
 * @param depth, current depth level
 */
MetadataLoader.getMetadataViewModel = function(parentField, mmdKids, metadata, depth,
                                               child_value_as_label, taskUrl)
{
  var metadataViewModel = [];
  
  // Stop recursing at the max depth
  if (depth >= METADATA_FIELD_MAX_DEPTH)
  {
    return metadataViewModel;
  }
    
  for (var key in mmdKids)
  {    
    var mmdField = mmdKids[key];
    
    if (mmdField.scalar)
    {
      MetadataLoader.getScalarMetadataViewModel(metadataViewModel, parentField, mmdField,
          mmdKids, metadata, depth, child_value_as_label, taskUrl);
    }    
    else if (mmdField.composite)
    {
      MetadataLoader.getCompositeMetadataViewModel(metadataViewModel, parentField, mmdField,
          mmdKids, metadata, depth, child_value_as_label, taskUrl);
    }
    else if (mmdField.collection != null)
    {
      MetadataLoader.getCollectionMetadataViewModel(metadataViewModel, parentField, mmdField,
          mmdKids, metadata, depth, child_value_as_label, taskUrl);
    }
  }
  
  //Sort the fields by layer, higher layers first
  metadataViewModel.sort(function(a,b) { return b.layer - a.layer - 0.5; });

  MetadataLoader.collapseEmptyLabelSet(metadataViewModel, parentField);
  
  return metadataViewModel;
}

/**
 *
 */
MetadataLoader.getScalarMetadataViewModel = function(metadataViewModel,
													 parentField,
                                                     mmdField,
                                                     mmdKids,
                                                     metadata,
                                                     depth,
                                                     child_value_as_label,
                                                     taskUrl)
{
  mmdField = mmdField.scalar;

  // Is this a visible field?
  if (MetadataLoader.isFieldVisible(mmdField, metadata, taskUrl, parentField))
  {        
    // Is there a metadata value for this field?    
    var value = MetadataLoader.getFieldValue(mmdField, metadata);        
    if (value)
    {  
      if (child_value_as_label != null)
      {
        mmdField.use_value_as_label = child_value_as_label; 
      }
                
      var field = MetadataLoader.getMetadataField(mmdField, metadataViewModel);
                
      field.value = value;
      if (mmdField.use_value_as_label != null) 
      {
        field.value_as_label =
          MetadataLoader.getValueForProperty(mmdField.use_value_as_label,
                                             metadata, mmdKids, depth);
      }
                
      field.scalar_type = mmdField.scalar_type;
      field.parentMDType = metadata.meta_metadata_name;  
            
      // Does the field have a navigation link?
      if (mmdField.navigates_to != null)
      {
        var navigationLink = metadata[mmdField.navigates_to];
        
        // Is there a value for the navigation link
        if (navigationLink != null
            && (navigationLink.toLowerCase() != taskUrl || depth == 0))
        {
          field.navigatesTo = navigationLink;
        }
      }
      
      if (mmdField.concatenates_to)
      {
        MetadataLoader.concatenateField(field, metadataViewModel, mmdKids);
      }
      
      if (metadataViewModel.indexOf(field) == -1)
      {
        metadataViewModel.push(field);
      }
    }
  }
}

MetadataLoader.getCompositeMetadataViewModel = function(metadataViewModel,
														parentField,
                                                        mmdField,
                                                        mmdKids,
                                                        metadata,
                                                        depth,
                                                        child_value_as_label,
                                                        taskUrl)
{
  mmdField = mmdField.composite;
      
  // Is this a visible field?
  if (MetadataLoader.isFieldVisible(mmdField, metadata, taskUrl, parentField))
  {        
    // Is there a metadata value for this field?    
    var value = MetadataLoader.getFieldValue(mmdField, metadata);  
    if (value)
    {  
      if (child_value_as_label != null)
      {
        mmdField.use_value_as_label = child_value_as_label;
      }
    
      // If there is an array of values            
      if (value.length != null)
      {            
        for (var i = 0; i < value.length; i++)
        {
          var field = new MetadataViewModel(mmdField);
          
          field.value =
            MetadataLoader.getMetadataViewModel(mmdField, mmdField["kids"], value[i],
                                                depth + 1, null, taskUrl);
          if (mmdField.use_value_as_label != null)
          {
            field.value_as_label =
              MetadataLoader.getValueForProperty(mmdField.use_value_as_label,
                                                 value[i], mmdField["kids"],
                                                 depth + 1);
          }
          
          field.composite_type = mmdField.type;
          field.parentMDType = metadata.meta_metadata_name;
          MetadataLoader.checkAndSetShowExpanded(parentField, field);
          
          metadataViewModel.push(field);
        }
      }
      else
      {
        var field = new MetadataViewModel(mmdField);
                    
        field.value =
          MetadataLoader.getMetadataViewModel(mmdField, mmdField["kids"], value,
                                              depth + 1, null, taskUrl);
        if (mmdField.use_value_as_label != null)
        {
          if (mmdField.child_value_as_label != null)
          {
            field.value_as_label =
              MetadataLoader.getValueForProperty(mmdField.use_value_as_label,
                                                 value, mmdField["kids"],
                                                 depth + 1);
          }
          else
          {
            field.value_as_label =
              MetadataLoader.getValueForProperty(mmdField.use_value_as_label,
                                                 metadata, mmdKids, depth + 1);
          }
        }
        
        field.composite_type = mmdField.type;
        field.parentMDType = metadata.meta_metadata_name;
        MetadataLoader.checkAndSetShowExpanded(parentField, field);
        
        metadataViewModel.push(field);
      }
    }
  }
  else
  {
    if (value)
    {
    }
  }
}

MetadataLoader.getCollectionMetadataViewModel = function(metadataViewModel,
														 parentField,
                                                         mmdField,
                                                         mmdKids,
                                                         metadata,
                                                         depth,
                                                         child_value_as_label,
                                                         taskUrl)
{
  mmdField = mmdField.collection;  
  if(mmdField.name == "companion_products"){
	  
  }
  // Is this a visible field?
  if (MetadataLoader.isFieldVisible(mmdField, metadata, taskUrl, parentField))
  {    
    // Is there a metadata value for this field?  
    var value = MetadataLoader.getFieldValue(mmdField, metadata);  
    if (value)
    {  
      if (child_value_as_label != null)
      {
        mmdField.use_value_as_label = child_value_as_label;
      }
      
      var field = new MetadataViewModel(mmdField);
      
      field.child_type = (mmdField.child_tag != null) ? mmdField.child_tag
                                                      : mmdField.child_type;
      field.parentMDType = metadata.meta_metadata_name;
                  
      // If scalar collection
      if (mmdField.child_scalar_type != null)
      {    
        field.child_type = mmdField.child_scalar_type;      
                    
        var newList = [];
        for (var k = 0; k < value.length; k++)
        {
          var scalarField = new MetadataViewModel(mmdField);
          scalarField.value = value[k]; 
          scalarField.hide_label = true;
          scalarField.scalar_type = mmdField.child_scalar_type;
          newList.push(scalarField);
        }
        field.value = newList;
      }    
      // Else if it's a polymorphic collection
      else if (mmdField.polymorphic_scope != null)
      {            
        var newObject = {};
        var newArray = [];
        
        for (var i = 0; i < value.length; i++)
        {             
          for (k in value[i])
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
      
      if (mmdField.child_use_value_as_label != null)
      {
        field.value =
          MetadataLoader.getMetadataViewModel(mmdField,
        		  							  mmdField["kids"],
                                              value,
                                              depth + 1,
                                              mmdField.child_use_value_as_label,
                                              taskUrl);
      }
      else if (mmdField.child_scalar_type == null)
      {
        field.value =
          MetadataLoader.getMetadataViewModel(mmdField, mmdField["kids"], value,
                                              depth + 1, null, taskUrl);
      }
      if (mmdField.use_value_as_label != null) 
      {
        field.value_as_label =
          MetadataLoader.getValueForProperty(mmdField.use_value_as_label,
                                             metadata, mmdKids);
      }
      //Dummy call for facet information
      var facetList = MetadataLoader.getFacets(taskUrl, mmdField);
      field.facets = facetList;
    
      metadataViewModel.push(field);
    }
  }
}

MetadataLoader.getFacets = function(parentUrl, mmdField){
	//The current iteration of this is quite dumb: it literally goes into a collection and scans the kid's kid's for any hint of a facet
	//and then goes cha-raazy!
	/*
	var facetFlag = false;
	for(var i = 0; i < mmdField.kids[0].composite.type_mmd.kids.length; i++){
		if ( mmdField.kids[0].composite.type_mmd.kids[i].facet_type != null && mmdField.kids[0].composite.type_mmd.kids[i].facet_type != ""){
			facetFlag = true;
		}
	}
	
	if(facetFlag){
			return ['url'];
	}
	return [];*/
	/*
	 * */
	var facetList= [];

	var children = mmdField.kids[0].composite.kids;
	if(children!=null){
		for(var i = 0; i < children.length; i++){
			
			if(children[i].collection!=null){
				var field = children[i].collection;
				if(field.facet_type != null && field.facet_type!=""){
					var obj = {}
					obj.name = field.name;
					obj.facet_type = field.facet_type;
					facetList.push(obj);				}
			}
			else if (children[i].composite!=null){
				var field = children[i].composite;
				if(field.facet_type != null && field.facet_type!=""){
					var obj = {}
					obj.name = field.name;
					obj.facet_type = field.facet_type;
					facetList.push(obj);					}
			}
			else if(children[i].scalar!=null){
				var field = children[i].scalar;
				if(field.facet_type != null && field.facet_type!=""){
					var obj = {}
					obj.name = field.name;
					obj.facet_type = field.facet_type;
					facetList.push(obj);					}
			}	
		}

	}
	
	return facetList;
	
}
MetadataLoader.collapseEmptyLabelSet = function(metadataViewModel, parentField)
{
	var deleteLabelCol = true;
	// make deleteLabelCol false if any child label is visible
	for (var i = 0; i < metadataViewModel.length; i++)
	{
		if (MetadataLoader.isLabelVisible(metadataViewModel[i], parentField))
		{
			deleteLabelCol = false;
			break;
		}		
	}
	
	if (deleteLabelCol)
	{
		for (var i = 0; i < metadataViewModel.length; i++)
		{
			var field = metadataViewModel[i];
			if (field.scalar_type)
			{
				// TODO: set use_value_as_label as itself?
			}
			else if (field.composite_type || field.child_type)
			{
				if (field.value.length > 0)
					metadataViewModel[i] = field.value[0];
			}
		}
	}
}

MetadataLoader.isLabelVisible = function(field, parentField)
{
	if (field.scalar_type)
	{
		if (field.name && !field.hide_label)
		{
			return true;
		}
	}
	else if (field.composite_type)
	{
		var imageLabel = (field.value_as_label == "") ?	false : field.value_as_label.type == "image";
		// if label visible OR 
		// expandable composite -- more than one item
		// downloadable document OR composite media field
		if ( ((field.name && !field.hide_label) && (imageLabel || !parentField.child_type)) 
				|| (field.value.length > 1) 
				|| (field.value.length == 1 && (field.value[0].navigatesTo || field.value[0].name == "location")) )
		{
			return true;
		}
	}
	else if (field.child_type)
	{
		// if label visible OR expandable collection
		if ((field.name && !field.hide_label) || (field.value.length > 1))
		{
			return true;
		}
	}
	return false;
}

MetadataLoader.checkAndSetShowExpanded = function(parentField, field)
{
	if (parentField.child_show_expanded_initially != null) {
		field.show_expanded_initially = parentField.child_show_expanded_initially;
	}
	if (parentField.child_show_expanded_always != null) {
		field.show_expanded_always = parentField.child_show_expanded_always;
	}
}

/**
 * 
 */
MetadataLoader.isFieldVisible = function(mmdField, metadata, url, parentField)
{
  if (mmdField["styles"])
  {
    var style = mmdField["styles"][0];
    var location = metadata[mmdField["name"]].location; 
    if (style.is_child_metadata == "true" && style.hide == "true" 
        && url && location && location.toLowerCase() == url)
    {
      return false;
    }
  }
  
  var includeMediaField = MetadataLoader.isVisibleMediaField(mmdField, parentField);
  
  return includeMediaField || mmdField.hide == null || mmdField.hide == "false" || mmdField.always_show == "true";
}

MetadataLoader.isVisibleMediaField = function(mmdField, parentField)
{
	if (parentField.type == "image" && mmdField.name == "location")
		return true;
	
	return false;
}

/**
 * 
 */
MetadataLoader.getFieldValue = function(mmdField, metadata)
{
  
  if (mmdField.tag != null){
	  if(metadata[mmdField.tag] != null){
		  return metadata[mmdField.tag];
	  }
	  else{
		  return metadata[mmdField.name];
	  }
  }
  else{
	  return metadata[mmdField.name];
  }
}

/**
 * 
 */
MetadataLoader.getValueForProperty = function(valueAsLabelStr, metadata,
                                              mmdKids, depth, taskUrl)
{
  var nestedFields = valueAsLabelStr.split(".");
  var fieldValue = metadata;
  var fieldType = "";
  for (var i = 0; i < nestedFields.length; i++)
  {
    for (var key in mmdKids)
    {
      var mmdField = mmdKids[key];
      if (mmdField.scalar)
      {
        mmdField = mmdField.scalar;
        fieldType = "scalar";
        if (mmdField.name == nestedFields[i])
        {
          break;        
        }
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
        fieldType = (mmdField.child_tag != null) ? mmdField.child_tag
                                                 : mmdField.child_type;
        if (mmdField.name == nestedFields[i])
        {
          mmdKids = mmdField["kids"];

          // get the child type; as directly selecting the first child below
          mmdField = mmdKids[0];
          if (mmdField.scalar)
          {
            mmdField = mmdField.scalar;
          }
          else if (mmdField.composite)
          {
            mmdField = mmdField.composite;
          }
          
          mmdKids = mmdField["kids"];
          depth = depth + 1;
          
          break;
        }
      }      
    }
    
    fieldValue = fieldValue[nestedFields[i]];
    // if value is to be read from a collection, then use first element (if its a composite)
    // TODO: define semantics for selection
    if (fieldValue && fieldValue.length != null && mmdField.type)
    {
      fieldValue = fieldValue[0];
    }
  }
  
  // TODO: define caching structure
  if (mmdField.metadataFields)
  {
    return {value: mmdField.metadataFields, type: fieldType};
  }
  else if (fieldValue)
  {
    if (fieldType == "scalar")
    {
      return {value: fieldValue, type: fieldType};
    }
    else  
    {
      var metadataFields =
        MetadataLoader.getMetadataViewModel(mmdField, mmdKids, fieldValue, depth, null,
                                            taskUrl);
      return {value: metadataFields, type: fieldType};
    }        
  }

  return "";
}

/**
 * 
 */
MetadataLoader.concatenateField = function(field, metadataFields, mmdKids)
{
  var metadataField = "";  
  for (var i = 0; i < metadataFields.length; i++)
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
      {
        mmdField = mmdField.scalar;
      }
      else if (mmdField.composite)
      {
        mmdField = mmdField.composite;
      }
      else if (mmdField.collection)
      {
        mmdField = mmdField.collection;
      }
      
      var name = mmdField.name;
      if (name == field.concatenates_to)
      {
        metadataField = new MetadataViewModel(mmdField);
        metadataField.concatenates.push(field);
        metadataFields.push(metadataField);
      }
    }
  }
}

/**
 *
 */
MetadataLoader.getImageSource = function(metadataViewModel)
{
  for (var i = 0; i < metadataViewModel.length; i++)
  {
    if (metadataViewModel[i].name == "location")
    {
      return metadataViewModel[i].value;
    }
  }
  return null;
}
/** 
 * Make the string prettier by replacing underscores with spaces  
 * @param string to make over
 * @return hansome string, a real genlteman
 */
MetadataLoader.toDisplayCase = function(string)
{  
  var strings = string.split('_');
  var display = "";
  for (var s in strings)
  {
    display += strings[s].charAt(0).toLowerCase() + strings[s].slice(1) + " ";
  }
  return display;
}

/**
 * Remove line breaks from the string and any non-ASCII characters
 * @param string
 * @return a string with no line breaks or crazy characters
 */
MetadataLoader.removeLineBreaksAndCrazies = function(string)
{
  string = string.replace(/(\r\n|\n|\r)/gm," ");  
  var result = "";
  for (var i = 0; i < string.length; i++)
  {
    if (string.charCodeAt(i) < 128)
    {
      result += string.charAt(i);
    }
  }
  return result;
}

/**
 *
 */
MetadataLoader.clearDocumentCollection = function()
{
  MetadataLoader.queue = [];
  MetadataLoader.documentMap = [];
}

/**
 * Gets the host from a URL
 * @param url, string of the target URL
 * @return host as a string
 */
MetadataLoader.getHost = function(url)
{
  if (url)
  {
    var host = url.match(/:\/\/(www\.)?(.[^/:]+)/)[2];
    return "http://www." + host;
  }
}
function Facet(fieldName, isFilter, isSort ){
	this.field = fieldName;
	this.isFilter = isFilter;
	this.isSort = isSort
}
MetadataLoader.setFilterAndSortCall = function(facetedCollection, callback){
	//Later we will make an appropriate call to the service
	//For now we are just going to call a dummy function
	return MICE.dummyUrlList;
}
function compareFacetedCollection(a,b) {
	  if (a.last_nom < b.last_nom)
	     return -1;
	  if (a.last_nom > b.last_nom)
	    return 1;
	  return 0;
	}


