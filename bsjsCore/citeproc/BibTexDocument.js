
/*
 * BibTexDocuments are passed to a BibTexGenerator
 * The generator will prefer to use local metadata over request metadata for the link - same goes for mmd
 * 
 * 
 * 
 * 
 */

function BibTexDocument(link, metadata, mmd, createdDate){
	this.link = null;
	this.createdDate = createdDate;
	if(link){
		this.link = link;
	}
	this.metadata = null;
	if(metadata){
		this.metadata = metadata;
	}
	this.mmd = null;
	if(mmd){
		this.mmd = mmd;
	}
	this.bibJSON = null;
}