imagePairs = {
	"document" : "img/flair/document.png",
	"acm_portal" : "img/flair/document.png",
	"amazon_product" : "img/flair/shopping.png",
	"unknown" : "img/flair/unknown.png"
}

var FlairMaster = {};

FlairMaster.preload = function(){
	for (key in imagePairs){
		this.images[key] = new Image();
		this.images[key].src = imagePairs[key];
	}
}

FlairMaster.getFlairImage = function(metadataType)
{
	if(metadataType != null)
	{
		switch(metadataType)
		{
			case "unknown": 			return this.images[metadataType];
			
			case "acm_portal": 			return this.images[metadataType];
			
			case "document": 			return this.images[metadataType];
			
			case "amazon_product": 		return this.images[metadataType];
			
			default:					return this.images["unknown"];
		}
	}
	return this.images["unknown"];
}

FlairMaster.images = {};
FlairMaster.preload();
