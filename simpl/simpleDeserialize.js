var simplTypes = [];

function simplDeserialize(simplTypeScope, simplObj)
{
	simplGraphResolve(simplObj);
	
	if(simplTypeScope && simplObj["simpl.type"])
	{
		var simplType = getSimplType(simplObj["simpl.type"], simplTypeScope);
		
		if(simplType)
			return simplTypeResolve(simplTypeScope, simplType, simplObj);		
	}
	
	return simplObj;	
}


function simplTypeResolve(simplTypeScope, simplType, simplObj)
{
	if( !(simplType["tag_name"] in simplTypes) )
	{
		simplTypes[simplType["tag_name"]] = function (type, obj)
		{		
			if(!type)
			{
				//type = 
			}			
			
			for(var i in type["field_descriptor"])
			{
				var field = type["field_descriptor"][i];				
				
				if(field["field_type"] == "ArrayList")
				{
					this[field["tag_name"]] = [];
					
					var fieldValues = obj[field["collection_or_map_tag_name"]];
					for(i in fieldValues)
					{
						this[field["tag_name"]].push(deserializeField(simplTypeScope, field, fieldValues[i]));
					}
				}
				else
				{	
					this[field["tag_name"]] = deserializeField(simplTypeScope, field, obj[field["tag_name"]]);					
				}
			}
		};		
	}
	
	var deserializedObj = new simplTypes[simplType["tag_name"]](simplType, simplObj);
	return deserializedObj;
}

function deserializeField(simplTypeScope, field, fieldValue)
{
	if(fieldValue["simpl.type"])
	{
		var fieldType = getSimplType(fieldValue["simpl.type"], simplTypeScope);
			
		if(fieldType)
			return simplTypeResolve(simplTypeScope, fieldType, fieldValue);	
	}
	else if(field["scalar_type"])
	{
		if(field["scalar_type"] == "int")
			return parseInt(fieldValue);
	}
	else
	{
		return fieldValue;
	}
}

function getSimplType(typeName, typeScope)
{
	for(var i in typeScope["class_descriptor"])
	{
		if(typeScope["class_descriptor"][i]["tag_name"] == typeName)
			return typeScope["class_descriptor"][i];
			
		//check sub types
		for(j in typeScope["class_descriptor"][i]["field_descriptor"])
		{
			var possibleType = getSimplType(typeName, typeScope["class_descriptor"][i]["field_descriptor"][j]);
			if(possibleType)
				return possibleType;
		}
	}
	return null;
}