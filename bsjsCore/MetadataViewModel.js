/*
 * Contains MetadataViewMOdel, a constructor for viewModels, as well as the ViewModeler,
 *  which builds them
 */

var ViewModeler = {};

METADATA_FIELD_MAX_DEPTH = 7;

/**
 * MetadataField represents a parsed metadata field combining
 * presentation/interaction rules from meta-metadata with the metadata value
 *
 * @param mmdField, meta-metadata field object
 */
function MetadataViewModel(mmdField)
{
  this.name = (mmdField.label != null) ? mmdField.label : mmdField.name;
  this.mmdName = mmdField.name;
  this.value = "";
  this.value_as_label = "";
  
  this.layer = (mmdField.layer != null) ? mmdField.layer : 0.0;
  this.style_name = (mmdField.style_name != null) ? mmdField.style_name : "";
  
  this.hide_label = (mmdField.hide_label != null) ? mmdField.hide_label : false;
  this.label_at = mmdField.label_at;
  
  this.concatenates_to = mmdField.concatenates_to;
  this.concatenates = [];
  if (mmdField.concatenates != null)
  {
    for (var k = 0; k < mmdField.concatenates.length; k++)
    {
      this.concatenates.push(mmdField.concatenates[k]);
    }
  }
  this.extract_as_html = mmdField.extract_as_html;

  if (mmdField.dont_show_expanded_initially != "true" && mmdField.show_expanded_initially != null)
  {
    this.show_expanded_initially = mmdField.show_expanded_initially;
  }

  if (mmdField.show_expanded_always != null)
  {
    this.show_expanded_always = mmdField.show_expanded_always;
  }
}


/**
 *
 */
ViewModeler.createMetadata = function(isRoot, mmd, metadata, taskUrl)
{
  var mmdToMake;
  if(mmd['meta_metadata']!= null){
	  mmdToMake = mmd['meta_metadata'];
  }else{
	  mmdToMake = mmd;
  }
  var metadataFields =
	  ViewModeler.getMetadataViewModel(mmdToMake, mmdToMake["kids"], metadata, 0, null, taskUrl);
  
  return metadataFields;
};

/**
 * Checks if the given list of MetadataFields has any visible fields.
 *
 * @param metadata, array of MetadataFields to search for visible fields
 * @return true if there are visible fields, false otherwise
 */
ViewModeler.hasVisibleMetadata = function(metadata)
{
  for (var key in metadata)  
  {
    if (metadata[key].value)
    {
      if (metadata[key].value.length != null && metadata[key].value.length > 0)
      {
        // if the field is an array with at least one element
        return true;
      }
      else if (metadata[key].value.length == null)
      {
        // if the field is not an array
        return true;
      }
    }
  }
  return false;
}

/**
 * Searches an array of MetadataFields to find the document's location.
 *
 * @param metadata, array of MetadataFields
 */
ViewModeler.guessDocumentLocation = function(metadata)
{
  var location = "";
  for (var i = 0; i < metadata.length; i++)
  {
    // the document's location is typically the navigation target of the 'title'
    // or 'name' field
    if (metadata[i].mmdName == "title" || metadata[i].mmdName == "name")
    {
      if (metadata[i].navigatesTo != null)
      {
        location = metadata[i].navigatesTo;
      }
    }
  }
  return location;
}

/**
 * looks up metadataFields collection for the instance, else creates new
 */
ViewModeler.getMetadataField = function(mmdField, metadataFields)
{
  for (var i = 0; i < metadataFields.length; i++)
  {
    if (metadataFields[i].mmdName == mmdField.name)
    {
      return metadataFields[i];
    }
  }
  return new MetadataViewModel(mmdField);
}

/**
 * Iterates through the meta-metadata, creating MetadataViewModel by matching
 * meta-metadata fields to metadata values.
 *
 * @param mmdKids, array of meta-metadata fields
 * @param metadata, metadata object from the service
 * @param depth, current depth level
 */
