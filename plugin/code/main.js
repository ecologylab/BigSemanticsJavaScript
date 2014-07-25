// GLODBAL VARIABLES
var slideOutVisual;
var SLIDEOUT_WIDTH = 660; //320
var MICEDISPLAY = true;
var defVars = { };
var browserExtraction = true;

window.onload = setup(document);


chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    toggleSlideOut();
  });

/**
 * Sets up the plugin.
 * Should be called when the webpage has loaded
 */
function setup(document)
{
	// create the the 'slide-out'
	buildSlideOut(document);
	var x = getMMD(document.URL, handleMMD);
}

/**
 * Asks the semantic service for the meta-metadata for the given URL
 */
function getMMD(url, callback)
{
	var serviceURL = "http://ecology-service.cse.tamu.edu/BigSemanticsService/mmd.json?url="; //settings.serviceUrl;
	serviceURL += url;
	
	//make a request to the service for the mmd for the url
	var request = new XMLHttpRequest();
	request.open("GET", serviceURL, true);
	request.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	
	request.onreadystatechange = function()
	{
		if(request.readyState == 4) {
			
			if (request.status == 200) {
				// if the request succeeds, call the callback function with the mmd as the param
				ans = request.responseText;
				callback(ans, url);

			} else {
				// if the request fails, call the callback function with an error message
				// and log an error to the console
				var errormes = "Error! XMLHttpRequest failed.";
				console.log(errormes);
				handleMMD(errormes);
			}
		}	
	};
	request.send();
	return request;
}


/**
 * Callback function for getMMD() 
 * @param mmd, returned mmd JSON from service
 */
function handleMMD(mmd, url)
{
	// deserialize
	mmd = JSON.parse(mmd);
	//console.log(mmd);

	console.log(mmd);
	
	//mmd = mmd['meta_metadata'];
	//console.log(mmd);
	
	if (MICEDISPLAY) {
		simplDeserialize(mmd);	
		console.log(mmd['meta_metadata']);
		getMetadata(url,mmd);
	} else {
		console.log(mmd['meta_metadata']);
		renderMMD(mmd['meta_metadata'], url);
	}
}

/*
 * temps?
 */
function getMetadata(url,mmd)
{
	if (browserExtraction)
	{
		var metadataObject;
		metadataObject = extractMetadata(mmd);
		handleMetadata(mmd,metadataObject,url);
	}
	else // service extraction
	{
		//to get metadata
		var mServiceURL = "http://ecology-service.cs.tamu.edu/BigSemanticsService/metadata.json?url=";
		mServiceURL += url;
		
		var request = new XMLHttpRequest();
		request.open("GET",mServiceURL,true);
		request.setRequestHeader("Content-type","application/x-www-form-urlencoded");
		
		request.onreadystatechange = function ()
		{
			if(request.readyState == 4 && request.status == 200) {
				//console.log(request.responseText);
				//var ans = JSON.parse(JSON.stringify(request.responseText));
				var ans = JSON.parse(request.responseText);
				//console.log(ans);
				handleMetadata(mmd,ans,url);
			}
		};
		
		request.send();
		// return request;
	}
	

}

function handleMetadata(mmd,meta,url)
{
	console.log(meta);
	console.log(mmd);
	
	for (i in meta) {
		console.log(i);
		meta = meta[i];
	}

	var task = new RenderingTask(url,slideOutVisual,true);	
	//console.log(task.url);
	var fields = MetadataLoader.createMetadata(true,mmd,meta,url);
	console.log(fields);
	MICE.render(task,fields);
}

