/**
 * RenderingTask adopted for some TweetBubble-specific needs
 */

//temporary fix for overriding RenderingTask

/**
 * RenderingTask represents a metadata rendering that is in progress of being downloaded and parsed
 * @param url of the document
 * @param container, HTML container which will hold the rendering
 * @param isRoot, true if this is the root document for a metadataRendering
 * @param expandedItem, a non-metadata item for which the display was constructed
 */
function TweetBubbleRenderingTask(url, isRoot, clipping, handler, container, extractor, renderer,
												mmd, metadata, expandedItem, visual, bgColorObj)
{
	if(url != null)
		this.url = url.toLowerCase();
	
	this.container = container;
	this.clipping = clipping;
	
	this.metadata = metadata;	
	this.mmd = mmd;
	
	this.isRoot = isRoot;

	if (handler == null) {
		this.handler = RenderingTask.prototype.metadataToModel;
	} 
	else {
		this.handler = handler;
	}
	this.renderer = renderer;
	this.extractor = extractor;
	
	this.expandedItem = expandedItem;
	this.visual = visual;
	this.bgColorObj = bgColorObj;
}

/**
 * Does the given url match the RenderingTask's url?
 * @param url, url to check against the RenderingTask
 */
TweetBubbleRenderingTask.prototype.matches = function(url)
{
    url = url.toLowerCase();
    return this.url === url;
}
