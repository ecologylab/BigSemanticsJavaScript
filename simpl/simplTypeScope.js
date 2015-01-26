function SimplTypeScope(typeScope)
{
	if(typeScope)
	{
		try
		{
			var scope = clone(typeScope["simpl_types_scope"]);
			simplGraphExpand(scope);
			
			this.name = scope["name"];
			this.typeDescriptors = scope["class_descriptor"];
			
			this.types = [];
			this.serializeTypes = [];
		}
		catch(e)
		{
			console.error("Unexpected error during the creation of SimplTypeScope. Please check that you are using a valid simpl_types_scope.");
			console.error("Unexpected error: " + e);
		}
	}
}

SimplTypeScope.prototype.getKeyDescriptorFromMapClass = function(mapDescriptor)
{
	for(i in mapDescriptor["field_descriptor"])
	{
		var fieldDescriptor = mapDescriptor["field_descriptor"][i];
		if(fieldDescriptor["map_key_field_name"])
		{
			// is this double check needed? prolly not - nic
			if(fieldDescriptor["map_key_field_name"] == fieldDescriptor["name"])
				return fieldDescriptor;
		}
	}	
	return null;
}

SimplTypeScope.prototype.getValueDescriptorFromMapClass = function(mapDescriptor)
{
	for(i in mapDescriptor["field_descriptor"])
	{
		var fieldDescriptor = mapDescriptor["field_descriptor"][i];
		if(!fieldDescriptor["map_key_field_name"])
		{
			return fieldDescriptor;
		}
	}	
	return null;
}

SimplTypeScope.prototype.getSimplTypeByTagName = function(typeList, tagName)
{
	for(var i in typeList)
	{
		console.log(typeList[i]["tag_name"])
		if(typeList[i]["tag_name"] == tagName)
			return typeList[i];
	}
	return null;
}

SimplTypeScope.prototype.getSimplType = function(typeName)
{
	for(var i in this.typeDescriptors)
	{
		if(this.typeDescriptors[i]["name"] == typeName)
			return this.typeDescriptors[i];
	}
	return null;
}