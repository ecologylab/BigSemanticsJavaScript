var upperLevel = { }; //holds upperlevel metadata
//var scalars = { };

/*
 * extracts metadata from metametadata
 * 
 * @param mmd, meta-metadata object
 */
function extractMetadata(mmd) {
	var extractedMeta = { };
	mmd = mmd['meta_metadata'];
	mmdKids = mmd['kids'];
	mmdKids = sortKids(mmdKids);
	var contextNode = document;
	var type = mmd['type'];
	var name = mmd['name'];
	
	if (mmd.hasOwnProperty('def_vars')) 
	{
		for (var i = 0; i < mmd.def_vars.length; i++) {
			if (typeof mmd.def_vars[i].xpaths !== 'undefined'){ //in case someone writes a wrapper and doesn't define an xpath
				var def = mmd.def_vars[i];
				var path = def.xpaths[0];
				var nodes = document.evaluate(path, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
				if (nodes.snapshotLength != null)
				{
					var n = def['name'];
					var snap = nodes.snapshotItem(0);
					defVars[n] = snap;
				}
			}
		}
	}
	
	if (type != undefined) 
	{
		extractedMeta[type] = dataFromKids(mmdKids,contextNode,true,null);
		extractedMeta[type]['download_status'] = "DOWNLOAD_DONE";
		extractedMeta[type]['mm_name'] = mmd.name;
	} else {
		extractedMeta[name] = dataFromKids(mmdKids,contextNode,true,null);
		extractedMeta[name]['download_status'] = "DOWNLOAD_DONE";
		extractedMeta[name]['mm_name'] = mmd.name;
	}
	return extractedMeta;
}

/*
 * loops through the kids of the metadata field
 */
function dataFromKids(mmdKids,contextNode,recurse,parserContext)
{
	var d = { };
	var e = true; //if object is empty
	
	for (var i = 0; i < mmdKids.length; i++) {
		var field = mmdKids[i];
		var name;
		var obj;
		var tag;
				
		if(field.scalar) 
		{
			field = field.scalar;
			name = field.name;

			if (field.hasOwnProperty('context_node'))
			{
				if (defVars[field.context_node] != null)
					contextNode = defVars[field.context_node];
			}
			
			obj = getScalarD(field,contextNode,recurse,parserContext);
			tag = field.tag;
			
			if (recurse && name == 'location') {
				obj = url;
			}
			
			if (obj != null)
			{
				e = false;
				if (tag != undefined){
					d[tag] = obj;
					if (recurse) {
						upperLevel[tag] = obj;
					}
				} else {
					d[name] = obj;
					if (recurse) {
						upperLevel[name] = obj;
					}
				}
				
			}
			
			if (!recurse && field.name == 'location' && obj != null && obj != url) {
				break;
			}
		}
		else if (field.composite) 
		{
			field = field.composite;
			name = field.name;
			
			if (field.hasOwnProperty('context_node'))
			{
				contextNode = defVars[field.context_node];
			}			
			
			obj = getCompositeD(field,contextNode,recurse,parserContext);

			if(!isObjEmpty(obj,recurse))
			{
				if(obj != null)
				{
					e = false;
					if (tag != undefined){
						d[tag] = obj;
					} else {
						d[name] = obj;
					}			
				}
			}
		}
		else if (field.collection)
		{
			field = field.collection;
			name = field.name;
			
			if (field.hasOwnProperty('context_node'))
			{
				contextNode = defVars[field.context_node];
			}			
			
			obj = getCollectionD(field,contextNode,recurse,parserContext);
			if(obj != null)
			{
				e = false;
				if (tag != undefined) {
					d[tag] = obj;
				} else {
					d[name] = obj;
				}
			}			
		}
	}
	
	//if object is empty just return null
	if (e) { 
		return null;
	}
	
	return d;
}

function getScalarD(field,contextNode,recurse,parserContext)
{
	var x = null;
	var data = null;
	
	if (field.hasOwnProperty("concatenate_values")) { 	//calls the service when there is concatenate_values in the fields
		data = concatValues(field.concatenate_values);	//temporary until there is javascript code for concatenate_values
		if (!recurse) {
			return null;
		}
		serviceCall = true;
		console.log("Calling service for metadata, something went wrong");
		return null;
	}
	
	// var fieldParserKey = field['field_parser_key'];
	// if (fieldParserKey != null) {
		// data = getFieldParserValueByKey(parserContext,fieldParserKey);
	// }
	
	if (field["xpaths"] != null && field["xpaths"].length > 0)
	{
		var fieldx = field["xpaths"];
		for (var j = 0; j < fieldx.length; j++) {
			var x = getScalarString(field,fieldx[j],contextNode);
			if (x != null && x != "") {
				data = x;
				break;			
			}

		}
				
	}
	
	if(data != null)
	{			
		data = data.trim();
		if (field['field_ops'] != null)
		{
			for (var i = 0; i < field['field_ops'].length; i++)
			{
				var regexOps = field.field_ops[i].regex_op;
				var regex = regexOps.regex;
				var replace = regexOps.replace;
				
				data = data.replace(new RegExp(regex, 'g'),replace);
			}
		}
		return data;
	} 
	return null;
}

function getCompositeD(field,contextNode,recurse,parserContext)
{
	var x = null;
	var data = null;
	var kids = field['kids'];
	
	if (field["xpaths"] != null)
	{
		var fieldx = field["xpaths"];
		for (var j = 0; j < fieldx.length; j++) {
			var x = getCompositeObject(fieldx[j]);
			if (x != null && x != "") {
				contextNode = x;
			}
		}
		
		if (contextNode != null && recurse) {
			data = dataFromKids(kids,contextNode,false,null);
		}
		
	} else if (recurse)
	{
		data = dataFromKids(kids,contextNode,false,null);
	}  
	
	if(data != null)
	{	
		data['download_status'] = "UNPROCESSED";
		if (field.hasOwnProperty('type')) {
			data['mm_name'] = field.type;
		} else {
			data['mm_name'] = field.name;
		}	
		return data;
	}	
	return null;		
}

function getCollectionD(field,contextNode,recurse,parserContext)
{
	if (!recurse) 
	{
		return null;
	}

	var x = null;
	var data = null;
	
	if (field.hasOwnProperty("field_parser")) {
		(console.log(field.name + " has a field parser"));
	}
	
	if (field["xpaths"] != null)
	{
		var fieldx = field["xpaths"];
		for (var j = 0; j < fieldx.length; j++) {
			var x = getCollectionData(field,fieldx[j],contextNode);
			if (x != null && x != "") {
				data = x;
			}
		}
	}	

	if(data != null)
	{	
		return data;
	}				
	return null;
}

function getScalarString(field,xpath,contextNode)
{
	try {
		var data = document.evaluate(xpath, contextNode, null, XPathResult.STRING_TYPE, null);
	} catch (err) {
		return null;
	}
	string = data.stringValue;
	
	if (field.scalar_type == "ParsedURL") 
	{
		if (string.charAt(0) == "/")
		{
			if (string.charAt(1) != "/") {
				string = baseURL.concat(string);
			} else {
				var h = "http:";
				string = h.concat(string);				
			}
		} else if (string.indexOf("@") > -1)
		{
			return null;
		}
		
	}
	return string;
}

function getCompositeObject(xpath)
{
	try {
		var nodes = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);		
	} catch (e) {
		return null;
	}
	var size = nodes.snapshotLength;
	
	if (size == 0) {
		return null;
	}

	var node = nodes.snapshotItem(0);

	if (node.textContent != null) {
		return node;
	}
	return null;
}

