/**
 *  Iterates through the meta-metadata fields and assigns values 
 *  from the parsed json object.
 *  @param mmd, meta-metadata object
 *  @param jsonData, json data string
 *  @return metadata, metadata object
 */
function extractMetadataFromJSON(dataObj, mmd) {
	var metadata = null;

	//var dataObj = jQuery.parseJSON(jsonData);
	if (mmd && dataObj) {
		metadata = recursivelyBindFieldValues(mmd, dataObj, metadata);
		if (metadata)
			metadata.mm_name = mmd.name;
	}

	return metadata;
}

function recursivelyBindFieldValues(mmd, contextObj, metadata) {
	if (metadata == undefined || metadata == null)
		metadata = {};

	if (mmd.kids == null || mmd.kids.length == 0)
		return null;

	for (var mmdFieldIndex = 0; mmdFieldIndex < mmd.kids.length; mmdFieldIndex++) {
		var mmdField = mmd.kids[mmdFieldIndex];
		var currentMMDField = mmdField;

		if (mmdField.scalar != null) {
			bindScalarFieldValue(mmdField.scalar, contextObj, metadata);
		}

		if (mmdField.collection != null) {
			bindCollectionFieldValue(mmdField.collection, contextObj, metadata);
		}

		if (mmdField.composite != null) {
			bindCompositeFieldValue(mmdField.composite, contextObj, metadata);
		}
	}

	return metadata;
}

function bindScalarFieldValue(mmdScalarField, contextObj, metadata) {
	if (contextObj == null)
		return;

	//console.log(contextObj[mmdScalarField.tag]);
	var scalarValue = null;
	var jsonPaths = getJSONPaths(mmdScalarField);
	if (jsonPaths)
	{
		for (var i = 0; i < jsonPaths.length; i++)
		{
			scalarValue = jsonPath(contextObj, jsonPaths[i]);
			if (scalarValue)
				break;
		}
	}

	if (scalarValue) {
		scalarValue = scalarValue[0];
		if (typeof scalarValue == 'string')
		{
			scalarValue = scalarValue.replace(new RegExp('\n', 'g'), "");
			scalarValue = scalarValue.trim();
			// for compatibility 
			mmdScalarField.regex_op = getRegexOp(mmdScalarField);
			if (mmdScalarField.regex_op != null) {
				var regex = mmdScalarField.regex_op.regex;
				var replace = mmdScalarField.regex_op.replace;
				if (replace != undefined && replace != null) // We must replace all newlines if the replacement is not a empty character
				{
					scalarValue = scalarValue.replace(new RegExp(regex, 'g'), replace);
				} else {
					var grps = scalarValue.match(new RegExp(regex));
					if (grps != null && grps.length > 0)
						scalarValue = grps[grps.length - 1];
				}
			}
		}

		metadata[mmdScalarField.name] = scalarValue;
	}
}

function bindCollectionFieldValue(mmdCollectionField, contextObj, metadata) {
	if (contextObj == null)
		return;

	//console.log(contextObj[mmdCollectionField.tag]);
	var thisObj = null;
	var jsonPaths = getJSONPaths(mmdCollectionField);
	if (jsonPaths)
	{
		for (var i = 0; i < jsonPaths.length; i++)
		{
			thisObj = jsonPath(contextObj, jsonPaths[i]);
			if (thisObj)
				break;
		}
	}
	
	// temporary && condition for a single composite treated as collection in mmd
	if (thisObj && thisObj[0] instanceof Array)
		thisObj = thisObj[0];
	
	//metadata[mmdCollectionField.name] = {};
	
	var size = thisObj? thisObj.length : 0;
	var elements = [];
	for (var i = 0; i < size; ++i) {
		if (mmdCollectionField.childScalarType) { // collection of scalars
			var value = thisObj[i];

			if (value)
				elements.push(value);
		} 
		else { // collection of elements
			var kids = mmdCollectionField.kids;
			if (kids == undefined || kids == null || kids.length == 0) {
				//console.log("Oops, collection fields do not exist.");
			} else {
				var element = {};
				element = recursivelyBindFieldValues(
						mmdCollectionField.kids[0].composite, thisObj[i], element);
				
				if (mmdCollectionField.kids[0].composite.hasOwnProperty('type'))
					element.mm_name = mmdCollectionField.kids[0].composite.type;
				else
					element.mm_name = mmdCollectionField.kids[0].composite.name;
				
				if (mmdCollectionField.polymorphic_scope != null) {
					var child_element = {};
					child_element[mmdCollectionField.child_type] = element;
					element = child_element;
				}

				var newElement = clone(element);

				if (!isEmpty(newElement))
					elements.push(newElement);
			}
		}
	}

	if (elements.length > 0) {
		var extractedCollection = {};

		//fix for new collection representation (json) policy
		//extractedCollection[mmdCollectionField.child_type] = elements;
		extractedCollection = elements;
		metadata[mmdCollectionField.name] = extractedCollection;

	} else {
		//console.info("empty collection, not adding the object");
	}
}

function bindCompositeFieldValue(mmdCompositeField, contextObj, metadata) {
	if (contextObj == null)
		return;

	//console.log(contextObj[mmdCompositeField.tag]);
	var thisObj = null;	
	var jsonPaths = getJSONPaths(mmdCompositeField);
	if (jsonPaths)
	{
		for (var i = 0; i < jsonPaths.length; i++)
		{
			thisObj = jsonPath(contextObj, jsonPaths[i]);
			if (thisObj)
				break;
		}
	}
	
	if (thisObj)
	{
		thisObj = thisObj[0];
		metadata[mmdCompositeField.name] = {};
	
		var compositeMetadata = metadata[mmdCompositeField.name];
		recursivelyBindFieldValues(mmdCompositeField, thisObj, compositeMetadata);
		
		if (mmdCompositeField.hasOwnProperty('type')) {
			thisObj.mm_name = mmdCompositeField.type;
		} else {
			thisObj.mm_name = mmdCompositeField.name;
		}
	}
}

function getRegexOp(field) {

	if (field.field_ops != null) {
		for (var i = 0; i < field.field_ops.length; i++) {
			if (field.field_ops[i].regex_op != null)
				return field.field_ops[i].regex_op;
		}
	} else
		return field.filter;

	return null;
}

function isEmpty(obj) {
    for (var propName in obj)
        if (obj.hasOwnProperty(propName))
            return false;
    return true;
}

function clone(obj){
    if(obj == null || typeof(obj) != 'object')
        return obj;

    var temp = obj.constructor(); // changed

    for(var key in obj)
        temp[key] = clone(obj[key]);
    return temp;
}

function getJSONPaths(field) {
	if (field.json_paths)
		return field.json_paths;
		
	return null;
}
