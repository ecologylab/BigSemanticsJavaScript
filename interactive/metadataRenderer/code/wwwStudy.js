/** WWW Study specific functions **/

// WWW study namespace
var WWWStudy = {};
var CITE_U_LIKE_USERNAME;
var CITE_U_LIKE_TYPES;

/**
 * Check if the given type is a CiteULike type
 * @param type to check
 * @return true if it's a CiteULike type, false otherwise
 */
WWWStudy.isCiteULikeType = function(type)
{
	return CITE_U_LIKE_TYPES.indexOf(type) != -1;
}

/**
 * Send an event message to the window for logging purposes
 * The message contains a timestamp, the expaned document,
 * and a list of the path to that document
 * @param targetMetadata, metadata which was expanded
 * @param container, HTML container for the expaned metadata
 */
WWWStudy.logExpansion = function(targetMetadata, container)
{
	// Get the ancestry of the child metadata by backtracking through the DOM
	var parentList = [];
	while(container.parentElement)
	{
		if(container.parentElement.className == "metadataContainer")
		{
			var target = container.parentElement.getElementsByClassName("fieldValue")[0];			
			if(target.href)
				parentList.push({title: target.innerText, url: target.href});			
		}
		container = container.parentElement;
	}
		
	var time = new Date();
	
	// Create the expansion message
	var message = {
		timestamp: time.getTime(),
		source: {
				title: (targetMetadata.title) ? targetMetadata.title : targetMetadata.name,
				url: targetMetadata.location
			},
		parents: parentList
	};
	
	window.postMessage({ type: "EXPANSION_EVENT", text: JSON.stringify(message) }, "*");
}

/**
 * The WWW study uses one big canvas for drawing lines since it does cross-rendering lines 
 */
WWWStudy.clearBigCanvas = function()
{
	var canvas = document.getElementById("bigLineCanvas");
	var containerRect =  canvas.parentElement.getClientRects()[0];
	canvas.width = containerRect.width;
	canvas.height = containerRect.height;
}

/**
 * Create the HTML for the citeULike button with a given url 
 * @param url for the citeULike button to cite
 */
WWWStudy.createCiteULikeButton = function(url)
{
	var citeULikeAtag = document.createElement('a');
		citeULikeAtag.className = "citeULikeButton";
		citeULikeAtag.href = "http://www.citeulike.org/posturl?username="+ CITE_U_LIKE_USERNAME + "&bml=nopopup&url="+ url +")";
		citeULikeAtag.target = "_blank";
								
	var citeULikeButton = document.createElement('img');
		citeULikeButton.src = "citeULike.png";
								
	citeULikeAtag.appendChild(citeULikeButton);
	return citeULikeAtag;
}

/**
 * Check if the CiteULike button is needed, if so then create and add it 
 * @param container to add the button to
 * @param type of the metadata to check if it's a citeULike type
 * @param url of the document to cite
 */
WWWStudy.addCiteULikeButton = function(container, type, url)
{
	// Does it need the cite U like button? only if it is a certain metadata of type
	if(WWWStudy.isCiteULikeType(type))																							
		container.appendChild(WWWStudy.createCiteULikeButton(url));
}
