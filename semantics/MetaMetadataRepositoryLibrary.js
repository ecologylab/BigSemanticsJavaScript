var MetaMetadataRepositoryLibrary = {};
var METAMETADATA_REPOSITORY = null;
var METAMETADATA_BY_NAME = null;

MetaMetadataRepositoryLibrary.getRepository = function()
{
	// open the repository
	var xhr = new XMLHttpRequest();
	xhr.open("GET", "http://ecology-service.cse.tamu.edu/BigSemanticsService/mmdrepository.json");
	xhr.onload = function() {
	 	//console.log(xhr.responseText);
	    console.log(xhr.responseText);
	    
	}
	xhr.send();
}

MetaMetadataRepositoryLibrary.initializeRepository = function(repository)
{
	simplDeserialize(repository);
	METAMETADATA_REPOSITORY = repository.meta_metadata_repository;
	
	MetaMetadataRepositoryLibrary.populateNameMap();
}

MetaMetadataRepositoryLibrary.initializeTestRepository = function()
{
	simplDeserialize(JSONRepository);
	METAMETADATA_REPOSITORY = JSONRepository.meta_metadata_repository;
	
	MetaMetadataRepositoryLibrary.populateNameMap();
}

MetaMetadataRepositoryLibrary.populateNameMap = function()
{
	METAMETADATA_BY_NAME = {};
		
	for(var i = 0; i < METAMETADATA_REPOSITORY.repository_by_name.length; i++)
		METAMETADATA_BY_NAME[METAMETADATA_REPOSITORY.repository_by_name[i].name] = METAMETADATA_REPOSITORY.repository_by_name[i];
}

MetaMetadataRepositoryLibrary.isInstanceOf = function(name, parentInQuestion)
{
	// Error checking / reporting
	if(METAMETADATA_BY_NAME == null)
	{
		console.error("Error: MetaMetadataRepository not initialized.");
		return false;
	}
	if(METAMETADATA_BY_NAME[name] == null)
	{
		console.error("Error: No MetaMetadata found named: "+name);
		return false;
	}
	
	return MetaMetadataRepositoryLibrary._isInstanceOf(name, parentInQuestion);
}

MetaMetadataRepositoryLibrary._isInstanceOf = function(name, parentInQuestion)
{
	// recursively upward crawl from name checking for target parent
	if(METAMETADATA_BY_NAME[name]['extends'] == null)
		return false;
		
	else if(METAMETADATA_BY_NAME[name]['extends'] == parentInQuestion)
		return true;
	
	else
		return MetaMetadataRepositoryLibrary._isInstanceOf(METAMETADATA_BY_NAME[name]['extends'], parentInQuestion);
}

MetaMetadataRepositoryLibrary.firstSharedParent = function(a, b)
{
	// Error checking / reporting
	if(METAMETADATA_BY_NAME == null)
	{
		console.error("Error: MetaMetadataRepository not initialized.");
		return false;
	}
	if(METAMETADATA_BY_NAME[a] == null)
	{
		console.error("Error: No MetaMetadata found named: "+a);
		return false;
	}
	if(METAMETADATA_BY_NAME[b] == null)
	{
		console.error("Error: No MetaMetadata found named: "+b);
		return false;
	}
		
	return MetaMetadataRepositoryLibrary._firstSharedParent(a, b);
}

MetaMetadataRepositoryLibrary._firstSharedParent = function(a, b)
{
	// get arrays of the parents of each metametadata
	var aAncestry = MetaMetadataRepositoryLibrary._getAncestry(a);
	var bAncestry = MetaMetadataRepositoryLibrary._getAncestry(b);
	
	for(var aIndex = 0; aIndex < aAncestry.length; aIndex++)
	{
		for(var bIndex = 0; bIndex < bAncestry.length; bIndex++)
		{
			if(aAncestry[aIndex] == bAncestry[bIndex])
			{
				return aAncestry[aIndex];
			}
		}
	}
	
	return null;
}

MetaMetadataRepositoryLibrary._getAncestry = function(name)
{
	var ancestry = [];
	
	var metaMetadata = METAMETADATA_BY_NAME[name];
	while(metaMetadata['extends'])
	{		
		ancestry.push(metaMetadata['extends']);
		metaMetadata = METAMETADATA_BY_NAME[metaMetadata['extends']];
	}
	
	return ancestry;
}


