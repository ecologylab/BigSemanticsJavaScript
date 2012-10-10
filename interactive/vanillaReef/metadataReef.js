
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
				
				if(metadata[key].scalar_type == "String")
				{				
					if(metadata[key].name != null)
					{
						var fieldLabel = document.createElement('span');
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
						
						valueCol.appendChild(favicon);
						
						var aTag = document.createElement('a');
							aTag.className = "fieldValue";
							aTag.target = "_blank";
							aTag.innerText = MetadataRenderer.removeLineBreaks(metadata[key].value);
							aTag.href = metadata[key].navigatesTo;
						
						valueCol.appendChild(aTag);
					}
					else
					{
						var fieldValue = document.createElement('span');
							fieldValue.className = "fieldValue";
							fieldValue.innerText = MetadataRenderer.removeLineBreaks(metadata[key].value);										
							
						valueCol.appendChild(fieldValue);
					}
					
					row.appendChild(nameCol);
					row.appendChild(valueCol);
				}
					
				else if(metadata[key].scalar_type == "ParsedURL")
				{
					var aTag = document.createElement('a');
						aTag.innerText = MetadataRenderer.removeLineBreaks(metadata[key].value);
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
					
					var fieldLabelDiv = document.createElement('div');
							fieldLabelDiv.className = "fieldLabelContainer";
						
					fieldLabelDiv.appendChild(fieldLabel);
					nameCol.appendChild(fieldLabelDiv);
				}
				
				valueCol.appendChild( MetadataRenderer.buildMetadataTable(metadata[key].value) );
					
				row.appendChild(nameCol);
				row.appendChild(valueCol);
			}
			
			else if(metadata[key].child_type != null)
			{			
				if(metadata[key].name != null)
				{
					var fieldLabel = document.createElement('span');
						fieldLabel.className = "fieldLabel";
						fieldLabel.innerText = MetadataRenderer.toDisplayCase(metadata[key].name);
						
					var fieldLabelDiv = document.createElement('div');
							fieldLabelDiv.className = "fieldLabelContainer";
						
					fieldLabelDiv.appendChild(fieldLabel);
					nameCol.appendChild(fieldLabelDiv);
				}
					
				valueCol.appendChild( MetadataRenderer.buildMetadataTable(metadata[key].value) );
					
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
	for( var s in strings) {
		display += strings[s].charAt(0).toLowerCase() + strings[s].slice(1) + " ";
	}
	return display;
}

MetadataRenderer.removeLineBreaks = function(string) {
	string = string.replace(/(\r\n|\n|\r)/gm,"");
	return string;
}
