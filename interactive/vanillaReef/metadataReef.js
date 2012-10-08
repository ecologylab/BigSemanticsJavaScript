var PARENT = null;
function addMetadataRender(parent, url)
{
	getMetadata(url, printMetadata);
	PARENT = parent;
}

function printMetadata(metadata)
{
	PARENT.innerText = metadata;//JSON.stringify(metadata);
}

function getMetadata(url, callback)
{
	var serviceURL = "http://ecology-service/ecologylabSemanticService/metadata.json?url=";
	serviceURL += url;
	/*
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open("GET", serviceURL, true);
	xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	
	xmlhttp.onreadystatechange = function() {
		
		//Call a function when the state changes.
		if(xmlhttp.readyState == 4 && xmlhttp.status == 200) {
			
			var response = jQuery.parseJSON(xmlhttp.responseText);
			
			//if(settings.debugMmd == "true") {
				console.log("Metadata object:");
				console.log(response);
			//}
			
			callback(response);
		}
	}
	xmlhttp.send(" ");
	
	var xmlHttp = null;
*/
    xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", serviceURL, false );
    xmlHttp.send( null );
    return xmlHttp.responseText;
}