
var compositionHeight = 0;
var compositionWidth = 0;

function createCompositionVisual(file) {
	var composition = file.information_composition;
	simplDeserialize(composition);
	
	var rootVisual = document.createElement('div');
		rootVisual.className = "compositionContainer";
		rootVisual.style.height = composition.height + "px";
		rootVisual.style.width = composition.width + "px";
	
	compositionWidth = composition.width;
	compositionHeight = composition.height;
	
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
	//console.log(element);
	
	var extentTokens = element.extent.split(' ');
	
	var extent = {
			x: extentTokens[0],
			y: extentTokens[1],
			width: extentTokens[2],
			height: extentTokens[3]
		};
	
	var rootVisual = document.createElement('a');
		rootVisual.className = "compositionElement";
		rootVisual.style.height = extent.height + "px";
		rootVisual.style.width = extent.width + "px";
		rootVisual.style.top = extent.y + "px";
		rootVisual.style.left = extent.x + "px";
	
		
		
		
	if(element.image_clipping != null) {
		var metadata = element.image_clipping.compound_document;
		
		//if(metadata != null && metadata.location != null)
			rootVisual.href = metadata.location;
		
		rootVisual.target = "_blank";
		
		rootVisual.appendChild(createInContextMetadata(extent, metadata));
	}
	else if(element.annotation != null) {
		var metadata = element.annotation;
		
		//if(metadata != null && metadata.location != null)
			rootVisual.href = metadata.location;
		
		rootVisual.target = "_blank";
		
		rootVisual.appendChild(createInContextMetadata(extent, metadata));
	}
	else
		console.log(element);
	
		
	var visual = element.kids[0];
	//console.log(visual);
	if(visual.text_chunk_visual != null) {
		visual = visual.text_chunk_visual;
		
		if(visual.bgcolor != null)
			rootVisual.style.background = visual.bgcolor;
		
		var annotation = document.createElement('div');
			annotation.className = "annotation";	
		
		for(var i in visual.kids){
			var tokenVisual = visual.kids[i].text_token_visual;
			//console.log(tokenVisual);
			
			var span = document.createElement('span');
				span.style.color = visual.text_color;
				span.style.fontSize = tokenVisual.named_style.font_size;				
				span.style.fontStyle = tokenVisual.named_style.font_style;
				//span.style.fontFamily = INFO_COMPOSER_FONTS[tokenVisual.named_style.face_index];
								
				span.innerText = tokenVisual.string;				
			annotation.appendChild(span);
		}
		
		rootVisual.appendChild(annotation);
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
	
	return rootVisual;
}

function createInContextMetadata(extent, metadata) {
	//console.log(metadata)
	var visual = document.createElement('div');
		visual.className = "incontextMetadata";
		visual.style.top = '0px';
	
	var leftSide = extent.x;
	var rightSide = compositionWidth - extent.x - extent.width;
	
	//console.log(compositionWidth+" "+extent.x+" "+ extent.width+" "+rightSide);
	
	if(leftSide > rightSide) {
		visual.style.left = '-400px';
		if(leftSide < 400) {
			visual.style.left = '-'+ leftSide +'px';
			visual.style.width = leftSide;
		}
	}
	else {
		visual.style.left = extent.width + 'px';
		if(rightSide < 400) {
			visual.style.width = rightSide;
		}
	}
	
	var table = document.createElement('table');
		table.className = "metadataView";
	
	metadata = sortMetadata(metadata);
	
	
	for(var key in metadata) {
		
		//console.log(key);
		
		if((key != "root_document" && key != "clippings" && key != "mm_name")
			&& (typeof key == "string") ) {
				
			var row = document.createElement('tr');
			var nameCol = document.createElement('td');
			var valueCol = document.createElement('td');
			
			if(key == "title") {					
				var titleValue = document.createElement('span');
					titleValue.className = "metadata_h1";
					titleValue.innerText = metadata.title;	
					
				var domainSpan = document.createElement('span');
					domainSpan.className = "domainSpan";
					
				if(metadata.location != null) 	
					domainSpan.innerText = getURLDomain(metadata.location);
													
				var titleCol = document.createElement('td');	
					titleCol.colSpan = 2;
								
				titleCol.appendChild(titleValue);
				titleCol.appendChild(domainSpan);
					
				row.appendChild(titleCol);
			}
			else {
				if(metadata[key] != null) {
					var fieldLabel = document.createElement('span');
						fieldLabel.className = "fieldLabel";
						fieldLabel.innerText = toDisplayCase(key);
					
					nameCol.appendChild(fieldLabel);
				}
				
				var fieldValue = document.createElement('span');
					fieldValue.className = "fieldValue";
					fieldValue.innerText = metadata[key];						
					
				valueCol.appendChild(fieldValue);
				
				row.appendChild(nameCol);
				row.appendChild(valueCol);
			}
			table.appendChild(row);
		}
		
	}
	
	visual.appendChild(table);
	return visual;
		
}

function toDisplayCase(string) {
	var strings = string.split('_');
	var display = "";
	for( var s in strings) {
		display += strings[s].charAt(0).toUpperCase() + strings[s].slice(1) + " ";
	}
	return display;
}

function getURLDomain(url) {
	return url.match(/:\/\/(www\.)?(.[^/:]+)/)[2];
}

function sortMetadata(metadata) {
	var newMetadata = {};
	
	//title first
	for(var key in metadata) {
		if(key == "title")
			newMetadata[key] = metadata[key];
		
		delete metadata.key;
	}
	
	//everything else
	for(var key in metadata) 
		newMetadata[key] = metadata[key];
	
	return newMetadata;
}

function simplDeserialize(simplObj)
{
var simplReferences = [];
var simplId = "simpl.id";
var simplRef = "simpl.ref";
var idCount = 0;
var refCount = 0;

	function recurse(currentObj, parentObj, parentFieldName, level)
	{
		var skipRecursion = false;

		////console.info("recursing[" + level + "] Parent and currentObj:"); //Too detailed prints.
		//console.log(parentObj);
		//console.log(currentObj);
		
		
		if(simplId in currentObj)
		{
			//console.info(parentFieldName + " ------------ Adding ref: " + currentObj[simplId] + " [" + ++idCount +"]");
			simplReferences[currentObj[simplId]] = currentObj;
			delete currentObj[simplId];
		}
		
		else if(simplRef in currentObj)
		{
			var ref = currentObj[simplRef];
			if(ref in simplReferences)
			{
				//console.info(parentFieldName + "---------- Resolving Ref: " + ref + " [" + ++refCount +"]");
				//Replace field in the parent with the simplRef
				if(parentObj instanceof Array) //Never happens?
				{
					//console.info("parentObj is an Array!");
					var index = parentObj.indexOf(currentObj)
					if(index == -1)
					{
						//console.info("Item not found in parent!");
					}
					else
					{
						//console.info("Replacing item at index: " + index);
						parentObj[index] = simplReferences[ref];
					}					
				}
				else
				{
					//console.info("Replacing item with name: " + parentFieldName + " with reference" + ref);
					parentObj[parentFieldName] = simplReferences[ref];
				}
			}
			else 
				//console.info("No Such Reference: " + ref);
				
			skipRecursion = true;
		}

		if(!skipRecursion)
		{
			for(var fieldName in currentObj)
			{
				if(!currentObj.hasOwnProperty(fieldName))
				{
					//console.info("Found shitty props");
					continue;
				}
				var field = currentObj[fieldName];
				if(field instanceof Array)
				{
					for(var i = 0; i < field.length; i++)// arrayItem in field)
					{
						recurse(field[i], field, fieldName, level + 1);
					}
				}
				else if(field instanceof Object)
				{
					recurse(field, currentObj, fieldName, level + 1);
				}
			}
		}
	}
	
    recurse(simplObj, null, null, 0);
}

//End of SimplDeserialize






