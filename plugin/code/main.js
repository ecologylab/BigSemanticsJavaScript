// GLODBAL VARIABLES
var slideOutVisual;
var SLIDEOUT_WIDTH = 320;

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
	var serviceURL = "http://ecology-service.cse.tamu.edu/BigSemanticsService/mmd.json?url=";//settings.serviceUrl;
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
				var ans = JSON.parse(request.responseText);
				console.log(ans);
				console.log(ans['meta_metadata']);
				//handleMMD(ans['meta_metadata'], url);					commented for now
				
				getMetadata(url,ans);
				
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




/*
 * temps
 */
function getMetadata(url,mmd)
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
			console.log(request.responseText);
			var ans = JSON.parse(request.responseText);
			console.log(ans);
			handleMetadata(mmd,ans,url);
			//var ans = JSON.parse(request.responseText);
			//console.log(ans);
			//handleMetadata(ans);
			//MICE.render(slideOutVisual,ans['attracion']);
		}
	};
	
	request.send();
	return request;
	

}

function handleMetadata(mmd,meta,url)
{
	console.log(meta);
	
	for (i in meta) {
		//console.log(i);
		meta = meta[i];
	}

	
	
	for (j in meta) {
		console.log(j + ": " + meta[j]);
		var x = j;
	}

	console.log(meta);
	
	//var meta = MetadataLoader.setMetadata(meta);
	console.log(meta);
	console.log(mmd['meta_metadata']);
	
	//mmd = mmd['meta_metadata'];
	
	var fields = MetadataLoader.createMetadata(true,mmd,meta,url);
	//MetadataLoader.getMetadataViewModel(mmd,mmd['kids'],meta,0,null,url);
	
	console.log(fields);
}

/**
 * Callback function for getMMD() 
 * @param mmd, returned mmd JSON from service
 */
function handleMMD(mmd, url)
{
	// deserialize TODO
	
	renderMMD(mmd, url);
}
