
var MetadataRenderer = {};
MetadataRenderer.container = null;

MetadataRenderer.addMetadataDisplay = function(parent, url)
{
	MetadataRenderer.container = parent;
	MetadataRenderer.getMetadata(url, "MetadataRenderer.createAndAddMetadataDisplay");
	
}

MetadataRenderer.getMetadata = function(url, callback)
{
	/*
	var serviceURL = "http://ecology-service/ecologylabSemanticService/metadata.json?callback=" + callback + "url=" + url;
	
	var metadataScript = document.createElement('script');
	metadataScript.src = serviceURL;
	document.head.appendChild(metadataScript);
	*/
	var rawMetadata = book;
	
	var type = "";
	var metadata = {};
	for(i in rawMetadata)
	{
		type = i;
		console.log("type = " + i);
		metadata = rawMetadata[i];
	}
	
	var mmd = MetadataRenderer.getMMD(type);
	
	MetadataRenderer.createAndAddMetadataDisplay(mmd, metadata);
}

MetadataRenderer.getMMD = function(type)
{
	return amazonProductMMD;
}

MetadataRenderer.createAndAddMetadataDisplay = function(mmd, metadata) {
	console.log("creating metadata display");
	
	console.log(metadata);
	console.log(mmd);
	
	MetadataRenderer.mmd = mmd;
	MetadataRenderer.metadata = metadata;
	
	MetadataRenderer.visual = document.createElement('div');
	MetadataRenderer.visual.className = "metadataContainer";
	
	MetadataRenderer.visual.appendChild(MetadataRenderer.buildMetadataDisplay(MetadataRenderer.mmd, MetadataRenderer.metadata));
	
	MetadataRenderer.container.appendChild(MetadataRenderer.visual);
}



MetadataRenderer.buildMetadataDisplay = function(mmd, metadata)
{
	var metadataFields = MetadataRenderer.getMetadataFields(mmd["meta_metadata"]["kids"], metadata);
				
	// sort by layer
	
	
	var metadata = metadataFields;
	
	
	// build html table
	
	var table = MetadataRenderer.buildMetadataTable(metadata);
	
	return table;
	
}
	
MetadataRenderer.buildMetadataTable = function(metadata)
{
	var table = document.createElement('table');
	
	for(var key in metadata)
	{
		//console.log(key);
		var row = document.createElement('tr');
		var nameCol = document.createElement('td');
		var valueCol = document.createElement('td');
		
		if(metadata[key].scalar_type != null)
		{
			
			if(metadata[key].scalar_type == "String")
			{				
				if(metadata[key].name != null)
				{
					var fieldLabel = document.createElement('span');
						fieldLabel.className = "fieldLabel";
						fieldLabel.innerText = MetadataRenderer.toDisplayCase(metadata[key].name);
					
					nameCol.appendChild(fieldLabel);
				}
				
				if( metadata[key].navigatesTo != null)
				{
					var aTag = document.createElement('a');
					aTag.className = "fieldValue";
					aTag.target = "_blank";
					aTag.innerText = metadata[key].value;
					aTag.href = metadata[key].navigatesTo;
					
					valueCol.appendChild(aTag);
				}
				else
				{
					var fieldValue = document.createElement('span');
						fieldValue.className = "fieldValue";
						fieldValue.innerText = metadata[key].value;										
						
					valueCol.appendChild(fieldValue);
				}
				
				row.appendChild(nameCol);
				row.appendChild(valueCol);
			}
				
			else if(metadata[key].scalar_type == "ParsedURL")
			{
				var aTag = document.createElement('a');
					aTag.innerText = metadata[key].value;
					aTag.href = metadata[key].value;
					
				valueCol.appendChild(aTag);
				
				row.appendChild(nameCol);
				row.appendChild(valueCol);
			}			
		}
		
		else if(metadata[key].composite_type != null)
		{
			if(metadata[key].name != null)
			{
				var fieldLabel = document.createElement('span');
					fieldLabel.className = "fieldLabel";
					fieldLabel.innerText = MetadataRenderer.toDisplayCase(metadata[key].name);
					
				nameCol.appendChild(fieldLabel);
			}
				
				console.log("composite: "+metadata[key]);
			valueCol.appendChild( MetadataRenderer.buildMetadataTable(metadata[key].value) );
				
			row.appendChild(nameCol);
			row.appendChild(valueCol);
		}
		
		else if(metadata[key].child_type != null)
		{
			/*
			if(metadata[key].name != null)
			{
				var fieldLabel = document.createElement('span');
					fieldLabel.className = "fieldLabel";
					fieldLabel.innerText = MetadataRenderer.toDisplayCase(metadata[key].name);
					
				nameCol.appendChild(fieldLabel);
			}
			
			var childList = metadata[key].value[metadata[key].child_type]
			
			switch(metadata[key].child_type)
			{
				case 'image': 		valueCol.appendChild(MetadataRenderer.createImageList(childList));
									break;
									
				case 'document': 	valueCol.appendChild(MetadataRenderer.createDocumentList(childList));
									break;
								
				case 'child': 		valueCol.appendChild(MetadataRenderer.createChildList(childList));
									break;
									
				default: 			for(i in childList) {
										valueCol.appendChild(MetadataRenderer.buildCondensedMetadataTable(childList[i]));
									}
									break;
			}		
			
			row.appendChild(nameCol);
			row.appendChild(valueCol);
			*/
		}		
		
		table.appendChild(row);
	}
	
	return table;
}

MetadataRenderer.buildCondensedMetadataTable = function(metadata) {
	var expandedTable = MetadataRenderer.buildMetadataTable(metadata);
		//expandedTable.style.display = "none";
	
	var condensedSpan = document.createElement('span');
	
	return expandedTable;		
}

MetadataRenderer.createImageList = function(imageList) {
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

MetadataRenderer.createDocumentList = function(documentList) {
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

MetadataRenderer.createChildList = function(children) {
	var childList = document.createElement('div');
	
	for(var i = 0; i < children.length; i++) {
		var docSpan = document.createElement('span');
			docSpan.className = "childSnip";

		var titleValue = document.createElement('a');
			titleValue.className = "inlink";
			titleValue.innerText = children[i].title.value;	
			
			//docSpan.onclick = function() { enterChild(parent, i) };
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

MetadataRenderer.createTitleColumn = function(metadata) {
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



MetadataRenderer.toDisplayCase = function(string) {
	var strings = string.split('_');
	var display = "";
	for( var s in strings) {
		display += strings[s].charAt(0).toUpperCase() + strings[s].slice(1) + " ";
	}
	return display;
}
