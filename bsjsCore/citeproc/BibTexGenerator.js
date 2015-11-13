
/*
 * Instantiating a BibTextGenerator sets the links to a csl sheet and language it should use.
 * To get bibtex
 * 1. use BibTexGEnerator.prototype.addDocument to add BibTexDocuments to the list of documents to get BibTex for
 * either:
 *  	call BibTexGenerator.getBibHTML - returns HTML output for your documents.
 *      call BibTextGenerator.getBibJSON - returns array of JSON objects with bibtex
 *      call BibTexGenerator.getBibString - returns string output for your documents.
		each of these may take a while to process, so kindly pass them a callback function
 * 
 */

function BibTexGenerator(cslLink, languageLink, cslName, documents){
	this.citeprocStatus = 'uninitialized';
	this.documentStatus = 'unstarted'
	this.cslLink = cslLink;
	this.languageLink = languageLink;
	this.cslName = cslName;
	if(!cslName){
		this.cslName = 'modern-language-association-with-url'
	}
	this.documents = [];
	this.documentLocationDict = {};

	if(documents){
		this.documents = documents;
		for(var i = 0; i < documents.length; i++)
		{	
			this.documentLocationDict[documents[i].link] = 'X';
		}

	}
	this.documentsTotal = this.documents.length;
	this.documentsFinished = 0;
	this.citeproc = null;
	this.HTML;
	this.bibString;
	this.metadataFromService = 0;
	this.metadataFromDocuments = 0;
	this.mmdFromService = 0;
	this.mmdFromDocuments = 0;

}


BibTexGenerator.prototype.addClipping = function(clipping){
	
	var date = this.getClippingDate(clipping);
	
	
	if(clipping.metadata){
		if(clipping.metadata.source){
			if(date){
				clipping.metadata.source.clipping_created = date;
			}
			this.addDocument(new BibTexDocument(clipping.metadata.source.location, clipping.metadata.source.rawMetadata, null, clipping.metadata.source.clipping_created));

		}
		for (k in clipping.metadata.outlinks)
		 {
			if(clipping.metadata.outlinks[k].doc){
				if(date){
					clipping.metadata.outlinks[k].doc.clipping_created = date;
				}
				if(clipping.metadata.outlinks[k].doc.rawMetadata){
					this.addDocument(new BibTexDocument(clipping.metadata.outlinks[k].doc.location, clipping.metadata.outlinks[k].doc.rawMetadata, null, clipping.metadata.outlinks[k].doc.clipping_created));

				}else{
					this.addDocument(new BibTexDocument(clipping.metadata.outlinks[k].doc.location, null, null, clipping.metadata.outlinks[k].doc.clipping_created));

				}

			} 
		 }
	}

}

BibTexGenerator.prototype.addDocument = function(document){
	var that = this;
	if(that.documentLocationDict[document.link] != "X"){			
		
		
		function whenDone(that){
			if(that.documentStatus == 'ready'){
			
				that.documentLocationDict[document.link] = 'X';
				that.documents.push(document);
				that.documentsTotal = that.documents.length;
				that.documentsFinished = 0;
	
			}else{
				setTimeout(function(){
					whenDone(that);
				}, 500);
			}
			
		}
		if(this.documentStatus == 'in progress'){
			whenDone(that)
		}else{
			that.documentLocationDict[document.link] = 'X';
			this.documents.push(document);
			this.documentsTotal = this.documents.length;
			this.documentsFinished = 0;
	
			this.documentStatus = 'unstarted';
	
		}
	}
	
}


BibTexGenerator.prototype.initCiteproc = function(){
/*	var bibparser = new BibParser(session.composition);
	this.parseBibAsJSON(function(bibs){*/
	var that = this;
	var citeprocSys = {
		    // Given a language tag in RFC-4646 form, this method retrieves the
		    // locale definition file.  This method must return a valid *serialized*
		    // CSL locale. (In other words, an blob of XML as an unparsed string.  The
		    // processor will fail on a native XML object or buffer).
		    retrieveLocale: function (lang){
		        var xhr = new XMLHttpRequest();
		        xhr.open('GET', that.languageLink, false);
		        xhr.send(null);
		        return xhr.responseText;
		    },

		    // Given an identifier, this retrieves one citation item.  This method
		    // must return a valid CSL-JSON object.
		    retrieveItem: function(id){
		        for(var i = 0; i < that.bibs.length; i++){
		        	if(that.bibs[i].id == id){
		        		return that.bibs[i];
		        	}
		        }
		    	return {};
		    }
		};
	function getProcessor(styleID) {
		    // Get the CSL style as a serialized string of XML
		    var xhr = new XMLHttpRequest();
		    xhr.open('GET', styleID, false);
		    xhr.send(null);
		    var styleAsText = xhr.responseText;
		    // Instantiate and return the engine
		    var citeproc = new CSL.Engine(citeprocSys, styleAsText);
		    return citeproc;
		};
		
		this.citeproc = getProcessor(this.cslLink);
		this.status = 'citeproc'
		this.citeprocStatus = 'ready';
}

