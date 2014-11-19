/*global Image*/

var imagePairs = {
	"document" : "img/flair/document.png",
	"acm_portal" : "img/flair/document.png",
	"acm_portal_author" : "img/flair/person.png",
    "acm_portal_periodical" : "img/flair/journal.png",
	"amazon_product" : "img/flair/shopping.png",
	"unknown" : "img/flair/unknown.png"
};

var FlairMaster = {};

FlairMaster.preload = function(){
	for (var key in imagePairs){
		this.images[key] = new Image();
		this.images[key].src = imagePairs[key];
	}
};

FlairMaster.getFlairImage = function(metadataType)
{
	if(this.images[metadataType] !== undefined){
	   return this.images[metadataType];
	}
	else {
        return this.images.unknown;
    }
};

FlairMaster.images = {};
FlairMaster.preload();
