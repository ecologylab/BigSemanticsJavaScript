
/*
 * Instantiating a BibTextGenerator sets the links to a csl sheet and language it should use.
 * To get bibtex
 * 1. use BibTexGEnerator.prototype.addClipping to add BibTexClippings to the list of clippings to get BibTex for
 * 2. call BibTexGenerator.prepareClippings() - this makes calls to bsService to fill in missing md/mmd as needed. This is also done synchronously and may take a while
 * either:
 *  	call BibTexGenerator.initCiteproc // may take awhile
 *  	call BibTexGenerator.getBibHTML - returns HTML output for your clippings.
 * or:
 *      call BibTextGenerator.getBibJSON - returns array of JSON objects with bibtex
 * or: 
 *      call BibTexGenerator.getBibString - returns string output for your clippings.

 * 
 */

function BibTexGenerator(cslLink, languageLink){
	this.citeprocStatus = 'uninitialized';
	this.clippingStatus = 'unstarted'
	this.cslLink = cslLink;
	this.languageLink = languageLink;
	this.cslName = cslName;
	if(!cslName){
		this.cslName = 'modern-language-association-with-url'
	}
	this.clippings = [];
	this.clippingsTotal = 0;
	this.clippingsFinished = 0;
	this.citeproc = null;
	this.HTML;
	this.bibString;
	this.metadataFromService = 0;
	this.metadataFromClippings = 0;
	this.mmdFromService = 0;
	this.mmdFromClippings = 0;

}




BibTexGenerator.prototype.addClipping = function(clipping){
	this.clippings.push(clipping);
	this.clippingsTotal = this.clippings.length;
	
}


/*
 * Functions for preppering clipppings
 */
BibTexGenerator.prototype.markReadyAndCheckIfDone = function(){
	this.clippingsFinished++;					 
	if(this.clippingsFinished == this.clippingsTotal){
		this.logCalls();
		this.clippingsToBib(metadataList, callback);
		this.clippingStatus = 'ready';
	}
}

BibTexGenerator.prototype.logCalls = function(){
	console.log("md From bs: " + this.metadataFromService.toString() + " md from clippings: " + this.metadataFromClippings.toString() 
			+ " mmd from bs: " + this.mmdFromService.toString() + " mmd from clippings: " + this.mmdFromClippings.toString()); 
}

BibTexGenerator.prototype.bibComparator = function(a,b){	
	try{
	var vala = a.author ? a.author : (a.title ? a.title :"");
	var valb = b.author ? b.author : (b.title ? b.title :"");
	return (vala.toUpperCase() < valb.toUpperCase() ? -1 : 1);
	}
	catch(e)
	{
		console.log("Error comparing error: " + e);
		return 1;
	}
	
}

BibTexGenerator.prototype.bibFromMmd = function(bib, mmd, metadata){
	for (var i = 0; i < mmd.kids.length; i++){
		var kidName;
		var kidType;
		var kid = mmd.kids[i];
		if(kid.collection){
			kidName = kid.collection.name;
			kidType = kid.collection.bibtex_field;
		}else if(kid.composite){
			kidName = kid.composite.name;
			kidType = kid.composite.bibtex_field;

		}else if(kid.scalar){
			kidName = kid.scalar.name;
			kidType = kid.scalar.bibtex_field;

		}
		if(kidType){
			if(!bib[kidType])
				bib[kidType] = metadata[kidName];
		}
	}
}

BibTexGenerator.prototype.createBib	= function(clipping){	
	try{
		var metadata = clipping.metadata;
		var mmd = clipping.mmd['meta_metadata'];
		var bib = {};
		bib.type   = mmd.bibtex_type;
		bib.id     = undefined;
		bib.title  = metadata.title ? metadata.title.trim() : "";
		bib.author = '';
		if(metadata.authors){
			bib.first_author  = metadata.authors ? metadata.authors[0].title : "";
		}
		bib.author = this.flattenAuthorArray(metadata.authors);
		bib.year    = metadata.year ? metadata.year : ( metadata.source ? metadata.source.year : metadata.filing_date );
		if(bib['year'])
		    bib['year']    = parseInt(bib['year']);

		//if no author, keep url, if url please strip http(s) and www(2/3/4)
		switch (bib['type'])
		{
			case 'misc':
			{
				BibTexGenerator.prototype.bibFromMmd(bib, mmd, metadata);
			  break;
			}
			case 'book':
			{
				// Required
				bib.publisher = metadata.publisher;			
				BibTexGenerator.prototype.bibFromMmd(bib, mmd, metadata);
				break;
			}
		  case 'article':
		  {
			  bib.type = "article-journal";
			  BibTexGenerator.prototype.bibFromMmd(bib, mmd, metadata);
			  bib['key']    = metadata.key; 
			  break;
		  }
		  case 'undefined':
		  {
		  	return [];	
		  }
		 
		}
		if(bib.author){
			bib['URL'] = undefined;
		}else{
			bib['URL'] = this.makeUrlReadable(bib['URL']); 

		}
		
		if( !bib.title && !bib.author){
		  return "";
		}
		else{
			 bib['id']  = this.generateBibId(bib); 
		  return bib;
		}
	}
	catch(e)
	{
		console.log("Error in creating bib entry for " + metadata + "error " + e);
	}
}



