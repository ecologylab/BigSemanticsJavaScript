/**
 * custom rendering for Twitter Metadata expansion
 */
//var CustomRenderer = {};

var metadataProcessor = null;
var requestDocumentDownload = null;

//var colors = ['#FFFFCC', '#BBE2FA', '#FAE3C8', '#D8CAE8', '#FFD0C9', '#D4DEFF', '#D5EEF2']; // use hex values
var colors = ['rgb(255, 255, 204)', 'rgb(187, 226, 250)', 'rgb(250, 227, 200)', 'rgb(216, 202, 232)',
              'rgb(255, 208, 201)', 'rgb(212, 222, 255)', 'rgb(213, 238, 242)']; // use rgb for direct comparison
var lastColorIndex = Math.floor(Math.random()*colors.length);

/**
 * Retrieves the target metadata and meta-metadata, constructs the metadata table, and appends it to the container.
 * @param container, the HTML object which the final metadata rendering will be appened into
 * @param url, url of the target document
 * @param isRoot, true if this is the root metadata for the rendering,
 * 		needed because styling is slightly different for the root metadata rendering
 */
MetadataRenderer.addMetadataDisplay = function(container, url, isRoot, clipping, expandedItem)
{	
	// Add the rendering task to the queue
	var task = new RenderingTask(url, container, isRoot, clipping, expandedItem)
	MetadataRenderer.queue.push(task);	
	
	if(clipping != null && clipping.rawMetadata != null)
	{
		clipping.rawMetadata.deserialized = true;
		MetadataRenderer.setMetadata(clipping.rawMetadata);
	}
	else
	{	
		// Fetch the metadata from the service
		//MetadataRenderer.getMetadata(url, "MetadataRenderer.setMetadata");	
	}
}

/**
 * Deserializes the metadata from the service and matches the metadata with a queued RenderingTask
 * If the metadata matches then retrieve the needed meta-metadata
 * @param rawMetadata, JSON metadata string returned from the semantic service
 */
MetadataRenderer.setMetadata = function(rawMetadata)
{	
	if(typeof MDC_rawMetadata != "undefined")
	{
		MDC_rawMetadata = JSON.parse(JSON.stringify(rawMetadata));
		updateJSON(true);
	}
	
	var metadata = rawMetadata;
//	var metadata = {};
	
	var deserialized = false;
//	for(i in rawMetadata)
//	{
//		if(i != "simpl.id" && i != "simpl.ref" && i != "deserialized")
//		{
//			metadata = rawMetadata[i];		
//			metadata.mm_name = i;
//		}
//		
//		if(i == "deserialized")
//		deserialized = true;
//	}
	
	if(!deserialized)
		simplDeserialize(metadata);

	//console.log("Retreived metadata: "+metadata.location);
	
	// Match the metadata with a task from the queue
	var queueTasks = [];
	
	if(metadata.location)
		queueTasks = MetadataRenderer.getTasksFromQueueByUrl(metadata.location);

	// Check additional locations for more awaiting MICE tasks
	if(metadata["additional_locations"])
	{
		//console.log("checking additional locations");
		//console.log(MetadataRenderer.queue);
		//console.log(metadata["additional_locations"]);
		for(var i = 0; i < metadata["additional_locations"].length; i++)
		{
			var additional_location = metadata["additional_locations"][i]
			queueTasks = queueTasks.concat(MetadataRenderer.getTasksFromQueueByUrl(additional_location));			
		}
	}
	
	for(var i = 0; i < queueTasks.length; i++)
	{
		var queueTask = queueTasks[i];
		
		if(metadata["additional_locations"])
			queueTask.additionalUrls = metadata["additional_locations"];
		
		queueTask.metadata = metadata;
		queueTask.mmdType = metadata.mm_name;
	
		if(queueTask.clipping != null)
			queueTask.clipping.rawMetadata = rawMetadata;
				
		//MetadataRenderer.getMMD(queueTask.mmdType, "MetadataRenderer.setMetaMetadata");
	}
	
	if(queueTasks.length < 0)
	{
		console.error("Retreived metadata: "+metadata.location+"  but it doesn't match a document from the queue.");
		console.log(MetadataRenderer.queue);
	}
}


/**
 * Create the metadataRendering, add it to the HTML container, and complete the RenderingTask
 * @param task, RenderingTask to complete 
 */
MetadataRenderer.createAndRenderMetadata = function(task)
{	
	// Create the interior HTML container
	task.visual = document.createElement('div');
	task.visual.className = "metadataContainer";
	
	// Build the HTML table for the metadata
	MetadataRenderer.currentDocumentLocation = task.url;
	var bgColor = MetadataRenderer.getNextColor(task.container);
	var metadataTable = MetadataRenderer.buildMetadataDisplay(task.isRoot, task.mmd, task.metadata, task.url, bgColor)
	
	if(metadataTable)
	{
		// Clear out the container so that it will only contain the new metadata table
		if(!task.isRoot)
		{
			while (task.container.hasChildNodes())
				task.container.removeChild(task.container.lastChild);
		}    
		    
		// Add the HTML5 canvas for the drawing of connection lines
		var canvas = document.createElement("canvas");
			canvas.className = "lineCanvas";
		
		// Add the table and canvas to the interior container
		task.visual.appendChild(metadataTable);
		task.visual.appendChild(canvas);
		
		// Add the interior container to the root contianer
		task.container.appendChild(task.visual);
		if (task.expandedItem && bgColor)
			task.expandedItem.style.background = bgColor;
		
		if (metadataProcessor)
			metadataProcessor(task.visual);
		
		if(MetadataRenderer.LoggingFunction)
		{
			var eventObj = {
				show_metadata: {
					primary_doc: task.url
				}
			}
			MetadataRenderer.LoggingFunction(eventObj);
		}
		
		// Create and add a new DocumentContainer to the list
		MetadataRenderer.documentMap.push( new DocumentContainer(task.url, task.additionalUrls, task.container, true, task.expandedItem, task.visual));
	
		// Remove any highlighting of documents as the addition of the new table will cause the connection-lines to be out of place
		MetadataRenderer.unhighlightDocuments(null);
		
		// For the WWW study, log the expansion of metadata
		if(WWWStudy)
			// Log the addition of the metadata rendering so that metadata expansions can be tracked
			WWWStudy.logExpansion(task.metadata, task.container);		
	}
	
	// If there isn't a metadata table to display then keep the old visual and remove the loading indicator
	else
		MetadataRenderer.clearLoadingRows(task.container);
	
	// Remove the RenderingTask from the queue
	MetadataRenderer.queue.splice(MetadataRenderer.queue.indexOf(task), 1);
}

