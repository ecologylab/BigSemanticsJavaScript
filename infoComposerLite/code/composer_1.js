var clippingMap = [];
var mediaMap = [];

function constructComposition(file) {
	var composition = new InformationComposition(file.information_composition);
	return composition
}


function InformationComposition(obj) {
	this.version = obj["-version"];
	this.metadataVersion = obj["-metadata_version"];
	this.height = obj["-height"];
	this.width = obj["-width"];
	
	this.metadata = loadMetadata(obj["metadata"]);
	this.elements = loadElements(obj["composition_space"]["kids"]);
}

function ImageClipping(obj) {
	this.simplId = obj["-simpl:id"];
	
	clippingMap[this.simplId] = this;
	
	this.caption = obj["-caption"];
	this.outlink = new Document(obj["outlink"]);
	this.media = new ImageMedia(obj["media"]["image"]);
}

function Document(obj) {
	if(obj["compound_document"] != null)
		obj = obj["compound_document"];
	else if(obj["image"] != null)
		obj = obj["image"];
	
	this.location = obj["-location"];
}

function ImageMedia(obj) {
	this.simplId = obj["-simpl:id"];
	
	mediaMap[this.simplId] = this;
	
	this.location = obj["-location"];
	this.height = obj["-height"];
	this.width = obj["-width"];
	
	var isInRef = obj["clippings_this_is_in"]["image_clipping"]["-simpl:ref"];
	this.belongsTo = clippingMap[isInRef];
}

function loadMetadata(obj) {
	var metadata = [];
	for(i in obj.image_clipping) {
		var clipping = obj.image_clipping[i];
		
		var imageClipping = new ImageClipping(clipping);
		metadata.push(imageClipping);
	}
	return metadata;
}

function loadElements(obj) {
	var elements = [];
	for(i in obj.composition_element) {
		var ele = obj.composition_element[i];
		
		var element = new CompositionElement(ele);
		elements.push(element);
	}
	return elements;
}

function CompositionElement(obj) {
	this.extent = new Extent(obj["-extent"]);
	
	var clipRef = "";
	if(obj["image_clipping"] != null)
		clipRef = obj["image_clipping"]["-simpl:ref"];
		
	this.clipping = clippingMap[clipRef];
}

function Extent(string) {
	var tokens = string.split(' ');
	this.x = tokens[0]; 
	this.y = tokens[1]; 
	this.width = tokens[2]; 
	this.height = tokens[3]; 
}

function createCompositionVisual(composition) {
	var rootVisual = document.getElementById("compositionSpace");
		rootVisual.className = "compositionContainer";
		rootVisual.style.height = composition.height + "px";
		rootVisual.style.width = composition.width + "px";
	
	for(var i in composition.elements) {
		var element = composition.elements[i];
		
		var visual = createElementVisual(element);
		rootVisual.appendChild(visual);
	}
	
	return rootVisual;
}

function createElementVisual(element) {
	var rootVisual = document.createElement('div');
		rootVisual.className = "compositionElement";
		rootVisual.style.height = element.extent.height + "px";
		rootVisual.style.width = element.extent.width + "px";
		rootVisual.style.top = element.extent.y + "px";
		rootVisual.style.left = element.extent.x + "px";
	
	//console.log(element.clipping);
	//console.log(typeof element.clipping);
	//if(element.clipping === "ImageClipping") {
		var imgVisual = document.createElement('img');
			imgVisual.src = element.clipping.media.location;
		//console.log("ASGSDFASDFSDF");
		rootVisual.appendChild(imgVisual);
	//}
	
	return rootVisual;
}







