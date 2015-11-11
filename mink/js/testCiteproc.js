var gen = new BibTexGenerator('./modern-language-association-with-url.csl', './locales-en-us.xml');

function favesToClippings(){
	var faves = minkApp.favorites;
	for(var i = 0; i < faves.length; i++){
		var link = faves[i].url;
		var metadata = null;
		if (link.startsWith('mink::')){
			metadata = Mink.minklinkToMetadataMap.get(link);
		}
		var clipping = new BibTexClipping(link, metadata);
		gen.addClipping(clipping);
	}
}

function gimmeHTML(){
	gen.getBibHTML(useHTML);
}

function useHTML(html){
	console.log(html);
}