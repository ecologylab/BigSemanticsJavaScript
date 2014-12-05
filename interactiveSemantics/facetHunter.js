
/*
 * Creates a JSON object which contains the authors per each reference for the specified ACM paper
 */

var FacetHunter = {};
FacetHunter.authors = new Map;
FacetHunter.referenceUrls = [];
FacetHunter.paperHolder = [];
FacetHunter.max;
FacetHunter.current = 0;

FacetHunter.getAuthors =  function(task, metadataFields, styleInfo){

	var jk = 0;
	
	for (var i = 0; i < metadataFields.length;i++){
		if(metadataFields[i].child_type != null){
			if(metadataFields[i].child_type=="acm_portal_author" && metadataFields[i].name == "authors"){
				
				var authorList = [];
				for (var j = 0; j < metadataFields[i].value.length; j++){
					authorList.push(metadataFields[i].value[j].value[0].value);
				}
				
				FacetHunter.authors.put(metadataFields[0].navigatesTo, authorList);
				
			}
		}
	}
	
	
	FacetHunter.current++;
	if(FacetHunter.current == FacetHunter.max){
		FacetHunter.authorsToJson();
		
	}
	else{
		var ntask = new RenderingTask(FacetHunter.referenceUrls[FacetHunter.current], null, true, null, FacetHunter.getAuthors);
		MetadataLoader.queue.push(ntask);
		
		var url = FacetHunter.referenceUrls[FacetHunter.current];
		var clipping = null;
		var reloadMD = true;
	   /*
		var task = new RenderingTask(metadataFields[i].value[k].value[0].navigatesTo, null, true, null, FacetHunter.getAuthors);
		MetadataLoader.queue.push(task);	*/
		


		if(clipping != null && clipping.rawMetadata != null)
		{
			clipping.rawMetadata.deserialized = true;
			MetadataLoader.setMetadata(clipping.rawMetadata);
		}
		else
		{	
			var requestMetadata = (typeof requestMD === "undefined") || requestMD == true;
			
			// Fetch the metadata from the service
			if(!isExtension && requestMetadata)
				MetadataLoader.getMetadata(url, "MetadataLoader.setMetadata", reloadMD);	
		}
	}
	MetadataLoader.queue.splice(MetadataLoader.queue.indexOf(task), 1);

} 
FacetHunter.getReferences = function(task, metadataFields, styleInfo){
	
	for (var i = 0; i < metadataFields.length;i++){
		if(metadataFields[i].child_type != null){
			if(metadataFields[i].child_type=="acm_portal" && metadataFields[i].name == "references"){

				for(var k = 0; k < metadataFields[i].value.length; k++){
					if(metadataFields[i].value[k].value[0] != null){
						if (metadataFields[i].value[k].value[0].navigatesTo != null){
							FacetHunter.referenceUrls.push(metadataFields[i].value[k].value[0].navigatesTo);
							
							
							
							
						}
						else if(metadataFields[i].value[k].value[1] !=null){
							if(metadataFields[i].value[k].value[1].name=="authors"){
								var authorList = [];
								for (var j = 0; j < metadataFields[i].value[k].value[1].value.length; j++){
									authorList.push(metadataFields[i].value[k].value[1].value[j].value);
								}
								FacetHunter.authors.put(metadataFields[i].value[k].value[0].value, authorList);

							}
						
						}else{

						}
					}
					
				}
			}
		}
	}
	FacetHunter.max = FacetHunter.referenceUrls.length;
	for(var j = 0; j < FacetHunter.referenceUrls.length; j++){
		var ntask = new RenderingTask(FacetHunter.referenceUrls[j], null, true, null, FacetHunter.getAuthors);
		MetadataLoader.queue.push(ntask);
		
		var url = FacetHunter.referenceUrls[j];
		var clipping = null;
		var reloadMD = true;
	   /*
		var task = new RenderingTask(metadataFields[i].value[k].value[0].navigatesTo, null, true, null, FacetHunter.getAuthors);
		MetadataLoader.queue.push(task);	*/
		


		if(clipping != null && clipping.rawMetadata != null)
		{
			clipping.rawMetadata.deserialized = true;
			MetadataLoader.setMetadata(clipping.rawMetadata);
		}
		else
		{	
			var requestMetadata = (typeof requestMD === "undefined") || requestMD == true;
			
			// Fetch the metadata from the service
			if(!isExtension && requestMetadata)
				MetadataLoader.getMetadata(url, "MetadataLoader.setMetadata", reloadMD);	
		}
		
		j = 1000;
	}
	
	MetadataLoader.queue.splice(MetadataLoader.queue.indexOf(task), 1);

}

function jsonWriter(fs) {

	  fs.root.getFile('log.txt', {create: false}, function(fileEntry) {

	    // Create a FileWriter object for our FileEntry (log.txt).
	    fileEntry.createWriter(function(fileWriter) {

	      fileWriter.seek(fileWriter.length); // Start write position at EOF.

	      // Create a new Blob and write it to log.txt.
	      var blob = new Blob(['Hello World'], {type: 'text/plain'});

	      fileWriter.write(blob);

	    }, errorHandler);

	  }, errorHandler);

	}
FacetHunter.authorsToJson = function(){
	
	
	for(var i =0; i < FacetHunter.authors.size; i++){
		var paper = {}
		paper.name = FacetHunter.authors.current.key;
			
		var currentAList = FacetHunter.authors.current.value;
		paper.authors = currentAList;
		FacetHunter.paperHolder.push(paper);
		FacetHunter.authors.next();
	}
	alert("all done");
}
FacetHunter.getAuthorFacets = function(container, url, isRoot, clipping, requestMD, reloadMD){
	
	// Add the rendering task to the queue
	var task = new RenderingTask(url, container, isRoot, clipping, FacetHunter.getReferences)
	MetadataLoader.queue.push(task);	
	
	if(clipping != null && clipping.rawMetadata != null)
	{
		clipping.rawMetadata.deserialized = true;
		MetadataLoader.setMetadata(clipping.rawMetadata);
	}
	else
	{	
		var requestMetadata = (typeof requestMD === "undefined") || requestMD == true;
		
		// Fetch the metadata from the service
		if(!isExtension && requestMetadata)
			MetadataLoader.getMetadata(url, "MetadataLoader.setMetadata", reloadMD);	
	}
}
