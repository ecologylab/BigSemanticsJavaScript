/** MetadataField and related functions **/

// Constant for how deep to recurse through the metadata
var METADATA_FIELD_MAX_DEPTH = 7;

/**
 * MetadataField represents a parsed metadata field combining presentation/interaction rules from
 * meta-metadata with the metadata value
 * @param mmdField, meta-metadata field object
 */
function MetadataField(mmdField)
{
	this.name = (mmdField.label != null) ? mmdField.label : mmdField.name;
	this.value = "";
					
	this.layer = (mmdField.layer != null) ? mmdField.layer : 0.0;
	this.style = (mmdField.style != null) ? mmdField.style : "";
}

/**
 * Checks if the given list of MetadataFields has any visible fields 
 * @param metadata, array of MetadataFields to search for visible fields
 * @return true if there are visible fields, false otherwise
 */
MetadataRenderer.hasVisibleMetadata = function(metadata)
{
	for(var key in metadata)	
		if(metadata[key].value)
		{
			// if the field is an array with at least one element
			if(metadata[key].value.length != null && metadata[key].value.length > 0)
				return true;

			// if the field is not an array
			else if(metadata[key].value.length == null)
				return true;
		}
	
	return false;
}

/**
 * Searches an array of MetadataFields to find the document's location 
 * @param metadata, array of MetadataFields
 */
MetadataRenderer.guessDocumentLocation = function(metadata)
{
	var location = "";
	
	for(var i = 0; i < metadata.length; i++)
		// the document's location is typically the navigation target of the 'title' or 'name' field
		if(metadata[i].name == "title" || metadata[i].name == "name")
			if(metadata[i].navigatesTo != null)
				location = metadata[i].navigatesTo;
	
	//console.log("guessing document location: " + location);
	return location;
}

/**
 * Iterates through the meta-metadata, creating MetadataFields by matching meta-metadata fields to metadata values 
 * @param mmdKids, array of meta-metadata fields
 * @param metadata, metadata object from the service
 * @param depth, current depth level
 */
MetadataRenderer.getMetadataFields = function(mmdKids, metadata, depth)
{
	var metadataFields = [];
	
	// Stop recursing at the max depth
	if(depth >= METADATA_FIELD_MAX_DEPTH)
		return metadataFields;
		
	for(var key in mmdKids)
	{		
		var mmdField = mmdKids[key];
		
		if(mmdField.scalar)
		{
			mmdField = mmdField.scalar;
			
			// Is this a visible field?
			if(MetadataRenderer.isFieldVisible(mmdField))
			{				
				// Is there a metadata value for this field?		
				var value = MetadataRenderer.getFieldValue(mmdField, metadata);				
				if(value)
				{		
					var field = new MetadataField(mmdField);
					
					field.value = value; 
										
					field.scalar_type = mmdField.scalar_type;
					field.parentMDType = metadata.mm_name;	
								
					// Does the field have a navigation link?
					if(mmdField.navigates_to != null)
					{
						var navigationLink = metadata[mmdField.navigates_to];
						
						// Is there a value for the navigation link
						if(navigationLink != null && (navigationLink.toLowerCase() != MetadataRenderer.currentDocumentLocation || depth == 0))
							field.navigatesTo = navigationLink;
					}
								
					metadataFields.push(field);
				}
			}
		}		
		else if(mmdField.composite)
		{
			mmdField = mmdField.composite;
			
			// Is this a visible field?
			if(MetadataRenderer.isFieldVisible(mmdField))
			{				
				// Is there a metadata value for this field?		
				var value = MetadataRenderer.getFieldValue(mmdField, metadata);	
				if(value)
				{		
					// If there is an array of values						
					if(value.length != null)
					{						
						for(var i = 0; i < value.length; i++)
						{
							var field = new MetadataField(mmdField);
							
							field.value = MetadataRenderer.getMetadataFields(mmdField["kids"], value[i], depth + 1);
							
							field.composite_type = mmdField.type;
							field.parentMDType = metadata.mm_name;							
							
							metadataFields.push(field);
						}
					}
					else
					{
						var field = new MetadataField(mmdField);
						
						field.value = MetadataRenderer.getMetadataFields(mmdField["kids"], value, depth + 1);
						
						field.composite_type = mmdField.type;
						field.parentMDType = metadata.mm_name;						
						
						metadataFields.push(field);
					}
				}
			}
		}
		
		else if(mmdField.collection != null)
		{
			mmdField = mmdField.collection;	
			
			// Is this a visible field?
			if(MetadataRenderer.isFieldVisible(mmdField))
			{		
				//console.log(mmdField);			
				// Is there a metadata value for this field?		
				var value = MetadataRenderer.getFieldValue(mmdField, metadata);	
				if(value)
				{				
					var field = new MetadataField(mmdField);
					
					field.child_type = (mmdField.child_tag != null) ? mmdField.child_tag : mmdField.child_type;
					field.parentMDType = metadata.mm_name;
											
					// If its a poly-morphic collection, then the value array needs to be restructured
					if(value.length != null)
					{
						var newArray = [];						
						for(var i = 0; i < value.length; i++)
						{
							var polyType = value[i];
							for(k in polyType)
							{
								newArray.push(polyType[k]);								
							}
						}
						
						var newObject = {};
						newObject[field.child_type]	= newArray;
						
						value = newObject;
						
					}
					
					field.value = MetadataRenderer.getMetadataFields(mmdField["kids"], value, depth + 1);
					
					metadataFields.push(field);
				}
			}
		}		
	}
		
	//Sort the fields by layer, higher layers first
	metadataFields.sort(function(a,b){return b.layer - a.layer});
	return metadataFields;
}

MetadataRenderer.isFieldVisible = function(mmdField)
{
	return mmdField.hide == null || mmdField.hide == false;
}

MetadataRenderer.getFieldValue = function(mmdField, metadata)
{
	var valueName = (mmdField.tag != null) ? mmdField.tag : mmdField.name;				
	return metadata[valueName];
}
