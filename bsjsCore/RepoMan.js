/*
 * Loads the metadataRepository for BigSemantics projects that do not hook into an extension
 */

var RepoMan = {};
MetadataLoader.initMetaMetadataRepo = function(jsonRepo)
{
	simplDeserialize(jsonRepo);
	
	var mmdByName = jsonRepo["meta_metadata_repository"]["repository_by_name"];
		
	MetadataLoader.repo = {};
	
	//go through all mmd and construct mmd dictionary
	for (var i = 0; i < mmdByName.length; i++)
	{
		var mmd = mmdByName[i];
		
		MetadataLoader.repo[mmd.name] = mmd;
	}
	
	// alt names 
	var altNames = jsonRepo["meta_metadata_repository"]["alt_names"];
	
	for (var i = 0; i < altNames.length; i++)
	{
		var mmdName = altNames[i].name;
		var mmdObj = altNames[i].mmd;
		
		MetadataLoader.repo[mmdName] = mmdObj;
	}
	
	//go through all tasks and set their metadata
	var lengthSafeTaskList = [];
	for (var i = 0; i < MetadataLoader.queue.length; i++)
	{
		var task = MetadataLoader.queue[i];
		lengthSafeTaskList.push(task);
	}
	
	for (var i = 0; i < lengthSafeTaskList.length; i++)
	{
		var task = lengthSafeTaskList[i];
		if (task.mmdType)
		{
    		MetadataLoader.getMMDFromRepoByTask(task); 
    	}    	
	}	
};

MetadataLoader.getMMDFromRepoByName = function(name)
{
	var mmd = MetadataLoader.repo[name];
	MetadataLoader.setMetaMetadata(mmd);
};

MetadataLoader.getMMDFromRepoByTask = function(task)
{
	var mmd = MetadataLoader.repo[task.mmdType];
	task.mmdType = mmd.name;
	
	MetadataLoader.setMetaMetadata(mmd);
};
