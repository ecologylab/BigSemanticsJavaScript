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
			if(this.urls[i].indexOf(url) == 0)
			{
				return true;
			}
			else if(url.indexOf(this.urls[i]) == 0)
			{
				return true;
			}
		}
	}
	return false;
}}