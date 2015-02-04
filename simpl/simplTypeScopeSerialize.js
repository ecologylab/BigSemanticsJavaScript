SimplTypeScope.prototype.serialize = function(appObj)
{	
	simplGraphCollapse(appObj);
	
	if(appObj.hasOwnProperty("simpl.type"))
	{
		var simplType = this.getSimplType(appObj["simpl.type"]);
		
		if(simplType)
		{
			try
			{
				appObj = this.typeResolve(simplType, appObj);
				appObj["simpl.type"] = simplType["name"];
				
				this.convertFieldsToStrings(appObj);
			}
			catch(e)
			{
				console.error("Error during simplTypeResolve. Please check that you are using a valid simplObj to simplTypeScope pairing.");
				console.error("Unexpected error: " + e);
			}
		}	
	}
		
	
	
	this.convertFieldsToStrings(appObj);
	
	return appObj;	
}

SimplTypeScope.prototype.convertFieldsToStrings = function(appObj)
{
	for(var key in appObj)
	{
		if(typeof appObj[key] == "number")
			appObj[key] = appObj[key].toString();
		
		else if(typeof appObj[key] == "object")
			this.convertFieldsToStrings(appObj[key]);
	}	
}