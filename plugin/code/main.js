// GLODBAL VARIABLES
var slideOutVisual;
var SLIDEOUT_WIDTH = 660; //320
var browserExtraction = true;
var MICEDISPLAY = true;
var defVars = { };
var url;
var description;
var baseURL;

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
	getMMD(document.URL, handleMMD);
}

/**
 * Asks the semantic service for the meta-metadata for the given URL
 */
function getMMD(pageURL, callback)
{
	url = pageURL;
	
	baseURL = url.substring(0,getPosition(url,"/",3));
	console.log(baseURL);
	
	console.log(url);
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
				//console.log(ans);
				callback(ans);

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
}


/**
 * Callback function for getMMD() 
 * @param mmd, returned mmd JSON from service
 */
function handleMMD(mmd)
{
	// deserialize
	mmd = JSON.parse(mmd);
	//console.log(mmd);

	console.log(mmd);

	if (MICEDISPLAY) {
		simplDeserialize(mmd);	
		console.log(mmd['meta_metadata']);
		getMetadata(mmd);
	} else {
		console.log(mmd['meta_metadata']);
		renderMMD(mmd['meta_metadata'], url);
	}
}

/*
 * temps?
 */
function getMetadata(mmd)
{
	var parser = mmd.meta_metadata.parser;
	console.log(parser);
		
	if (browserExtraction && parser == "xpath")
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
				handleMetadata(mmd,ans);
			}
		};
		
		request.send();
	}
	

}

function handleMetadata(mmd,meta)
{
	console.log("metadata: ");
	console.log(meta);
	console.log("mmd: ");
	console.log(mmd);
	
	for (i in meta) {
		meta = meta[i];
	}

	var task = new RenderingTask(url,slideOutVisual,true);	
	//console.log(task.url);
	var fields = MetadataLoader.createMetadata(true,mmd,meta,url);
	console.log(fields);
	MICE.render(task,fields);
}

function getPosition(str, m, i) 
{
   return str.split(m, i).join(m).length;
}