ViewModeler.getMetadataViewModel = function(parentField, mmdKids, metadata, depth,
                                               child_value_as_label, taskUrl)
{
  metadata = BSUtils.unwrap(metadata);

  var metadataViewModel = [];
  
  // Stop recursing at the max depth
  if (depth >= METADATA_FIELD_MAX_DEPTH)
  {
    return metadataViewModel;
  }
    
  for (var key in mmdKids)
  {    
    var mmdField = mmdKids[key];
    
    if (mmdField.scalar)
    {
      ViewModeler.getScalarMetadataViewModel(metadataViewModel, parentField, mmdField,
          mmdKids, metadata, depth, child_value_as_label, taskUrl);
    }    
    else if (mmdField.composite)
    {
      ViewModeler.getCompositeMetadataViewModel(metadataViewModel, parentField, mmdField,
          mmdKids, metadata, depth, child_value_as_label, taskUrl);
    }
    else if (mmdField.collection != null)
    {
      ViewModeler.getCollectionMetadataViewModel(metadataViewModel, parentField, mmdField,
          mmdKids, metadata, depth, child_value_as_label, taskUrl);
    }
  }
  
  //Sort the fields by layer, higher layers first
  if(!parentField.child_type){
  	  metadataViewModel.sort(function(a,b) { return b.layer - a.layer - 0.5; });

  }

  ViewModeler.collapseEmptyLabelSet(metadataViewModel, parentField);
  
  return metadataViewModel;
}

/**
 *
 */
ViewModeler.getScalarMetadataViewModel = function(metadataViewModel,
													 parentField,
                                                     mmdField,
                                                     mmdKids,
                                                     metadata,
                                                     depth,
                                                     child_value_as_label,
                                                     taskUrl)
{
  mmdField = mmdField.scalar;

  // Is this a visible field?
  if (ViewModeler.isFieldVisible(mmdField, metadata, taskUrl, parentField))
  {        
    // Is there a metadata value for this field?    
    var value = ViewModeler.getFieldValue(mmdField, metadata);        
    if (value)
    {  
      if (child_value_as_label != null)
      {
        mmdField.use_value_as_label = child_value_as_label; 
      }
                
      var field = ViewModeler.getMetadataField(mmdField, metadataViewModel);
                
      field.value = value;
      if (mmdField.use_value_as_label != null) 
      {
        field.value_as_label =
          ViewModeler.getValueForProperty(mmdField.use_value_as_label,
                                             metadata, mmdKids, depth);
      }
                
      field.scalar_type = mmdField.scalar_type;
      field.parentMDType = metadata.meta_metadata_name;  
            
      // Does the field have a navigation link?
      if (mmdField.navigates_to != null)
      {
        var navigationLink = metadata[mmdField.navigates_to];
        
        // Is there a value for the navigation link
        if (navigationLink != null
            && (navigationLink.toLowerCase() != taskUrl || depth == 0))
        {
          field.navigatesTo = navigationLink;
        }
      }
      
      if (mmdField.concatenates_to)
      {
        ViewModeler.concatenateField(field, metadataViewModel, mmdKids);
      }
      
      if (metadataViewModel.indexOf(field) == -1)
      {
        metadataViewModel.push(field);
      }
    }
  }
}

ViewModeler.getCompositeMetadataViewModel = function(metadataViewModel,
														parentField,
                                                        mmdField,
                                                        mmdKids,
                                                        metadata,
                                                        depth,
                                                        child_value_as_label,
                                                        taskUrl)
{
  mmdField = mmdField.composite;
      
  if(mmdField.name == 'keywords'){
	  console.log('gagnam style')
  }
  // Is this a visible field?
  if (ViewModeler.isFieldVisible(mmdField, metadata, taskUrl, parentField))
  {        
    // Is there a metadata value for this field?    
    var value = ViewModeler.getFieldValue(mmdField, metadata);  
    if (value)
    {  
      if (child_value_as_label != null)
      {
        mmdField.use_value_as_label = child_value_as_label;
      }
    
      // If there is an array of values            
      if (value.length != null)
      {            
        for (var i = 0; i < value.length; i++)
        {
          var field = new MetadataViewModel(mmdField);
          
          field.value =
            ViewModeler.getMetadataViewModel(mmdField, mmdField["kids"], value[i],
                                                depth + 1, null, taskUrl);
          
          
          if (mmdField.use_value_as_label != null)
          {
            field.value_as_label =
              ViewModeler.getValueForProperty(mmdField.use_value_as_label,
                                                 value[i], mmdField["kids"],
                                                 depth + 1);
          }
          
          field.composite_type = mmdField.type;
          field.parentMDType = metadata.meta_metadata_name;
          ViewModeler.checkAndSetChildAtributes(parentField, field);
         //if no value, just ignore field
          if(field.value != null && field.value.length >0){
              metadataViewModel.push(field);

          }
        }
      }
      else
      {
        var field = new MetadataViewModel(mmdField);
                    
        field.value =
          ViewModeler.getMetadataViewModel(mmdField, mmdField["kids"], value,
                                              depth + 1, null, taskUrl);
        if (mmdField.use_value_as_label != null)
        {
          if (mmdField.child_value_as_label != null)
          {
            field.value_as_label =
              ViewModeler.getValueForProperty(mmdField.use_value_as_label,
                                                 value, mmdField["kids"],
                                                 depth + 1);
          }
          else
          {
            field.value_as_label =
              ViewModeler.getValueForProperty(mmdField.use_value_as_label,
                                                 metadata, mmdKids, depth + 1);
          }
        }
        
        field.composite_type = mmdField.type;
        field.parentMDType = metadata.meta_metadata_name;
        ViewModeler.checkAndSetChildAtributes(parentField, field);
        
        if(field.value != null && field.value.length >0){
            metadataViewModel.push(field);

        }      }
    }
  }
  else
  {
    if (value)
    {
    }
  }
}

