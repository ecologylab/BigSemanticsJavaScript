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



//The queue holds a list of containers which are waiting for metadata or
//meta-metadata from the service.
MetadataLoader.queue = [];
MetadataLoader.onloadCallback = function(urls, url) { /* null default implementation */ };


/**
 * Requests metadata of the given URL and the corresponding meta-metadata from
 * the BigSemantics service, then calls the given callback for rendering.
 *
 * @param handler:
 *     The callback that operates on metadata.
 * @param url:
 *     The URL to the requested document.
 * @param isRoot:
 *     Is 'true' when this metadata is a top level one in the current context.
 * @param clipping:
 *     Used to specify special clipping structure for special use.
 * @param container: if a handler has an associated HTML container, this is where it goes!
     
 */

MetadataLoader.load = function(handler, url, isRoot, clipping, container)
{
  // Add the rendering task to the queue
  

  var task = new Metadatatask(url, isRoot, clipping, renderer, container)
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
};


/**
 * Retrieves the metadata from the service using a JSON-p call.
 * When the service responds the callback function will be called.
 *
 * @param url, url of the target document
 * @param callback, name of the function to be called from the JSON-p call
 */
MetadataLoader.getMetadata = function(url, callback, reload, source)
{
	/*
	 * Should eventually choose where to get mmd from based on source
	 */
	
	
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
};



//Logger
MetadataLoader.logger = function(message) { /* null default implementation */ };

//The URL for the document being loaded.
MetadataLoader.currentDocumentLocation = "";


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
      metadata.meta_metadata_name = i;
    }
    
    if (i == "deserialized")
    {
      deserialized = true;
    }
  }
  
  if(jQuery.isEmptyObject(metadata) && rawMetadata != null){
	  metadata = rawMetadata;
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
    { 	
    	if(queueTask.mmdType == null)
    	{
    		queueTask.mmdType = metadata.meta_metadata_name;
    	}
    	//When we specify extractors, this is where that logic will go
    	if(queueTask.extractor != null){
    		if(queueTask.extractor == 'nottheService'){
        		MetadataLoader.getMMD(queueTask, "MetadataLoader.setMetaMetadata");

    		}
    	}else{
           MetadataLoader.getMMD(queueTask, "MetadataLoader.setMetaMetadata");

      }
    	
    }
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
  // TODO move MDC related code to mdc.js
  if (typeof MDC_rawMMD != "undefined")
  {
  	simplGraphCollapse(mmd);
    MDC_rawMMD = JSON.parse(JSON.stringify(mmd));
    simplDeserialize(mmd);
  }
  
  var tasks = MetadataLoader.getTasksFromQueueByType(mmd.name);
  
  if (tasks.length > 0)
  {
    for (var i = 0; i < tasks.length; i++)
    {
      tasks[i].mmd = mmd;

      // if the task has both metadata and meta-metadata then create and display
      // the rendering
      if (tasks[i].metadata && tasks[i].mmd)  
      {  
      	
      	// make sure any connected clippings have the correct meta_metadata_name
      	if (tasks[i].clipping && tasks[i].clipping.rawMetadata ) 
      	{
      		MetadataLoader.setClippingMetadataType(tasks[i].clipping, tasks[i].mmd);
      	}     	
      	
     
          tasks[i].handler(tasks[i]);
        
      }
    }
  }
  else
  {
    console.error("Retreived meta-metadata: " + mmd.name
                  + "  but it doesn't match a document from the queue.");
  }
};


MetadataLoader.setClippingMetadataType = function(clipping, mmd)
{
	var mmdName = mmd.name;
	var unwrappedMetadata = MetadataLoader.getUnwrappedMetadata(clipping.rawMetadata);
		unwrappedMetadata.meta_metadata_name = mmdName;
	
	var newMetadata = {};
	newMetadata[mmdName] = unwrappedMetadata;

	clipping.rawMetadata = newMetadata;
};

MetadataLoader.getUnwrappedMetadata = function(wrappedMetadata)
{
	for(var key in wrappedMetadata)
	{
		if(key != "simpl.id" && key != "simpl.ref" && key != "deserialized")
		{
			return wrappedMetadata[key];
		}
	}
};

/**
 * @returns bool, to request extension for metadata or not
 */
MetadataLoader.toRequestMetadataFromService = function(location)
{
	return !MetadataLoader.isExtensionMetadataDomain(location);
}

MetadataLoader.isExtensionMetadataDomain = function(location)
{
	for (var i = 0; i < RepoMan.extensionMetadataDomains.length; i++)
	{
		if (location.indexOf(RepoMan.extensionMetadataDomains[i]) != -1)
			return true;
	}
	return false;
}

MetadataLoader.checkForMetadataFromExtension = function()
{
	for (var i = 0; i < RepoMan.extensionMetadataDomains.length; i++)
	{
		var tasks = MetadataLoader.getTasksFromQueueByDomain(RepoMan.extensionMetadataDomains[i]);
		for (var j = 0; j < tasks.length; j++)
		{
			MetadataLoader.getMetadata(tasks[i].url, "MetadataLoader.setMetadata");
		}
	}
}

/**
 * Retrieves the meta-metadata from the service using a JSON-p call.
 * When the service responds the callback function will be called.
 *
 * @param url, the URL of the document the requested meta-metadata is for.
 * @param callback, name of the function to be called from the JSON-p call
 */

MetadataLoader.getMMD = function(task, callback)
{
	if(RepoMan.repo != null)
	{
		RepoMan.getMMDFromRepoByTask(task);
	}
	else if(RepoMan.repoIsLoading == false)
	{
		RepoMan.repoIsLoading = true;
		RepoMan.loadMMDRepo();
	}
};	


/**
 * Do a JSON-P call by appending the jsonP url as a scrip object.
 * @param jsonpURL 
 */
MetadataLoader.doJSONPCall = function(jsonpURL)
{
  var script = document.createElement('script');
  script.src = jsonpURL;
  document.head.appendChild(script);
};


MetadataLoader.clearDocumentCollection = function()
{
  MetadataLoader.queue = [];
  MetadataLoader.documentMap = [];
}


/**
 * Get a matching MetadataTask from the queue 
 * @param url, target url to attempt to match to any tasks in the queue
 * @return a matching MetadataTask, null if no matches are found
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
};

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
    if (MetadataLoader.queue[i].mmdType == type || type == undefined)
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
