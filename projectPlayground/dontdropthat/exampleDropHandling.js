// code snippet to catch drop event and extract metadata from the drop data which has been added by the IdeaMâché Extension

// prevent default drop handling
document.addEventListener("dragover", function(event) {	
	// stop default event handling and event propagation 
	event.preventDefault();	
	return false;
});

// drop event handler
document.addEventListener("drop", function(event) {
	// check to see if the IdeaMâché extension data flavor is present
	if(!event.dataTransfer.getData("application/json"))
		console.log("no metadata found in the drop data");
	else {
		var contextualSemantics = JSON.parse(event.dataTransfer.getData("application/json"));
		
		/* the embedded contextual semantics has 3 fields:
		 *	- source - the url of the drop origin
		 *  - xpath - the xpath of the dragged content
		 *	- metadata - the BigSemantics metadata of the source page
		 * 		metadata is wrapped inside its metadata_type
		*/
		
		// example code to print out the contextual semantic fields to the console
		console.log(contextualSemantics["source"]);
		console.log(contextualSemantics["xpath"]);
		console.log(contextualSemantics["metadata"]);	
	}	
	
	// stop default event handling and event propagation 
	event.preventDefault();
	return false;
});