BibTexGenerator.prototype.getBibHTML = function(callback){
	
	function closurify(that, callback){
		var itemIDs = [];
	   
		for (var i in that.bibs) {
		    itemIDs.push(that.bibs[i].id);
		}
		that.citeproc.updateItems(itemIDs);
		var bibResult = that.citeproc.makeBibliography();
		callback( bibResult[1].join('\n'));
	}
	
	
	var that = this;

	function whenDone(that, callback){
		if(that.documentStatus == 'ready'){
			closurify(that, callback);

		}else{
			setTimeout(whenDone, 500);
		}
		
	}
	
	if(this.citeprocStatus != 'ready'){
		this.initCiteproc();
	}
	if(this.documentStatus == 'ready'){
		closurify(that, callback);

	}else if (this.documentStatus == 'in progress'){
			whenDone(that, callback);	
	}else{
		this.prepareDocuments(function(){
			closurify(that, callback);
		}, that);

	}
	
	
 
}

BibTexGenerator.prototype.getBibJSON = function(callback){
	function closurify(that, callback){
		callback(that.bibs);

	}
	var that = this;

	function whenDone(that, callback){
		if(that.documentStatus == 'ready'){
			closurify(that, callback);

		}else{
			setTimeout(function(){
				whenDone(that, callback);
			}, 500);		}
		
	}
	
	if(this.documentStatus == 'ready'){
		closurify(that, callback);

	}else if (this.documentStatus == 'in progress'){
		setTimeout(function(){
			whenDone(that, callback);
		}, 500);	}else{
		this.prepareDocuments(function(){
			closurify(that, callback);
		}, that);

	}
	
}

	 
BibTexGenerator.prototype.getBibString = function(callback){
	
	function closurify(that, callback){
	
		var bibString = "";
		for ( var key in that.bibs){
			bibString += that.createStringBibEntry(that.bibs[key]);
		} 
		callback(bibString);
	}
	var that = this;


	function whenDone(that, callback){
		if(that.documentStatus == 'ready'){
			closurify(that, callback);

		}else{
			setTimeout(function(){
				whenDone(that, callback);
			}, 500);
		}
		
	}
	
	if(this.documentStatus == 'ready'){
		closurify(that, callback);

	}else if (this.documentStatus == 'in progress'){
			whenDone(that, callback);	
	}else{
		this.prepareDocuments(function(){
			closurify(that, callback);
		}, that);

	}
}


	 




/*
 * Functions for preppering clipppings
 */
BibTexGenerator.prototype.markReadyAndCheckIfDone = function(that, callback){
	that.documentsFinished++;					 
	if(that.documentsFinished == that.documentsTotal){
		that.logCalls();
		that.documentsToBib(that);
		that.documentStatus = 'ready';
		that.bibs = [];

	    for(var i = 0; i < that.documents.length; i++){
		  	 if(that.documents[i].bibJSON){
		  		 that.bibs.push(that.documents[i].bibJSON);
		  	 }
	    }
		that.bibs.sort(that.bibComparator);

		callback();
	}
}

