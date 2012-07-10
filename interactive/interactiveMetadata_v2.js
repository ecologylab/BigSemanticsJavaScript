function createMetadataBrowser(continer, metadata) {
	console.log("creating metadata display");
	
	var metadataBrowser = new MetadataBrowser(metadata);
	
	return metadataBrowser;
}

function MetadataBrowser(md) {
	this.metadata = md;
	
	this.rootVisual = document.createElement('div');
	this.rootVisual.className = "metadataContainer";
	
	this.history = [];
	this.children = [];
		
	this.startingDisplay = new MetadataDisplay(this, this.metadata, -1);
	
	this.startingDisplay.mainView = this.buildMetadataMainView(this.startingDisplay.metadata);
		
	this.rootVisual.appendChild(this.startingDisplay.mainView);
}

function MetadataDisplay(p, md, i) {
	this.parent = p;
	this.metadata = md;
	this.index = i;
	
	this.listView = this.buildListView(this.metadata);
	this.historicView = this.buildHistoricView(this.metadata);
	this.hoverView = this.buildHoverView(this.metadata);
}

MetadataDisplay.prototype.buildListView = function(metadata) {
	var listItem = document.createElement('li');
		listItem.className = "childListItem";

	var titleValue = document.createElement('a');
		titleValue.className = "inlink";
		titleValue.innerText = metadata.title.value;	
		
		//docSpan.onclick = function() { enterChild(parent, i) };
		//docSpan.onmouseover = function() { this.showHoverChild(children[i])};
		
	listItem.appendChild(titleValue);
	
	return listItem;
};

MetadataDisplay.prototype.buildHistoricView = function(metadata) {
	return null;
};

MetadataDisplay.prototype.buildHoverView = function(metadata) {
	var table = document.createElement('table');
		table.className = "metadataView";
	
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
					aTag.innerText = metadata[key].name;
					aTag.href = metadata[key].value;
					
				var domainSpan = document.createElement('span');
					domainSpan.className = "domainSpan";
					domainSpan.innerText = getURLDomain(metadata[key].value);
					
				valueCol.appendChild(aTag);
				valueCol.appendChild(domainSpan);
				
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
								
				case 'child': 		valueCol.appendChild(this.parent.createChildList(childList));
									break;
			}
			
			
			
			row.appendChild(nameCol);
			row.appendChild(valueCol);
		}		
		
		table.appendChild(row);
	}
	
	return table;
};

MetadataBrowser.prototype.buildMetadataMainView = function(metadata) {
	var table = document.createElement('table');
		table.className = "metadataView";
	
	for(var key in metadata) {
		var row = document.createElement('tr');
		var nameCol = document.createElement('td');
		var valueCol = document.createElement('td');
		
		if(metadata[key].scalar_type != null) {
			
			if(metadata[key].scalar_type == "String") {
				
				// Title field - special case
				if(key == "title") {					
					var titleValue = document.createElement('span');
						titleValue.className = metadata.title.style;
						titleValue.innerText = metadata.title.value;	
					
					var domainSpan = document.createElement('span');
						domainSpan.className = "domainSpan";
						
					if(metadata.location != null) 	
						domainSpan.innerText = getURLDomain(metadata.location.value);
													
					var titleCol = document.createElement('td');	
						titleCol.colSpan = 2;
									
					titleCol.appendChild(titleValue);
					titleCol.appendChild(domainSpan);
					
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
					aTag.innerText = metadata[key].name;
					aTag.href = metadata[key].value;
					
				var domainSpan = document.createElement('span');
					domainSpan.className = "domainSpan";
					domainSpan.innerText = getURLDomain(metadata[key].value);
					
				valueCol.appendChild(aTag);
				valueCol.appendChild(domainSpan);
				
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
								
				case 'child': 		valueCol.appendChild(this.parent.createChildList(childList));
									break;
			}
			
			
						row.appendChild(nameCol);
			row.appendChild(valueCol);
		}		
		
		table.appendChild(row);
	}
	
	return table;
}

MetadataBrowser.prototype.createChildList = function(children) {
	var childList = document.createElement('ul');
	
	for(var i = 0; i < children.length; i++) {
		var child = children[i];
		
		this.children.push(new MetadataDisplay(this.parent, child, this.children.length));		

		childList.appendChild(this.children[this.children.length - 1].listView);		
	}	
	
	return childList;
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


function createTitleColumn(metadata) {
	
	var titleValue = document.createElement('a');
		titleValue.className = metadata.title.style;
		titleValue.innerText = metadata.title.value;	
	
	var domainSpan = document.createElement('span');
		domainSpan.className = "domainSpan";
		
	if(metadata.location != null) {
		titleValue.href = metadata.location.value;		
		domainSpan.innerText = getURLDomain(metadata.location.value);
	}
				
	var titleCol = document.createElement('td');	
		titleCol.colSpan = 2;
					
	titleCol.appendChild(titleValue);
	titleCol.appendChild(domainSpan);
	
	return titleCol;
}


function getURLDomain(url) {
	return url.match(/:\/\/(www\.)?(.[^/:]+)/)[2];
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