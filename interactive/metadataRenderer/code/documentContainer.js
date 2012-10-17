/**
 * DocumentContain represents a document that is part of a MetadataRendering
 * @param url, location of the document, serves as the document ID
 * @param container, HTML object which contains the rendering of this document
 * @param rendered, true if the document has been downloaded and displayed, false otherwise
 */
function DocumentContainer(url, container, rendered)
{
	this.url = url.toLowerCase();
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
	if(this.url.indexOf(url) == 0)
	{
		return true;
	}
	else if(url.indexOf(this.url) == 0)
	{
		return true;
	}
	return false;
}