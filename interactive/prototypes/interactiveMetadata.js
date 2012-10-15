var container = null;

function createMetadataDisplay(continer, metadata) {
	console.log("creating metadata display");
	
	var metadataDisplay = new MetadataDisplay(container, metadata);
	
	return metadataDisplay;
}

function MetadataDisplay(contain, md) {
	this.metadata = md;
	this.container = contain;
	
	this.rootVisual = document.createElement('div');
	this.rootVisual.className = "metadataContainer";
	
	this.rootVisual.appendChild(this.buildMetadataTable(this.metadata));
}

MetadataDisplay.prototype.buildMetadataTable = function(metadata) {
	var table = document.createElement('table');
	
	for(var key in metadata) {
		var row = document.createElement('tr');
		var nameCol = document.createElement('td');
		var valueCol = document.createElement('td');
		
		if(metadata[key].scalar_type != null) {
			
			if(metadata[key].scalar_type == "String") {
				
				// Title field - special case
				if(key == "title") {					
					var titleCol = createTitleColumn(metadata);
					
					row.appendChild(titleCol);
				}
				else {
					if(metadata[key].name != null) {
						var fieldLabel = document.createElement('span');
							fieldLabel.className = "fieldLabel";
							fieldLabel.innerText = toDisplayCase(metadata[key].name);
						
						nameCol.appendChild(fieldLabel);
					}
					
					var fieldValue = document.createElement('span');
						fieldValue.className = "fieldValue";
						fieldValue.innerText = metadata[key].value;						
						
					valueCol.appendChild(fieldValue);
					
					row.appendChild(nameCol);
					row.appendChild(valueCol);
				}
			}
				
			else if(metadata[key].scalar_type == "ParsedURL") {
				var aTag = document.createElement('a');
					aTag.innerText = metadata[key].value;
					aTag.href = metadata[key].value;
					
				valueCol.appendChild(aTag);
				
				row.appendChild(nameCol);
				row.appendChild(valueCol);
			}			
		}
		else if(metadata[key].child_type != null){
			if(metadata[key].name != null) {
				var fieldLabel = document.createElement('span');
					fieldLabel.className = "fieldLabel";
					fieldLabel.innerText = toDisplayCase(metadata[key].name);
					
				nameCol.appendChild(fieldLabel);
			}
			
			var childList = metadata[key].value[metadata[key].child_type]
			
			switch(metadata[key].child_type) {
				case 'image': 		valueCol.appendChild(createImageList(childList));
									break;
									
				case 'document': 	valueCol.appendChild(createDocumentList(childList));
									break;
								
				case 'child': 		valueCol.appendChild(createChildList(this, childList));
									break;
									
				default: 			for(i in childList) {
										valueCol.appendChild(buildCondensedMetadataTable(childList[i]));
									}
									break;
			}
			
			
			
			row.appendChild(nameCol);
			row.appendChild(valueCol);
		}		
		
		table.appendChild(row);
	}
	
	return table;
}

function buildCondensedMetadataTable(metadata) {
	var expandedTable = buildMetadataTable(metadata);
		//expandedTable.style.display = "none";
	
	var condensedSpan = document.createElement('span');
	
	return expandedTable;		
}

function createImageList(imageList) {
	var imgList = document.createElement('div');
		imgList.className = "imgList";
	
	for(i in imageList) {
		var img = document.createElement('img');
			img.src = imageList[i].location.value;

		if( parseInt(i) == (imageList.length - 1) )
			img.style.marginRight = "0px"; 
	
		imgList.appendChild(img);
	}
	return imgList;
}

function createDocumentList(documentList) {
	var docList = document.createElement('div');
	
	for(i in documentList) {
		var docSpan = document.createElement('span');
			docSpan.className = "documentSnip";

		var titleValue = document.createElement('a');
			titleValue.className = documentList[i].title.style;
			titleValue.innerText = documentList[i].title.value;	
						
		if(documentList[i].location != null)
			titleValue.href = documentList[i].location.value;
		
		docSpan.appendChild(titleValue);		
	
		var index = parseInt(i);
		console.log(index+" | "+ (index+1) +" | "+documentList.length);
		if((index + 1) < documentList.length) {
			var commaSpan = document.createElement('span');
				commaSpan.innerText = ", ";
			docSpan.appendChild(commaSpan);
		}
			
		docList.appendChild(docSpan);		
	}	
	
	return docList;
}