/**
 * Converts the metadata into a set of metadataFields using the meta-metadata.
 * If there is visible metadata then create and return the HTML table.
 * @param isRoot, is the metadata the root document in the container (for styling)
 * @param mmd, meta-metadata for the given metadata
 * @param metadata, metadata to display
 * @return table, HTML table for the metadata or null if there is no metadata to display
 */
MetadataRenderer.buildMetadataDisplay = function(isRoot, mmd, metadata, taskUrl, bgColor)
{
	// Convert the metadata into a list of MetadataFields using the meta-metadata.
	var metadataFields = MetadataRenderer.getMetadataFields(mmd["meta_metadata"]["kids"], metadata, 0, null, taskUrl);
	
	// Is there any visable metadata?
	if(MetadataRenderer.hasVisibleMetadata(metadataFields))
	{
		// If so, then build the HTML table	
		var bgColorObj = {color: bgColor, bFirstField: true};
		return MetadataRenderer.buildMetadataTable(null, false, isRoot, metadataFields, FIRST_LEVEL_FIELDS, taskUrl, bgColorObj);
	}	
	else
		// The metadata doesn't contain any visible fields so there is nothing to display
		return null;	
}

/**
 * Build the HTML table for the list of MetadataFields
 * @param table, the table that the metadata fields should be rendered to, null if the table should be created
 * @param isChildTable, true if the table belongs to a collection table, false otherwise
 * @param isRoot, true if table is the root table of the MetadataRendering
 * @param metadataFields, array of MetadataFields to be displayed
 * @param fieldCount, the number of fields to render before cropping with a "More" button
 * @return HTML table of the metadata display
 */
MetadataRenderer.buildMetadataTable = function(table, isChildTable, isRoot, metadataFields, fieldCount, taskUrl, bgColorObj)
{
	if(!table)
	{
		table = document.createElement('div');
		
		if(isRoot)
		{
			table.className = "rootMetadataTableDiv";
			table.style.background = MetadataRenderer.makeTinge(bgColorObj.color);
			table.onclick = MetadataRenderer.stopEventPropagation;
		}
		else
		{
			table.className = "metadataTableDiv";
			// TODO: differentiate between downloaded to use tinged
			if (!isChildTable)
				table.style.background = 'white';
		}
	}
	
	// Iterate through the metadataFields which are already sorted into display order
	for(var i = 0; i < metadataFields.length; i++)
	{			
		
		var row = document.createElement('div');
		row.className = 'metadataRow';
					
		// if the maximum number of fields have been rendered then stop rendering and add a "More" expander
		if(fieldCount <= 0)
		{
			var nameCol = document.createElement('div');
				nameCol.className = "labelCol";
							
			var valueCol = document.createElement('div');
				valueCol.className = "valueCol";
							
			//TODO - add "more" expander
			var moreCount = metadataFields.length - i;
			
			var fieldValueDiv = document.createElement('div');
				fieldValueDiv.className = "moreButton";
				fieldValueDiv.textContent = "More... ("+moreCount+")";
				fieldValueDiv.onclick = MetadataRenderer.morePlease;
				fieldValueDiv.task_url = taskUrl;
						
			var moreData = {
				"fields": FIELDS_TO_EXPAND,
				"isChild": isChildTable,
				"data": metadataFields.slice(i, metadataFields.length)
			};
			
			
			
			var detailsSpan = document.createElement('span');
				detailsSpan.className = "hidden";
				detailsSpan.textContent = JSON.stringify(moreData);
			
			fieldValueDiv.appendChild(detailsSpan);
			
			valueCol.appendChild(fieldValueDiv);
								
			row.appendChild(nameCol);
			row.appendChild(valueCol);				
			
			table.appendChild(row);
			
			break;
		} 
			
		var metadataField = metadataFields[i];
		
		if(metadataField.value)
		{
			// If the field is an empty array then move on to the next field
			if(	metadataField.value.length != null && metadataField.value.length == 0)
				continue;
			
			if (metadataField.concatenates_to != null)
				continue;
			
			var expandButton = null;
			var fieldObj = MetadataRenderer.buildMetadataField(metadataField, isChildTable, fieldCount, row, taskUrl, bgColorObj);
			expandButton = fieldObj.expand_button;
			
			var fieldObjs = [];
			fieldObjs.push(fieldObj);

			var innerRow = null;
			if (metadataField.concatenates.length > 0)
			{
				innerRow = document.createElement('div');
				innerRow.className = 'metadataRow';
			}
			else
				innerRow = row;
			
			for (var j = 0; j < metadataField.concatenates.length; j++)
			{
				fieldObj = MetadataRenderer.buildMetadataField(metadataField.concatenates[j], isChildTable, fieldCount, row, taskUrl, bgColorObj);
				fieldObjs.push(fieldObj);
			}
							
			for (var j = 0; j < fieldObjs.length; j++)
			{
				var nameCol = fieldObjs[j].name_col;
				var valueCol = fieldObjs[j].value_col;
				fieldCount = fieldObjs[j].count;
				
				// append name and value in the needed order
				if (metadataField.label_at != null)
				{
					if (metadataField.label_at == "top" || metadataField.label_at == "bottom")
					{
						var innerTable = document.createElement('div');
						var row1 = document.createElement('div');
						var row2 = document.createElement('div');
						innerTable.style.display = 'table';
						row1.className = 'metadataRow';
						row2.className = 'metadataRow';
						if (metadataField.label_at == "top")
						{
							row1.appendChild(nameCol);							
							row2.appendChild(valueCol);
						}
						else
						{
							row1.appendChild(valueCol);							
							row2.appendChild(nameCol);
						}
						innerTable.appendChild(row1);
						innerTable.appendChild(row2);
						
						var td = document.createElement('div');
						td.style.display = 'table-cell';
						td.appendChild(innerTable);
						
						// to still make labels align well with fields having label_at left
						if (metadataField.concatenates.length == 0)
						{
							var tdDummy = document.createElement('div');
							tdDummy.style.display = 'table-cell';						
							innerRow.appendChild(tdDummy);
						}
						innerRow.appendChild(td);
					}						
					else if (metadataField.label_at == "right")
					{
						innerRow.appendChild(valueCol);
						innerRow.appendChild(nameCol);
					}
					else
					{
						innerRow.appendChild(nameCol);
						innerRow.appendChild(valueCol);
					}
				}
				else
				{
					innerRow.appendChild(nameCol);
					innerRow.appendChild(valueCol);
				}
			}
			
			if (metadataField.concatenates.length > 0)
			{
				// new table for inner row
				var outerTable = document.createElement('div');
				outerTable.style.display = 'table';
				outerTable.appendChild(innerRow);
				
				var tdOuter = document.createElement('div');
				tdOuter.style.display = 'table-cell';						
				tdOuter.appendChild(outerTable);
				
				var tdDummy1 = document.createElement('div');
				tdDummy1.style.display = 'table-cell';						

				row.appendChild(tdDummy1);
				row.appendChild(tdOuter);
			}
			table.appendChild(row);
			
			if (expandButton != null && metadataField.show_expanded_initially == "true") {
				var fakeEvent = {};
				fakeEvent.target = expandButton;
				fakeEvent.name = "fakeEvent";
				//console.log("fake event ready");
				MetadataRenderer.expandCollapseTable(fakeEvent);
				
				//TODO: introduce semantics for hiding after expand
				if (metadataField.composite_type == "tweet")
				{
					var buttonParent = expandButton.parentNode;
					buttonParent.removeChild(expandButton);
					//expandButton.style.visibility = "hidden";
				}
			}
		}
	}	
	return table;
}

