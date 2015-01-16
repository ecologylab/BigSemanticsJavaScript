// GLODBAL VARIABLES
var slideOutVisual;
var serializedMeta = "{\"undefined\":{}}";
var SLIDEOUT_WIDTH = 660; //320
var browserExtraction = true; //service or browser extraction (blackboxing)
var defVars = { };
var url;
var baseURL;
var serviceCall = false; //whether or not service call is needed when extracting metadata
var MMD;
var display = true;

window.onload = setup(document);

/**
 * Sets up the plugin.
 * Should be called when the webpage has loaded
 */
function setup(document)
{
	// create the the 'slide-out'
	buildSlideOut(document);
	//getMMD(document.URL, handleMMD);
    
    //we are now doing it client-side
    handleMMD(getDocumentMM(document.URL), document.URL);
}

/**
 * Asks the semantic service for the meta-metadata for the given URL
 */
function getMMD(pageURL, callback)
{
	url = pageURL;
	
	baseURL = url.substring(0,getPosition(url,"/",3));
	
	var serviceURL = "//ecology-service.cse.tamu.edu/BigSemanticsService/mmd.json?url=";
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
				callback(ans);

			} else {
				console.log("Error! XMLHttpRequest failed.");
			}
		}	

	};
	request.send();
}


/**
 * Callback function for getMMD() 
 * @param mmd, returned mmd JSON from service
 */
function handleMMD(mmd, url)
{
    if (mmd === undefined){
        setTimeout(function() {handleMMD(getDocumentMM(url), url);}, 1000);
        return;
    }
   //simplDeserialize(mmd);	
   MMD = mmd;
   callService(mmd, url);
}

/*
 * decides whether or not the code will call the service for the metadata
 */
function callService(mmd, url)
{
    var parser = mmd.parser;

    if (mmd["extract_with"] == "service"){
        browserExtraction = false;
        serviceCall = true;
    }

    if (browserExtraction && parser == "xpath")
    {
        var metadataObject;
        metadataObject = extractMetadata(mmd);
    }
    if (!browserExtraction || serviceCall || parser != "xpath") // service extraction
    {
        return getMetadataFromService(mmd);
    }
    handleMetadata(mmd,metadataObject,url);
}

/*
 * get metadata from service if needed
 */
function getMetadataFromService(mmd)
{
	//to get metadata
	var mServiceURL = "//ecology-service.cs.tamu.edu/BigSemanticsService/metadata.json?url=";
	mServiceURL += url;
	
	var request = new XMLHttpRequest();
	request.open("GET",mServiceURL,true);
	request.setRequestHeader("Content-type","application/x-www-form-urlencoded");
		
	request.onreadystatechange = function ()
	{
		if(request.readyState == 4 && request.status == 200) {
			var ans = JSON.parse(request.responseText);
			handleMetadata(mmd,ans);
		}
	};
		
	request.send();
}

/*
 * sends mmd and metadata to mice display code for a mice display on the slide-out
 */
function handleMetadata(mmd,meta,url)
{
	console.log(JSON.stringify(meta));
	for (i in meta) {
		var meta2 = meta[i];
	}
	
	if (display) {
		var task = new RenderingTask(url,slideOutVisual,true);	
		var fields = MetadataLoader.createMetadata(true,mmd,meta2,url);
		//console.log(fields);
		MICE.render(task,fields);		
	}
	// var task = new RenderingTask(url,slideOutVisual,true);	
	// var fields = MetadataLoader.createMetadata(true,mmd,meta2,url);
	// console.log(fields);
	// MICE.render(task,fields);
	
	serialize(meta);
}

function getPosition(str, m, i) 
{
   return str.split(m, i).join(m).length;
}

/*
 * serializes metadata
 */
function serialize(meta)
{
	serializedMeta = JSON.stringify(meta);
}

/*
 * resets globals
 */
function reset(){
	var defVars = { };
	var serviceCall = false;
}