function createChildList(parent, children) {
	var childList = document.createElement('div');
	
	for(var i = 0; i < children.length; i++) {
		var docSpan = document.createElement('span');
			docSpan.className = "childSnip";

		var titleValue = document.createElement('a');
			titleValue.className = "inlink";
			titleValue.innerText = children[i].title.value;	
			
			docSpan.onclick = function() { enterChild(parent, i) };
			//docSpan.onmouseover = function() { showChild(parent, children[i])};
		
		docSpan.appendChild(titleValue);		
	
	/*
		var index = parseInt(i);
		if((index + 1) < children.length) {
			var commaSpan = document.createElement('span');
				commaSpan.innerText = ", ";
			docSpan.appendChild(commaSpan);
		}
	*/	
		childList.appendChild(docSpan);		
	}	
	
	return childList;
}

function enterChild(parent, child) {
	console.log(child);
	clearChildren(parent.rootVisual);
	parent.rootVisual.appendChild(parent.buildMetadataTable(child));
}

function clearChildren(node) {;
	while (node.hasChildNodes()) {
	    node.removeChild(node.lastChild);
	}
}

function metadataContainerResize() {
	console.log("resized");
}

function createTitleColumn(metadata) {
	var titleValue = document.createElement('a');
		titleValue.className = metadata.title.style;
		titleValue.innerText = metadata.title.value;	
						
	if(metadata.location != null)
		titleValue.href = metadata.location.value;
				
	var titleCol = document.createElement('td');	
		titleCol.colSpan = 2;
					
	titleCol.appendChild(titleValue);
	
	return titleCol;
}



function toDisplayCase(string) {
	var strings = string.split('_');
	console.log(strings);
	var display = "";
	for( var s in strings) {
		display += strings[s].charAt(0).toUpperCase() + strings[s].slice(1) + " ";
	}
	console.log(display);
	return display;
}

/** getAverageRGB
 *  Computes the average RGB value for the given image.
 *  Once complete, the callback is called with the color as the only param.
 *  @param imgURL, url of the image to compute the average rgb from
 *  @param callback, function to be called, callback(string color)
 */
function getAverageRGB(imgURL, callback)
{    
    var imgEl = document.createElement('img');
    imgEl.src = imgURL;
    imgEl.crossOrigin = ''; // no credentials flag. Same as img.crossOrigin='anonymous'
    
    imgEl.onload = function() {
	    //console.log(imgEl.src);
	    
	    var blockSize = 5, // only visit every 5 pixels
	        defaultRGB = "rgb(0,0,0)", // for non-supporting envs
	        canvas = document.createElement('canvas'),
	        context = canvas.getContext && canvas.getContext('2d'),
	        data, width, height,
	        i = -4,
	        length,
	        rgb = {r:0,g:0,b:0},
	        count = 0;
	        
	    if (!context) {
	    	//console.log("here");
	        callback(defaultRGB);
	    }
	    
	    height = canvas.height = imgEl.naturalHeight || imgEl.offsetHeight || imgEl.height;
	    width = canvas.width = imgEl.naturalWidth || imgEl.offsetWidth || imgEl.width;
	    
	    context.drawImage(imgEl, 0, 0);
	    	    
	    //console.log(canvas.toDataURL("image/png"));
	    
	    try {
	        data = context.getImageData(0, 0, width, height);
	    } catch(e) {
	        //console.log(e);
	         callback(defaultRGB);
	    }
	    
	    length = data.data.length;
	    
	    while ( (i += blockSize * 4) < length ) {
	        ++count;
	        rgb.r += data.data[i];
	        rgb.g += data.data[i+1];
	        rgb.b += data.data[i+2];
	    }
	    
	    // ~~ used to floor values
	    rgb.r = ~~(rgb.r/count);
	    rgb.g = ~~(rgb.g/count);
	    rgb.b = ~~(rgb.b/count);
	    
	    callback("rgb("+rgb.r+", "+rgb.g+", "+rgb.b+")");
    }    
}