BibTexGenerator.prototype.logCalls = function(){
	console.log("md From bs: " + this.metadataFromService.toString() + " md from documents: " + this.metadataFromDocuments.toString() 
			+ " mmd from bs: " + this.mmdFromService.toString() + " mmd from documents: " + this.mmdFromDocuments.toString()); 
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
BibTexGenerator.prototype.flattenAuthorArray = function(authors, that){
	if(!authors)
		return "";
	try{
		var result = "";
		for (var i = 0; i < authors.length; i++)
		{
			result += that.formatAuthor(authors[i].title) + " and ";
		}
		var pos = result.lastIndexOf("and");
		result = result.slice(0 , pos);
		return result;
	}
	catch(e){
		console.log("Error flatteningAuthor Array " + authors + "error " + e);
		return "";
	}
};

BibTexGenerator.prototype.createBib	= function(document, that){	
	try{
		var metadata = document.metadata;
		if(document.mmd == 'skip'){
			return {};
		}
		var mmd = document.mmd['meta_metadata'];
		if(!mmd){
			mmd = document.mmd;
		}
		var bib = {};
		bib.type   = mmd.bibtex_type;
		bib.id     = undefined;
		bib.title  = metadata.title ? metadata.title.trim() : "";
		bib.author = '';
		if(metadata.authors){
			bib.first_author  = metadata.authors ? metadata.authors[0].title : "";
		}
		bib.author = that.flattenAuthorArray(metadata.authors, that);
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
			bib['URL'] = that.makeUrlReadable(bib['URL']); 

		}
		if(!bib.title){
		  return "";
		}
		else{
			 bib['id']  = that.generateBibId(bib); 
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
	var bibC = jQuery.extend(true, {}, bib);

	if(!bibC)
		return "";
	try{
	  var entry  = "@" + bibC['type'] + "{ ";
		entry += bibC['id'] + " , \n";	
		
		// These fields are unwanted after this point
		bibC['id']           = undefined;
		bibC['first_author'] = undefined;
		bibC['type']         = undefined;
		
		var empty = true;
		for (field in bibC){
			if( bibC[field])
			{
				entry+= field + "= \"" + bibC[field] + "\" , \n";
				empty = false;
			}
		}
		entry += "}\n\n";
	
		return empty ? '' : entry;
	}
	catch(e)
	{
		console.log("Error when creating string bibtex entry for " + JSON.stringify(bibC) + " Error message " + e);
		return undefined; 
	}
};

BibTexGenerator.prototype.makeUrlReadable = function(url){
	//attempts to get rid of common url prefixes
	var newUrl = url.replace(/(.*?:\/\/)?(www[0-9]?\.)?/i, '');
	return newUrl;
}
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
}

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



BibTexGenerator.prototype.documentsToBib = function(that){
	try{ 
		var bibsHash = {};
		var bibString = "";
		var idHash = {};
		for (var i = 0; i < that.documents.length; i++) {
			var document = that.documents[i];
			document.bibJSON = that.createBib(document, that);
			
			if(!(document.bibJSON.id in bibsHash)){ 
				 bibsHash[document.bibJSON.id] = "X";				 
			}else{
				document.bibJSON = null;			
			}
		 }
	}

	catch(e){
		console.log("Error gettign BibList error" + e); 
	}
}



BibTexGenerator.prototype.prepareDocuments = function(callback, that){


	function howToProcess(clip){
		if(clip.metadata && clip.mmd){
			return 'ready';
		}else if(clip.metadata){
			return 'mmd_from_metadata_name';
		}else if(clip.link){
			return 'md_and_mmd_from_link';
		}
	}
	
	that.documentStatus = 'in progress';
	for(i in that.documents){
		(function(document){
			
			var whatToDo = howToProcess(document);
			switch(whatToDo){
			case 'ready':
				that.metadatFromDocuments++;
				that.mmdFromDocuments++;
				document.metadata = BSUtils.unwrap(document.metadata);
				document.mmd = BSUtils.unwrapMmd(document.mmd);
				if(document.createdDate){
					document.metadata.accessed = document.createdDate;

				}
				that.markReadyAndCheckIfDone(that, callback);
				break;
			case 'mmd_from_metadata_name':
				that.metadatFromDocuments++;
				that.mmdFromService++;
				document.metadata = BSUtils.unwrap(document.metadata);
				var mdname = document.metadata.meta_metadata_name;
				if(!mdname){
					mdname =	document.metadata.mm_name
				}

				bsService.loadMmd(mdname, null, function(err, result){
					if(err){
						console.log('error getting mmd for bib');
						document.mmd = 'skip';
					}
					else{		
						result = BSUtils.unwrap(result);
						document.mmd = BSUtils.unwrap(result);
					}
					if(document.createdDate){
						document.metadata.accessed = document.createdDate;

					}
					that.markReadyAndCheckIfDone(that, callback);
				});
				break;
			case 'md_and_mmd_from_link':
				that.metadataFromService++;
				that.mmdFromService++;
				bsService.loadMetadata(document.link, null, function(err, result){
					if(err){
						console.log(err);
						document.mmd = 'skip';

					}else{
						document.mmd = BSUtils.unwrap(result.mmd);
						document.metadata = BSUtils.unwrap(result.metadata);
						document.metadata.bibtex_type = result.mmd.bibtex_type;
						if(document.createdDate){
							document.metadata.accessed = document.createdDate;

						}
						
					}
					that.markReadyAndCheckIfDone(that, callback);
				});
				break;
			default:
				console.log('following document in bonkers');
				console.log(document);
				that.markReadyAndCheckIfDone(that, callback);
			}
	
		})(that.documents[i]);
	}
}
BibTexGenerator.prototype.getClippingDate = function(element){
	if(!element)
		return;
	try{
	var acts = element.creativeActs;
	var creation_time = undefined;
	for( var i = 0; i < acts.length; i++){
		if( acts[i].action == 1)
		{
			creation_time = new Date(acts[i].time);
			break;
		}
	}
	if( creation_time )
		return creation_time.toDateString().substr(4); // Hacky
	else
		return undefined;
	}
	catch(e)
	{
		console.log("Error getting clipping date from element error" + e);
		return undefined;
	}
	
	
};

