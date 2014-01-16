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
	
	return MetaMetadataRepositoryLibrary._isInstanceOf(METAMETADATA_BY_NAME[name], parentInQuestion);
}

MetaMetadataRepositoryLibrary._isInstanceOf = function(metaMetadata, parentInQuestion)
{
	// recursively upward crawl from name checking for target parent
	if(metaMetadata['extends'] == null)
		return false;
		
	else if(metaMetadata['extends'] == parentInQuestion)
		return true;
	
	else
		return MetaMetadataRepositoryLibrary._isInstanceOf(metaMetadata['inherited_mmd'], parentInQuestion);
}

MetaMetadataRepositoryLibrary.firstSharedParent = function(a, b)
{
	// Error checking / reporting
	if(METAMETADATA_BY_NAME == null)
	{
		console.error("Error: MetaMetadataRepository not initialized.");
		return null;
	}
	if(METAMETADATA_BY_NAME[a] == null)
	{
		console.error("Error: No MetaMetadata found named: "+a);
		return null;
	}
	if(METAMETADATA_BY_NAME[b] == null)
	{
		console.error("Error: No MetaMetadata found named: "+b);
		return null;
	}
	
	if(a == b)
		return a;
	
	return MetaMetadataRepositoryLibrary._firstSharedParent(METAMETADATA_BY_NAME[a], METAMETADATA_BY_NAME[b]);
}

MetaMetadataRepositoryLibrary._firstSharedParent = function(a, b)
{
	while(a['extends'])
	{		
		if(a['extends'] == b['name'])
			return a['extends'];
		
		var bIterator = METAMETADATA_BY_NAME[b['name']];
		while(bIterator['extends'])
		{
			if(a['extends'] == bIterator['name'])
				return a['extends'];
				
			bIterator = bIterator['inherited_mmd'];
		}
		
		a = a['inherited_mmd'];
	}	
	return null;
}

MetaMetadataRepositoryLibrary.getAncestry = function(metaMetadata)
{
	var ancestry = [];
	
	while(metaMetadata['extends'])
	{		
		ancestry.push(metaMetadata['extends']);
		metaMetadata = metaMetadata['inherited_mmd'];
	}
	
	return ancestry;
}


