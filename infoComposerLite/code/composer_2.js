function createCompositionVisual(file) {
	var composition = file.information_composition;
	simplDeserialize(composition);	
	//console.log(composition);
	
	var rootVisual = document.createElement('div');
		rootVisual.className = "compositionContainer";
		rootVisual.style.height = composition.height + "px";
		rootVisual.style.width = composition.width + "px";
	
	for(var i in composition.composition_space.kids) {
		var element = composition.composition_space.kids[i].composition_element;
		var visual = createElementVisual(element);
		rootVisual.appendChild(visual);
	}
	
	return rootVisual;
}

var INFO_COMPOSER_FONTS = [
	"Georgia, serif",
	"'Palatino Linotype', 'Book Antiqua', Palatino, serif",
	"'Times New Roman', Times, serif",
	"Arial, Helvetica, sans-serif",
	"'Arial Black', Gadget, sans-serif"
	];

function createElementVisual(element) {
	console.log(element);
	
	var extentTokens = element.extent.split(' ');
	
	var x = extentTokens[0]; 
	var y = extentTokens[1]; 
	var width = extentTokens[2]; 
	var height = extentTokens[3]; 
	
	var rootVisual = document.createElement('a');
		rootVisual.className = "compositionElement";
		rootVisual.style.height = height + "px";
		rootVisual.style.width = width + "px";
		rootVisual.style.top = y + "px";
		rootVisual.style.left = x + "px";
		
		
		
	if(element.image_clipping != null) {
		var metadata = element.image_clipping.compound_document;
		rootVisual.href = metadata.location;
		rootVisual.target = "_blank";
	}
		
	var visual = element.kids[0];
	//console.log(visual);
	if(visual.text_chunk_visual != null) {
		visual = visual.text_chunk_visual;
		
		if(visual.bgcolor != null)
			rootVisual.style.background = visual.bgcolor;
		
		for(var i in visual.kids){
			var tokenVisual = visual.kids[i].text_token_visual;
			//console.log(tokenVisual);
			
			var span = document.createElement('span');
				span.style.color = visual.text_color;
				span.style.fontSize = tokenVisual.named_style.font_size;				
				span.style.fontStyle = tokenVisual.named_style.font_style;
				//span.style.fontFamily = INFO_COMPOSER_FONTS[tokenVisual.named_style.face_index];
								
				span.innerText = tokenVisual.string;				
			rootVisual.appendChild(span);
		}
	}
	else if(visual.img_visual != null) {
		visual = visual.img_visual;
		//console.log(visual);
		var img = document.createElement('img');
			img.src = visual.image.location;				
			rootVisual.appendChild(img);
	}
	else {
		console.log(visual)
	}
	
	/*
	var imgVisual = document.createElement('img');
		imgVisual.src = element.clipping.media.location;


	rootVisual.appendChild(imgVisual);
*/	
	return rootVisual;
}
