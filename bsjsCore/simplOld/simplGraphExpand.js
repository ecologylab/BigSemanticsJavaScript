function simplGraphExpand(targetObj)
{
	var simplReferences = [];
	var simplId = "simpl.id";
	var simplRef = "simpl.ref";
	
	function findIds(currentValue)
	{		
		if(typeof currentValue != 'object' || currentValue == null)
		{
			return;
		}
		
		if(simplId in currentValue)
		{
			simplReferences[currentValue[simplId]] = currentValue;
		}
		
		for(i in currentValue)
		{
			findIds(currentValue[i]);
		}		
	}
	
	function expandRefs(currentKey, currentValue, parentValue)
	{		
		if(typeof currentValue != 'object' || currentValue == null)
		{
			return;
		}
		
		if(simplRef in currentValue)
		{
			var ref = currentValue[simplRef];
			if(ref in simplReferences)
			{
				parentValue[currentKey] = simplReferences[ref];
			}
		}
		else
		{
			for(i in currentValue)
			{
				expandRefs(i, currentValue[i], currentValue);
			}
		}
	}
	   
    findIds(targetObj);
    
    expandRefs(null, targetObj, null);  
}
