
var ExtensionInterface = {};

ExtensionInterface.init = function()
{
	document.addEventListener("extractionResponse", ExtensionInterface.onMessage);
	window.addEventListener("message", ExtensionInterface.onMessage);
	ExtensionInterface.dispatchMessage({sender: "PAGE", type:"EXT_CHECK"});
}

/**
 * sends messages to the extension
 * 
 * @param message, the message object that consists of
 * 		type, message type to send
 *		sender, originator or the element for which message is to be sent
 *		(optional) detail, additional information 
 */
ExtensionInterface.dispatchMessage = function(message)
{
	if (typeof message === "undefined" || typeof message.type === "undefined" || typeof message.sender === "undefined")
		return;
	
	if (message.type == "extractionRequest")
	{
		if (message.detail && message.detail.url)
		{
			var extEvent = new CustomEvent(message.type, {bubbles: true, cancelable: false, detail: {location: message.detail.url}});
			document.dispatchEvent(extEvent);
			//message.sender.dispatchEvent(extEvent);
		}
	}
	if (message.type == "GET_MD" || message.type == "EXT_CHECK"){
		window.postMessage(message, "*");
	}
}

/**
 * receives message from the extension
 * 
 * @param message, the message object from the extension that consists of
 * 		type, message type to send
 */
ExtensionInterface.onMessage = function(message)
{
	if (message.type == "extractionResponse")
	{
		ExtensionInterface.setMetadata(message.detail);
	}
	if (message.data.sender == "EXT"){
		if (message.data.type == "EXT_CHECK"){
			MetadataLoader.hasExtension = message.data.value;
			console.log("User has extension");
		}
		else if (message.data.type == "RET_MD"){
			executeFunctionByName(message.data.callback, window, message.data.md);
		}
		else if (event.data.type == "RET_MD_SERVICE"){
			console.log("Tried with extension but was told to do with service");
			MetadataLoader.getMetadataFromService(message.data.url, message.data.callback, message.data.reload, message.data.source);
		}
        else {
			console.log("MICE received: " + message.data.text);
		}
	}
}

/**
 * prepares the metadata and sets it using MetadataLoader api in debi.js
 */
ExtensionInterface.setMetadata = function(metadata)
{
	// object wrapper is already there, directly set
	MetadataLoader.setMetadata(metadata);
}

ExtensionInterface.init();
