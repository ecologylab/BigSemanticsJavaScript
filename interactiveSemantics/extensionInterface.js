
var ExtensionInterface = {};

ExtensionInterface.init = function()
{
	document.addEventListener("extractionResponse", ExtensionInterface.onMessage);
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
			message.sender.dispatchEvent(extEvent);
		}
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
}

/**
 * prepares the metadata and sets it using MetadataLoader api in debi.js
 */
ExtensionInterface.setMetadata = function(metadata)
{
	//var rawMetadata = node.getAttribute("extensionMetadata");
	
	// object wrapper is already there, directly set
	MetadataLoader.setMetadata(metadata);
}

ExtensionInterface.init();