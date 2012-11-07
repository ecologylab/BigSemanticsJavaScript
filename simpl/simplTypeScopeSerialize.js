SimplTypeScope.prototype.serialize = function(appObj)
{	
	if(appObj.hasOwnProperty("simpl.type"))
	{
		var simplType = this.getSimplType(appObj["simpl.type"]);
		
		if(simplType)
		{
			try
			{
				appObj = this.reverseTypeResolve(simplType, appObj);
				appObj["simpl.type"] = simplType["name"];
			}
			catch(e)
			{
				console.error("Error during simplTypeResolve. Please check that you are using a valid simplObj to simplTypeScope pairing.");
				console.error("Unexpected error: " + e);
			}
		}	
	}
	
	simplGraphCollapse(appObj);
	
	return appObj;	
}

SimplTypeScope.prototype.reverseTypeResolve = function(simplType, simplObj)
{
	if( !(simplType["name"] in this.serializeTypes) )
	{
		var simplTypeScope = this;
		this.serializeTypes[simplType["name"]] = function (type, obj)
		{		
			for(var i in type["field_descriptor"])
			{
				var fieldDescriptor = type["field_descriptor"][i];				
				
				var fieldType = fieldDescriptor["type"];
				
				switch(parseInt(fieldType))
				{
					case SIMPL_SCALAR: 		
						var fieldValue = simplObj[fieldDescriptor["tag_name"]];
						if(fieldValue)
						{
							this[fieldDescriptor["tag_name"]] = fieldValue.toString();
						}
						break;
								
										
					case SIMPL_COMPOSITE_ELEMENT:
						var fieldValue = simplObj[fieldDescriptor["composite_tag_name"]];
						var childType = fieldDescriptor["element_class_descriptor"];
						if(fieldValue && childType)
						{
							this[fieldDescriptor["tag_name"]] = simplTypeScope.reverseTypeResolve(childType, fieldValue);
						}
						break;
					
					case SIMPL_COLLECTION_ELEMENT:
						var fieldValue = simplObj[fieldDescriptor["collection_or_map_tag_name"]];
						
						// wrapped collection
						if(fieldDescriptor["wrapped"] == "true")
						{
							fieldValue = simplObj[fieldDescriptor["tag_name"]][fieldDescriptor["collection_or_map_tag_name"]];
						}						
						
						// polymorphic collection
						if(false)
						{
							
						}
						else // monomorphic collection
						{
							var childType = fieldDescriptor["element_class_descriptor"];
							// TODO how do you know if a field is polymorphic?
							if(fieldValue && childType)
							{
								this[fieldDescriptor["tag_name"]] = [];
								for(i in fieldValue)
								{
									this[fieldDescriptor["tag_name"]].push(simplTypeScope.reverseTypeResolve(childType, fieldValue[i]));
								}
							}
						}						
						break;
						
					case SIMPL_COLLECTION_SCALAR:
						var fieldValue = simplObj[fieldDescriptor["collection_or_map_tag_name"]];
						
						if(fieldValue)
						{
							this[fieldDescriptor["tag_name"]] = [];
							for(i in fieldValue)
							{
								this[fieldDescriptor["tag_name"]].push(fieldValue[i].toString());
							}
						}						
						break;
				}
			}
			
		};		
	}
	
	var deserializedObj = new this.serializeTypes[simplType["name"]](simplType, simplObj);
	return deserializedObj;
}