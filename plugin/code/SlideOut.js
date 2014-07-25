var defVars = { };

/**
 * Creates the slide-out to display information about the meta-metadata, metadata, and clippings available on the page.
 */
function buildSlideOut(document)
{
	// create new div
	slideOutVisual = document.createElement("div");
	
	// assign propertyies and default styling
	slideOutVisual.className = "slide";
	
	// add new div to the page
	document.body.appendChild(slideOutVisual);
}


/**
 * Display the given meta-metadata in the slideout so that user can see it
 * @param mmd, meta-metadata json object
 */
function renderMMD(mmd, url)
{			
	var typeHeader = document.createElement('h1');
		typeHeader.className = "mmdTypeTitle";
		typeHeader.innerText = prettifyText(mmd["name"]);
		
	slideOutVisual.appendChild(typeHeader);
	
	if (mmd.hasOwnProperty('def_vars')) 
	{
		for (var i = 0; i < mmd.def_vars.length; i++) {
			var def = mmd.def_vars[i];
			var path = def.xpaths[0];
			var nodes = document.evaluate(path, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
			var name = def['name'];
			var snap = nodes.snapshotItem(0);

			defVars[name] = snap;
			//console.log(defVars);
						
			var contextTitle = document.createElement('div');
				contextTitle.className = "contextNode";
				contextTitle.id = "contextTitle";
				contextTitle.innerHTML = "Context Nodes:";
			
			var context = document.createElement('div');
				context.className = "contextNode";
				context.innerHTML = name + ": " + path;
			
			slideOutVisual.appendChild(contextTitle);
			slideOutVisual.appendChild(context);
			
		}
		
	}
	var metaTitle = document.createElement('div');
		metaTitle.className = "mmdField";
		metaTitle.id = "metaTitle";
		metaTitle.innerHTML = "MetaData:";
	
	slideOutVisual.appendChild(metaTitle);
	
	var kids = mmd['kids'];
	
	var contextNode = document;
	
	getData(kids,contextNode);
	
	
	// make it display pretty
	
	// style it cool and legible
	
}

function getData(kids,contextNode)
{
	// dynamically build html to render the mmd
	for (var i = 0; i < kids.length; i++)
	{	
		//console.log(i);
		
		// iterate through the mmd to find all the fields
		var field = kids[i];
		
		// render scalar types
		if(field.scalar != null)
		{	
			scalarType(field,contextNode);
		}
		// render composite types
		if(field.composite != null) 
		{
			compositeType(field,contextNode);
		}
		
		// render collection types
		if(field.collection != null)
		{
			collectionType(field,contextNode);
		}
	}
}

function scalarType(field,contextNode) 
{
	//console.log("scalar:");
	
	field = field.scalar;

	if (prettifyText(field["name"]) === undefined) return;
			
	if (field.hasOwnProperty('context_node')) {
		// console.log(defVars[field['context_node']]);
		contextNode = defVars[field['context_node']];
	}
			
	var mmdField = document.createElement('div');
		mmdField.className = "mmdField";
		mmdField.innerText = prettifyText(field["name"]) + ": "; 	
				
	console.log(prettifyText(field["name"]));
	console.log(field);
 			
	var mmdFieldType = document.createElement('span');
		mmdFieldType.className = "mmdFieldType";
		var type = prettifyText(field["scalar_type"]);
		mmdFieldType.innerText = type;
		
	mmdField.appendChild(mmdFieldType);
	slideOutVisual.appendChild(mmdField);			
		
	var x = null;
	var data = null;
	
	
	var fieldParserKey = field['field_parser_key'];
	if (fieldParserKey != null) {
		console.log(fieldParserKey);
	}	
	
			
	if (field["xpaths"] != null)
	{
		var fieldx = field["xpaths"];
		for (var j = 0; j < fieldx.length; j++) {
			console.log(fieldx[j]);
			var x = getDataScalar(field,fieldx[j],contextNode);
			if (x != null && x != "") {
				data = x;
				//console.log("data: " + data);				
			}

		}
				
	}
	
	//console.log("final data: ");
	//console.log(data);
			
	if(data != null)
	{			
		var text = prettifyText(data).replace(new RegExp('\n', 'g'), "");
		text = text.trim();
		if (field['field_ops'] != null)
		{
			var regexOps = field.field_ops[0].regex_op;
			//console.log(regexOps);
			var regex = regexOps.regex;
			var replace = regexOps.replace;
			
			text = text.replace(new RegExp(regex, 'g'),replace);
		}
		
		var exData = document.createElement('div');
			exData.className = "exData";
			if (type === "ParsedURL")
			{
				var link = document.createElement('a');
				var t = document.createTextNode(text);
				link.appendChild(t);
				link.href = text;
				link.target = "_blank";
				exData.appendChild(link);
			} else {
				exData.innerText = text;
			}

		console.log("data: " + exData.innerText);

		slideOutVisual.appendChild(exData);
	} 
	
	if (field["xpaths"] != null)
	{
		for (var i = 0; i < fieldx.length; i++) {
			var mmdXPath = document.createElement('div');
				mmdXPath.className = "mmdXPath";
				mmdXPath.innerText = fieldx[i];
					
			slideOutVisual.appendChild(mmdXPath);
		}
	}			
	
}

function compositeType(field,contextNode)
{
	//console.log("composite:");
	
	field = field.composite;	
			
	if (prettifyText(field["name"]) === undefined) return;
			
	if (field.hasOwnProperty('context_node')) {
		// console.log(defVars[field['context_node']]);
		contextNode = defVars[field['context_node']];
	}			
			
	var mmdField = document.createElement('div');
		mmdField.className = "mmdField";
		mmdField.innerText = prettifyText(field["name"]) + ": ";
				
	console.log(prettifyText(field["name"]));
	console.log(field);
				
	var mmdFieldType = document.createElement('span');
		mmdFieldType.className = "mmdFieldType";
		mmdFieldType.innerText = prettifyText(field["type"]);
			
	mmdField.appendChild(mmdFieldType);
	slideOutVisual.appendChild(mmdField);		
			
	var x = null;
	var data = null;
	var kids = field['kids'];
	
	if (field["xpaths"] != null)
	{
		var fieldx = field["xpaths"];

		for (var j = 0; j < fieldx.length; j++) {
			var x = getDataComposite(fieldx[j]);
			if (x != null && x != "") {
				data = x;
			}

		}
		
	} else {
		getData(kids,contextNode);
	}
			
	if(data != null)
	{	
		//console.log(data);
		
		var text = prettifyText(data);
		text = text.replace(new RegExp('\n', 'g'), "");
		text = text.trim();
		
		var exData = document.createElement('div');
			exData.className = "exData";
			
			exData.innerText = text;
				
		console.log("data: " + exData.innerText);
				
		slideOutVisual.appendChild(exData);
		
	}	
	
	if (field["xpaths"] != null)
	{
		for (var i = 0; i < fieldx.length; i++) {
			var mmdXPath = document.createElement('div');
				mmdXPath.className = "mmdXPath";
				mmdXPath.innerText = fieldx[i];
					
			slideOutVisual.appendChild(mmdXPath);
		}
	}		
}

function collectionType(field,contextNode)
{
	//console.log("collection:");
	
	field = field.collection;
			
	if (prettifyText(field["name"]) === undefined) return;
			
	if (field.hasOwnProperty('context_node')) {
		// console.log(defVars[field['context_node']]);
		contextNode = defVars[field['context_node']];
	}			
			
	var mmdField = document.createElement('div');
		mmdField.className = "mmdField";
		mmdField.innerText = prettifyText(field["name"]) + ": ";
			
	console.log(prettifyText(field["name"]));
	console.log(field);
			
	if (field['child_scalar_type'] != null)
	{
		var mmdFieldType = document.createElement('span');
			mmdFieldType.className = "mmdFieldType";
			mmdFieldType.innerText = prettifyText(field["child_scalar_type"]);
	} else {
		var mmdFieldType = document.createElement('span');
			mmdFieldType.className = "mmdFieldType";
			mmdFieldType.innerText = prettifyText(field["child_type"]);
	}

	mmdField.appendChild(mmdFieldType);
	slideOutVisual.appendChild(mmdField);

	var x = null;
	var data = null;
			
	if (field["xpaths"] != null)
	{
		var fieldx = field["xpaths"];
		for (var j = 0; j < fieldx.length; j++) {
			console.log(fieldx[j]);
			var x = getDataCollection(field,fieldx[j],contextNode);
			if (x != null && x != "") {
				data = x;
			}

		}
		
	}	
			
	if(data != null)
	{	
		var exData = document.createElement('div');
			exData.className = "exData";
			var text = prettifyText(data).replace(new RegExp('\n', 'g'), "");
			exData.innerText = text.trim();
				
		console.log("data: " + exData.innerText);
				
		slideOutVisual.appendChild(exData);
		
	}			
	
	if (field["xpaths"] != null)
	{
		for (var i = 0; i < fieldx.length; i++) {
			var mmdXPath = document.createElement('div');
				mmdXPath.className = "mmdXPath";
				mmdXPath.innerText = fieldx[i];
					
			slideOutVisual.appendChild(mmdXPath);
		}
	}		
			
}

function getDataScalar(field,xpath,contextNode)
{
	//console.log(xpath);
	//console.log(contextNode);
	
	var data = document.evaluate(xpath, contextNode, null, XPathResult.STRING_TYPE, null);
	console.log(data);
	string = data.stringValue;
	//console.log(string);
	return string;
}


function getDataComposite(xpath)
{
	var data;
	var stuff = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	var size = stuff.snapshotLength;
	if (size == 0) {
		return null;
	}
	
	console.log(stuff);	
	var node = stuff.snapshotItem(0);
	//console.log(node);
	
	return data;
}

function getDataCollection(field,xpath,contextNode)
{
	var fieldParserEl = field['field_parser'];
	var nodes = document.evaluate(xpath, contextNode, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	var size = nodes.snapshotLength;
	if (size == 0) {
		return null;
	}
	
	var kids = field['kids'];
	kids = kids[0].composite['kids'];
	
	//var fieldP = getFieldParserFactory()[fieldParserEl.name];
	//console.log(fieldP == null);
	
	console.log(nodes);
	//console.log(nodes.snapshotItem(0));
	//console.log(nodes.snapshotItem(0).textContent);
	
	for (var i = 0; i < size; i++) {
		//console.log(i);
		var newNode = nodes.snapshotItem(i);
		//console.log(newNode.textContent);
		//console.log(newNode);
		
		getData(kids,newNode);
	}
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


/**
 * Toogles the Slide-Out, by sliding it in or out of view
 */ 
function toggleSlideOut()
{
	if(slideOutVisual == null)
		buildSlideOut();

	// check to see if the slide-out is open
	if (parseInt(slideOutVisual.style.width) > 0)
	{
		//go in if slideout is out
		goIn();
	}
	else
	{
		// else, make slideout come out
		goOut();
	}	
}

/**
 * slides the slideout out
 */
function goOut() 
{
	slideOutVisual.style.width = SLIDEOUT_WIDTH + "px";
	slideOutVisual.style.boxShadow = "6px 0 16px 5px #888";
}

/**
 * slides the slideout back in
 */
function goIn()
{
	slideOutVisual.style.width = 0 + "px";
	slideOutVisual.style.boxShadow = "none";
}

