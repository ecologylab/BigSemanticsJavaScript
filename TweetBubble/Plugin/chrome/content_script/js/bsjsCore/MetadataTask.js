
/**
 * MetadataTask represents a metadata request that is in progress of being
 * downloaded and parsed.
 *
 * @param url of the document
 * @param isRoot, true if this is the root document for a metadataRendering
 * @param clipping, metadata already in your possession
 * @param handler, a callback function that 'does stuff' with the metadata after its been downloaded/parsed
 * @param container, HTML container which will hold the rendering
 * @param extractor, which extraction service ('extension', 'service') to use to obtain md

 */
function MetadataTask(url, isRoot, clipping, handler, container, extractor)
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
   
  this.handler = handler;
  this.extractor = extractor;
}

/**
 * Does the given url match the RenderingTask's url?
 *
 * @param url, url to check against the RenderingTask
 */
MetadataTask.prototype.matches = function(url)
{
  url = url.toLowerCase();
  return this.url === url;
}