
var MetadataRenderer = {};
MetadataRenderer.queue = [];

MetadataRenderer.addFirstMetadataDisplay = function(parent, url)
{	
	console.log("queueing: "+url);
	MetadataRenderer.queue.push(new MetadataQueueTask(url, parent, true));	
	MetadataRenderer.getMetadata(url, "MetadataRenderer.getMMDThenCreate");	
}

MetadataRenderer.addMetadataDisplay = function(parent, url)
{	
	console.log("queueing: "+url);
	MetadataRenderer.queue.push(new MetadataQueueTask(url, parent, false));	
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
		metadata = rawMetadata[i];
	}
	
	simplDeserialize(metadata);
	
	console.log("got metadata for: "+metadata.location);
	
	var queueTask = null;
	if(metadata.location != null)
		queueTask = MetadataRenderer.getTaskFromQueueByUrl(metadata.location);

		
	if(queueTask != null)
	{
		queueTask.metadata = metadata;
		queueTask.mmdType = type;
	}
	else 
	{
		alert("i got some metadata but it doesnt match anything queue'd");
	}
	
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
	simplDeserialize(mmd);
	
	console.log(mmd["meta_metadata"].name);
	var mmdType = mmd["meta_metadata"].name;
	
	var tasks = MetadataRenderer.getTasksFromQueueByType(mmdType);
	
	if(tasks.length > 0)
	{
		console.log("doing a queue'd shovel");
		for(var i = 0; i < tasks.length; i++)
		{
			var task = tasks[i];
			task.mmd = mmd;
			
			MetadataRenderer.completeShovelTask(task);
		}
	}
	else
	{
		alert("i got some MMD but it doesnt match anything queue'd");
	}
}

MetadataRenderer.completeShovelTask = function(task) {
	
	//console.log(task.metadata);
	//console.log(task.mmd);
	
	task.visual = document.createElement('div');
	task.visual.className = "metadataContainer";
	
	var metadataTable = MetadataRenderer.buildMetadataDisplay(task.isFirst, task.mmd, task.metadata)
	
	if(metadataTable != null)
	{
		task.visual.appendChild(metadataTable);
		
		while (task.container.hasChildNodes())
		    task.container.removeChild(task.container.lastChild);
		
		task.container.appendChild(task.visual);
	}
	// remove loading row
	else
	{
		task.clearLoadingRows(task.container);
	}
	
	MetadataRenderer.queue.splice(MetadataRenderer.queue.indexOf(task), 1);
}



MetadataRenderer.buildMetadataDisplay = function(isRoot, mmd, metadata)
{
	//console.log("getting fields");
	var metadataFields = MetadataRenderer.getMetadataFields(mmd["meta_metadata"]["kids"], metadata, 0);
	console.log(metadataFields);
	
	// did we actually get any metadata?
	if(MetadataRenderer.hasVisibleMetadata(metadataFields))
	{
		// if so, then build html table	
		return MetadataRenderer.buildMetadataTable(false, isRoot, metadataFields);		
	}
	else
	{
		return null;
	}	
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
					
					//console.log("isChild: "+isChildTable);
					//console.log(metadata[key]);
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
				
				
				var nestedPad = document.createElement('div');
					nestedPad.className = "nestedPad";
				
				nestedPad.appendChild(childTable);
				
				fieldValueDiv.appendChild(nestedPad);
				
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
					
				var nestedPad = document.createElement('div');
					nestedPad.className = "nestedPad";
				
				nestedPad.appendChild(childTable);
				
				fieldValueDiv.appendChild(nestedPad);
				
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
			
		while(table.rows.length == 0)
		{
			table = table.getElementsByTagName("table")[0];
		}
		
		console.log(table);
		
		MetadataRenderer.expandTable(table);
	}
	else if(expandSymbol.style.display == "none")
	{
		// collapse table
		expandSymbol.style.display = "block";
		var table = button.parentElement.parentElement.parentElement.getElementsByTagName("td")[1];
		
		while(table.rows == null)
			table = table.lastChild;
		
		while(table.rows.length == 0)
		{
			table = table.getElementsByTagName("table")[0];
		}
		
		console.log(table);
			
		MetadataRenderer.collapseTable(table);
	}	
}

