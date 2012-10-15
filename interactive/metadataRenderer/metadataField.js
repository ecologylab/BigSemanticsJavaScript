var MAX_DEPTH = 4;

function MetadataField()
{
	this.name = "field label";
	this.value = "field value";
	
	this.layer = 0.0;
	
	this.style = "";	
}

MetadataRenderer.getMetadataFields = function(mmdKids, metadata, depth)
{
	var metadataFields = [];
	
	if(depth >= MAX_DEPTH)
		return metadataFields;
		
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
			
			// is field hidden?
			if(mmdField.hide == null || mmdField.hide == false)
			{				
				// is there data for the field?				
				var valueName = (mmdField.tag != null) ? mmdField.tag : mmdField.name;				
				var value = metadata[valueName];	
	
				if(value != null)
				{									
					if(value.length != null)
					{						
						for(var i = 0; i < value.length; i++)
						{
							var field = new MetadataField();
						
							field.name = (mmdField.label != null) ? mmdField.label : mmdField.name;
							
							field.layer = (mmdField.layer != null) ? mmdField.layer : 0.0;
							field.style = (mmdField.style != null) ? mmdField.style : "";
							
							field.composite_type = mmdField.type;
							
							//console.log("depth: "+depth+" | reading  fields  multi-composite: "+i+ " - " + mmdField.name);
							
							field.value = MetadataRenderer.getMetadataFields(mmdField["kids"], value[i], depth + 1);
							
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
						
						//console.log("depth: "+depth+" | reading fields single-composite : "+ mmdField.name);
						
						field.value = MetadataRenderer.getMetadataFields(mmdField["kids"], value, depth + 1);
						
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
					//console.log(mmdField.name + ": " + value);
					//console.log(mmdField.name + ": ");
					//console.log(mmdField);
					//console.log(value);
					
					var field = new MetadataField();
					
					field.name = (mmdField.label != null) ? mmdField.label : mmdField.name;
					
					field.layer = (mmdField.layer != null) ? mmdField.layer : 0.0;
					field.style = (mmdField.style != null) ? mmdField.style : "";
					
					field.child_type = (mmdField.child_tag != null) ? mmdField.child_tag : mmdField.child_type;
					
					//console.log("getting metadata fields collection : "+mmdField.name);
					field.value = MetadataRenderer.getMetadataFields(mmdField["kids"], value, depth + 1);
										
					metadataFields.push(field);
				}
			}
		}
		
	}
	metadataFields.sort(function(a,b){return b.layer - a.layer});	
	return metadataFields;
}

function MetadataQueueTask(url, container, isFirst)
{
	this.isFirst = isFirst;
	this.metadata = null;
	this.url = url;
	this.mmd = null;
	this.container = container;
}
