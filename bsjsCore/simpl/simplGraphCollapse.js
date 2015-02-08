function simplGraphCollapse(targetObj)
{
	var simplIds = [];
	var simplReferences = [];
	
	var simplId = "simpl.id";
	var simplRef = "simpl.ref";

	function getRandomSimplId()
    {
    	var random = Math.floor(Math.random() * 10000000);
    	while(random in simplIds)
    	{
    		random = Math.floor(Math.random() * 10000000);
    	}
    	
    	simplIds[random] = 1;
    	return random;
    }

	function addIdsAndRefs(currentKey, currentValue, parentValue)
	{		
		if(typeof currentValue != 'object' || currentValue == null)
		{
			return;
		}
		
		if(simplId in currentValue)
		{
			simplReferences[currentValue[simplId]] = 1;
			parentValue[currentKey] = { "simpl.ref": currentValue[simplId] };
		}
		else
		{
			currentValue[simplId] = getRandomSimplId();
			
			for(i in currentValue)
			{
				addIdsAndRefs(i, currentValue[i], currentValue);
			}
		}		
	}
	
	function removeIds(currentKey, currentValue, parentValue)
	{		
		if(typeof currentValue != 'object' || currentValue == null)
		{
			return;
		}
		
		if(simplId in currentValue)
		{
			if(!(currentValue[simplId] in simplReferences))
			{
				delete currentValue[simplId];				
			}
		}
		
		for(i in currentValue)
		{
			removeIds(i, currentValue[i], currentValue);
		}
	}
	   
    addIdsAndRefs(null, targetObj, null);
    
    removeIds(null, targetObj, null);   	
}
