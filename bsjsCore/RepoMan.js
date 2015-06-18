/*
 * Loads the metadataRepository
 * Will eventually select between various extensions, but for now is content to just use a lcoal version
 */

var RepoMan = {};

RepoMan.repoIsLoading = false;
RepoMan.repo = null;


var isExtension = (typeof chrome !== "undefined" && typeof chrome.extension !== "undefined");

RepoMan.extensionMetadataDomains = ["twitter.com"];





	
RepoMan.loadMMDRepo = function()
{	
	var callback = "RepoMan.initMetaMetadataRepo";
	var serviceURL = SEMANTIC_SERVICE_URL + "mmdrepository.jsonp?reload=true&callback=" + callback;
	  
	MetadataLoader.doJSONPCall(serviceURL);
	//console.log("requesting semantics service for mmd repository");
};



RepoMan.initMetaMetadataRepo = function(jsonRepo, alreadyDeserialized)
{
    if (!alreadyDeserialized) {
        simplDeserialize(jsonRepo);
       

    }
	
    var mmdByName = jsonRepo["meta_metadata_repository"]["repository_by_name"];

	RepoMan.repo = {};
	
	//go through all mmd and construct mmd dictionary
	for (var i = 0; i < mmdByName.length; i++)
	{
		var mmd = mmdByName[i];
		
		RepoMan.repo[mmd.name] = mmd;
	}
	
	// alt names 
	var altNames = jsonRepo["meta_metadata_repository"]["alt_names"];
	
	for (var i = 0; i < altNames.length; i++)
	{
		var mmdName = altNames[i].name;
		var mmdObj = altNames[i].mmd;
		
		RepoMan.repo[mmdName] = mmdObj;
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
    		RepoMan.getMMDFromRepoByTask(task); 
    	}    	
	}	
};

RepoMan.getMMDFromRepoByName = function(name)
{
	var mmd = RepoMan.repo[name];
	MetadataLoader.setMetaMetadata(mmd);
};

RepoMan.getMMDFromRepoByTask = function(task , callback)
{
	var mmd = RepoMan.repo[task.mmdType];
	task.mmdType = mmd.name;
	if ( typeof callback == "function")
		callback(mmd);
	else
		MetadataLoader.setMetaMetadata(mmd);
};

RepoMan.isLoaded = function()
{
    if (RepoMan.repo != null) {
    	  return true;
    }
    else if (RepoMan.repoIsLoading == false) {
        RepoMan.repoIsLoading = true;
        RepoMan.loadMMDRepo();
    }
    return false;
};
