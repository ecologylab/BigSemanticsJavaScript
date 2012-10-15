/** Global Variables **/
var hasMetadata = false;
var metadata = {};
var settings = {};
var selectionListener = false;


// Retrieve the extension settings from the the background page.
chrome.extension.sendRequest({loadOptions: "all"}, function(response) {
  settings = response;
});


// Calls the windw.onload function after 1 second, this is to ensure that the onload function is called on the page.
setTimeout(window.onload, 1000);

/** window.onload
 *  Extracts the metadata from the current document.
 */

//some code from: http://www.html5rocks.com/en/tutorials/file/filesystem/#toc-support


function errorHandler(e) {
  var msg = '';

  switch (e.code) {
    case FileError.QUOTA_EXCEEDED_ERR:
      msg = 'QUOTA_EXCEEDED_ERR';
      break;
    case FileError.NOT_FOUND_ERR:
      msg = 'NOT_FOUND_ERR';
      break;
    case FileError.SECURITY_ERR:
      msg = 'SECURITY_ERR';
      break;
    case FileError.INVALID_MODIFICATION_ERR:
      msg = 'INVALID_MODIFICATION_ERR';
      break;
    case FileError.INVALID_STATE_ERR:
      msg = 'INVALID_STATE_ERR';
      break;
    default:
      msg = 'Unknown Error';
      break;
  };

  console.log('Error: ' + msg);
}

function onInitFs(fs) {

  fs.root.getFile('log.txt', {create: true}, function(fileEntry) {

    // Create a FileWriter object for our FileEntry (log.txt).
    fileEntry.createWriter(function(fileWriter) {

      fileWriter.onwriteend = function(e) {
        console.log('Write completed.');
      };

      fileWriter.onerror = function(e) {
        console.log('Write failed: ' + e.toString());
      };

      // Create a new Blob and write it to log.txt.
      var blob = new Blob(['Lorem Ipsum'], {type: 'text/plain'});

      console.log(fileWriter);
      fileWriter.write(blob);

    }, errorHandler);

  }, errorHandler);

}

window.onload = function() {
	console.log("On load version 1.00005");
	
	/*
	chrome.extension.sendRequest({test: "something"}, function(response) {
  		got_back = response;
  		console.log(got_back*2);
	});
	*/
	
	chrome.extension.sendRequest({append_to_log: ""+window.location.href}, function(response) {
  		got_back = response;
  		console.log("What does the log have???");
  		console.log("LOG HAS"+got_back);
	});
	
	console.log("Window was called :)!!!");
	console.log(""+window.location.href);
	console.log("yep")
	

    window.webkitRequestFileSystem(window.TEMPORARY, 1024*1024, onInitFs, errorHandler);


	//console.log(window.location);
	/*
	if(!hasMetadata && settings != null) {
		
		if(settings.selectionInjection == "true" && !selectionListener) {
			
			// Add the selection range metadata injection handler
			window.addEventListener("mouseup", function(event) { 
			   injectMetadata();
			});
			
			selectionListener = true;
		}
		
		// Assume that the metadata will be retrieved and lock this function from a race condition		
		hasMetadata = true;
		
		// Call textractMetadataFromUrl() from mmdDomHelper.js
		extractMetadataFromUrl(document.URL, document, function(data){
		    metadata = data;

		    if(settings.debugMetadata == "true") {
				console.log("Extracted metadata object:");
				console.log(metadata);
				console.log(JSON.stringify(metadata));
			}					
			
			// Check if the metadata was extracted.
		    if(metadata == null) {
		    	
		    	// If the metadata was not found then try again in 1 second.
		    	hasMetadata = false;
		    	setTimeout(window.onload, 1000);		    	
		    }
		    else if(settings.attributeInjection == "true")
				tagEachElementWithContainer();
	    });
	}
	*/
}

/** tagEachElementWithContainer
 * Adds the 'metadata' attribute to every HTML tag in the document.
 * The 'metadata' attribute value is set to the metadata as an escaped JSON string
 */
function tagEachElementWithContainer() {
	var items = document.getElementsByTagName("*");
	for(i in items) {
		var item = items[i];
    	if(typeof(item) == "object")
        	item.setAttribute("metadata", getMetadataString());
	}
}

/** injectMetadata
 * Injects the metadata into a user highlighted selection.
 * The metadata is injected as an <img> element with the 'metadata' attribute.
 * This is needed because Chrome does not allow for modifications to the DataTransfer object
 * and because Chrome does not allow for custom DataTransfer MIME types.
 */
function injectMetadata() {
	
	var oldFixtures = document.getElementsByClassName('injectedMetadata');
	
	for(var i = 0; i < oldFixtures.length; i++) {
	   var f = oldFixtures[i];
	   f.parentElement.removeChild(f);
	}
	
	var t = document.getSelection();
	
	if(t.type == "Range") {
		var injected = document.createElement('img');//span is a no go
		injected.setAttribute("metadata", getMetadataString());
		injected.setAttribute("class","injectedMetadata");
		
		var range = t.getRangeAt();
		range.insertNode(injected);
		document.getSelection().addRange(range);
	}
}

/** GetMetadataString
 * Converts the metadata object into a JSON string.
 * @return metadata string
 */
function getMetadataString() {
	
	if(settings.metadataInjection == "rich") {
		return JSON.stringify(metadata);
	}
	else if(settings.metadataInjection == "raw") {
		var data = {};
		data[metadata["mm_name"]] = getRawMetadata(metadata);
		return JSON.stringify(data);
	}
	return "{}";
}

/** getRawMetadata
 * Converts the full metadata object to a raw metadata object which only 
 * contains key / value pairs.
 * @param object, metadata or  metadata field object
 * @return the raw metadata object
 */
function getRawMetadata(object) {
	var raw = {};
	
	for(var i in object) {
		var child = getValues(object[i]);
		raw[i] = child;
	}

	return raw;
}

/** getValues
 * Extracts the value or values from a metadata field object.
 * @param object, metadata field object
 * @return value of the field as a simple string or as a raw metadata object
 */
function getValues(object) {	
	if(typeof(object.value) == "object") {
		return getRawMetadata(object.value);
	}
	else
		return object.value;
}