ViewModeler.getCollectionMetadataViewModel = function(metadataViewModel,
														 parentField,
                                                         mmdField,
                                                         mmdKids,
                                                         metadata,
                                                         depth,
                                                         child_value_as_label,
                                                         taskUrl)
{
  mmdField = mmdField.collection;  
  if(mmdField.name == "companion_products"){
	  
  }
  // Is this a visible field?
  if (ViewModeler.isFieldVisible(mmdField, metadata, taskUrl, parentField))
  {    
    // Is there a metadata value for this field?  
    var value = ViewModeler.getFieldValue(mmdField, metadata);  
    if (value)
    {  
      if (child_value_as_label != null)
      {
        mmdField.use_value_as_label = child_value_as_label;
      }
      
      var field = new MetadataViewModel(mmdField);
      
      field.child_type = (mmdField.child_tag != null) ? mmdField.child_tag
                                                      : mmdField.child_type;
      field.parentMDType = metadata.meta_metadata_name;
                  
      // If scalar collection
      if (mmdField.child_scalar_type != null)
      {    
        field.child_type = mmdField.child_scalar_type;      
                    
        var newList = [];
        for (var k = 0; k < value.length; k++)
        {
          var scalarField = new MetadataViewModel(mmdField);
          scalarField.value = value[k]; 
          scalarField.hide_label = true;
          scalarField.scalar_type = mmdField.child_scalar_type;
          newList.push(scalarField);
        }
        field.value = newList;
      }    
      // Else if it's a polymorphic collection
      else if (mmdField.polymorphic_scope != null)
      {            
        var newObject = {};
        var newArray = [];
        
        for (var i = 0; i < value.length; i++)
        {             
          for (k in value[i])
          {
            newArray.push(value[i][k]);
            continue;
          }
        }
        
        newObject[field.child_type] = newArray;
        value = newObject;  
      }
      // Else, it must be a monomorphic collection
      else
      {
        var newObject = {};
        newObject[field.child_type] = value;
        value = newObject;  
      }
      
      if (mmdField.child_use_value_as_label != null)
      {
        field.value =
          ViewModeler.getMetadataViewModel(mmdField,
        		  							  mmdField["kids"],
                                              value,
                                              depth + 1,
                                              mmdField.child_use_value_as_label,
                                              taskUrl);
      }
      else if (mmdField.child_scalar_type == null)
      {
        field.value =
          ViewModeler.getMetadataViewModel(mmdField, mmdField["kids"], value,
                                              depth + 1, null, taskUrl);
      }
      if (mmdField.use_value_as_label != null) 
      {
        field.value_as_label =
          ViewModeler.getValueForProperty(mmdField.use_value_as_label,
                                             metadata, mmdKids);
      }
      
     
      metadataViewModel.push(field);
    }
  }
}
ViewModeler.collapseEmptyLabelSet = function(metadataViewModel, parentField)
{
	var deleteLabelCol = true;
	// make deleteLabelCol false if any child label is visible
	for (var i = 0; i < metadataViewModel.length; i++)
	{
		if (ViewModeler.isLabelVisible(metadataViewModel[i], parentField))
		{
			deleteLabelCol = false;
			break;
		}		
	}
	
	if (deleteLabelCol)
	{
		for (var i = 0; i < metadataViewModel.length; i++)
		{
			var field = metadataViewModel[i];
			if (field.scalar_type)
			{
				// TODO: set use_value_as_label as itself?
			}
			else if (field.composite_type || field.child_type)
			{
				if (field.value.length > 0) 
				{
					metadataViewModel[i] = field.value[0];
					
					// as we are currently hiding labels of collection children
					if (field.child_type)
						metadataViewModel[i].hide_label = true;
				}
			}
		}
	}
}

