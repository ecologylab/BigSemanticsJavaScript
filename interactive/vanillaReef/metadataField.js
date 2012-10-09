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
				var valueName = (mmdField.tag != null) ? mmdField.tag : mmdField.name;				
				var value = metadata[valueName];
				
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
			//console.log(mmdField.name + ": ");
			
			// is field hidden?
			if(mmdField.hide == null || mmdField.hide == false)
			{				
				// is there data for the field?
				
				var valueName = (mmdField.tag != null) ? mmdField.tag : mmdField.name;
				
				var value = metadata[valueName];
	
	
	
				if(value != null)
				{
					
					//console.log(typeof value);
					//console.log(mmdField["kids"]);
					
					if(value.length != null)
					{
						console.log(mmdField.name + ": ");
						console.log(mmdField["kids"]);
						console.log(value);
						
						for(var i = 0; i < value.length; i++)
						{
							var field = new MetadataField();
						
							field.name = (mmdField.label != null) ? mmdField.label : mmdField.name;
							
							field.layer = (mmdField.layer != null) ? mmdField.layer : 0.0;
							field.style = (mmdField.style != null) ? mmdField.style : "";
							
							field.composite_type = mmdField.type;
							
							field.value = MetadataRenderer.getMetadataFields(mmdField["kids"], value[i]);
							console.log(value[i]);
							console.log(field);
							metadataFields.push(field);
						}
					}
					else
					{
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
		}
		
		else if(mmdField.collection != null)
		{
			mmdField = mmdField.collection;	
			// is field hidden?
			if(mmdField.hide == null || mmdField.hide == false)
			{					
				// is there data for the field?
				var valueName = (mmdField.tag != null) ? mmdField.tag : mmdField.name;				
				var value = metadata[valueName];
				
				if(value != null)
				{
					//console.log(mmdField.name + ": ");
					//console.log(mmdField);
					//console.log(value);
					
					var field = new MetadataField();
					
					field.name = (mmdField.label != null) ? mmdField.label : mmdField.name;
					
					field.layer = (mmdField.layer != null) ? mmdField.layer : 0.0;
					field.style = (mmdField.style != null) ? mmdField.style : "";
					
					field.child_type = (mmdField.child_tag != null) ? mmdField.child_tag : mmdField.child_type;
					
					field.value = MetadataRenderer.getMetadataFields(mmdField["kids"], value);
					
					/*
					value = value[field.child_type];
					
					console.log(value.length);
					
					var childFields = [];
										
					for(var i = 0; i < value.length; i++)
					{
						//console.log({ child_type: value[i] });
						var childMetadata = { field.child_type: value[i] }; 
						
						childFields = childFields.concat( MetadataRenderer.getMetadataFields( mmdField["kids"], childMetadata));
					}
					
					childFields.sort(function(a,b){return b.layer - a.layer});					
					
					field.value = childFields;
					*/
					
					//console.log(field);
					
					metadataFields.push(field);
				}
			}
		}
		
	}
	metadataFields.sort(function(a,b){return b.layer - a.layer});	
	return metadataFields;
}
