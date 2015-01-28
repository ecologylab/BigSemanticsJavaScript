var clippingMap = [];
var mediaMap = [];

function InformationComposition(obj) {
	if(obj["version"] != null)
		this.version = obj["version"];
	
	this.metadataVersion = obj["metadata_version"];
	this.height = obj["height"];
	this.width = obj["width"];
	
	this.metadata = loadMetadata(obj["metadata"]);
	this.annotations = loadAnnotations(obj["annotations"]);
	this.elements = loadElements(obj["composition_space"]["kids"]);
}

function ImageClipping(obj) {
	this.simplId = obj["simpl:id"];	
	
	clippingMap[this.simplId] = this;
	
	this.caption = obj["caption"];
	
	if(obj["outlink"] != null)
		this.outlink = new Document(obj["outlink"]);
	
	if(obj["compound_document"] != null)
		this.doc = new Document(obj["compound_document"]);
		
	this.media = new ImageMedia(obj["image"]);
}

function Document(obj) {
	if(obj["compound_document"] != null)
		obj = obj["compound_document"];
	else if(obj["image"] != null)
		obj = obj["image"];
	
	this.location = obj["location"];
}

function ImageMedia(obj) {
	this.simplId = obj["simpl:id"];
	
	mediaMap[this.simplId] = this;
	
	this.location = obj["location"];
	this.height = obj["height"];
	this.width = obj["width"];
	
	var isInRef = obj["clippings_this_is_in"]["image_clipping"]["simpl:ref"];
	this.belongsTo = clippingMap[isInRef];
}

function loadMetadata(obj) {
	var metadata = [];
	for(i in obj) {
		console.log(obj[i]);
		var clipping = obj[i]["image_clipping"];
		console.log(clipping);
		var imageClipping = new ImageClipping(clipping);
		metadata.push(imageClipping);
	}
	return metadata;
}

function loadAnnotations(obj) {
	var annotations = [];
	for(i in obj["annotation"]) {
		var annotation = obj["annotation"][i];
		annotations.push(new Annotation(annotation));
	}
	return annotations;
}

function loadElements(obj) {
	var elements = [];
	for(i in obj) {
		var ele = obj[i]["composition_element"];
		var element = new CompositionElement(ele);
		elements.push(element);
	}
	return elements;
}

function Annotation(obj) {
	this.author = obj["author"];
	this.creationTime = obj["creation_time"];
	this.simplId = obj["simple.id"];
	this.text = obj["text"];
	
	clippingMap[this.simplId] = this;
}

function CompositionElement(obj) {
	this.extent = new Extent(obj["extent"]);	
	var clipRef = "";
	if(obj["image_clipping"] != null)
		clipRef = obj["image_clipping"]["simpl:ref"];
	else if(obj["annotation"] != null)
		clipRef = obj["annotation"]["simpl:ref"];
		
	this.clipping = clippingMap[clipRef];
}

function Extent(string) {
	var tokens = string.split(' ');
	this.x = tokens[0]; 
	this.y = tokens[1]; 
	this.width = tokens[2]; 
	this.height = tokens[3]; 
}

function createCompositionVisual(file) {
	console.log(file.information_composition);
	var composition = new InformationComposition(file.information_composition);
	console.log(composition);
	var rootVisual = document.createElement('div');
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

	var imgVisual = document.createElement('img');
		imgVisual.src = element.clipping.media.location;

	rootVisual.appendChild(imgVisual);
	
	return rootVisual;
}