ViewModeler.isLabelVisible = function(field, parentField)
{
	if (field.scalar_type)
	{
		if (field.name && !field.hide_label)
		{
			return true;
		}
	}
	else if (field.composite_type)
	{
		var imageLabel = (field.value_as_label == "") ?	false : field.value_as_label.type == "image";
		// if label visible OR 
		// expandable composite -- more than one item
		// downloadable document OR composite media field
		if ( ((field.name && !field.hide_label) && (imageLabel || !parentField.child_type)) 
				|| (field.value.length > 1) 
				|| (field.value.length == 1 && (field.value[0].navigatesTo || field.value[0].name == "location")) )
		{
			return true;
		}
	}
	else if (field.child_type)
	{
		// if label visible OR expandable collection
		if ((field.name && !field.hide_label) || (field.value.length > 1))
		{
			return true;
		}
	}
	return false;
}

ViewModeler.checkAndSetChildAtributes = function(parentField, field)
{
	if (parentField.child_show_expanded_initially != null) {
		field.show_expanded_initially = parentField.child_show_expanded_initially;
	}
	if (parentField.child_show_expanded_always != null) {
		field.show_expanded_always = parentField.child_show_expanded_always;
	}
	if (parentField.child_style_name != null) {
		field.style_name = parentField.child_style_name;
	}
}

/**
 * 
 */
ViewModeler.isFieldVisible = function(mmdField, metadata, url, parentField)
{
  if (mmdField["styles"])
  {
    var style = mmdField["styles"][0];
    var location = metadata[mmdField["name"]].location; 
    if (style.is_child_metadata == "true" && style.hide == "true" 
        && url && location && location.toLowerCase() == url)
    {
      return false;
    }
  }
  
  var includeMediaField = ViewModeler.isVisibleMediaField(mmdField, parentField);
  
  return includeMediaField || mmdField.hide == null || mmdField.hide == "false" || mmdField.always_show == "true";
}

ViewModeler.isVisibleMediaField = function(mmdField, parentField)
{
	if (parentField.type == "image" && mmdField.name == "location")
		return true;
	
	return false;
}

/**
 * 
 */
ViewModeler.getFieldValue = function(mmdField, metadata)
{
  
  if (mmdField.tag != null) {
    if (metadata[mmdField.tag] != null) {
      return metadata[mmdField.tag];
    } else if (metadata[mmdField.name] != null) {
      return metadata[mmdField.name];
    } else {
      var typeName = null;
      if (mmdField.tag.toUpperCase() == mmdField.tag) {
        if (mmdField.scope && mmdField.scope.resolved_generic_type_vars) {
          for (var i in mmdField.scope.resolved_generic_type_vars) {
            var gtv = mmdField.scope.resolved_generic_type_vars[i];
            if (gtv && gtv.name == mmdField.tag) {
              typeName = gtv.arg;
              break;
            }
          }
        }
      }
      if (typeName) {
        return metadata[typeName];
      }
    }
  } else {
    return metadata[mmdField.name];
  }
}

/**
 * 
 */