/*
	Assorted bib gen helpers
*/
/* Bib Creation helpers */
BibTexGenerator.prototype.generateBibId = function(bib )
{
	if(!bib )
		return "";
	try{	
	var title = "";
	var parts   = bib['title'].split(' ');
	for (var i =0; i < parts.length; i++){
		var word = parts[i].replace(/\W/g, "").toUpperCase();
		if( word != "" && (word != "AND") && (word != "THE") && (word != "A")){
			title = word;
			break;
		}
	}	
	var author = bib['first_author'];
	var year    = bib['year']? bib['year'] : '';
	if(!title && !author && !year )
		// return this.avoidIdCollision("notenoughinfo" , idHash);
		return "notenoughinfo";
	var tword = title;
	var aword = author ? author.split(' ')[author.split(' ').length -1 ] : '';
	var result = aword;
	result+= (aword && year) ? ":" + year : year;
	result+= result ? ":" + tword : tword;
	// result = this.avoidIdCollision(result , idHash);
	return result;
	}
	catch(e)
	{
		console.log("Error generatingBibId for " + bib + " error " + e);
		// return this.avoidIdCollision("notenoughinfo" , idHash);
		return 'notenoughinfo';
	}
	
}
//Given a bib, create a bibtex string for the bib
BibTexGenerator.prototype.createStringBibEntry = function(bib)
{
	if(!bib)
		return "";
	try{
	  var entry  = "@" + bib['type'] + "{ ";
		entry += bib['id'] + " , \n";	
		
		// These fields are unwanted after this point
		bib['id']           = undefined;
		bib['first_author'] = undefined;
		bib['type']         = undefined;
		
		var empty = true;
		for (field in bib){
			if( bib[field])
			{
				entry+= field + "= \"" + bib[field] + "\" , \n";
				empty = false;
			}
		}
		entry += "}\n\n";
	
		return empty ? '' : entry;
	}
	catch(e)
	{
		console.log("Error when creating string bibtex entry for " + JSON.stringify(bib) + " Error message " + e);
		return undefined; 
	}
};

