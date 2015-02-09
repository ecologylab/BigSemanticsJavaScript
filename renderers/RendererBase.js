/**
 *  Basic functions intended to be shared by metadata renderers
 *  RendererBase.addMetadataDisplay is the key function here
 *  
 *  
 *  DO NOT OVERWRITE these functions 
 *  
 *
 */

/*
 * Although we do not pursue a strictly object-oriented structure in BSJS
 * we include this constructor as an example of what renderers should have
 * 
 */
var RendererBase = {};

RendererBase.documentMap = [];

/**
 * add metadata display to the container.
 * @param container, the HTML object to which the metadata rendering will be appended
 * @param url, url of the  document
 * @param isRoot, is this the root metadata for the rendering (currently used for removing existing children)
 * @param requestMD, true if the function should request metadata from service, else false
 * @param reloadMD, true if the metadata should be extracted afresh, else false 
 * @param renderer, the function used by a particular renderer to fill in the container with HTML
 */
RendererBase.addMetadataDisplay = function(container, url, isRoot, clipping, requestMD, reloadMD, renderer){
	
	// Add the rendering task to the queue
	var task = new RenderingTask(url, true, clipping, null, container, null, renderer)
	MetadataLoader.queue.push(task);	
	
	if(clipping != null && clipping.rawMetadata != null)
	{
		clipping.rawMetadata.deserialized = true;
		MetadataLoader.setMetadata(clipping.rawMetadata);
	}
	else
	{	
		var requestMetadata = (typeof requestMD === "undefined") || requestMD == true;
		
		// Fetch the metadata from the service
		if(!isExtension && requestMetadata)
			MetadataLoader.getMetadata(url, "MetadataLoader.setMetadata", reloadMD);	
	}
}


/**
 * Searches the document map for the given url.
 *
 * @param url, url to search for in the document map
 * @return true, if the url exists in the document map, false otherwise
 */

RendererBase.isRenderedDocument = function(url)
{
  for (var i = 0; i < RendererBase.documentMap.length; i++)
  {
    if (RendererBase.documentMap[i].matches(url) && RendererBase.documentMap[i].rendered)
    {
      return true;
    }
  }
  return false;
}

RendererBase.createLoadingRow = function(styleInfo)
{
	var row = document.createElement('tr');
	
	var loadingRow = document.createElement('div');
		loadingRow.className = styleInfo.styles.loadingRow;
		loadingRow.innerText = "Loading document...";
		loadingRow.textContent = "Loading document...";
		
	row.appendChild(loadingRow);
	return row;
}
/*
 * Used to obtain labels for fields
 */
RendererBase.getFieldLabel = function(metadataField)
{
	var label = {};
	if (metadataField.value_as_label != "")
	{
		if (metadataField.value_as_label.type == "scalar" && metadataField.value_as_label.value.trim() != "")
		{
			label.type = "scalar";
			label.value = metadataField.value_as_label.value;
		}
		else if (metadataField.value_as_label.type == "image" && ViewModeler.getImageSource(metadataField.value_as_label.value))
		{
			label.type = "image";
			label.value = metadataField.value_as_label.value;
		}
		else
		{
			label.type = "scalar";
			label.value = metadataField.name;
		}
	}
	else
	{
		label.type = "scalar";
		label.value = metadataField.name;
	}
	return label;
}

//If metadata is already made, adds style info
RendererBase.addStyleToTask = function (task) {
    var styleMmdType = (task.expandedItem && task.expandedItem.mmdType &&
    task.expandedItem.mmdType.indexOf("twitter") != -1) ? "twitter" : task.mmd.name;
    var miceStyles = InterfaceStyle.getMiceStyleDictionary(styleMmdType);         //Adds the metadata type as an attribute to the first field in the MD
    //Adds the metadata type as an attribute to the first field in the MD
    task.style = { styles: miceStyles, type: task.mmd.name };
    return task;
}


/**
 * DocumentContainer represents a document that is part of a MetadataRendering
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