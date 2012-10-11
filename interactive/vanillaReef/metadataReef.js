
var MetadataRenderer = {};
MetadataRenderer.container = null;

MetadataRenderer.addMetadataDisplay = function(parent, url)
{
	MetadataRenderer.container = parent;
	MetadataRenderer.getMetadata(url, "MetadataRenderer.getMMDThenCreate");
	
}

MetadataRenderer.getMetadata = function(url, callback)
{	
	var serviceURL = "http://ecology-service/ecologylabSemanticService/metadata.jsonp?callback=" + callback + "&url=" + url;
	
	var metadataScript = document.createElement('script');
	metadataScript.src = serviceURL;
	document.head.appendChild(metadataScript);
}

MetadataRenderer.getMMDThenCreate = function(rawMetadata)
{	
	var type = "";
	var metadata = {};
	for(i in rawMetadata)
	{
		type = i;
		//console.log("type = " + i);
		metadata = rawMetadata[i];
	}
	
	simplDeserialize(metadata);
	MetadataRenderer.metadata = metadata;
	
	MetadataRenderer.getMMD(type, "MetadataRenderer.createAndAddMetadataDisplay");
}

MetadataRenderer.getMMD = function(type, callback)
{
	var serviceURL = "http://ecology-service/ecologylabSemanticService/mmd.jsonp?callback=" + callback + "&name=" + type;
	
	var metadataScript = document.createElement('script');
	metadataScript.src = serviceURL;
	document.head.appendChild(metadataScript);
}

MetadataRenderer.createAndAddMetadataDisplay = function(mmd) {
	//console.log("creating metadata display");
	
	simplDeserialize(mmd);
	
	MetadataRenderer.mmd = mmd;
	
	console.log(MetadataRenderer.metadata);
	console.log(MetadataRenderer.mmd);
	
	MetadataRenderer.visual = document.createElement('div');
	MetadataRenderer.visual.className = "metadataContainer";
	
	MetadataRenderer.visual.appendChild(MetadataRenderer.buildMetadataDisplay(MetadataRenderer.mmd, MetadataRenderer.metadata));
	
	while (MetadataRenderer.container.hasChildNodes())
	    MetadataRenderer.container.removeChild(MetadataRenderer.container.lastChild);
	
	MetadataRenderer.container.appendChild(MetadataRenderer.visual);
}



MetadataRenderer.buildMetadataDisplay = function(mmd, metadata)
{
	console.log("getting fields");
	var metadataFields = MetadataRenderer.getMetadataFields(mmd["meta_metadata"]["kids"], metadata);
	console.log(metadataFields);
				
	// sort by layer
	
	
	var metadata = metadataFields;
	
	
	// build html table
	
	var table = MetadataRenderer.buildMetadataTable(false, true, metadata);
	
	return table;
	
}
	