BibTexGenerator.prototype.makeUrlReadable = function(url){
	//attempts to get rid of common url prefixes
	var newUrl = url.replace(/(.*?:\/\/)?(www[0-9]?\.)?/i, '');
	return newUrl;

// Detect id collision and alter id to avoid collision
	
BibTexGenerator.prototype.avoidIdCollision = function(result , idHash)
{
	count = 2;
	var id = result;
	while ( idHash[id] != undefined){
		id = result + count;
		count ++;
	}
	idHash[id] = id;
	return id;
}

BibTexGenerator.prototype.captureYear = function(metadata)
{
	if(!metadata)
		return "";
	try{
	var line = metadata.year ? metadata.year : (metadata.source ? (metadata.source.year ? metadata.source.year : metadata.source.date): metadata.filing_date);
	if (line){
		var res = line.match(/\d\d\d\d/);
		if (res)
			return res[0];
	}
  return "";
 }
 catch(e){
 		console.log("Error capturing year for error " + e);
		return "";
 }
}

BibTexGenerator.prototype.formatAuthor = function(author)
{
	if(!author)
		return "";
	var names = author.split(' ');
	
	var result = names[names.length-1] + ", ";
	result += names[0] ? names[0] : "";
	result += names[1] && names.length > 2 ? " " + names[1] : "";
	// result += result[result.length-1] == "." ? ", " : ".,";
	return result;
};

BibTexGenerator.prototype.retrieveSiteName = function(metadata){
	try{
	return new URL(metadata.location).hostname.replace(/^www./ , '');
	}
	catch(e)
	{
		console.log("Error retrieving SiteName " + e);
		return "";
	}
}



BibTexGenerator.prototype.clippingsToBib = function(){
	try{ 
		var bibsHash = {};
		var bibString = "";
		var idHash = {};
		for (var i = 0; i < this.clippings.length; i++) {
			var clipping = this.clippings[i];
			clipping.bibJSON = this.createBib(clipping);
			if(!(clipping.bibJSON.id in bibsHash)){ 
				 bibsHash[clipping.bibJSON.id] = "X";				 
			}else{
				clipping.bibJSON = null;			
			}
		 }
	}

	catch(e){
		console.log("Error gettign BibList error" + e); 
	}
}



BibTexGenerator.prototype.prepareClippings(){

	

	function howToProcess(clip){
		if(clipping.metadata && clipping.mmd){
			return 'ready';
		}else if(clipping.metadata){
			return 'mmd_from_metadata_name';
		}else if(clipping.link){
			return 'md_and_mmd_from_link';
		}
	}
	
	this.clippingStatus = 'in progress';
	for(i in this.clippings){
		(function(clipping){
			
			var whatToDo = howToProcess(clipping);
			switch(whatToDo){
			case 'ready':
				this.metadatFromClippings++;
				this.mmdFromClippings++;
				clipping.metadata = BSUtils.unwrap(clipping.metadata);
				clipping.mmd = BSUtils.unwrapMmd(clipping.mmd);
				this.markReadyAndCheckIfDone();
				break;
			case 'mmd_from_metadata_name':
				this.metadatFromClippings++;
				this.mmdFromService++;
				clipping.metadata = BSUtils.unwrap(clipping.metadata);
				bsService.loadMmd(metadata.mm_name, null, function(err, result){
					if(err){
						console.log('error getting mmd for bib');
					}
					else{		
						result = BSUtils.unwrap(result);
						clipping.mmd = BSUtils.unwrap(result);
					}
					this.markReadyAndCheckIfDone();
				});
				break;
			case 'md_and_mmd_from_link':
				this.metadataFromService++;
				this.mmdFromService++;
				bsService.loadMetadata(clipping.link, null, function(err, result){
					if(err){
						console.log(err);
					}else{
						clipping.mmd = BSUtils.unwrap(result.mmd);
						clipping.metadata = BSUtils.unwrap(result.metadata);
						clipping.metadata.bibtex_type = result.mmd.bibtex_type;
						
					}
					this.markReadyAndCheckIfDone();
				});
				break;
			default:
				console.log('following clipping in bonkers');
				console.log(clipping);
				this.markReadyAndCheckIfDone();
			}
	
		})(this.clippings[i]);

}


BibTexGenerator.prototype.initCiteproc = function(){
/*	var bibparser = new BibParser(session.composition);
	this.parseBibAsJSON(function(bibs){*/
	
	var citeprocSys = {
		    // Given a language tag in RFC-4646 form, this method retrieves the
		    // locale definition file.  This method must return a valid *serialized*
		    // CSL locale. (In other words, an blob of XML as an unparsed string.  The
		    // processor will fail on a native XML object or buffer).
		    retrieveLocale: function (lang){
		        var xhr = new XMLHttpRequest();
		        xhr.open('GET', (this.languageLink), false);
		        xhr.send(null);
		        return xhr.responseText;
		    },

		    // Given an identifier, this retrieves one citation item.  This method
		    // must return a valid CSL-JSON object.
		    retrieveItem: function(id){
		        return bibs[id];
		    }
		};
	function getProcessor(styleID) {
		    // Get the CSL style as a serialized string of XML
		    var xhr = new XMLHttpRequest();
		    xhr.open('GET', (this.cslLink), false);
		    xhr.send(null);
		    var styleAsText = xhr.responseText;
		    // Instantiate and return the engine
		    var citeproc = new CSL.Engine(citeprocSys, styleAsText);
		    return citeproc;
		};
		
		this.citeproc = getProcessor(this.cslName);
		this.status = 'citeproc'
		this.citeprocStatus = 'ready';
}

BibTexGenerator.prototype.getBibHTML = function(){
	 
	if(this.citeprocState != 'ready' && this.clippingStatus != 'ready'){
		throw "citeproc and clippings not initialized";
	}else if(this.citeprocState != 'ready' && this.clippingStatus == 'in progress')){
		throw "citeproc not initialized and clippings still loading";
	}else if(this.citeprocState == 'ready' && this.clippingStatus == 'unstarted'){
		throw "clipping metadata/mmd fetching not started";
	}else if(this.citeprocState == 'ready' && this.clippingStatus == 'in progress'){
		throw "clippings still loading";
	}
	
	var itemIDs = [];
    var bibs = [];
	bibs.sort(BibTexGenerator.prototype.bibComparator);

	for(var i = 0; i < this.clippings.length; i++){
		if(this.clippings[i].bibJSON){
			bibs.push(bibJSON);
		}
	}

	for (var i in bibs) {
	    itemIDs.push(bibs[i].id);
	}
	citeproc.updateItems(itemIDs);
	var bibResult = citeproc.makeBibliography();
	return bibResult[1].join('\n');
     
}

BibTexGenerator.prototype.getBibString = function(){
	if(this.clippingStatus == 'unstarted'){
		throw "clipping metadata/mmd fetching not started";
	}else if(this.clippingStatus == 'in progress'){
		throw "clippings still loading";
	}  
	var itemIDs = [];
    var bibs = [];
    bibs.sort(BibTexGenerator.prototype.bibComparator);

	for(var i = 0; i < this.clippings.length; i++){
		if(this.clippings[i].bibJSON){
			bibs.push(bibJSON);
		}
	}
	return this.prototype.bibToString(bibs);

}

	 
BibTexGenerator.prototype.bibToString = function(){
	if(this.clippingStatus == 'unstarted'){
		throw "clipping metadata/mmd fetching not started";
	}else if(this.clippingStatus == 'in progress'){
		throw "clippings still loading";
	}  
	var bibs = [];
	bibs.sort(BibTexGenerator.prototype.bibComparator);

    for(var i = 0; i < this.clippings.length; i++){
  	 if(this.clippings[i].bibJSON){
  		 bibs.push(bibJSON);
  	 }

	var bibString = "";
	for ( var key in bibs)
	{
		bibString += this.createStringBibEntry(bibs[key]);
	} 
	return bibString;
}

	 