/*
 * extracts metadata from metametadata
 * 
 * @param mmd, meta-metadata object
 */
function extractMetadata(mmd) {
	var extractedMeta = { };
	mmd = mmd['meta_metadata'];
	mmdKids = mmd['kids'];
	var contextNode = document;
	var type = mmd['type'];
	var name = mmd['name'];
	
	if (mmd.hasOwnProperty('def_vars')) 
	{
		for (var i = 0; i < mmd.def_vars.length; i++) {
			var def = mmd.def_vars[i];
			var path = def.xpaths[0];
			var nodes = document.evaluate(path, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
			var n = def['name'];
			var snap = nodes.snapshotItem(0);

			defVars[n] = snap;
		}
		
	}
	
	if (type != undefined) 
	{
		//console.log("asdf");
		extractedMeta[type] = dataFromKids(mmdKids,contextNode,true);
		extractedMeta[type]['download_status'] = "DOWNLOAD_DONE";
		extractedMeta[type]['mm_name'] = mmd.name;
	} else {
		// console.log(name);
		// console.log(type);
		extractedMeta[name] = dataFromKids(mmdKids,contextNode,true);
		extractedMeta[name]['download_status'] = "DOWNLOAD_DONE";
		extractedMeta[name]['mm_name'] = mmd.name;
	}
	//console.log(extractedMeta);
	return extractedMeta;
}

function dataFromKids(mmdKids,contextNode,recurse)
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
			
			console.log(field.name + ": scalar");
			console.log(field);
			
			obj = getScalarD(field,contextNode,recurse);
			tag = field.tag;
			
			if (recurse && name == 'location') {
				obj = url;
			}
			
			if (obj != null)
			{
				e = false;
				if (tag != undefined){
					d[tag] = obj;
				} else {
					d[name] = obj;
				}
			}
			
			if (!recurse && field.name == 'location' && obj != null && obj != url) {
				break;
			}
			
			if (recurse && name == 'description') {
				description = obj;
			}
		}
		else if (field.composite) 
		{
			field = field.composite;
			name = field.name;
			
			if (name == 'root_document') continue;
			
			console.log(field.name + ": composite");
			//console.log(field);
			
			obj = getCompositeD(field,contextNode,recurse);
			if(!isObjEmpty(obj,recurse))
			{
				e = false;
				d[name] = obj;
			}
			
		}
		else if (field.collection)
		{
			field = field.collection;
			name = field.name;
			
			console.log(field.name + ": collection");
			//console.log(field);
			
			obj = getCollectionD(field,contextNode,recurse);
			if(obj != null)
			{
				e = false;
				d[name] = obj;
				//console.log(obj);
			}			
		}
	}
	//if object is empty just return null
	if (e) { 
		return null;
	}
	
	return d;
}

function getScalarD(field,contextNode,recurse)
{
	var x = null;
	var data = null;
	
	var fieldParserKey = field['field_parser_key'];
	if (fieldParserKey != null) {
		//console.log(fieldParserKey);
	}	
	
	if (field["xpaths"] != null)
	{
		var fieldx = field["xpaths"];
		for (var j = 0; j < fieldx.length; j++) {
			//console.log(fieldx[j]);
			var x = getScalarString(field,fieldx[j],contextNode);
			if (x != null && x != "") {
				data = x;			
			}

		}
				
	}
	
	//console.log("final data: ");
	//console.log(data);
	
	if(data != null)
	{			
		var data = prettifyText(data).replace(new RegExp('\n', 'g'), "");
		data = data.trim();
		if (field['field_ops'] != null)
		{
			var regexOps = field.field_ops[0].regex_op;
			//console.log(regexOps);
			var regex = regexOps.regex;
			var replace = regexOps.replace;
			
			data = data.replace(new RegExp(regex, 'g'),replace);
		}
		
		return data;
	} 
	
	return null;
}

