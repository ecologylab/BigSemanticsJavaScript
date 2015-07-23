	

/*
 * extracts metadata from metametadata
 * 
 * @param mmd, meta-metadata object
 */
function extractMetadata(mmd, page) {
    
	if (mmd.hasOwnProperty('filter_location')){
		page.URL = PreFilter.filter(page.URL, mmd.filter_location);
	}
	
    upperLevel[page.URL] = {}; //holds upperlevel metadata
    scalars[page.URL] = {};
    baseURL[page.URL] = "";
    upperXpath[page.URL] = {};
    
    baseURL[page.URL] = page.URL.substring(0,getPosition(page.URL,"/",3));
	
    var extractedMeta = { };
	mmdKids = mmd.kids;
	mmdKids = sortKids(mmdKids);
	var contextNode = page;
	var type = mmd.type;
	var name = mmd.name;
	
	if (mmd.hasOwnProperty('def_vars')) 
	{
		for (var i = 0; i < mmd.def_vars.length; i++) {
			if (typeof mmd.def_vars[i].xpaths !== 'undefined'){ //in case someone writes a wrapper and doesn't define an xpath
				var def = mmd.def_vars[i];
				var path = def.xpaths[0];
				var nodes = page.evaluate(path, page, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
				if (nodes.snapshotLength !== null)
				{
					var n = def.name;
					var snap = nodes.snapshotItem(0);
					defVars[n] = snap;
				}
			}
		}
	}
    
    countXpaths(mmdKids, page);
    
	if (type !== undefined) 
	{
		extractedMeta[type] = dataFromKids(mmdKids,contextNode,true,null,page);
		extractedMeta[type].download_status = "DOWNLOAD_DONE";
		extractedMeta[type].mm_name = mmd.name;
	} else {
		extractedMeta[name] = dataFromKids(mmdKids,contextNode,true,null,page);
		extractedMeta[name].download_status = "DOWNLOAD_DONE";
		extractedMeta[name].mm_name = mmd.name;
	}
    //getScalarStringCalled is helpful for analyzing run time
    //console.log(getScalarStringCalled);
	//console.log(getScalarStringCalledGotData);
	return extractedMeta;
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
        name = field.name;
        if ('xpaths' in field){
            upperXpath[page.URL][name] = field.xpaths;
        }
        else {
            upperXpath[page.URL][name] = [];
        }
    }
}

