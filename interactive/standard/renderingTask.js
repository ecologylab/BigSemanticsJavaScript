/**
 * RenderingTask represents a metadata rendering that is in progress of being downloaded and parsed
 * @param url of the document
 * @param container, HTML container which will hold the rendering
 * @param isRoot, true if this is the root document for a metadataRendering
 */
function RenderingTask(url, container, isRoot)
{
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