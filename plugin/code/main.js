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
	
	// make a request to the service for the mmd for the url
	var request = new XMLHttpRequest();
	request.open("GET",serviceURL, true);
	request.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	
	request.onreadystatechange = function()
	{
		if(request.readyState == 4) {
			
			if (request.status == 200) {
				// if the request succeeds, call the callback function with the mmd as the param
				var ans = JSON.parse(request.responseText);
				console.log(ans['meta_metadata']);
				handleMMD(ans['meta_metadata']);
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
function handleMMD(mmd)
{
	// deserialize TODO
	
	renderMMD(mmd);
}
