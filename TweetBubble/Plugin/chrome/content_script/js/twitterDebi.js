/**
 * Deserializes the metadata from the service and matches the metadata with a queued RenderingTask
 * If the metadata matches then retrieve the needed meta-metadata
 * @param rawMetadata, JSON metadata string returned from the semantic service
 */
MetadataLoader.setMetadata = function(rawMetadata)
{	
	if(typeof MDC_rawMetadata != "undefined")
	{
		MDC_rawMetadata = JSON.parse(JSON.stringify(rawMetadata));
		updateJSON(true);
	}
	
	var metadata = rawMetadata;
//	var metadata = {};
	
	var deserialized = false;
//	for(i in rawMetadata)
//	{
//		if(i != "simpl.id" && i != "simpl.ref" && i != "deserialized")
//		{
//			metadata = rawMetadata[i];		
//			metadata.mm_name = i;
//		}
//		
//		if(i == "deserialized")
//		deserialized = true;
//	}
	
	if(!deserialized)
		simplDeserialize(metadata);

	//console.log("Retreived metadata: "+metadata.location);
	
	// Match the metadata with a task from the queue
	var queueTasks = [];
	
	if(metadata.location)
		queueTasks = MetadataLoader.getTasksFromQueueByUrl(metadata.location);

	// Check additional locations for more awaiting MICE tasks
	if(metadata["additional_locations"])
	{
		//console.log("checking additional locations");
		//console.log(MetadataLoader.queue);
		//console.log(metadata["additional_locations"]);
		for(var i = 0; i < metadata["additional_locations"].length; i++)
		{
			var additional_location = metadata["additional_locations"][i]
			queueTasks = queueTasks.concat(MetadataLoader.getTasksFromQueueByUrl(additional_location));			
		}
	}
	
	for(var i = 0; i < queueTasks.length; i++)
	{
		var queueTask = queueTasks[i];
		
		if(metadata["additional_locations"])
		{
			queueTask.additionalUrls = metadata["additional_locations"];
			queueTask.url = metadata["location"].toLowerCase();
		}
		
		queueTask.metadata = metadata;
		queueTask.mmdType = metadata.mm_name;
	
		if(queueTask.clipping != null)
			queueTask.clipping.rawMetadata = rawMetadata;
				
		//MetadataLoader.getMMD(queueTask.mmdType, "MetadataRenderer.setMetaMetadata");
	}
	
	if(queueTasks.length < 0)
	{
		console.error("Retreived metadata: "+metadata.location+"  but it doesn't match a document from the queue.");
		console.log(MetadataLoader.queue);
	}
}


MetadataLoader.removeLineBreaksAndCrazies = function(string)
{
	return string;
}