function getCollectionData(field,xpath,contextNode,recurse)
{
	var d = null;
	var fieldParserEl = field['field_parser'];
	try {
		var nodes = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);		
	} catch (e) {
		return null;
	}
	var size = nodes.snapshotLength;
	if (size == 0) {
		return null;
	}
	
	if (field.hasOwnProperty('field_parser'))
	{
		serviceCall = true;
		console.log("Calling service for metadata, something went wrong");
		return null; //for now until we get field parsers handled
	}
	
	// if (field.hasOwnProperty('field_parser'))   //field parsers are not currently handled
	// {
		// var fieldName = fieldParserEl.name;
		// var fieldParser = getFieldParserFactory()[fieldName];
		// var contextList = [];
		// for (var i = 0; i < size; i++)
		// {
			// var node = nodes.snapshotItem(i);
			// var string = node.textContent;
			// if (string != null) 
			// {
				// var c = fieldParser.getKeyValuePairResult(fieldName,string.trim());
				// contextList.push(c);
			// }
		// }
// 		
		// if (contextList != null)
		// {
			// d = [];
			// for (var i = 0; i < size; i++)
			// {
				// context = contextList[i];
				// if (context)
				// {
					// var data = dataFromKids(field.kids[0].composite.kids,nodes.snapshotItem(i),false,context);
					// if (data != null) 
					// {
						// d.push(data);
					// }
				// }
			// }
		// }
