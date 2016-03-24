/* jshint browser:true, devel:true, node:true */
/* global BSUtils, FieldOps, getPosition, unwrapped:true */

// Default metadata extractor.

// Extracts metadata, given DOM and mmd.
//
// Response response:
//   contains the DOM (in its 'entity' property). see Downloader for the
//   specifics.
//
// MetaMetadata mmd:
//   the mmd
//
// BigSemantics bigSemantics:
//   used to provide types for outlinks
//
// Object options:
//   containing optional configurations
//
// (err, metadata)=>void callback:
//   to receive extraction result
function extractMetadata(response, mmd, bigSemantics, options, callback) {
  var extractedMeta = extractMetadataSync(response, mmd, bigSemantics, options);
	callback(null, extractedMeta);
}

function extractMetadataSync(response, mmd, bigSemantics, options) {
	
	mmd = BSUtils.unwrapMmd(mmd);

	/* Helper functions for operating on xpaths, some ported from ParserBase in BigSemanticsJava */
	function ammendXpath(xpath){
		var result = xpath;
		if(result){
			result = absoluteToRelative(result);
			result = joinLines(result);
		}
		return result;
	}
	
	function joinLines(xpath){
		if (xpath.includes("\n") || xpath.includes("\r"))
		{
		  xpath = xpath.replace("\n", "").replace("\r", "");
		}
		return xpath;
	}
	
	function absoluteToRelative(xpath){
		if(xpath.startsWith('/')){
			xpath = '.' + xpath;
		}
		if(xpath.includes('(/')){
			xpath.replace('(/', '(./');
		}

		return xpath;
	}

	function makeRelativeXpath(xpath, contextNode, page){
		var evaluationPath;
		if(contextNode != page){
			evaluationPath = ammendXpath(xpath);
		}else{
			evaluationPath = xpath;
		}
		return evaluationPath;
	}
	
	//store topmost xpaths for each field. used to tell if nested fields are inherited or not
	function countXpaths(mmdKids, page){
	    for (var i = 0; i < mmdKids.length; i++) {
			var field = mmdKids[i];
	        if(field.scalar) {
				field = field.scalar;
			}
			else if (field.composite) {
				field = field.composite;
				
			}
			else if (field.collection){
				field = field.collection;
			}
	        var name = field.name;
	        if ('xpaths' in field){
	            upperXpath[page.URL][name] = field.xpaths;
	        }
	        else {
	            upperXpath[page.URL][name] = [];
	        }
	    }
	}
	
	/** 
	* loops through the kids of the metadata field 
	* mmdKids : the scalars, composites, and collections to extract data for
	* contextNode : the code html node that we are in context of. is whole page for 
	* recurse : boolean, whether or not to recursively extract composites and collections
	* page : the parent html page
	* isLowerLvl : boolen, whether or not this is a first level extraction or second level
	*/
	function dataFromKids(mmdKids, contextNode, recurse, page, isLowerLvl){
		var data = { };
		var isEmpty = true; //if object is empty
	    var isNested = false;
	    if (contextNode != page) isNested = true;
	    
	    if (mmdKids === null || mmdKids.length === 0) {
	      return null; // Nothing to do here.
	    }
	    
		for (var i = 0; i < mmdKids.length; i++) {
			var field = mmdKids[i];
			var name;
			var obj;
			var tag;
					
	        var tmpField = field[Object.keys(field)[0]];
			
			//TODO work out with Ajit and Yin if this is right behavior
			// if the field has only the xpaths it inherited, or fewer xpaths, then do not try extraction
			/* */
			if (tmpField.hasOwnProperty('xpaths') && tmpField.xpaths == upperXpath[page.URL][tmpField.name] && (isNested || isLowerLvl)){
	            continue;
	        }
			else if (tmpField.hasOwnProperty('xpaths') && upperXpath[page.URL][tmpField.name] && tmpField.xpaths.length < upperXpath[page.URL][tmpField.name].length){
				continue;
			}
			
	        if (!isNested){
	            contextNode = page;
	        }

			if(field.scalar) {
				field = field.scalar;
				name = field.name;
	            var hasContext = false;

				if (field.hasOwnProperty('context_node')){
					if (defVars[field.context_node]) {
						contextNode = defVars[field.context_node];
					}
	                hasContext = true;
				}
				
				obj = getScalarD(field,contextNode,recurse,page);
				tag = field.tag;
				
				//this is a remnant. not sure what it does, but I'm scared to remove it
				if (!isNested && obj === null && recurse && name == 'location' && !hasContext) {
					obj = page.URL;
				}
				
				if (obj) {
					isEmpty = false;
					if (tag) {
						data[tag] = obj;
						if (!isNested && !isLowerLvl) {
							upperLevel[page.URL][tag] = obj;
						}
					} else {
						data[name] = obj;
						if (!isNested && !isLowerLvl) {
							upperLevel[page.URL][name] = obj;
						}
					}
					
				}
			
			}
			else if (field.composite) {
				field = field.composite;
				name = field.name;
				
				if (field.hasOwnProperty('context_node')) {
					contextNode = defVars[field.context_node];
				}			
				
				obj = getCompositeD(field,contextNode,recurse,page);
				
				//TODO probably remove commented out code (and related code)
				//make sure the object actually contains new data.
				//if(!isObjEmpty(obj,page)) {
					if(obj) {
						isEmpty = false;
						if (tag){
							data[tag] = obj;
						} else {
							data[name] = obj;
						}			
					}
				//}
			}
			else if (field.collection) {
				field = field.collection;
				name = field.name;
				
				if (field.hasOwnProperty('context_node')) {
					contextNode = defVars[field.context_node];
				}
				obj = getCollectionD(field,contextNode,recurse,page);
				if(obj) {
					isEmpty = false;
					if (tag) {
						data[tag] = obj;
					} else {
						data[name] = obj;
					}
				}			
			}
		}
		
		if (isEmpty) { 
			return null;
		}	
		return data;
	}

	function getScalarD(field, contextNode, recurse, page){
		var x = null;
		var data = null;
		
		if (field.hasOwnProperty("concatenate_values") && field.concatenate_values.length > 1) {
			data = concatValues(field.concatenate_values, page);
			if (!recurse) {
				return data;
			}
		}
		
		if (field.hasOwnProperty('field_parser_key')) {
			data = null;
		}
		else if (field.hasOwnProperty('xpaths') && field.xpaths.length > 0) {
			var fieldx = field.xpaths;
			for (var j = 0; j < fieldx.length; j++) {
				if (field.extract_as_html) {
					x = getScalarNode(field,fieldx[j],contextNode,page);
					if (x) {
						x = x.innerHTML;
					}
				}
				else {
					x = getScalarString(field,fieldx[j],contextNode,page);
				}				
				if (x !== null && x !== "" && x !== "\n") {
					data = x;
					break;			
				}
			}
		}
		
		if(data !== null && data !== undefined) {			
			data = data.trim();
			if (field.hasOwnProperty('field_ops')) {
				for (var i = 0; i < field.field_ops.length; i++) {
					var fieldOp = field.field_ops[i];
					data = FieldOps.operate(data, fieldOp);
				}
			}
	        scalars[page.URL][field.name] = data;
			return data;
		} 
		return null;
	}

	function getCompositeD(field,contextNode,recurse,page){
		var x = null;
		var data = null;
		var kids = field.kids;
		var recurseNeeded = false;
	    var newContextNode = null; 
		
		//in case of nested composites
		for (var kid in kids){
			if (kids[kid].hasOwnProperty("composite"))
				if (!kids[kid].composite.hasOwnProperty("declaring_mmd"))
					recurseNeeded=true;
			
			if (kids[kid].hasOwnProperty("collection"))
				recurseNeeded=true;
		}
		
		if (field.hasOwnProperty('xpaths')){
			var fieldx = field.xpaths;
			for (var j = 0; j < fieldx.length; j++) {
				x = getCompositeObject(field, fieldx[j], contextNode,page);
				// if the result is not a node, assume there was a field parser that manually got data for us and return that data
				if (x !== null && !("nodeType" in x)) {//x.prototype && !x.prototype.hasOwnProperty("nodeType")){
					return x;
				}
				else if (x !== null && x !== "") {
					newContextNode = x;
	                break;
				}
			}
			if(x === null){
				return null;
			}

			if (newContextNode !== null && recurse && recurseNeeded) {
				data = dataFromKids(kids,newContextNode,recurse,page,true);
			}
			else if (newContextNode !== null) {
				data = dataFromKids(kids,newContextNode,false,page,true);
			}
			
		} else if (recurse)
		{
			data = dataFromKids(kids,contextNode,false,page,true);
		}  
		
		if(data)
		{	
			data.download_status = "UNPROCESSED";
			
			if(field.hasOwnProperty('polymorphic_scope')){
				var polydata = {};
				polydata[field.type] = data;
				data = polydata;
			}	
			if (field.hasOwnProperty('type')) {
				data.mm_name = field.type;
			} else {
				data.mm_name = field.name;
			}	
			return data;
		}
		return null;		
	}

	function getCollectionD(field,contextNode,recurse,page){
		if (!recurse) {
			return null;
		}

		var x = null;
		var data = null;
		
		if (field.hasOwnProperty("xpaths")) {
			var fieldx = field.xpaths;
			for (var j = 0; j < fieldx.length; j++) {
				x = getCollectionData(field,fieldx[j],contextNode,page);
				if (x !== null && x !== "") {
					data = x;
	                break;
				}
			}
		}	

		if(data) {	
			return data;
		}				
		return null;
	}

	function getScalarNode(field,xpath,contextNode,page) {
		var data;
		try {
			var evalXpath = makeRelativeXpath(xpath, contextNode, page);
			data = page.evaluate(evalXpath, contextNode, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
		} catch (err) {
			return null;
		}
		return data.singleNodeValue;
	}

	function getScalarString(field,xpath,contextNode,page){
	    getScalarStringCalled++;
		var data;
		try {
			var evalXpath = makeRelativeXpath(xpath, contextNode, page);
			data = page.evaluate(evalXpath, contextNode, null, XPathResult.STRING_TYPE, null);
		} catch (err) {
			return null;
		}
		var string = data.stringValue;
		
		if (field.scalar_type == "ParsedURL") 
		{
			if (string.charAt(0) == "/")
			{
				if (string.charAt(1) != "/") {
					string = baseURL[page.URL].concat(string);
				} else {
					var h = "http:";
					string = h.concat(string);				
				}
			} 
	        else if (string.charAt(0) == "#")
			{
				string = page.URL + string;
			}
			else if (string.length > 1 && string.indexOf("http") == -1 && !field.absolute_url){
				string = string.trim();
				var beginIndex = page.URL.indexOf("://") + 3;
				string = page.URL.substring(0, page.URL.indexOf('/', beginIndex)+1) + string; 
			}
		}
		if (string.length > 1) getScalarStringCalledGotData++;
		return string;
	}

	function getCompositeObject(field,xpath,contextNode,page){
		var fieldParserEl = field.field_parser;
		var nodes;
		
		try {
			var evalXpath = makeRelativeXpath(xpath, contextNode, page);
			nodes = page.evaluate(evalXpath, contextNode, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);		
		} catch (e) {
			return null;
		}
		var size = nodes.snapshotLength;
		
		if (size === 0) {
			return null;
		}

		if (field.hasOwnProperty('field_parser')) {
			return null;
		} 

		var node = nodes.snapshotItem(0);

		if (node.textContent) {
			return node;
		}
		return null;
	}

	function getCollectionData(field,xpath,contextNode,page){
		var d = null;
		var fieldParserEl = field.field_parser;
		var nodes, g, generic_type_var;
		try {
			var evalXpath = makeRelativeXpath(xpath, contextNode, page);
			nodes = page.evaluate(evalXpath, contextNode, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);		
		} catch (e) {
			return null;
		}
		var size = nodes.snapshotLength;
		if (size === 0) {
			return null;
		}
		
		if (field.hasOwnProperty('field_parser')) {
			return null;
		} 	
		else if (field.kids.length > 0){
			d = [];
			var f = field.kids[0].composite;
			var kids = f.kids;
			
			for (var i = 0; i < size; i++) {
				var newNode = nodes.snapshotItem(i);
	            var obj = dataFromKids(kids,newNode,true,page);

				if (obj)
				{
					if (f.scope.resolved_generic_type_vars &&
							f.scope.resolved_generic_type_vars.length > 0) {
						for (g in f.scope.resolved_generic_type_vars){
							generic_type_var = f.scope.resolved_generic_type_vars[g];
							if (generic_type_var.name == f.type){
								obj.mm_name = generic_type_var.arg;
							}
						}
					}
					else if (f.type) {
						obj.mm_name = f.type;
					} 
					else {
						obj.mm_name = f.name;
					}
					if (obj.location) {
						obj.download_status = "UNPROCESSED";
					}
					d.push(obj);
				}
			}
		} 
		else if (size > 0) {
			d = [];
			for (var j = 0; j < size; j++) {
				var data = nodes.snapshotItem(j).textContent;
				
				data = data.trim();
				if (field.field_ops)
				{
					var fieldOp = field.field_ops[0];
					data = FieldOps.operate(data, fieldOp);
				}
				d.push(data);
			}
		}	
		
		if(field.hasOwnProperty('polymorphic_scope')){
			var polyd = [];
			for (var dataKey in d){
				var polydata = {};
				for (g in field.scope.resolved_generic_type_vars){
					generic_type_var = field.scope.resolved_generic_type_vars[g];
					if (generic_type_var.name == field.child_type){
						field.child_type = generic_type_var.arg;
					}
				}
				polydata[field.child_type] = d[dataKey];
				polyd.push(polydata);
			}
			return polyd;
		}	
		return d;
	}

	function concatValues(concatList, page){	
		var concatString = "";
		
		for (var i = 0; i < concatList.length; i++){
			var concat = concatList[i];
			if (concat.hasOwnProperty("from_scalar")){
				var fromScalar = concat.from_scalar;
				if (scalars[page.URL][fromScalar]){
					concatString = concatString + scalars[page.URL][fromScalar];
				}
			}
	        else if (concat.hasOwnProperty("constant_value") && concat.constant_value !== ""){
				var constantValue = concat.constant_value;
				concatString = concatString + constantValue;
			}
		}
	    return concatString;
	}

	/** checks if composite has any significant info */
	function isObjEmpty(o, page){
		if (o === null) {
			return true;
		}	
		var size = 0;
		var matches = 0;

		for (var x in o) {
			
			if (x == 'site_name' || x == "mm_name" || x == "download_status") {continue;}
			
			size++;
			if (upperLevel[page.URL].hasOwnProperty(x)) {
				//if the upperLevel[page.URL] has the same value as a property we deem it not significant
				if (o[x] == upperLevel[page.URL][x]) {
					matches++;
				}
				//or if the only the title is different, and it is just the page title we deem it not significant
				//we might want to include title with this 
				else if (x == "title" && o[x] == page.title) {
					matches++;
				}
			}
		}
		
		if (matches == size) {
			return true;
		}
		
		return false;
	}

	/** recursion recuires that scalars be evaluated first */
  	function sortKids(mmdKidsList) {
		var sortedList = [];
		if (mmdKidsList && mmdKidsList instanceof Array) {
			for (var i = 0; i < mmdKidsList.length; i++){
				if (mmdKidsList[i].scalar){
					sortedList.push(mmdKidsList[i]);
				}
			}
			for (var j = 0; j < mmdKidsList.length; j++){
				if (!mmdKidsList[j].scalar){
					sortedList.push(mmdKidsList[j]);
				}
			}
		}
		return sortedList;
  	}

	function secondaryExtractCallback(mmd, page){
		var md = extractMetadata(mmd, page);
		console.log(md);
	}

	var metadata = {};
	var page = response.entity;
	//Kade's code filters the URL here. I'm going to assume this is done earlier in the process
	var upperLevel = {}; //holds upperlevel metadata
	var scalars = {};
	var baseURL = {};
	var getScalarStringCalled = 0;
	var getScalarStringCalledGotData = 0;
	var upperXpath = {};
	var defVars = {};
	upperLevel[page.URL] = {}; //holds upperlevel metadata
	scalars[page.URL] = {};
	baseURL[page.URL] = "";
	upperXpath[page.URL] = {};

	baseURL[page.URL] = page.URL.substring(0, getPosition(page.URL,"/",3));

	var extractedMeta = { };
	var mmdKids = mmd.kids;
	mmdKids = sortKids(mmdKids);
	var contextNode = page;
	var type = mmd.type;
	var name = mmd.name;

	if (mmd.hasOwnProperty('def_vars')) {
		for (var i = 0; i < mmd.def_vars.length; i++) {
			if (typeof mmd.def_vars[i].xpaths !== 'undefined'){ //in case someone writes a wrapper and doesn't define an xpath
				var def = mmd.def_vars[i];
				var path = def.xpaths[0];
				var evalXpath = makeRelativeXpath(path, contextNode, page);
				var nodes = page.evaluate(evalXpath, page, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
				if (nodes.snapshotLength)
				{
					var n = def.name;
					var snap = nodes.snapshotItem(0);
					defVars[n] = snap;
				}
			}
		}
	}
    
    countXpaths(mmdKids, page);
    
	if (type) {
		extractedMeta[type] = dataFromKids(mmdKids,contextNode,true,page);
		extractedMeta[type].download_status = "DOWNLOAD_DONE";
		extractedMeta[type].mm_name = mmd.name;
	} else {
		extractedMeta[mmd.name] = dataFromKids(mmdKids,contextNode,true,page);
		extractedMeta[mmd.name].download_status = "DOWNLOAD_DONE";
		extractedMeta[mmd.name].mm_name = mmd.name;
	}

	unwrapped = BSUtils.unwrap(extractedMeta);
	unwrapped.location = response.location;
	unwrapped.additionalLocations = response.otherLocations;
	return extractedMeta;
}

// for use in Node:
if (typeof module == 'object') {
  module.exports = {
    extractMetadata: extractMetadata,
    extractMetadataSync: extractMetadataSync
  };
}
