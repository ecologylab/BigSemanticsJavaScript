SimplTypeScope.prototype.deserialize = function(simplObj)
{
	if(simplObj.hasOwnProperty("simpl.type"))
	{
		var simplType = this.getSimplType(simplObj["simpl.type"]);
		
		if(simplType)
		{
			try
			{
				simplObj = this.typeResolve(simplType, simplObj);
			}
			catch(e)
			{
				console.error("Error during simplTypeResolve. Please check that you are using a valid simplObj to simplTypeScope pairing.");
				console.error(e);
			}
		}	
	}	
	
	simplGraphExpand(simplObj);
	
	return simplObj;	
}

SimplTypeScope.prototype.typeResolve = function(simplType, simplObj)
{
	if( !(simplType["name"] in this.types) )
	{
		var simplTypeScope = this;
		this.types[simplType["name"]] = function (type, obj)
		{		
			for(var i in obj)
			{
				var fieldDescriptor = simplTypeScope.findFieldDescriptor(i, type);
				
				if(fieldDescriptor)
				{
					var value = simplTypeScope.parseField(simplObj, fieldDescriptor);
					
					this[fieldDescriptor["name"]] = value;
					//console.log(this[fieldDescriptor["name"]]);
				}				
				else if(i.indexOf("simpl") == 0)
				{
					this[i] = obj[i];
				}
			}
		};
	}
	
	var deserializedObj = new this.types[simplType["name"]](simplType, simplObj);
	return deserializedObj;
}

SimplTypeScope.prototype.findFieldDescriptor = function(fieldName, type)
{
	for(var i  in type["field_descriptor"])
	{
		if(type["field_descriptor"][i]["tag_name"] == fieldName)
			return type["field_descriptor"][i];
	}
	return null;
}

SimplTypeScope.prototype.parseField = function(simplObj, fieldDescriptor)
{	
	var fieldType = fieldDescriptor["type"];
	
	switch(parseInt(fieldType))
	{
		case SIMPL_SCALAR: 	// type = 18
			var fieldValue = simplObj[fieldDescriptor["tag_name"]];
			if(fieldValue)
			{
				return this.translateScalar(fieldDescriptor, fieldValue);
			}
			break;
					
							
		case SIMPL_COMPOSITE_ELEMENT:  // type = 3
			var fieldValue = simplObj[fieldDescriptor["composite_tag_name"]];
			var childType = fieldDescriptor["element_class_descriptor"];
			
			if(fieldValue && childType)
			{
				return this.typeResolve(childType, fieldValue);
			}
			break;
		
		case SIMPL_COLLECTION_ELEMENT:  // type = 4
			var fieldValue = simplObj[fieldDescriptor["collection_or_map_tag_name"]];
			
			// wrapped collection
			if(fieldDescriptor["wrapped"] == "true")
			{
				fieldValue = simplObj[fieldDescriptor["tag_name"]][fieldDescriptor["collection_or_map_tag_name"]];
			}						
			
			// polymorphic collection
			if(fieldDescriptor["polymorph_class_descriptors"])
			{
				console.log("poly-morphin' time!");
				
				fieldValue = simplObj[fieldDescriptor["tag_name"]];					
				var childTypes = fieldDescriptor["polymorph_class_descriptors"]["polymorph_class_descriptor"];
				
				if(fieldValue && childTypes)
				{
					return this.translatePolymorphicCollection(childTypes, fieldValue);
				}
				
			}
			else if (fieldDescriptor["element_class_descriptor"])// monomorphic collection
			{
				var childType = fieldDescriptor["element_class_descriptor"];
				if(fieldValue && childType)
				{
					return this.translateMonomorphicCollection(childType, fieldValue);
				}
			}						
			break;
			
		case SIMPL_COLLECTION_SCALAR:  // type = 5
			var fieldValue = simplObj[fieldDescriptor["collection_or_map_tag_name"]];
			
			if(fieldValue)
			{
				return this.translateScalarCollection(fieldDescriptor, fieldValue);
			}						
			break;
			
		case SIMPL_MAP_ELEMENT:  // type = 6
		case SIMPL_MAP_SCALAR:  // type = 7
			var fieldValue = simplObj[fieldDescriptor["collection_or_map_tag_name"]];
			var mapType = fieldDescriptor["element_class_descriptor"];
			if(fieldValue && mapType)
			{
				return this.translateMapElement(mapType, fieldValue);
			}						
			break;
	}
}

SimplTypeScope.prototype.translateScalar = function(field, fieldValue)
{
	if(field["scalar_type"])
	{		
		if(field["scalar_type"] == "int" || field["scalar_type"] == "Integer")
		{
			return parseInt(fieldValue);
		}
	}
	return fieldValue;
}

SimplTypeScope.prototype.translateScalarCollection = function(field, fieldValue)
{
	var collection = [];
	for(i in fieldValue)
	{
		collection.push(this.translateScalar(field, fieldValue[i]));
	}
	return collection;
}

SimplTypeScope.prototype.translateMonomorphicCollection = function(childType, collectionValue)
{
	var collection = [];
	for(i in collectionValue)
	{
		collection.push(this.typeResolve(childType, collectionValue[i]));
	}
	return collection;
}

SimplTypeScope.prototype.translatePolymorphicCollection = function(childTypes, collectionValue)
{
	var collection = [];
	for(i in collectionValue)
	{
		var fieldTypeTagName = "";
		var fieldValue = null;
		
		// get type of field element from nested property name
		for(var property in collectionValue[i])
		{
			fieldTypeTagName = property;
			fieldValue = collectionValue[i][property];
		}
		
		// find field type from possible types
		var childType = this.getSimplTypeByTagName(childTypes, fieldTypeTagName);
		if(fieldValue && childType)
			collection.push(this.typeResolve(childType, fieldValue));
	}
	return collection;
}

SimplTypeScope.prototype.translateMapElement = function(mapType, mapValue)
{
	var map = [];
	
	var keyDescriptor = this.getKeyDescriptorFromMapClass(mapType);	
	var valueDescriptor = this.getValueDescriptorFromMapClass(mapType);
	
	for(i in mapValue)
	{
		var fieldValue = mapValue[i];		
		 
		var key = this.parseField(fieldValue, keyDescriptor);		
		var value = null;
		if(valueDescriptor)
			value = this.parseField(fieldValue, valueDescriptor);
		
		if(key)
			map[key] = value;
	}
	return map;
}