//temporary fix for overriding RenderingTask

/**
 * RenderingTask represents a metadata rendering that is in progress of being downloaded and parsed
 * @param url of the document
 * @param container, HTML container which will hold the rendering
 * @param isRoot, true if this is the root document for a metadataRendering
 * @param expandedItem, a non-metadata item for which the display was constructed
 */
function RenderingTask(url, container, isRoot, clipping, renderer, expandedItem, visual, bgColorObj)
{
	if(url != null)
		this.url = url.toLowerCase();
	
	this.container = container;
	this.clipping = clipping;
	
	this.metadata = null;	
	this.mmd = null;
	
	this.isRoot = isRoot;
	
	this.renderer = renderer;
	this.expandedItem = expandedItem;
	this.visual = visual;
	this.bgColorObj = bgColorObj;
}

/**
 * Does the given url match the RenderingTask's url?
 * @param url, url to check against the RenderingTask
 */
RenderingTask.prototype.matches = function(url)
{
    url = url.toLowerCase();
    return this.url === url;
}