// 		
	// } 
	if (field['kids'].length > 0)
	{
		d = [];
		var f = field.kids[0].composite;
		var kids = f.kids;
		
		for (var i = 0; i < size; i++) {
			var newNode = nodes.snapshotItem(i);
			var obj = dataFromKids(kids,newNode,false,null);

			if (obj != null)
			{
			if (f.hasOwnProperty('type')) {
				obj['mm_name'] = f.type;
			} else
			{
				obj['mm_name'] = f.name;
			}
			obj['download_status'] = "UNPROCESSED";
			d.push(obj);
			}
		}
	} else if (size > 0) 
	{
		
		for (var i = 0; i < size; i++) {
			var data = nodes.snapshotItem(i).textContent;
			
			data = data.trim();
			if (field['field_ops'] != null)
			{
				var regexOps = field.field_ops[0].regex_op;
				var regex = regexOps.regex;
				var replace = regexOps.replace;
				if (replace != null) {
					d = [];
					data = data.replace(new RegExp(regex, 'g'),replace);
				} else {
					d = [];
					data = data.match(new RegExp(regex));
					data = data[0];
				}
			}
			d.push(data);
		}
	}
	return d;
}

/*
 * doesn't work, is supposed to concatenate values
 */
function concatValues(concatList)
{
	
	var concatString = "";
	
	for (var i = 0; i < concatList.length; i++)
	{
		var concat = concatList[i];
		if (concat.hasOwnProperty("from_scalar"))
		{
			var x = concat.from_scalar;
			concatString = concatString + scalars[x];
		}
	}
}

/*
 * checks if composite has any significant info
 */
function isObjEmpty(o)
{
	if (o == null) {
		return true;
	}	
	var size = 0;
	var matches = 0;

	for (x in o) {
		
		if (x == 'site_name' || x == "mm_name" || x == "download_status") {continue;}
		
		size++;
		if (upperLevel.hasOwnProperty(x)) {
			if (o[x] == upperLevel[x]) {
				matches++;
			}
		}
	}
	
	if (matches == size) {
		return true;
	}
	
	return false;
}

/*
 * supposed to help handle field parsers ?
 */
function getFieldParserValueByKey(fieldParserContext, fieldParserKey) {
    var pos = fieldParserKey.indexOf('|');
    if (pos < 0)
        return fieldParserContext[fieldParserKey];
    var keys = fieldParserKey.split('|');
    for (var key in keys)
        if (fieldParserContext.hasOwnProperty(key))
            return fieldParserContext[key];
    return null;
}

/*
 * recursion recuires that scalars be evaluated first
 */
function sortKids(mmdKidsList) {
	var sortedList = [];
    for (var i = 0; i < mmdKidsList.length; i++)
		if (mmdKidsList[i].scalar)
			sortedList.push(mmdKidsList[i])
    for (var i = 0; i < mmdKidsList.length; i++)
		if (!mmdKidsList[i].scalar)
			sortedList.push(mmdKidsList[i])
    return sortedList;
}