ViewModeler.getValueForProperty = function(valueAsLabelStr, metadata,
                                              mmdKids, depth, taskUrl)
{
  var nestedFields = valueAsLabelStr.split(".");
  var fieldValue = metadata;
  var fieldType = "";
  for (var i = 0; i < nestedFields.length; i++)
  {
    for (var key in mmdKids)
    {
      var mmdField = mmdKids[key];
      if (mmdField.scalar)
      {
        mmdField = mmdField.scalar;
        fieldType = "scalar";
        if (mmdField.name == nestedFields[i])
        {
          break;        
        }
      }
      else if (mmdField.composite)
      {
        mmdField = mmdField.composite;
        fieldType = mmdField.type;
        if (mmdField.name == nestedFields[i])
        {
          mmdKids = mmdField["kids"];
          depth = depth + 1;
          break;
        }
      }
      else if (mmdField.collection)
      {
        mmdField = mmdField.collection;
        fieldType = (mmdField.child_tag != null) ? mmdField.child_tag
                                                 : mmdField.child_type;
        if (mmdField.name == nestedFields[i])
        {
          mmdKids = mmdField["kids"];

          // get the child type; as directly selecting the first child below
          mmdField = mmdKids[0];
          if (mmdField.scalar)
          {
            mmdField = mmdField.scalar;
          }
          else if (mmdField.composite)
          {
            mmdField = mmdField.composite;
          }
          
          mmdKids = mmdField["kids"];
          depth = depth + 1;
          
          break;
        }
      }      
    }
    
    fieldValue = fieldValue[nestedFields[i]];
    // if value is to be read from a collection, then use first element (if its a composite)
    // TODO: define semantics for selection
    if (fieldValue && fieldValue.length != null && mmdField.type)
    {
      fieldValue = fieldValue[0];
    }
  }
  
  // TODO: define caching structure
  if (mmdField.metadataFields)
  {
    return {value: mmdField.metadataFields, type: fieldType};
  }
  else if (fieldValue)
  {
    if (fieldType == "scalar")
    {
      return {value: fieldValue, type: fieldType};
    }
    else  
    {
      var metadataFields =
        ViewModeler.getMetadataViewModel(mmdField, mmdKids, fieldValue, depth, null,
                                            taskUrl);
      return {value: metadataFields, type: fieldType};
    }        
  }

  return "";
}

/**
 * 
 */
ViewModeler.concatenateField = function(field, metadataFields, mmdKids)
{
  var metadataField = "";  
  for (var i = 0; i < metadataFields.length; i++)
  {
    if (metadataFields[i].mmdName == field.concatenates_to)
    {
      metadataField = metadataFields[i];
      metadataField.concatenates.push(field);
      break;
    }
  }
  
  if (metadataField == "")
  {
    for (var key in mmdKids)
    {
      var mmdField = mmdKids[key];
      
      if (mmdField.scalar)
      {
        mmdField = mmdField.scalar;
      }
      else if (mmdField.composite)
      {
        mmdField = mmdField.composite;
      }
      else if (mmdField.collection)
      {
        mmdField = mmdField.collection;
      }
      
      var name = mmdField.name;
      if (name == field.concatenates_to)
      {
        metadataField = new MetadataViewModel(mmdField);
        metadataField.concatenates.push(field);
        metadataFields.push(metadataField);
      }
    }
  }
}

/**
 *
 */
ViewModeler.getImageSource = function(metadataViewModel)
{
  for (var i = 0; i < metadataViewModel.length; i++)
  {
    if (metadataViewModel[i].name == "location")
    {
      return metadataViewModel[i].value;
    }
  }
  return null;
}

if (typeof MetadataLoader == 'undefined' || MetadataLoader == null) {
  var MetadataLoader = {};
}

/** 
 * Make the string prettier by replacing underscores with spaces  
 * @param string to make over
 * @return hansome string, a real genlteman
 */
MetadataLoader.toDisplayCase = function(string)
{  
  var strings = string.split('_');
  var display = "";
  for (var s in strings)
  {
    display += strings[s].charAt(0).toLowerCase() + strings[s].slice(1) + " ";
  }
  return display;
}

/**
 * Remove line breaks from the string and any non-ASCII characters
 * @param string
 * @return a string with no line breaks or crazy characters
 */
MetadataLoader.removeLineBreaksAndCrazies = function(string)
{
  string = string.replace(/(\r\n|\n|\r)/gm," ");  
  var result = "";
  for (var i = 0; i < string.length; i++)
  {
    if (string.charCodeAt(i) < 128)
    {
      result += string.charAt(i);
    }
  }
  return result;
}

/**
 *
 */
MetadataLoader.clearDocumentCollection = function()
{
  MetadataLoader.queue = [];
  MetadataLoader.documentMap = [];
}

/**
 * Gets the host from a URL
 * @param url, string of the target URL
 * @return host as a string
 */
MetadataLoader.getHost = function(url)
{
  if (url)
  {
    if (url.match(/:\/\/(www\.)?(.[^/:]+)/) != null)
		 return "http://www." + url.match(/:\/\/(www\.)?(.[^/:]+)/)[2];
	else
		return "error getting domain";
   
  }
}

/**
 * Gets the favicon image for a url
 * @param url, string of target URL
 * @return string of the favicon url
 */
MetadataLoader.getFaviconURL = function(url)
{
	return MetadataLoader.getHost(url) + "/favicon.ico";
	
	//return "http://g.etfv.co/" + url;
}
