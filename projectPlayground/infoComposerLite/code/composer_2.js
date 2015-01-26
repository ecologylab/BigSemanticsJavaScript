
var compositionHeight = 0;
var compositionWidth = 0;

function createCompositionVisual(file) {
	var composition = file.information_composition;
	simplDeserialize(composition);
	
	var rootVisual = document.createElement('div');
		rootVisual.className = "compositionContainer";
		rootVisual.style.height = composition.height + "px";
		rootVisual.style.width = composition.width + "px";
	
	rootVisual.onmousemove = onMouseMove;
	rootVisual.onmouseup = onMouseUp;
	
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
		
	rootVisual.onmousedown = startMoving;
		
	var overlay = createOverlay(element, extent);
			
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
	
	if(element.image_clipping != null) {
		var metadata = element.image_clipping.compound_document;		
		rootVisual.appendChild(createInContextMetadata(extent, metadata));
	}
	else if(element.annotation != null) {
		var metadata = element.annotation;		
		rootVisual.appendChild(createInContextMetadata(extent, metadata));
	}
	
	rootVisual.appendChild(overlay);
	
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

function createOverlay(element, extent) {
	var overlay = document.createElement('div');
		overlay.className = "overlay";
		
	// navigate button
	var navigationButton = document.createElement('a');
		navigationButton.className = "button";
		navigationButton.style.background = "green";
		navigationButton.style.top = (extent.height - 15) + "px";
		navigationButton.style.left = ((extent.width / 2) - 15) + "px";
		
	if(element.image_clipping != null) {
		var metadata = element.image_clipping.compound_document;
		navigationButton.href = metadata.location;
		navigationButton.target = "_blank";
		
		overlay.appendChild(navigationButton);
	}
	else if(element.annotation != null) {
		var metadata = element.annotation;
		navigationButton.href = metadata.location;
		navigationButton.target = "_blank";
		
		overlay.appendChild(navigationButton);
	}
	else
		console.log(element);
	
	// delete button
	var deleteButton = document.createElement('div');
		deleteButton.className = "button";
		deleteButton.style.background = "red";
		deleteButton.style.top = (0 - 15) + "px";
		deleteButton.style.left = (extent.width - 15) + "px";
		
		deleteButton.onclick = deleteElement;
		overlay.appendChild(deleteButton);
		
	// opacity button
	var opacityButton = document.createElement('div');
		opacityButton.className = "button";
		opacityButton.style.background = "yellow";
		opacityButton.style.top = ((extent.height / 2) - 15) + "px";
		opacityButton.style.left = (extent.width - 15) + "px";
		
		opacityButton.onmousedown = startBlending;
		overlay.appendChild(opacityButton);
	
	// resize button
	var resizeButton = document.createElement('div');
		resizeButton.className = "button";
		resizeButton.style.background = "blue";
		resizeButton.style.top = (extent.height  - 15) + "px";
		resizeButton.style.left = (extent.width - 15) + "px";
		
		resizeButton.onmousedown = startResize;
		overlay.appendChild(resizeButton);
		
	// rotate button
	var rotateButton = document.createElement('div');
		rotateButton.className = "button";
		rotateButton.style.background = "purple";
		rotateButton.style.top = (extent.height - 15) + "px";
		rotateButton.style.left = (0 - 15) + "px";
		
		rotateButton.onmousedown = startRotate;
		overlay.appendChild(rotateButton);
		
	return overlay;
	
}
var isMoving = false;
var isRotating = false;
var isResizing = false;
var isOpacitizing = false;

var targetElement = null;
var startX = 0;
var startY = 0;

var startAngle = 0;
var initialAngle = 0;

var startOpacity = 0;

// handle the stopping of moving, resizing, rotating, and opacity
function onMouseUp(event) {
	if(targetElement != null) {
		resizeChildren(targetElement, parseInt(targetElement.style.width), parseInt(targetElement.style.height));
		showMetadata(targetElement);
	}
	
	stopAllActions();
}

function onMouseMove(event) {
	if(targetElement != null) {
		// moving
		if(isMoving) {
			var nX = event.pageX - startX;
			var nY = event.pageY - startY;
			
			targetElement.style.left = nX + "px";
			targetElement.style.top = nY + "px";
		}
				
		// resizing
		else if(isResizing) {
			var dX = event.pageX - startX;
			var dY = event.pageY - startY;
			
			var nW = (parseInt(targetElement.style.width) + dX)
			var nH = (parseInt(targetElement.style.height) + dY)
				
			targetElement.style.width = nW + "px";
			targetElement.style.height = nH + "px";
			
			resizeChildren(targetElement, nW, nH);
			
			startX = event.pageX;
			startY = event.pageY;
		}
		
		// rotating
		else if(isRotating) {
			var currentAngle = Math.atan2(event.pageX, event.pageY);
			var newAngle = initialAngle + (currentAngle - startAngle);
			
			targetElement.style.mozTransform = "rotate(" + newAngle + "rad)";
			targetElement.style.webkitTransform = "rotate(" + newAngle + "rad)";
			//console.log(targetElement.style);
			
			startX = event.pageX;
			startY = event.pageY;
		}
		
		// opacity
		else if(isOpacitizing) {
			var dX = event.pageX - startX;
			
			var newOpacity = startOpacity - (dX / 400);
			console.log(startOpacity);
			console.log(newOpacity);
			targetElement.style.opacity = newOpacity;
		}
	}
}

function deleteElement(event) {
	stopAllActions();
	var child = event.toElement.parentElement.parentElement;
	var parent = child.parentElement;
	parent.removeChild(child);
	event.stopPropagation();
}

function startMoving(event) {
	//console.log(event);
	stopAllActions();
	isMoving = true;
	targetElement = event.toElement.parentElement;
	//console.log("starting move");
	event.stopPropagation();
	
	startX = event.pageX - parseInt(targetElement.style.left);
	startY = event.pageY - parseInt(targetElement.style.top);
	
	hideMetadata(targetElement);
}

function startBlending(event) {
	console.log("hey");
	stopAllActions();
	isOpacitizing = true;
	targetElement = event.toElement.parentElement.parentElement;
	console.log("starting opacity");
	event.stopPropagation();
	
	startX = event.pageX;
	startY = event.pageY;
	
	hideMetadata(targetElement);
	
	startOpacity = 1.0;
	if(targetElement.style.opacity != null && targetElement.style.opacity != "")
		startOpacity = targetElement.style.opacity;	
}

function startResize(event) {
	stopAllActions();
	isResizing = true;
	targetElement = event.toElement.parentElement.parentElement;
	console.log("starting resize");
	//console.log(targetElement);
	event.stopPropagation();
	
	startX = event.pageX;
	startY = event.pageY;
	
	hideMetadata(targetElement);
}

function startRotate(event) {
	stopAllActions();
	isRotating = true;
	targetElement = event.toElement.parentElement.parentElement;
	//console.log("starting rotate");
	event.stopPropagation();
	
	startX = event.pageX;
	startY = event.pageY;
	
	startAngle = Math.atan2(startX, startY);
	
	if(targetElement.style.webkitTransform != null)
		initialAngle = targetElement.style.webkitTransform;
	else if(targetElement.style.mozTransform != null)
		initialAngle = targetElement.style.mozTransform;
	else
		initialAngle = 0;
	
	hideMetadata(targetElement);
}

function stopAllActions() {
	targetElement = null;	
	isMoving = false;
	isRotating = false;
	isResizing = false;
	isOpacitizing = false;
	
	startX = 0;
	startY = 0;
	startAngle = 0;
}

function resizeChildren(element, width, height) {
	var extent = {
			x: parseInt(element.style.left),
			y: parseInt(element.style.top),
			width: parseInt(element.style.width),
			height: parseInt(element.style.height)
		};
	
	var children = element.childNodes;	
	for(c in children) {
		
		if(children[c].className == "incontextMetadata") {
			var metadata = children[c];
			
			var leftSide = extent.x;
			var rightSide = parseInt(element.parentElement.style.width) - extent.x - extent.width;
			
			//console.log(leftSide + " | " + rightSide);
			if(leftSide > rightSide) {
				metadata.style.left = '-400px';
				if(leftSide < 400) {
					metadata.style.left = '-'+ leftSide +'px';
					metadata.style.width = leftSide;
				}
			}
			else {
				metadata.style.left = extent.width + 'px';
				if(rightSide < 400) {
					metadata.style.width = rightSide;
				}
			}
		}
		
		else if(children[c].className == "overlay") {
			var buttons = children[c].childNodes;
			for(b in buttons) {
				if(buttons[b].className == "button") {
					//nav button
					if(buttons[b].style.background == "green") {
						buttons[b].style.top = (extent.height - 15) + "px";
						buttons[b].style.left = ((extent.width / 2) - 15) + "px";
					}
					//delete button
					else if(buttons[b].style.background == "red") {
						buttons[b].style.top = (0 - 15) + "px";
						buttons[b].style.left = (extent.width - 15) + "px";
					}
					//opacity button
					else if(buttons[b].style.background == "yellow") {
						buttons[b].style.top = ((extent.height / 2) - 15) + "px";
						buttons[b].style.left = (extent.width - 15) + "px";
					}
					//resize button
					else if(buttons[b].style.background == "blue") {
						buttons[b].style.top = (extent.height  - 15) + "px";
						buttons[b].style.left = (extent.width - 15) + "px";
					}
					//rotate button
					else if(buttons[b].style.background == "purple") {
						buttons[b].style.top = (extent.height - 15) + "px";
						buttons[b].style.left = (0 - 15) + "px";
					}
				}
			}
		}
	}	
}

function hideMetadata(element) {
	var children = element.childNodes;
	for(c in children) {		
		if(children[c].className == "incontextMetadata") {
			children[c].style.visibility = "hidden";
		}
	}
}

function showMetadata(element) {
	var children = element.childNodes;
	for(c in children) {		
		if(children[c].className == "incontextMetadata") {
			children[c].style.visibility = "visible";
		}
	}
}


