
/**
 * RenderingTask is essentially (though not techincally) and ectension of MetadataTask. The big difference is that
 * rendering task passes the metadata is recieves through the ViewModeler before giving it to the rendering function
 *
 * @param url of the document
 * @param isRoot, true if this is the root document for a metadataRendering
 * @param clipping, metadata already in your possession
 * @param handler, a callback function that 'does stuff' with the metadata after its been downloaded/parsed
 * @param container, HTML container which will hold the rendering

 */

function RenderingTask(url, isRoot, clipping, handler, container, renderer)
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
   
  this.handler = this.metadataToModel;
  this.renderer = renderer;
}

RenderingTask.prototype.metadataToModel = function(task){

    var metadataFields =
    	ViewModeler.createMetadata(task.isRoot, task.mmd,
                                    task.metadata, task.url);
    // Is there any visable metadata?
    if (ViewModeler.hasVisibleMetadata(metadataFields))
    {	
    	
    // If so, then build the HTML table	
      var styleMmdType = (task.expandedItem && tasks[i].expandedItem.mmdType && 
			task.expandedItem.mmdType.indexOf("twitter") != -1)? "twitter" : task.mmd.name; 
		var miceStyles = InterfaceStyle.getMiceStyleDictionary(styleMmdType);         //Adds the metadata type as an attribute to the first field in the MD
     //Adds the metadata type as an attribute to the first field in the MD
      metadataFields[0].parentMDType = task.mmd.name;
      task.fields = metadataFields;
      task.style = {styles: miceStyles, type: task.mmd.name};
      task.renderer(task);
      return task;
    }
    else{
    	return null;
    }
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