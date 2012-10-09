function MetadataField()
{
	this.name = "field label";
	this.value = "field value";
	
	this.layer = 0.0;
	
	this.style = "";
	
	

	
}

MetadataRenderer.getMetadataFields = function(mmdKids, metadata)
{
	var metadataFields = [];
	
	for(var key in mmdKids)
	{		
		var mmdField = mmdKids[key];
		
		if(mmdField.scalar != null)
		{
			mmdField = mmdField.scalar;
			
			// is field hidden?
			if(mmdField.hide == null || mmdField.hide == false)
			{				
				// is there data for the field?
				var value = metadata[mmdField.name];
				if(value != null)
				{
					//console.log(mmdField.name + ": " + value);
		
					var field = new MetadataField();
					
					field.name = (mmdField.label != null) ? mmdField.label : mmdField.name;
					field.value = value; 
					
					field.layer = (mmdField.layer != null) ? mmdField.layer : 0.0;
					field.style = (mmdField.style != null) ? mmdField.style : "";
					
					field.scalar_type = mmdField.scalar_type;
					
					// does it navigate to?
					if(mmdField.navigates_to != null)
					{
						var navigationLink = metadata[mmdField.navigates_to];
						// is there a value for its navigation
						if(navigationLink != null)
						{
							field.navigatesTo = navigationLink;
						}
					}
					
					metadataFields.push(field);
				}
			}
		}
		
		else if(mmdField.composite != null)
		{
			mmdField = mmdField.composite;
			
			// is field hidden?
			if(mmdField.hide == null || mmdField.hide == false)
			{				
				// is there data for the field?
				var value = metadata[mmdField.name];
				if(value != null)
				{
					//console.log(mmdField.name + ": ");
					//console.log(mmdField);
					//console.log(value);
					
					var field = new MetadataField();
					
					field.name = (mmdField.label != null) ? mmdField.label : mmdField.name;
					
					field.layer = (mmdField.layer != null) ? mmdField.layer : 0.0;
					field.style = (mmdField.style != null) ? mmdField.style : "";
					
					field.composite_type = mmdField.type;
					
					field.value = MetadataRenderer.getMetadataFields(mmdField["kids"], value);
					
					metadataFields.push(field);
				}
			}
		}
		
		else if(mmdField.collection != null)
		{
			mmdField = mmdField.collection;
			console.log(mmdField.name);		
			// is field hidden?
			if(mmdField.hide == null || mmdField.hide == false)
			{	
					
				// is there data for the field?
				var value = metadata[mmdField.name];
				if(value != null)
				{
					console.log(mmdField.name + ": ");
					console.log(mmdField);
					console.log(value);
					
					var field = new MetadataField();
					
					field.name = (mmdField.label != null) ? mmdField.label : mmdField.name;
					
					field.layer = (mmdField.layer != null) ? mmdField.layer : 0.0;
					field.style = (mmdField.style != null) ? mmdField.style : "";
					
					//field.composite_type = mmdField.type;
					
					//field.value = MetadataRenderer.getMetadataFields(mmdField["kids"], value);
					
					metadataFields.push(field);
				}
			}
		}
		
	}
	metadataFields.sort(function(a,b){return b.layer - a.layer});	
	return metadataFields;
}