/**
 * Build the HTML representation for MetadataField
 * @param metadataField, MetadataField to be rendered
 * @param isChildTable, true if the field is child of a collection table, false otherwise
 * @param fieldCount, the number of fields that are rendered before cropping with a "More" button
 * @param row, the containing element
 * @return HTML representation of the metadata field, expandButton, and fieldCount
 */
MetadataRenderer.buildMetadataField = function(metadataField, isChildTable, fieldCount, row, taskUrl, bgColorObj)
{
	var nameCol = document.createElement('div');
		nameCol.className = "labelCol";
	
	var valueCol = document.createElement('div');
		valueCol.className = "valueCol";
		
	var expandButton = null;	
	
	if(metadataField.scalar_type)
	{				
		// Currently it only rendered Strings, Dates, Integers, and ParsedURLs
		if(metadataField.scalar_type == "String" || metadataField.scalar_type == "Date" ||metadataField.scalar_type == "Integer" || metadataField.scalar_type == "ParsedURL")
		{	
			if(metadataField.name && !metadataField.hide_label)
			{
				var fieldLabelDiv = document.createElement('div');
					fieldLabelDiv.className = "fieldLabelContainer unhighlight";
				
				if (bgColorObj && bgColorObj.bFirstField)
					fieldLabelDiv.style.background = bgColorObj.color;
					
				var label = (metadataField.value_as_label == "" || (metadataField.value_as_label.type != "scalar"
					&& metadataField.value_as_label.type != "image"))? metadataField.name : metadataField.value_as_label.value;
				if (metadataField.value_as_label == "" || metadataField.value_as_label.type != "image")
				{
					var fieldLabel = document.createElement('p');
						fieldLabel.className = "fieldLabel";
						fieldLabel.innerText = MetadataRenderer.toDisplayCase(label);
						fieldLabel.textContent = MetadataRenderer.toDisplayCase(label);
						
					fieldLabelDiv.appendChild(fieldLabel);	
				}
				else if (metadataField.value_as_label.type == "image")
				{
					var img = document.createElement('img');
						img.className = "fieldLabelImage";
						img.src = MetadataRenderer.getImageSource(label);
						
					fieldLabelDiv.appendChild(img);	
				}			
				
				nameCol.appendChild(fieldLabelDiv);
			}
			
			// If the field is a URL then it should show the favicon and an A tag
			if(metadataField.scalar_type == "ParsedURL")
			{
				// Uses http://getfavicon.appspot.com/ to resolve the favicon
				var favicon = document.createElement('img');
					favicon.className = "faviconICE";
					favicon.src = "http://g.etfv.co/" + MetadataRenderer.getHost(metadataField.navigatesTo);
				
				var aTag = document.createElement('a');
				aTag.innerText = MetadataRenderer.removeLineBreaksAndCrazies(metadataField.value);
				aTag.textContent = MetadataRenderer.removeLineBreaksAndCrazies(metadataField.value);
				
				aTag.href = metadataField.value;
				aTag.onclick = MetadataRenderer.logNavigate;
				
				aTag.className = "fieldValue";
						
				if(metadataField.style != null)
					aTag.className += " "+metadataField.style;
			
				var fieldValueDiv = document.createElement('div');
					fieldValueDiv.className = "fieldValueContainer";
				if (bgColorObj && bgColorObj.bFirstField)
					aTag.style.background = bgColorObj.color;	
				
				fieldValueDiv.appendChild(favicon);
				fieldValueDiv.appendChild(aTag);
				valueCol.appendChild(fieldValueDiv);
			}
		
			// If the field navigates to a link then it should show the favicon and an A tag
			else if( metadataField.navigatesTo)
			{				
				// Uses http://getfavicon.appspot.com/ to resolve the favicon
				var favicon = document.createElement('img');
					favicon.className = "faviconICE";
					favicon.src = "http://g.etfv.co/" + MetadataRenderer.getHost(metadataField.navigatesTo);
				
				var aTag = document.createElement('a');
					aTag.className = "fieldValue";
					aTag.target = "_blank";
					aTag.innerText = MetadataRenderer.removeLineBreaksAndCrazies(metadataField.value);
					aTag.textContent = MetadataRenderer.removeLineBreaksAndCrazies(metadataField.value);
					
					aTag.href = metadataField.navigatesTo;
					aTag.onclick = MetadataRenderer.logNavigate;
										
					if(metadataField.style != null)
						aTag.className += " "+metadataField.style;
				var fieldValueDiv = document.createElement('div');
					fieldValueDiv.className = "fieldValueContainer";
				if (bgColorObj && bgColorObj.bFirstField)
					aTag.style.background = bgColorObj.color;	
				
				// For the current WWW study the rendering should have incontext CiteULike bookmarklets for specific types of metadata
				if(WWWStudy)				
					WWWStudy.addCiteULikeButton(fieldValueDiv, metadataField.parentMDType, metadataField.navigatesTo)						
				
				fieldValueDiv.appendChild(favicon);
				fieldValueDiv.appendChild(aTag);
				valueCol.appendChild(fieldValueDiv);
			}
			
			// If there is no navigation then just display the field value as text
			else
			{
				var fieldValue = document.createElement('p');
					fieldValue.className = "fieldValue";
					
				if (metadataField.extract_as_html)
				{
					fieldValue.innerHTML = MetadataRenderer.removeLineBreaksAndCrazies(metadataField.value);
				}
				else
				{
					fieldValue.innerText = MetadataRenderer.removeLineBreaksAndCrazies(metadataField.value);
					fieldValue.textContent = MetadataRenderer.removeLineBreaksAndCrazies(metadataField.value);
				}
					
				if(metadataField.style != null)
					fieldValue.className += " "+metadataField.style;
				var fieldValueDiv = document.createElement('div');
					fieldValueDiv.className = "fieldValueContainer";
				if (bgColorObj && bgColorObj.bFirstField)
					fieldValue.style.background = bgColorObj.color;
					
				fieldValueDiv.appendChild(fieldValue);
				valueCol.appendChild(fieldValueDiv);
			}
			
			if (bgColorObj && bgColorObj.bFirstField)
				bgColorObj.bFirstField = false;								
						
			fieldCount--;
		}		
	}
	
	else if (metadataField.composite_type != null && metadataField.composite_type == "image")
	{
		if(metadataField.name && !metadataField.hide_label)
		{
			var fieldLabelDiv = document.createElement('div');
				fieldLabelDiv.className = "fieldLabelContainer unhighlight";
			
			if (bgColorObj && bgColorObj.bFirstField)
				fieldLabelDiv.style.background = bgColorObj.color;
			
			var label = (metadataField.value_as_label == "" || (metadataField.value_as_label.type != "scalar"
				&& metadataField.value_as_label.type != "image"))? metadataField.name : metadataField.value_as_label.value;
			if (metadataField.value_as_label == "" || metadataField.value_as_label.type != "image")
			{
				var fieldLabel = document.createElement('p');
					fieldLabel.className = "fieldLabel";
					fieldLabel.innerText = MetadataRenderer.toDisplayCase(label);
					fieldLabel.textContent = MetadataRenderer.toDisplayCase(label);
				
				fieldLabelDiv.appendChild(fieldLabel);	
			}
			else if (metadataField.value_as_label.type == "image")
			{
				var img = document.createElement('img');
					img.className = "fieldLabelImage";
					img.src = MetadataRenderer.getImageSource(label);

				fieldLabelDiv.appendChild(img);
			}		
			
			nameCol.appendChild(fieldLabelDiv);
		}
		
		var img1 = document.createElement('img');
			img1.src = MetadataRenderer.getImageSource(metadataField.value);
		
		var fieldValueDiv = document.createElement('div');
			fieldValueDiv.className = "fieldValueContainer";
		
		fieldValueDiv.appendChild(img1);
		valueCol.appendChild(fieldValueDiv);
	}
	
	else if(metadataField.composite_type != null && metadataField.composite_type != "image")
	{
		/** Label Column **/
		var childUrl = MetadataRenderer.guessDocumentLocation(metadataField.value);
		
		var fieldLabelDiv = document.createElement('div');
			fieldLabelDiv.className = "fieldLabelContainer unhighlight";
			fieldLabelDiv.style.minWidth = "30px";					
			
		// Is the document already rendered?								
		if(childUrl != "" && MetadataRenderer.isRenderedDocument(childUrl)
							/*|| childUrl.toLowerCase() == taskUrl)*/)
		{
			// If so, then don't allow the document to be expaned, to prevent looping						
			fieldLabelDiv.className = "fieldLabelContainerOpened unhighlight";				
		}
		else
		{
			// If the document hasn't been download then display a button that will download it
			expandButton = document.createElement('div');
				expandButton.className = "expandButton";
			
			expandButton.onclick = MetadataRenderer.downloadAndDisplayDocument;
			expandButton.task_url = taskUrl;
			
			if(childUrl != ""/* && childUrl.toLowerCase() != taskUrl*/)
			{
				expandButton.onmouseover = MetadataRenderer.highlightDocuments;
				expandButton.onmouseout = MetadataRenderer.unhighlightDocuments;
			}
					
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
		
		if(metadataField.name)
		{													
			//If the table isn't a child table then display the label for the composite
			if((!isChildTable || (metadataField.composite_type == "tweet")) && !metadataField.hide_label)
			{				
				var label = (metadataField.value_as_label == "" || (metadataField.value_as_label.type != "scalar"
					&& metadataField.value_as_label.type != "image"))? metadataField.name : metadataField.value_as_label.value;
				if (metadataField.value_as_label == "" || metadataField.value_as_label.type != "image")
				{
					var fieldLabel = document.createElement('p');
						fieldLabel.className = "fieldLabel";
						fieldLabel.innerText = MetadataRenderer.toDisplayCase(label);
						fieldLabel.textContent = MetadataRenderer.toDisplayCase(label);
					
					fieldLabelDiv.appendChild(fieldLabel);
				}
				else if (metadataField.value_as_label.type == "image")
				{
					var img = document.createElement('img');
						img.className = "fieldLabelImage";
						img.src = MetadataRenderer.getImageSource(label);

					fieldLabelDiv.appendChild(img);
				}
			}
		}
		
		//if (childUrl.toLowerCase() != taskUrl)
			nameCol.appendChild(fieldLabelDiv);
		
		/** Value Column **/
		
		var fieldValueDiv = document.createElement('div');
			fieldValueDiv.className = "fieldCompositeContainer";

		// Build the child table for the composite
		var childTable =  MetadataRenderer.buildMetadataTable(null, false, false, metadataField.value, 1, taskUrl, bgColorObj);
		
		// If the childTable has more than 1 row, collapse table
		if(metadataField.value.length > 1)
			MetadataRenderer.collapseTable(childTable);			
		
		fieldValueDiv.appendChild(childTable);				
		
		var nestedPad = document.createElement('div');
			nestedPad.className = "nestedPad";
		
		nestedPad.appendChild(childTable);
		
		fieldValueDiv.appendChild(nestedPad);
		
		//if (childUrl.toLowerCase() != taskUrl)
			valueCol.appendChild(fieldValueDiv);
		
		// Add the unrendered document to the documentMap
		if(childUrl != "" /* && childUrl.toLowerCase() != taskUrl*/)
			MetadataRenderer.documentMap.push(new DocumentContainer(childUrl, null, row, false, null, null));
		
		// Add event handling to highlight document connections	
		if(childUrl != "" /* && childUrl.toLowerCase() != taskUrl*/)
		{	
			nameCol.onmouseover = MetadataRenderer.highlightDocuments;
			nameCol.onmouseout = MetadataRenderer.unhighlightDocuments;
		}
		
		if (metadataField.composite_type == "tweet")
		{
			fieldValueDiv.onmouseover = MetadataRenderer.highlightTweet;
			fieldValueDiv.onmouseout = MetadataRenderer.unhighlightTweet;
			fieldValueDiv.onclick = MetadataRenderer.collapseOrScrollToExpandedItem;
		}
		
		fieldCount--;
	}
	
	else if(metadataField.child_type != null)
	{		
		if(metadataField.name != null)
		{
			var fieldLabelDiv = document.createElement('div');
			fieldLabelDiv.className = "fieldLabelContainer unhighlight";
		
			// does it need to expand / collapse
			if(metadataField.value.length > 1)
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
			
			var label = (metadataField.value_as_label == "" || (metadataField.value_as_label.type != "scalar"
				&& metadataField.value_as_label.type != "image"))? metadataField.name : metadataField.value_as_label.value;
			if (metadataField.value_as_label == "" || metadataField.value_as_label.type != "image")
			{
				var fieldLabel = document.createElement('p');
					fieldLabel.className = "fieldLabel";
					fieldLabel.innerText = MetadataRenderer.toDisplayCase(label) + "(" + metadataField.value.length + ")";
					fieldLabel.textContent = MetadataRenderer.toDisplayCase(label) + "(" + metadataField.value.length + ")";
					
				if (!metadataField.hide_label)
					fieldLabelDiv.appendChild(fieldLabel);
			}
			else if (metadataField.value_as_label.type == "image")
			{
				var img = document.createElement('img');
					img.className = "fieldLabelImage";
					img.src = MetadataRenderer.getImageSource(label);

				if (!metadataField.hide_label)
					fieldLabelDiv.appendChild(img);
			}		
			
			nameCol.appendChild(fieldLabelDiv);
		}
			
		var fieldValueDiv = document.createElement('div');
			fieldValueDiv.className = "fieldChildContainer";
		
		var childTable =  MetadataRenderer.buildMetadataTable(null, true, false, metadataField.value, 1, taskUrl, bgColorObj);
		if(metadataField.value.length > 1)
		{
			MetadataRenderer.collapseTable(childTable);			
		}					
			
		var nestedPad = document.createElement('div');
			nestedPad.className = "nestedPad";
		
		nestedPad.appendChild(childTable);
		
		fieldValueDiv.appendChild(nestedPad);
		
		valueCol.appendChild(fieldValueDiv);
						
		fieldCount--;
	}
	return {name_col: nameCol, value_col: valueCol, count: fieldCount, expand_button: expandButton};
}

/**
 * Get the table that corresponds to the given button through the DOM
 * @param button, HTML object of the button
 * @return corresponding table HTML object  
 */
MetadataRenderer.getTableForButton = function(button)
{
	var table = button.parentElement.parentElement.parentElement.getElementsByClassName("valueCol")[0];
	
	// label_at top or bottom
	if (table == null)
	{
		var sibling = (button.parentElement.parentElement.parentElement.nextSibling == null) ?
			button.parentElement.parentElement.parentElement.previousSibling : 
			button.parentElement.parentElement.parentElement.nextSibling; 
		table = sibling.getElementsByClassName("valueCol")[0];
	}
	
	do
	{
		var rowsFound = false;
		var elts = table.childNodes;
		for (var i = 0; i < elts.length; i++)
		{
			if (elts[i].className == "metadataRow")
			{
				rowsFound = true;
				break;
			}
		}
		
		if (rowsFound)
			break;
		else
			table = table.firstChild;
		
	} while (table);
	
	//while(table.rows.length == 0)
		//table = table.getElementsByTagName("table")[0];
		
	return table;
}

MetadataRenderer.getLocationForParentTable = function(element)
{
	while(element.className != "metadataTableDiv" && element.className != "rootMetadataTableDiv")
	{
		element = element.parentElement;
	}
	
	var aTags = element.getElementsByTagName("a");
	if(aTags.length > 0)
	{
		console.log("parentTable loc: " + aTags[0].href);
		return aTags[0].href;	
	}	
	return "none";
}

MetadataRenderer.getLocationForChildTable = function(element)
{
	var valueCol = element.getElementsByClassName("valueCol")[0];
	
	// label_at top or bottom
	if (valueCol == null)
	{
		var sibling = (element.nextSibling == null) ? element.previousSibling : element.nextSibling; 
		valueCol = sibling.getElementsByClassName("valueCol")[0];
	}
	
	if (valueCol)
	{
		var tables = valueCol.getElementsByClassName("metadataTableDiv");
		
		if (tables.length > 0)
		{
			table = tables[0];
			
			var aTags = table.getElementsByTagName("a");
			if(aTags.length > 0)
			{
				console.log("childTable loc: " + aTags[0].href);
				return aTags[0].href;
			}
		}
	}
	return "none";
}

/**
 * Queue the target document for downloading and display
 * @param event, mouse click event
 */
MetadataRenderer.downloadAndDisplayDocument = function(event)
{
	var button = event.target;
	
	if(button.className == "collapseSymbol" || button.className == "expandSymbol")
		button = button.parentElement;
	
	// Update button visuals
	var expandSymbol = button.getElementsByTagName("div")[0];
		expandSymbol.style.display = "none";
		
		button.className = "collapseButton";
		
	
	// Change the onclick function of the button to expand/collapse the table
	button.onclick = MetadataRenderer.expandCollapseTable;
	var taskUrl = button.task_url;
		
	var table = MetadataRenderer.getTableForButton(button);
		
	// Search the table for the document location
	var location = null;
	var rows = [];
	var elts = table.childNodes;
	
	for (var i = 0; i < elts.length; i++)
		if (elts[i].className == "metadataRow")
			rows.push(elts[i]);
	
	for (var i = 0; i < rows.length; i++)
	{
		var valueCol = rows[i].childNodes[1];
		if(valueCol)
		{
			var valueDiv = valueCol.getElementsByTagName("div")[0];
			if(valueDiv)
				for (var j = 0; j < valueDiv.childNodes.length; j++)
					if(valueDiv.childNodes[j].href != null && valueDiv.childNodes[j].className != "citeULikeButton" && location == null)
						location = valueDiv.childNodes[j].href;
		}
	}

	// Did the table have a document location?
	if(location && location.toLowerCase() != taskUrl)
	{
		button.location = location;
		
		// Add a loadingRow for visual feedback that the metadata is being downloaded / parsed
		table.appendChild(MetadataRenderer.createLoadingRow());
		
		MetadataRenderer.addMetadataDisplay(table.parentElement, location, false, null, button);
		if (requestDocumentDownload)
			requestDocumentDownload(location);
	}
	// If there was no document location then the table must be a non-document composite in which case just expand
	else
		MetadataRenderer.expandTable(table);
	
	if (event.stopPropagation)
		event.stopPropagation();
	
	if(MetadataRenderer.LoggingFunction)
	{			
		var eventObj = {};
			
		if(location == null)
		{	
			if (button.parentElement.childNodes[1])
			{
				eventObj = {
					expand_metadata: {
						field_name: button.parentElement.childNodes[1].innerText,
						parent_doc: MetadataRenderer.getLocationForParentTable(button.parentElement)
					}
				};
			}
			else
			{
				eventObj = {
					expand_metadata: {
						parent_doc: MetadataRenderer.getLocationForParentTable(button.parentElement)
					}
				};
			}
		}
		else
		{
			eventObj = {
				expand_metadata: {
					target_doc: MetadataRenderer.getLocationForChildTable(button.parentElement.parentElement.parentElement)
				}
			};
		}
		MetadataRenderer.LoggingFunction(eventObj);
	}
}

/**
 * Finds matching documents, highlights them, and draws connecting lights
 * @param event, mouse enter event 
 */
MetadataRenderer.highlightDocuments = function(event)
{
	var row = event.srcElement;
	if(row.className == "expandButton")
		row = row.parentElement;
	
	// Only fieldLabelContainer or fieldLabelContainerOpened rows can be highlighted
	if(row.className.indexOf("fieldLabelContainerOpened") == 0 || row.className.indexOf("fieldLabelContainer") == 0)
	{
		// Highlight row
		MetadataRenderer.highlightLabel(row);
		
		var table = row.parentElement.parentElement.getElementsByClassName("valueCol")[0];
		
		// label_at top or bottom
		if (table == null)
		{
			var sibling = (button.parentElement.parentElement.nextSibling == null) ?
				button.parentElement.parentElement.previousSibling : 
				button.parentElement.parentElement.nextSibling; 
			table = sibling.getElementsByClassName("valueCol")[0];
		}
		
		// Search the table for a document location
		var location = null;
		
		var aTags = table.getElementsByTagName("a");
		for (var i = 0; i < aTags.length; i++)
		{
			if(aTags[i].className.indexOf("fieldValue") != -1)
			{
				location = aTags[i].href;
				break;
			}
		}
		// Did the table have a document location?
		if(location != null)
		{	
			MetadataRenderer.clearAllCanvases();		
						
			// Find matches in the DocumentMap
			var matches = [];
			for(var i = 0; i < MetadataRenderer.documentMap.length; i++)
			{
				if(MetadataRenderer.documentMap[i].matches(location))
				{
					if(MetadataRenderer.documentMap[i].container.style.display != "none")
						matches.push(MetadataRenderer.documentMap[i].container);
				}	
			}
			
			//console.log(location);
			// Draw the lines to each match
			for(var i = 0; i < matches.length; i++)			
			{
				MetadataRenderer.drawConnectionLine(matches[i], row);		
			}			
		}
	}
	return false;
}

/**
 * Draw a line connecting the target to the source
 * @param target HTML object
 * @param source HTML source
 */
MetadataRenderer.drawConnectionLine = function(target, source)
{
	// Don't draw connection lines in ideaMACHE
	if(typeof session != "undefined")
	{
		return;
	}
	
	
	// Get the first label of the target
	var label = target.getElementsByClassName("fieldLabel")[0];
	
	// Highlight the target label
	if (label)
		MetadataRenderer.highlightLabel(label.parentElement);
	else
		label = target.getElementsByClassName("valueCol")[0];

	// Get the canvas
	var canvas = null;
	
	if(WWWStudy)
		canvas = document.getElementById("bigLineCanvas");
	
	else
	{
		var canvases = document.getElementsByClassName("lineCanvas");
		
		// TODO - fix canvas finding, needs to find the least common canvas,
		// the smallest canvas that contains both target and source
		/*
		for(var i = canvases.length - 1; i >= 0; i--)
		{	
			canvases[i];	
		}
		*/
		// for the moment just use the biggest canvas
		canvas = canvases[canvases.length - 1];		
	}
		
	var startRect = label.getClientRects()[0];
	var endRect = source.getClientRects()[0];	
		
	// Don't draw the line if the source and target are in the same container
	if(canvas != null && Math.abs(startRect.top - endRect.top) > 12)
	{	
		var ctx = canvas.getContext('2d');
			
		var containerRect = canvas.parentElement.getClientRects()[0];
						
		ctx.moveTo(startRect.left - containerRect.left + METADATA_LINE_X_OFFSET, startRect.top - containerRect.top + METADATA_LINE_Y_OFFSET);
		ctx.lineTo(1, startRect.top - containerRect.top + METADATA_LINE_Y_OFFSET);
		ctx.lineTo(1, endRect.top - containerRect.top + METADATA_LINE_Y_OFFSET);
		ctx.lineTo(endRect.left - containerRect.left + METADATA_LINE_X_OFFSET, endRect.top - containerRect.top + METADATA_LINE_Y_OFFSET);
		ctx.strokeStyle = "rgba(200, 44, 4, 0.4)";
		ctx.lineWidth = 3;
		ctx.lineCap = "round";
		ctx.stroke();
	}
	
}

/**
 * Expand or collapse a collection or composite field table.
 * @param event, mouse click event 
 */
MetadataRenderer.expandCollapseTable = function(event)
{
	var button = event.target;
	
	if(button.className == "collapseSymbol" || button.className == "expandSymbol")
		button = button.parentElement;
		
	// Use the symbold to check if the table should expand or collapse
	var expandSymbol = button.getElementsByTagName("div")[0];
	if(expandSymbol.style.display == "block")
	{
		expandSymbol.style.display = "none";	
		button.className = "collapseButton";
		
		var table = MetadataRenderer.getTableForButton(button);
		MetadataRenderer.expandTable(table);
		
		if(MetadataRenderer.LoggingFunction && (event.name == null || event.name != "fakeEvent"))
		{			
			var eventObj = {};
			if(typeof button.location === "undefined")
			{
				if(button.parentElement.childNodes[1])
				{
					eventObj = {
						expand_metadata: {
							field_name: button.parentElement.childNodes[1].innerText,
							parent_doc: MetadataRenderer.getLocationForParentTable(button.parentElement)
						}
					};
				}
				else
				{
					eventObj = {
						expand_metadata: {
							parent_doc: MetadataRenderer.getLocationForParentTable(button.parentElement)
						}
					};
				}
			}
			else
			{
				eventObj = {
					expand_metadata: {
						target_doc: MetadataRenderer.getLocationForChildTable(button.parentElement.parentElement.parentElement)
					}
				};
			}
			MetadataRenderer.LoggingFunction(eventObj);
		}
	}
	else if(expandSymbol.style.display == "none")
	{
		expandSymbol.style.display = "block";			
		button.className = "expandButton";
		
		var table = MetadataRenderer.getTableForButton(button);
		MetadataRenderer.collapseTable(table);
		
		if(MetadataRenderer.LoggingFunction)
		{
			var eventObj = {};
			if(typeof button.location === "undefined")
			{
				if (button.parentElement.childNodes[1])
				{
					eventObj = {
						collapse_metadata: {
							field_name: button.parentElement.childNodes[1].innerText,
							parent_doc: MetadataRenderer.getLocationForParentTable(button.parentElement)
						}
					};
				}
				else
				{
					eventObj = {
						collapse_metadata: {
							parent_doc: MetadataRenderer.getLocationForParentTable(button.parentElement)
						}
					};
				}
			}
			else
			{
				
				eventObj = {
					collapse_metadata: {
						target_doc: MetadataRenderer.getLocationForChildTable(button.parentElement.parentElement.parentElement)
					}
				};
			}
			MetadataRenderer.LoggingFunction(eventObj);
		}	
	}
	
	// condition added for fakeEvent in case of show_expanded_initially
	if (event.stopPropagation)
		event.stopPropagation();
}

/**
 * Expand the table, showing all of its rows
 * @param table to expand 
 */
MetadataRenderer.expandTable = function(table)
{
	var rows = [];
	var elts = table.childNodes;
	
	for (var i = 0; i < elts.length; i++)
		if (elts[i].className == "metadataRow")
			rows.push(elts[i]);
	
	for (var i = 0; i < rows.length; i++)
	{
		rows[i].style.display = "table-row";
		if (metadataProcessor)
			metadataProcessor(rows[i]);
	}

	// Remove any loading rows, just to be sure 	
	MetadataRenderer.clearLoadingRows(table);
	
	// Unlight the documents because the connection lines will be in the wrong place
	MetadataRenderer.unhighlightDocuments(null);
	
	// Check for More and expand it
	if(table.lastChild.lastChild.lastChild.className == "moreButton")
		MetadataRenderer.morePlease({"target": table.lastChild.lastChild.lastChild});
}

/**
 * Collapse the table, showing only the first row
 * @param table to collapse 
 */
MetadataRenderer.collapseTable = function(table)
{
	var rows = [];
	var elts = table.childNodes;
	
	for (var i = 0; i < elts.length; i++)
		if (elts[i].className == "metadataRow")
			rows.push(elts[i]);
	
	for (var i = 0; i < rows.length; i++)
	{
		if(i == 0)
			rows[i].style.display = "table-row";
		else
			rows[i].style.display = "none";
	}
	
	// Remove any loading rows, just to be sure 	
	MetadataRenderer.clearLoadingRows(table);
	
	// Unlight the documents because the connection lines will be in the wrong place
	MetadataRenderer.unhighlightDocuments(null);
}

MetadataRenderer.morePlease = function(event)
{
	var moreData = JSON.parse(event.target.lastChild.textContent);
	
	var parentRow =  event.target.parentElement.parentElement;
	var parentTable = parentRow.parentElement;
	
	var taskUrl = event.target.task_url;
	//remove More Button	
	parentTable.removeChild(parentRow);
	
	// Build and add extra rows
	MetadataRenderer.buildMetadataTable(parentTable, moreData.isChild, false, moreData.data, moreData.fields, null, taskUrl);
	
	// TODO add logging for the 'More' button
	
}

MetadataRenderer.isFieldVisible = function(mmdField, metadata, url)
{
	if (mmdField["styles"])
	{
		var style = mmdField["styles"][0];
		var location = metadata[mmdField["name"]].location; 
		if (style.is_child_metadata == "true" && style.hide == "true" 
				&& url && location && location.toLowerCase() == url)
			return false;
	}
	
	return mmdField.hide == null || mmdField.hide == false || mmdField.always_show == "true";
}

MetadataRenderer.getImageSource = function(mmdField)
{
	for (var i = 0; i < mmdField.length; i++)
		if (mmdField[i].name == "location")
			return mmdField[i].value;
	
	return null;
}

/**
 * Get a suitable color for the expansion
 * @param container, element that contains expansion
 */
MetadataRenderer.getNextColor= function(container)
{
	var index = -1;
	if (container.colors && (container.colors.length < colors.length))
	{
		var i = 0;
		// iterate to find unused color
		while (i < container.colors.length - 1)
		{
			if (container.colors[i+1] != (container.colors[i] + 1))
			{
				index = container.colors[i] + 1;
				break;
			}
			i++;
		}
		
		if (i == container.colors.length - 1)
			index = (container.colors[i] + 1) % colors.length;
		
		if (index == -1)
			index = (++lastColorIndex) % colors.length;
		else
			lastColorIndex = index;
	}
	else
	{
		container.colors = [];
		index = (++lastColorIndex) % colors.length;		
	}
	
	container.colors.push(index);
	container.colors.sort();
	
    return colors[index];
}

/**
 * Removes the color from list of used colors
 * @param container, element that contained the expansion
 * @param color, color used for the expansion
 */
MetadataRenderer.removeColor = function(container, color)
{
	for (var i = 0; i < container.colors.length; i++)
	{
		if (color == colors[container.colors[i]])
		{
			container.colors.splice(i, 1);
			break;
		}
	}
}

/**
 * 
 */
MetadataRenderer.makeTinge = function(color)
{
	var rgb = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/i.exec(color);
	var r = parseInt(rgb[1]);
	var g = parseInt(rgb[2]);
	var b = parseInt(rgb[3]);
	r = r + Math.floor((255 - r) * 0.75);
	g = g + Math.floor((255 - g) * 0.75);
	b = b + Math.floor((255 - b) * 0.75);
	return 'rgb(' + r + ", " + g + ", " + b + ")";
}

MetadataRenderer.highlightTweet = function(event)
{
	var fieldValueDiv = event.currentTarget;
	fieldValueDiv.className = "fieldCompositeContainer highlightTweet";
}

MetadataRenderer.unhighlightTweet = function(event)
{
	var fieldValueDiv = event.currentTarget;
	fieldValueDiv.className = "fieldCompositeContainer";
}

MetadataRenderer.collapseOrScrollToExpandedItem = function(event)
{
	var elt = event.target;
	var y = 0;        
    while (elt && (typeof elt.offsetTop !== "undefined") && !isNaN(elt.offsetTop))
    {
    	y += elt.offsetTop;
    	elt = elt.offsetParent;
    }
    if (window.pageYOffset > y)
    {
    	window.scrollTo(window.scrollLeft, (y - 50));
    	/*var animateScroll = function() {
    		if ((window.pageYOffset - (y-50)) > 0)
    		{
	    		var scroll = (window.pageYOffset - (y-50)) > 100?
	    									100 : (window.pageYOffset - (y-50));    		
	        	window.scrollTo(window.scrollLeft, (window.pageYOffset - scroll));
	        	setTimeout(animateScroll, 10);
    		}
        };
        animateScroll();*/
    }
}

MetadataRenderer.stopEventPropagation = function(event)
{
	event.stopPropagation();
}

/**
 * RenderingTask represents a metadata rendering that is in progress of being downloaded and parsed
 * @param url of the document
 * @param container, HTML container which will hold the rendering
 * @param isRoot, true if this is the root document for a metadataRendering
 * @param expandedItem, a non-metadata item for which the display was constructed
 */
function RenderingTask(url, container, isRoot, clipping, expandedItem)
{
	if(url != null)
		this.url = url.toLowerCase();
	
	this.container = container;
	this.clipping = clipping;
	
	this.metadata = null;	
	this.mmd = null;
	
	this.isRoot = isRoot;
	this.expandedItem = expandedItem;
}

/**
 * Does the given url match the RenderingTask's url?
 * @param url, url to check against the RenderingTask
 */
RenderingTask.prototype.matches = function(url)
{
	url = url.toLowerCase();
	if(this.url.indexOf(url) == 0)
		return true;
		
	else if(url.indexOf(this.url) == 0)
		return true;

	return false;
}

/**
 * DocumentContain represents a document that is part of a MetadataRendering
 * @param url, location of the document, serves as the document ID
 * @param container, HTML object which contains the rendering of this document
 * @param rendered, true if the document has been downloaded and displayed, false otherwise
 * @param expandedItem, a non-metadata item for which the display was constructed
 */
function DocumentContainer(url, additionalUrls, container, rendered, expandedItem, visual)
{
	this.urls = [];
	this.urls.push(url.toLowerCase());
	
	if(additionalUrls)
	{
		for(var i = 0; i < additionalUrls.length; i++)
		{
			this.urls.push(additionalUrls[i].toLowerCase());
		}
	}
		
	this.container = container;
	this.rendered = rendered;
	this.expandedItem = expandedItem;
	this.visual = visual;
}

/**
 * Does the given url match the DocumentContainer's?
 * @param url, url to check against the DocumentContainer
 */
DocumentContainer.prototype.matches = function(url)
{
	url = url.toLowerCase();
	for(var i = 0; i < this.urls.length; i++)
	{
		if(this.urls[i].length > 1)
		{		
			if(this.urls[i].indexOf(url) == 0)
			{
				return true;
			}
			else if(url.indexOf(this.urls[i]) == 0)
			{
				return true;
			}
		}
	}
	return false;
}

/**
 * Does the given item match the DocumentContainer's?
 * @param item, expandedItem to check against the DocumentContainer
 * @return DocumentContainer if there's a match, null otherwise
 */
MetadataRenderer.getDocumentContainerByExpandedItem = function(item)
{
	for(var i = 0; i < MetadataRenderer.documentMap.length; i++)
		if(MetadataRenderer.documentMap[i].expandedItem == item)
			return MetadataRenderer.documentMap[i];

	return null;
}

/**
 * show the metadata display
 * @param expandedItem, item for which display was constructed
 */
MetadataRenderer.showMetadataDisplay = function(expandedItem)
{
	var dc = MetadataRenderer.getDocumentContainerByExpandedItem(expandedItem);
	if (dc)
	{
		// metadata display
		dc.visual.style.display = "";
		
		if(MetadataRenderer.LoggingFunction)
		{
			var eventObj = {
				show_metadata: {
					primary_doc: dc.urls[0]
				}
			}
			MetadataRenderer.LoggingFunction(eventObj);
		}		
	}
}

/**
 * hide the metadata display
 * @param expandedItem, item for which display was constructed
 */
MetadataRenderer.hideMetadataDisplay = function(expandedItem)
{
	var dc = MetadataRenderer.getDocumentContainerByExpandedItem(expandedItem);
	if (dc)
	{
		// metadata display
		dc.visual.style.display = "none";
		
		if(MetadataRenderer.LoggingFunction)
		{
			var eventObj = {
				hide_metadata: {
					primary_doc: dc.urls[0]
				}
			}
			MetadataRenderer.LoggingFunction(eventObj);
		}				
	}
}

/**
 * Sets the processing function for metadata
 * @param fnMetadataProcessor, metadata processing function
 */
MetadataRenderer.setMetadataProcessor = function(fnMetadataProcessor)
{
	metadataProcessor = fnMetadataProcessor;
}

/**
* Sets the function for requesting document download
* @param fnRequestDownload
*/
MetadataRenderer.setDocumentDownloader = function(fnDownloadRequester)
{
	requestDocumentDownload = fnDownloadRequester;
}