MetadataRenderer.buildMetadataTable = function(isChildTable, isRoot, metadata)
{
	var table = document.createElement('table');
	
	if(!isRoot)
		table.className = "metadataTable";
		
	for(var key in metadata)
	{
		//console.log(key);
		var row = document.createElement('tr');
		var nameCol = document.createElement('td');
			nameCol.className = "labelCol";
			
		var valueCol = document.createElement('td');
			valueCol.className = "valueCol";
		
		
		if(metadata[key].value == null || metadata[key].value.length == 0 )
		{			
		}
		else
		{		
			if(metadata[key].scalar_type != null)
			{
				
				if(metadata[key].scalar_type == "String" || metadata[key].scalar_type == "Date" ||metadata[key].scalar_type == "Integer")
				{				
					if(metadata[key].name != null)
					{
						var fieldLabel = document.createElement('p');
							fieldLabel.className = "fieldLabel";
							fieldLabel.innerText = MetadataRenderer.toDisplayCase(metadata[key].name);
						
						var fieldLabelDiv = document.createElement('div');
							fieldLabelDiv.className = "fieldLabelContainer";
						
						fieldLabelDiv.appendChild(fieldLabel);
						nameCol.appendChild(fieldLabelDiv);
					}
					
					if( metadata[key].navigatesTo != null)
					{
						var favicon = document.createElement('img');
							favicon.className = "favicon";
							favicon.src = "http://g.etfv.co/" + metadata[key].navigatesTo;
						
						var aTag = document.createElement('a');
							aTag.className = "fieldValue";
							aTag.target = "_blank";
							aTag.innerText = MetadataRenderer.removeLineBreaks(metadata[key].value);
							aTag.href = metadata[key].navigatesTo;
						
						var fieldValueDiv = document.createElement('div');
							fieldValueDiv.className = "fieldValueContainer";
						
						fieldValueDiv.appendChild(favicon);
						fieldValueDiv.appendChild(aTag);
						valueCol.appendChild(fieldValueDiv);
					}
					else
					{
						var fieldValue = document.createElement('p');
							fieldValue.className = "fieldValue";
							fieldValue.innerText = MetadataRenderer.removeLineBreaks(metadata[key].value);										
							
						var fieldValueDiv = document.createElement('div');
							fieldValueDiv.className = "fieldValueContainer";
						
						fieldValueDiv.appendChild(fieldValue);
						valueCol.appendChild(fieldValueDiv);
					}
					
					row.appendChild(nameCol);
					row.appendChild(valueCol);
				}
					
				else if(metadata[key].scalar_type == "ParsedURL")
				{
					var aTag = document.createElement('a');
						aTag.innerText = MetadataRenderer.removeLineBreaks(metadata[key].value);
						aTag.href = metadata[key].value;
						aTag.className = "fieldValue";
					
					var fieldValueDiv = document.createElement('div');
						fieldValueDiv.className = "fieldValueContainer";
					
					fieldValueDiv.appendChild(aTag);
					valueCol.appendChild(fieldValueDiv);
					
					row.appendChild(nameCol);
					row.appendChild(valueCol);
				}			
			}
			
			else if(metadata[key].composite_type != null)
			{
				if(metadata[key].name != null)
				{	
					
							
					var fieldLabelDiv = document.createElement('div');
						fieldLabelDiv.className = "fieldLabelContainer";
						fieldLabelDiv.style.minWidth = "36px";
					
					var expandButton = document.createElement('div');
							expandButton.className = "expandButton";
							
							expandButton.onclick = MetadataRenderer.shovelComposite;
							
							var expandSymbol = document.createElement('div');
								expandSymbol.className = "expandSymbol";
								expandSymbol.style.display = "block";
								
							var collapseSymbol = document.createElement('div');
								collapseSymbol.className = "collapseSymbol";
								collapseSymbol.style.display = "block";						
						
							expandButton.appendChild(expandSymbol);
							expandButton.appendChild(collapseSymbol);
							
					fieldLabelDiv.appendChild(expandButton);
					
					if(!isChildTable)
					{
						var fieldLabel = document.createElement('p');
							fieldLabel.className = "fieldLabel";
							fieldLabel.innerText = MetadataRenderer.toDisplayCase(metadata[key].name);
						
						fieldLabelDiv.appendChild(fieldLabel);
					}
					
					nameCol.appendChild(fieldLabelDiv);
				}
				
				var fieldValueDiv = document.createElement('div');
					fieldValueDiv.className = "fieldCompositeContainer";
				
				var childTable =  MetadataRenderer.buildMetadataTable(false, false, metadata[key].value);
				if(metadata[key].value.length > 1)
				{
					MetadataRenderer.collapseTable(childTable);			
				}	
				
				fieldValueDiv.appendChild(childTable);
				
				
				valueCol.appendChild(fieldValueDiv);
					
				row.appendChild(nameCol);
				row.appendChild(valueCol);
			}
			
			else if(metadata[key].child_type != null)
			{		
				if(metadata[key].name != null)
				{
					var fieldLabel = document.createElement('p');
						fieldLabel.className = "fieldLabel";
						fieldLabel.innerText = MetadataRenderer.toDisplayCase(metadata[key].name);
						
						fieldLabel.innerText += "(" + metadata[key].value.length + ")";
						
					var fieldLabelDiv = document.createElement('div');
							fieldLabelDiv.className = "fieldLabelContainer";
					
					// does it need to expand / collapse
					if(metadata[key].value.length > 1)
					{
						var expandButton = document.createElement('div');
							expandButton.className = "expandButton";
							
							expandButton.onclick = MetadataRenderer.expandCollapseTable;
							
							var expandSymbol = document.createElement('div');
								expandSymbol.className = "expandSymbol";
								expandSymbol.style.display = "block";
								
							var collapseSymbol = document.createElement('div');
								collapseSymbol.className = "collapseSymbol";
								collapseSymbol.style.display = "block";						
						
							expandButton.appendChild(expandSymbol);
							expandButton.appendChild(collapseSymbol);
							
						fieldLabelDiv.appendChild(expandButton);
					}						
					fieldLabelDiv.appendChild(fieldLabel);
					nameCol.appendChild(fieldLabelDiv);
				}
					
				var fieldValueDiv = document.createElement('div');
					fieldValueDiv.className = "fieldChildContainer";
				
				var childTable =  MetadataRenderer.buildMetadataTable(true, false, metadata[key].value);
				if(metadata[key].value.length > 1)
				{
					MetadataRenderer.collapseTable(childTable);			
				}					
					
				fieldValueDiv.appendChild(childTable);
				valueCol.appendChild(fieldValueDiv);
								
				row.appendChild(nameCol);
				row.appendChild(valueCol);
			}		
			table.appendChild(row);
		}
	}	
	return table;
}