function getCompositeD(field,contextNode,recurse)
{
	//console.log("composite:");

	var x = null;
	var data = null;
	var kids = field['kids'];
	
	if (field["xpaths"] != null)
	{
		var fieldx = field["xpaths"];

		for (var j = 0; j < fieldx.length; j++) {
			var x = getCompositeObject(fieldx[j]);
			if (x != null && x != "") {
				data = x;
			}

		}
		
	} else if (recurse)
	{
		//console.log("kids");
		//console.log(kids);
		data = dataFromKids(kids,contextNode,false);
		//console.log("asdf");
		//console.log(data);
	}
	
	//console.log(data.);
	
	if(data != null)
	{	
		//console.log(data);
		
		// var data = prettifyText(data);
		// data = data.replace(new RegExp('\n', 'g'), "");
		// data = data.trim();
		
		data['download_status'] = "UNPROCESSED";
		if (field.hasOwnProperty('type')) {
			data['mm_name'] = field.type;
		} else {
			data['mm_name'] = field.name;
		}
		
		//console.log(data);
		return data;
		
	}	
	return null;		
}

function getCollectionD(field,contextNode,recurse)
{
	//console.log(field);
	var x = null;
	var data = null;
			
	if (field["xpaths"] != null)
	{
		var fieldx = field["xpaths"];
		for (var j = 0; j < fieldx.length; j++) {
			//console.log(fieldx[j]);
			var x = getCollectionArray(field,fieldx[j],contextNode);
			if (x != null && x != "") {
				data = x;
			}

		}
		
	}	
			
	if(data != null)
	{	
		//console.log(data);
		return data;
	}				
	return null;
}

function getScalarString(field,xpath,contextNode)
{
	//console.log(xpath);
	//console.log(contextNode);
	
	var data = document.evaluate(xpath, contextNode, null, XPathResult.STRING_TYPE, null);
	//console.log(data);
	string = data.stringValue;
	
	console.log(string);
	console.log(string.charAt(0) == '/');
	

	
	if (field.scalar_type == "ParsedURL" && string.charAt(0) == "/")
	{
		string = baseURL.concat(string);
		console.log(string);
	}
	
	
	//console.log(string);
	return string;
}

function getCompositeObject(xpath)
{
	var data;
	var stuff = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	var size = stuff.snapshotLength;
	if (size == 0) {
		return null;
	}
	
	//console.log(stuff);	
	var node = stuff.snapshotItem(0);
	//console.log(node);
	
	return data;
}

function getCollectionArray(field,xpath,contextNode,recurse)
{
	var d = [];
	var fieldParserEl = field['field_parser'];
	var nodes = document.evaluate(xpath, contextNode, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	var size = nodes.snapshotLength;
	if (size == 0) {
		return null;
	}

	//console.log(field);
	var f = field.kids[0].composite;
	//console.log(f);
	var kids = f.kids;
	
	//var fieldP = getFieldParserFactory()[fieldParserEl.name];
	//console.log(fieldP == null);
	
	//console.log(nodes);
	//console.log(nodes.snapshotItem(0));
	//console.log(nodes.snapshotItem(0).textContent);
	
	//console.log('size' + size);
	//console.log(kids);
	
	for (var i = 0; i < size; i++) {
		//console.log(i);
		var newNode = nodes.snapshotItem(i);
		//console.log(newNode.textContent);
		//console.log(newNode);
		
		var obj = dataFromKids(kids,newNode,false);
		if (f.hasOwnProperty('type')) {
			obj['mm_name'] = f.type;
		} else
		{
			obj['mm_name'] = f.name;
		}
		
		// obj['mm_name'] = f.name;
		obj['download_status'] = "UNPROCESSED";
		d[i] = obj;
	}
	//console.log(d);
	return d;
}

function isObjEmpty(o,recurse)
{
	//return (o.description == description && !recurse);
	var size = 0;
	var qua = true;
	
	for (x in o) 
	{
		size++;
		if (size > 3) {
			qua = false;
			break;
		} else {
			qua = true;
			
		}
	}
	//console.log(o);
	//console.log("size: " + size);
	//console.log(qua);
	return qua;
}

function prettifyText(str)
{
	// replaces '_' with spaces
	try 
	{
		str = str.replace('_', " ");
		//str = str.replace(/&lt;br&gt;/g," ");
	} catch (e) { }
	
	
	return str;
}