MetadataRenderer.expandTable = function(table)
{
	for (var i = 0; i < table.rows.length; i++)
	{
		table.rows[i].style.display = "table";
	}
	
	MetadataRenderer.clearLoadingRows(table);
}

MetadataRenderer.collapseTable = function(table)
{
	for (var i = 0; i < table.rows.length; i++)
	{
		if(i == 0)
			table.rows[i].style.display = "table";
		else
			table.rows[i].style.display = "none";
	}
	
	MetadataRenderer.clearLoadingRows(table);
	
}

MetadataRenderer.clearLoadingRows = function(container)
{
	var divs = container.getElementsByTagName("div");
	for( var i = 0; i < divs.length; i++)
	{
		var child = divs[i];
		if(child.className == "loadingRow")
		{
			child.parentElement.removeChild(child);
		}
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
	
	var table = button.parentElement.parentElement.parentElement.getElementsByTagName("td")[1];
	

	while(table.rows == null)
			table = table.lastChild;	
	
	while(table.rows.length == 0)
	{
			table = table.getElementsByTagName("table")[0];
	}
	
	console.log("table to shovel");	
	console.log(table);
	
	// search for a top level location
	var location = null;
	for (var i = 0; i < table.rows.length; i++)
	{
		var valueCol = table.rows[i].getElementsByTagName("td")[1];
		//console.log(valueCol);
		if(valueCol != null)
		{
			var valueDiv = valueCol.getElementsByTagName("div")[0];
			if(valueDiv != null)
			{
				//console.log(valueDiv);
				for (var j = 0; j < valueDiv.childNodes.length; j++)
				{
					//console.log(valueDiv.childNodes[j].href);
					if(valueDiv.childNodes[j].href != null)
					{
						//console.log("my gosh");
						location = valueDiv.childNodes[j].href;
						break;
					}	
				}
			}
		}
	}
	//console.log(location);
	
	// does it have top level location?
	if(location != null)
	{
		// add thining row
		table.appendChild(MetadataRenderer.createLoadingRow());
						
		var parent = table.parentElement;	
		console.log	(parent);
		MetadataRenderer.addMetadataDisplay(parent, location);
	}
	// if not then just expand
	else
	{
		MetadataRenderer.expandTable(table);
	}	
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

MetadataRenderer.hasVisibleMetadata = function(metadata)
{
	for(var key in metadata)
	{	
		if(metadata[key].value != null)
		{
			if(metadata[key].value.length != null && metadata[key].value.length > 0)
			{
				return true;	
			}
			else if(metadata[key].value.length == null)
			{
				return true;
			}
		}
	}
	return false;
}

MetadataRenderer.getTaskFromQueueByUrl = function(url)
{
	url = url.toLowerCase();
	for(var i = 0; i < MetadataRenderer.queue.length; i++)
	{
		MetadataRenderer.queue[i].url = MetadataRenderer.queue[i].url.toLowerCase();
		if(MetadataRenderer.queue[i].url.indexOf(url) == 0)
			return MetadataRenderer.queue[i];
	}
	return null;
}

MetadataRenderer.getTasksFromQueueByType = function(type)
{
	var tasks = [];
	for(var i = 0; i < MetadataRenderer.queue.length; i++)
	{
		if(MetadataRenderer.queue[i].mmdType == type)
			tasks.push(MetadataRenderer.queue[i]);
	}
	return tasks;
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
		
		if((typeof currentObj) != 'object' || currentObj == null)
		{
			return;
		}
		
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


var MAX_DEPTH = 4;

function MetadataField()
{
	this.name = "field label";
	this.value = "field value";
	
	this.layer = 0.0;
	
	this.style = "";	
}

MetadataRenderer.getMetadataFields = function(mmdKids, metadata, depth)
{
	var metadataFields = [];
	
	if(depth >= MAX_DEPTH)
		return metadataFields;
		
	for(var key in mmdKids)
	{		
		var mmdField = mmdKids[key];		
		
		if(mmdField.scalar != null)
		{
			mmdField = mmdField.scalar;
			
			// is field hidden?
			if(mmdField.hide == null || mmdField.hide == false)
			{				
				// is there data for the field?
				var valueName = (mmdField.tag != null) ? mmdField.tag : mmdField.name;				
				var value = metadata[valueName];
				
				if(value != null)
				{
					//console.log(mmdField.name + ": " + value);
		
					var field = new MetadataField();
					
					field.name = (mmdField.label != null) ? mmdField.label : mmdField.name;
					field.value = value; 
					
					field.layer = (mmdField.layer != null) ? mmdField.layer : 0.0;
					field.style = (mmdField.style != null) ? mmdField.style : "";
					
					field.scalar_type = mmdField.scalar_type;
										
					// does it navigate to?
					if(mmdField.navigates_to != null)
					{
						var navigationLink = metadata[mmdField.navigates_to];
						// is there a value for its navigation
						if(navigationLink != null)
						{
							field.navigatesTo = navigationLink;
						}
					}					
					metadataFields.push(field);
				}
			}
		}
		
		else if(mmdField.composite != null)
		{
			mmdField = mmdField.composite;
			
			// is field hidden?
			if(mmdField.hide == null || mmdField.hide == false)
			{				
				// is there data for the field?				
				var valueName = (mmdField.tag != null) ? mmdField.tag : mmdField.name;				
				var value = metadata[valueName];	
	
				if(value != null)
				{									
					if(value.length != null)
					{						
						for(var i = 0; i < value.length; i++)
						{
							var field = new MetadataField();
						
							field.name = (mmdField.label != null) ? mmdField.label : mmdField.name;
							
							field.layer = (mmdField.layer != null) ? mmdField.layer : 0.0;
							field.style = (mmdField.style != null) ? mmdField.style : "";
							
							field.composite_type = mmdField.type;
							
							//console.log("depth: "+depth+" | reading  fields  multi-composite: "+i+ " - " + mmdField.name);
							
							field.value = MetadataRenderer.getMetadataFields(mmdField["kids"], value[i], depth + 1);
							
							metadataFields.push(field);
						}
					}
					else
					{
						var field = new MetadataField();
						
						field.name = (mmdField.label != null) ? mmdField.label : mmdField.name;
						
						field.layer = (mmdField.layer != null) ? mmdField.layer : 0.0;
						field.style = (mmdField.style != null) ? mmdField.style : "";
						
						field.composite_type = mmdField.type;
						
						//console.log("depth: "+depth+" | reading fields single-composite : "+ mmdField.name);
						
						field.value = MetadataRenderer.getMetadataFields(mmdField["kids"], value, depth + 1);
						
						metadataFields.push(field);
					}
				}
			}
		}
		
		else if(mmdField.collection != null)
		{
			mmdField = mmdField.collection;	
			// is field hidden?
			if(mmdField.hide == null || mmdField.hide == false)
			{					
				// is there data for the field?
				var valueName = (mmdField.tag != null) ? mmdField.tag : mmdField.name;				
				var value = metadata[valueName];
				
				if(value != null)
				{
					//console.log(mmdField.name + ": " + value);
					//console.log(mmdField.name + ": ");
					//console.log(mmdField);
					//console.log(value);
					
					var field = new MetadataField();
					
					field.name = (mmdField.label != null) ? mmdField.label : mmdField.name;
					
					field.layer = (mmdField.layer != null) ? mmdField.layer : 0.0;
					field.style = (mmdField.style != null) ? mmdField.style : "";
					
					field.child_type = (mmdField.child_tag != null) ? mmdField.child_tag : mmdField.child_type;
					
					//console.log("getting metadata fields collection : "+mmdField.name);
					field.value = MetadataRenderer.getMetadataFields(mmdField["kids"], value, depth + 1);
										
					metadataFields.push(field);
				}
			}
		}
		
	}
	metadataFields.sort(function(a,b){return b.layer - a.layer});	
	return metadataFields;
}

function MetadataQueueTask(url, container, isFirst)
{
	this.isFirst = isFirst;
	this.metadata = null;
	this.url = url;
	this.mmd = null;
	this.container = container;
}

MetadataRenderer.initMetadataRenderings = function()
{
	var divs = document.getElementsByTagName('div');
	for(var i = 0; i < divs.length; i++)
	{
		if(divs[i].className == "metadataRendering")
		{
			var location = divs[i].getElementsByTagName('a')[0];
			if(location != null)
			{
				location = location.href;
				MetadataRenderer.addFirstMetadataDisplay(divs[i], location);
			}
		}
	}
}







