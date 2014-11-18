document.addEventListener("macheCopy", macheCopyHandler);
document.addEventListener("machePaste", machePasteHandler);

function macheCopyHandler(event)
{
	chrome.runtime.sendMessage({type: "copy", load: {elements: event.detail, ts: event.timeStamp}});
}

function machePasteHandler(event)
{
	chrome.runtime.sendMessage(null, { type: "paste", load: null}, null, function(response) {
		var extEvent = new CustomEvent("pasteResponse", {bubbles: true, cancelable: false, detail: {elements: response.elements, point: event.detail, ts: response.ts}});
		document.dispatchEvent(extEvent);
	});
}