MetadataRenderer.toDisplayCase = function(string) {
	var strings = string.split('_');
	var display = "";
	for( var s in strings)
	{
		display += strings[s].charAt(0).toLowerCase() + strings[s].slice(1) + " ";
	}
	return display;
}

MetadataRenderer.removeLineBreaks = function(string) {
	string = string.replace(/(\r\n|\n|\r)/gm," ");	
	var result = "";
	 for (var i = 0; i < string.length; i++)
	 {
        var ch = string.charCodeAt(i); 
        if (ch < 128)
        {
            result += string.charAt(i);
        }
    }
	
	return result;
}

MetadataRenderer.expandCollapseTable = function(event)
{
	// is expanding or collapsing? & change button
	var button = event.srcElement;
	
	if(button.className == "collapseSymbol" || button.className == "expandSymbol")
		button = button.parentElement;
		
	var expandSymbol = button.getElementsByTagName("div")[0];
	if(expandSymbol.style.display == "block")
	{
		// expand table
		expandSymbol.style.display = "none";
		var table = button.parentElement.parentElement.parentElement.getElementsByTagName("td")[1];
		
		while(table.rows == null)
			table = table.lastChild;
		
		MetadataRenderer.expandTable(table);
	}
	else if(expandSymbol.style.display == "none")
	{
		// collapse table
		expandSymbol.style.display = "block";
		var table = button.parentElement.parentElement.parentElement.getElementsByTagName("td")[1];
		
		while(table.rows == null)
			table = table.lastChild;
			
		MetadataRenderer.collapseTable(table);
	}	
}

MetadataRenderer.expandTable = function(table)
{
	for (var i = 0; i < table.rows.length; i++)
	{
		table.rows[i].style.display = "block";
	}
}

MetadataRenderer.collapseTable = function(table)
{
	for (var i = 0; i < table.rows.length; i++)
	{
		if(i == 0)
			table.rows[i].style.display = "block";
		else
			table.rows[i].style.display = "none";
	}
}

MetadataRenderer.shovelComposite = function(event)
{
	var button = event.srcElement;
	
	if(button.className == "collapseSymbol" || button.className == "expandSymbol")
		button = button.parentElement;
	
	var expandSymbol = button.getElementsByTagName("div")[0];
	expandSymbol.style.display = "none";
	
	button.onclick = MetadataRenderer.expandCollapseTable;
	
	var table = button.parentElement.parentElement.parentElement.getElementsByTagName("td")[1].lastChild.lastChild;
	console.log(table);
	
	// add thining row
	table.appendChild(MetadataRenderer.createLoadingRow());
	
	
	var location = table.getElementsByTagName('a')[0].href;
	console.log(location);
	
	var parent = table.parentElement;
		
	MetadataRenderer.addMetadataDisplay(parent, location);
}

MetadataRenderer.createLoadingRow = function()
{
	var row = document.createElement('tr');
	
	var loadingRow = document.createElement('div');
		loadingRow.className = "loadingRow";
		loadingRow.innerText = "Loading document...";
	row.appendChild(loadingRow);
	return row;
}














