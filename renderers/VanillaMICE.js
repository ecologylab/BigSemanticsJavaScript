/*
 * The most basic MICE - it loves walks down the breach and drinking pumpkin spice lattes
 * 
 * Kindly remember to not overwrite any functions you see here. use your own namespace!
 */

//MICE renders the metaData for the MICE interface
var MICE = {};
var FIRST_LEVEL_FIELDS = 20;
var FIELDS_TO_EXPAND = 10;
// The documentMap contains a list of DocumentContainers for each found metadata object, both retrieved and not.

 /**
 * Initializes MICE.
 * 
 * Hunts for elements of class 'metadataRendering' and adds MICE displays for the URLS it
 * finds there
 */

MICE.initialize = function(){
	
	var miceRenderings = document.getElementsByClassName('ecologylab-metadataRendering');

	
	for(var i = 0; i < miceRenderings.length; i++)
	{
		console.log("called");
		var location = miceRenderings[i].getElementsByTagName('a')[0];
		if(location)
			
			RendererBase.addMetadataDisplay(miceRenderings[i], location.href, null, MICE.render);
	}
}

MICE.render = function(task){
	
	var metadataFields = task.fields;
	var styleInfo = task.style;
	// Create the interior HTML container
	task.visual = document.createElement('div');
	task.visual.className = styleInfo.styles.metadataContainer;
	task.visual.setAttribute('mdType', metadataFields[0].parentMDType);

	// Build the HTML table for the metadata
	// MetadataLoader.currentDocumentLocation = task.url;
	
	var metadataTable = MICE.buildMetadataTable(null, false, task.isRoot, metadataFields, FIRST_LEVEL_FIELDS, styleInfo);
	if(metadataTable)
	{
		// Clear out the container so that it will only contain the new metadata table
		while (task.container.hasChildNodes())
		    task.container.removeChild(task.container.lastChild);
		    
		// Add the HTML5 canvas for the drawing of connection lines
		var canvas = document.createElement("canvas");
			canvas.className = styleInfo.styles.lineCanvas;
		
		// Add the table and canvas to the interior container
		task.visual.appendChild(metadataTable);
		task.visual.appendChild(canvas);
		
		// Add the interior container to the root contianer
		task.container.appendChild(task.visual);
		
		// Create and add a new DocumentContainer to the list
		RendererBase.documentMap.push( new DocumentContainer(task.url, task.additionalUrls, task.container, true));
	
		// Remove any highlighting of documents as the addition of the new table will cause the connection-lines to be out of place
		MICE.unhighlightDocuments(null, styleInfo);
		
	}
	
	// If there isn't a metadata table to display then keep the old visual and remove the loading indicator
	else
		MICE.clearLoadingRows(task.container, styleInfo);
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
MICE.buildMetadataTable = function(table, isChildTable, isRoot, metadataFields, fieldCount, styleInfo)
{
	if(!table)
	{
		table = document.createElement('div');
		table.className = styleInfo.styles.metadataTableDiv;
		
		//if(!isRoot)
		//	table.className = "metadataTable";
	}
	
	// console.log(metadataFields);
	
	// Iterate through the metadataFields which are already sorted into display order
	for(var i = 0; i < metadataFields.length; i++)
	{			
		var row = document.createElement('div');
		row.className = styleInfo.styles.metadataRow;
		if(metadataFields[i].composite_type != null && metadataFields[i].composite_type != undefined && metadataFields[i].value.length > 0){
			var field = metadataFields[i];
			var value = field.value[0];
			var link = value.navigatesTo;
			var childUrl = link;
			//Should we add to map?
			
		}			
		// if the maximum number of fields have been rendered then stop rendering and add a "More" expander
		
		if(fieldCount <= 0)
		{
			var nameCol = document.createElement('div');
				nameCol.className = styleInfo.styles.labelColShowDiv;
							
			var valueCol = document.createElement('div');
				valueCol.className = styleInfo.styles.valueColShowDiv;
			
			//TODO - add "more" expander
			var moreCount = metadataFields.length - i;
			
			var fieldValueDiv = document.createElement('div');
				fieldValueDiv.className = styleInfo.styles.moreButton;
				fieldValueDiv.textContent = "More... ("+moreCount+")";
				fieldValueDiv.onclick = MICE.morePlease;
						
			var moreData = {
				"fields": FIELDS_TO_EXPAND,
				"isChild": isChildTable,
				"data": metadataFields.slice(i, metadataFields.length),
				"type": styleInfo.type
			};
			
			var detailsSpan = document.createElement('span');
				detailsSpan.className = styleInfo.styles.hidden;
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
			var fieldObj = MICE.buildMetadataField(metadataField, isChildTable, fieldCount, row, styleInfo, metadataFields[0].navigatesTo);
			expandButton = fieldObj.expand_button;

			var fieldObjs = [];
			fieldObjs.push(fieldObj);

			var innerRow = null;
			if (metadataField.concatenates.length > 0)
			{
				innerRow = document.createElement('div');
				innerRow.className = styleInfo.styles.metadataRow;
			}
			else
				innerRow = row;
			
			for (var j = 0; j < metadataField.concatenates.length; j++)
			{
				fieldObj = MICE.buildMetadataField(metadataField.concatenates[j], isChildTable, fieldCount, row, styleInfo, metadataFields[0].navigatesTo);
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
						row1.className = styleInfo.styles.metadataRow;
						row2.className = styleInfo.styles.metadataRow;
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
			
			if (expandButton != null && (metadataField.show_expanded_initially == "true"
										|| metadataField.show_expanded_always == "true")) {
				var fakeEvent = {};
				fakeEvent.target = expandButton;
				// console.log("fake event ready");
				MICE.expandCollapseTable(fakeEvent);
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
 * @return HTML representation of the metadata field, and related properties
 */
MICE.buildMetadataField = function(metadataField, isChildTable, fieldCount, row, styleInfo, parentUrl)
{
	var imageLabel = (metadataField.value_as_label == "") ?	false : metadataField.value_as_label.type == "image";
	
	var nameCol = document.createElement('div');
	if (!metadataField.show_expanded_always ){	
		nameCol.className = styleInfo.styles.labelCol;
	}
	else if(metadataField.composite_type != null && metadataField.composite_type != "image" && !imageLabel){
		nameCol.className = styleInfo.styles.labelCol;
		nameCol.style.display = "none";
	}
	var valueCol = document.createElement('div');
	
		valueCol.className = styleInfo.styles.valueCol;
	
	if(metadataField.composite_type != null && metadataField.composite_type != "image" && !imageLabel){
		valueCol.className = styleInfo.styles.valueCol;
		valueCol.style.position = "relative";
		valueCol.style.left = "-9px";
	}
	
	var expandButton = null;	
	
	if(metadataField.scalar_type)
	{				
		// Currently it only rendered Strings, Dates, Integers, and ParsedURLs
		if(metadataField.scalar_type == "String"
      || metadataField.scalar_type == "Integer"
      || metadataField.scalar_type == "Float"
      || metadataField.scalar_type == "Date"
      || metadataField.scalar_type == "ParsedURL")
		{	
			
			
			if(metadataField.name && !metadataField.hide_label)
			{
				var fieldLabelDiv = document.createElement('div');
					fieldLabelDiv.className = styleInfo.styles.fieldLabelContainerUnhighlight;
					
				var label = RendererBase.getFieldLabel(metadataField);
				if (label.type == "scalar")
				{
					var fieldLabel = document.createElement('p');
						fieldLabel.className = styleInfo.styles.fieldLabel;
						fieldLabel.innerText = BSUtils.toDisplayCase(label.value);
						fieldLabel.textContent = BSUtils.toDisplayCase(label.value);
						
					fieldLabelDiv.appendChild(fieldLabel);	
				}
				else if (label.type == "image")
				{
					var img = document.createElement('img');
						img.className = styleInfo.styles.fieldLabelImage;
						img.src = ViewModeler.getImageSource(label.value);
						
					fieldLabelDiv.appendChild(img);	
				}			
				
				nameCol.appendChild(fieldLabelDiv);
			}
			
			// If the field is a URL then it should show the favicon and an A tag
			if(metadataField.scalar_type == "ParsedURL")
			{
				var favicon = document.createElement('img');
					favicon.className = styleInfo.styles.faviconICE;
					favicon.src = BSUtils.getFaviconURL(metadataField.navigatesTo);
					
				var aTag = document.createElement('a');
				aTag.innerText = BSUtils.removeLineBreaksAndCrazies(metadataField.value);
				aTag.textContent = BSUtils.removeLineBreaksAndCrazies(metadataField.value);
				
				aTag.href = metadataField.value;
				aTag.onclick = MICE.logNavigate;
				
				aTag.className = styleInfo.styles.fieldValue;
						
				if(metadataField.style_name != null && metadataField.style_name != "")
					aTag.classList.add(metadataField.style_name);
			
				var fieldValueDiv = document.createElement('div');
					fieldValueDiv.className = styleInfo.styles.fieldValueContainer;
				
				fieldValueDiv.appendChild(favicon);
				fieldValueDiv.appendChild(aTag);
				valueCol.appendChild(fieldValueDiv);
			}
		
			// If the field navigates to a link then it should show the favicon and an A tag
			else if( metadataField.navigatesTo)
			{				
				var favicon = document.createElement('img');
					favicon.className = styleInfo.styles.faviconICE;
					favicon.src = BSUtils.getFaviconURL(metadataField.navigatesTo);
					
				var aTag = document.createElement('a');
					aTag.className = styleInfo.styles.fieldValue;
					if(metadataField.style_name != "null" && metadataField.style_name!=""){
						aTag.classList.add(metadataField.style_name);
					}
					
					aTag.target = "_blank";
					aTag.innerText = BSUtils.removeLineBreaksAndCrazies(metadataField.value);
					aTag.textContent = BSUtils.removeLineBreaksAndCrazies(metadataField.value);
					
					aTag.href = metadataField.navigatesTo;
					aTag.onclick = MICE.logNavigate;
										
					if(metadataField.style_name != null && metadataField.style_name != "")
						aTag.classList.add(metadataField.style_name);
				var fieldValueDiv = document.createElement('div');
					fieldValueDiv.className = styleInfo.styles.fieldValueContainer;						
				
				// For the current WWW study the rendering should have incontext CiteULike bookmarklets for specific types of metadata
				
				fieldValueDiv.appendChild(favicon);
				fieldValueDiv.appendChild(aTag);
				valueCol.appendChild(fieldValueDiv);
			}
			
			// If there is no navigation then just display the field value as text
			else
			{
				var fieldValue = document.createElement('p');
					fieldValue.className = styleInfo.styles.fieldValue;
					
				if (metadataField.extract_as_html)
				{
					fieldValue.innerHTML = BSUtils.removeLineBreaksAndCrazies(metadataField.value);
				}
				else
				{
					fieldValue.innerText = BSUtils.removeLineBreaksAndCrazies(metadataField.value);
					fieldValue.textContent = BSUtils.removeLineBreaksAndCrazies(metadataField.value);
				}
					
				if(metadataField.style_name != null){
					fieldValue.className += " " + metadataField.style_name;
				}		
				var fieldValueDiv = document.createElement('div');
					fieldValueDiv.className = styleInfo.styles.fieldValueContainer;
				
				fieldValueDiv.appendChild(fieldValue);
				valueCol.appendChild(fieldValueDiv);
			}
			
			fieldCount--;
		}		
	}
	
	else if (metadataField.composite_type != null && metadataField.composite_type == "image")
	{
		var label = RendererBase.getFieldLabel(metadataField);
		
		if(metadataField.name && !metadataField.hide_label && (!isChildTable || label.type == "image"))
		{
			var fieldLabelDiv = document.createElement('div');
				fieldLabelDiv.className = styleInfo.styles.fieldLabelContainerUnhighlight;
			
			if (label.type == "scalar")
			{
				var fieldLabel = document.createElement('p');
					fieldLabel.className = styleInfo.styles.fieldLabel;
					fieldLabel.innerText = BSUtils.toDisplayCase(label.value);
					fieldLabel.textContent = BSUtils.toDisplayCase(label.value);
				
				fieldLabelDiv.appendChild(fieldLabel);	
			}
			else if (label.type == "image")
			{
				var img = document.createElement('img');
					img.className = styleInfo.styles.fieldLabelImage;
					img.src = ViewModeler.getImageSource(label.value);

				fieldLabelDiv.appendChild(img);
			}		
			
			nameCol.appendChild(fieldLabelDiv);
		}
		
		var img1 = document.createElement('img');
			img1.src = ViewModeler.getImageSource(metadataField.value);
			img1.className = styleInfo.styles.fieldValueImage;
		
		var fieldValueDiv = document.createElement('div');
			fieldValueDiv.className = styleInfo.styles.fieldValueContainer;
			
		if(metadataField.style_name != null && metadataField.style_name != "") {
			if (img1.height > 500)
				fieldValueDiv.className += " " + metadataField.style_name;
			else 
				fieldValueDiv.style.height = img1.height.toString() + "px";
		}
		
		fieldValueDiv.appendChild(img1);
		valueCol.appendChild(fieldValueDiv);
	}
	//We're going to focus on non-composite images that have a location
	else if(metadataField.composite_type != null && metadataField.composite_type != "image")
	{
		/** Label Column **/
		var childUrl = ViewModeler.guessDocumentLocation(metadataField.value);
		
		var fieldLabelDiv = document.createElement('div');
			fieldLabelDiv.className = styleInfo.styles.fieldLabelContainerUnhighlight;
			fieldLabelDiv.style.minWidth = "30px";					
			
	
		// Is the document already rendered?								
		if(childUrl != "" && RendererBase.isRenderedDocument(childUrl) )
		{
			
			// If so, then don't allow the document to be expaned, to prevent looping						
			fieldLabelDiv.className = styleInfo.styles.fieldLabelContainerOpenedUnhighlight;
		}
		else
		{
			if (childUrl != "" || metadataField.value.length > 1)
			{
				
				// If the document hasn't been download then display a button that will download it
				expandButton = document.createElement('div');
					expandButton.className = styleInfo.styles.expandButtonX;
					
				expandButton.onclick = MICE.downloadAndDisplayDocument;
				
				if(childUrl != "")
				{
					expandButton.onmouseover = MICE.highlightDocuments;
					expandButton.onmouseout = MICE.unhighlightDocuments;
				}
			
			
				var expandSymbol = document.createElement('div');
					expandSymbol.className = styleInfo.styles.expandSymbol;
					expandSymbol.style.display = "block";
					
				var collapseSymbol = document.createElement('div');
					collapseSymbol.className = styleInfo.styles.collapseSymbol;
					collapseSymbol.style.display = "block";						
				
				/* set mmdType to all as any may receive event */
				expandButton.mmdType = styleInfo.type;
				expandSymbol.mmdType = styleInfo.type;
				collapseSymbol.mmdType = styleInfo.type;
									
				expandButton.appendChild(expandSymbol);
				expandButton.appendChild(collapseSymbol);
				fieldLabelDiv.appendChild(expandButton);
			}				
			
		}
		
		if(metadataField.name)
		{												
			var label = RendererBase.getFieldLabel(metadataField);

			//If the table isn't a child table then display the label for the composite
			if((!isChildTable || label.type == "image") && !metadataField.hide_label)
			{				
				if (label.type == "scalar")
				{
					var fieldLabel = document.createElement('p');
						fieldLabel.className = styleInfo.styles.fieldLabel;
						fieldLabel.innerText = BSUtils.toDisplayCase(label.value);
						fieldLabel.textContent = BSUtils.toDisplayCase(label.value);
					
					fieldLabelDiv.appendChild(fieldLabel);
				}
				else if (label.type == "image")
				{
					var img = document.createElement('img');
						img.className = styleInfo.styles.fieldLabelImage;
						img.src = ViewModeler.getImageSource(label.value);

					fieldLabelDiv.appendChild(img);
				}
			}
		}
	
		nameCol.appendChild(fieldLabelDiv);
		
		
		/** Value Column **/
		
		var fieldValueDiv = document.createElement('div');
			fieldValueDiv.className = styleInfo.styles.fieldCompositeContainer;

		// Build the child table for the composite
		var childTable =  MICE.buildMetadataTable(null, false, false, metadataField.value, 1, styleInfo);
		
		// If the childTable has more than 1 row, collapse table
		
		if(metadataField.value.length > 1 && !metadataField.show_expanded_always){
			MICE.collapseTable(childTable, styleInfo);			
		}
		if(metadataField.show_expanded_always){
			MICE.expandTable(childTable, styleInfo);
		}
		
		fieldValueDiv.appendChild(childTable);				
		
		var nestedPad = document.createElement('div');
			nestedPad.className = styleInfo.styles.nestedPad;
		
		nestedPad.appendChild(childTable);
		
		fieldValueDiv.appendChild(nestedPad);
		
		valueCol.appendChild(fieldValueDiv);
		
		// Add the unrendered document to the documentMap
		if(childUrl != "")
			RendererBase.documentMap.push(new DocumentContainer(childUrl, null, row, false));
		
		// Add event handling to highlight document connections	
		if(childUrl != "")
		{	
			nameCol.onmouseover = MICE.highlightDocuments;
			nameCol.onmouseout = MICE.unhighlightDocuments;
			nameCol.mmdType = styleInfo.type;
		}
	
				
		
		fieldCount--;
		
	}
	
	else if(metadataField.child_type != null)
	{		


		if(metadataField.name != null)
		{
			var fieldLabelDiv = document.createElement('div');
					fieldLabelDiv.className = styleInfo.styles.fieldLabelContainerUnhighlight;
					
			// does it need to expand / collapse
			
			if(metadataField.value.length > 1)
			{
				var expandButton = document.createElement('div');
					expandButton.className = styleInfo.styles.expandButton;
					
					expandButton.onclick = MICE.expandCollapseTable;
					
				var expandSymbol = document.createElement('div');
					expandSymbol.className = styleInfo.styles.expandSymbol;
					expandSymbol.style.display = "block";
					
				var collapseSymbol = document.createElement('div');
					collapseSymbol.className = styleInfo.styles.collapseSymbol;
					collapseSymbol.style.display = "block";						
		
				expandButton.mmdType = styleInfo.type;
				expandSymbol.mmdType = styleInfo.type;
				collapseSymbol.mmdType = styleInfo.type;	
						
				expandButton.appendChild(expandSymbol);
				expandButton.appendChild(collapseSymbol);
					
				fieldLabelDiv.appendChild(expandButton);
			}
			
			var label = RendererBase.getFieldLabel(metadataField);
			if (label.type == "scalar")
			{
				var fieldLabel = document.createElement('p');
					fieldLabel.className = styleInfo.styles.fieldLabel;
					fieldLabel.innerText = BSUtils.toDisplayCase(label.value) + "(" + metadataField.value.length + ")";
					fieldLabel.textContent = BSUtils.toDisplayCase(label.value) + "(" + metadataField.value.length + ")";
					
				if (!metadataField.hide_label)
					fieldLabelDiv.appendChild(fieldLabel);
				
			}
			else if (label.type == "image")
			{
				var img = document.createElement('img');
					img.className = styleInfo.styles.fieldLabelImage;
					img.src = ViewModeler.getImageSource(label.value);

				if (!metadataField.hide_label)
					fieldLabelDiv.appendChild(img);
			}		
			
		
			nameCol.appendChild(fieldLabelDiv);
		}
		
		
			
		var fieldValueDiv = document.createElement('div');
			fieldValueDiv.className = styleInfo.styles.fieldChildContainer;
		
		var childTable =  MICE.buildMetadataTable(null, true, false, metadataField.value, 1, styleInfo);
	
		
			//var collection = new facetedCollection(childUrl, row);
			
	
		if(metadataField.value.length >= 1)
		{
			MICE.collapseTable(childTable, styleInfo);			
		}					
			
		var nestedPad = document.createElement('div');
			nestedPad.className = styleInfo.styles.nestedPad;
		
		nestedPad.appendChild(childTable);
		
		fieldValueDiv.appendChild(nestedPad);
		
		valueCol.appendChild(fieldValueDiv);

		fieldCount--;
		//Function to be overwritten by MICE extensions


	}
	return {name_col: nameCol, value_col: valueCol, count: fieldCount, expand_button: expandButton};
}


/*
 * The following functions control interactions for expanding and collapsing metadata
*/



MICE.expandCollapseTable = function(event)
{
	
	var button = event.target;
	var miceStyles = InterfaceStyle.getMiceStyleDictionary(button.mmdType);
	var styleInfo = {styles: miceStyles, type: button.mmdType};
	
	if(button.className == styleInfo.styles.collapseSymbol || button.className == styleInfo.styles.expandSymbol)
		button = button.parentElement;
		
	// Use the symbold to check if the table should expand or collapse
	var expandSymbol = button.getElementsByTagName("div")[0];
	if(expandSymbol.style.display == "block")
	{
		expandSymbol.style.display = "none";	
		button.className = styleInfo.styles.collapseButton;
		
		if (button.nextSibling && button.nextSibling.className == styleInfo.styles.fieldLabelImage)
			button.nextSibling.style.display = "";
		
		var table = MICE.getTableForButton(button, styleInfo);
		if (table)
		{	
			MICE.expandTable(table, styleInfo);
			/*
			if(MetadataLoader.logger)
			{			
				var eventObj = {};
				if(typeof button.location === "undefined")
				{
					if(button.parentElement.childNodes[1])
					{
						eventObj = {
							expand_metadata: {
								field_name: button.parentElement.childNodes[1].innerText,
								parent_doc: MICE.getLocationForParentTable(button.parentElement, styleInfo)
							}
						};
					}
					else
					{
						eventObj = {
							expand_metadata: {
								parent_doc: MICE.getLocationForParentTable(button.parentElement, styleInfo)
							}
						};
					}
				}
				else
				{
					eventObj = {
						expand_metadata: {
							target_doc: MICE.getLocationForChildTable(button.parentElement.parentElement.parentElement, styleInfo)
						}
					};
				}
				MetadataLoader.logger(eventObj);
			}*/
		}
	}
	else if(expandSymbol.style.display == "none")
	{
		expandSymbol.style.display = "block";			
		button.className = styleInfo.styles.expandButton;
		
		if (button.nextSibling && button.nextSibling.className == styleInfo.styles.fieldLabelImage)
			button.nextSibling.style.display = "none";
		
		var table = MICE.getTableForButton(button, styleInfo);
		if(table)
		{
			MICE.collapseTable(table, styleInfo);
			/*
			if(MetadataLoader.logger)
			{
				var eventObj = {};
				if(typeof button.location === "undefined")
				{
					if (button.parentElement.childNodes[1])
					{
						eventObj = {
							collapse_metadata: {
								field_name: button.parentElement.childNodes[1].innerText,
								parent_doc: MICE.getLocationForParentTable(button.parentElement, styleInfo)
							}
						};
					}
					else
					{
						eventObj = {
							collapse_metadata: {
								parent_doc: MICE.getLocationForParentTable(button.parentElement, styleInfo)
							}
						};
					}
				}
				else
				{
					
					eventObj = {
						collapse_metadata: {
							target_doc: MICE.getLocationForChildTable(button.parentElement.parentElement.parentElement, styleInfo)
						}
					};
				}
				MetadataLoader.logger(eventObj);
			}*/	
		}
	}	
}

/**
 * Get the table that corresponds to the given button through the DOM
 * @param button, HTML object of the button
 * @return corresponding table HTML object  
 */

MICE.getTableForButton = function(button, styleInfo)
{
	var table = button.parentElement.parentElement.parentElement.getElementsByClassName(styleInfo.styles.valueCol)[0];
	
	// label_at top or bottom
	if (table == null)
	{
		var sibling = (button.parentElement.parentElement.parentElement.nextSibling == null) ?
			button.parentElement.parentElement.parentElement.previousSibling : 
			button.parentElement.parentElement.parentElement.nextSibling; 
		table = sibling.getElementsByClassName(styleInfo.styles.valueCol)[0];
	}
	
	do
	{
		var rowsFound = false;
		var elts = table.childNodes;
		for (var i = 0; i < elts.length; i++)
		{
			if (elts[i].className == styleInfo.styles.metadataRow)
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
		
	return table;
}

/**
 * Expand the table, showing all of its rows
 * @param table to expand 
 */
MICE.expandTable = function(table, styleInfo)
{
	var rows = [];
	var elts = table.childNodes;
	
	for (var i = 0; i < elts.length; i++)
		if (elts[i].className == styleInfo.styles.metadataRow)
			rows.push(elts[i]);
	
	for (var i = 0; i < rows.length; i++)
	{
		rows[i].style.display = "table-row";
	}

	// Remove any loading rows, just to be sure 	
	MICE.clearLoadingRows(table, styleInfo);
	
	// Unlight the documents because the connection lines will be in the wrong place
	MICE.unhighlightDocuments(null, styleInfo);
	
	// Check for More and expand it
	if(table.lastChild.lastChild.lastChild.className == styleInfo.styles.moreButton)
		MICE.morePlease({"target": table.lastChild.lastChild.lastChild});
}

/**
 * Collapse the table, showing only the first row
 * @param table to collapse 
 */
MICE.collapseTable = function(table, styleInfo)
{
	var rows = [];
	var elts = table.childNodes;
	
	for (var i = 0; i < elts.length; i++)
		if (elts[i].className == styleInfo.styles.metadataRow)
			rows.push(elts[i]);
	
	for (var i = 0; i < rows.length; i++)
	{
		if(i == 0)
			rows[i].style.display = "table-row";
		else
			rows[i].style.display = "none";
	}
	
	// Remove any loading rows, just to be sure 	
	MICE.clearLoadingRows(table, styleInfo);
	
	// Unlight the documents because the connection lines will be in the wrong place
	MICE.unhighlightDocuments(null, styleInfo);
}


/**
 * Remove any loadingRows from the container
 * @param container to remove loadingRows from
 */
MICE.clearLoadingRows = function(container, styleInfo)
{
	var divs = container.getElementsByTagName("div");
	for( var i = 0; i < divs.length; i++)
		if(divs[i].className == styleInfo.styles.loadingRow)
			divs[i].parentElement.removeChild(divs[i]);
}

/**
 * Queue the target document for downloading and display
 * @param event, mouse click event
 */
MICE.downloadAndDisplayDocument = function(event)
{
	var button = event.target;
	var miceStyles = InterfaceStyle.getMiceStyleDictionary(button.mmdType);
	var styleInfo = {styles: miceStyles, type: button.mmdType};
	
	if(button.className == styleInfo.styles.collapseSymbol || button.className == styleInfo.styles.expandSymbol)
		button = button.parentElement;
	
	// Update button visuals
	var expandSymbol = button.getElementsByTagName("div")[0];
		expandSymbol.style.display = "none";
		
		button.className = styleInfo.styles.collapseButton;
		
	
	// Change the onclick function of the button to expand/collapse the table
	button.onclick = MICE.expandCollapseTable;
	
	var table = MICE.getTableForButton(button, styleInfo);
		
	// Search the table for the document location
	var location = null;
	var rows = [];
	var elts = table.childNodes;
	
	for (var i = 0; i < elts.length; i++)
		if (elts[i].className == styleInfo.styles.metadataRow)
			rows.push(elts[i]);
	
	for (var i = 0; i < rows.length; i++)
	{
		var valueCol = rows[i].childNodes[1];
		if(valueCol)
		{
			var valueDiv = valueCol.getElementsByTagName("div")[0];
			if(valueDiv)
				for (var j = 0; j < valueDiv.childNodes.length; j++)
					if(valueDiv.childNodes[j].href != null && valueDiv.childNodes[j].className != styleInfo.styles.citeULikeButton && location == null)
						location = valueDiv.childNodes[j].href;
		}
	}

	// Did the table have a document location?
	if(location)
	{
		button.location = location;
		
		// Add a loadingRow for visual feedback that the metadata is being downloaded / parsed
		table.appendChild(RendererBase.createLoadingRow(styleInfo));

	//	var requestMD = MetadataLoader.toRequestMetadataFromService(location);
	    //MetadataLoader.render(MICE.render, table.parentElement, location, false)	;
		//MICE.addMetadataDisplay(table.parentElement, location, false);
		RendererBase.addMetadataDisplay(table.parentElement, location, null, MICE.render);
		
	}
	// If there was no document location then the table must be a non-document composite in which case just expand
	else
		MICE.expandTable(table, styleInfo);
	
	
	// Grow the In-Context Metadata Display
	if(MICE.updateInContextStyling)
		MICE.updateInContextStyling(table);
	
	
	if(MICE.logger)
	{			
		var eventObj = {};
			
		if(location == null)
		{	
			if (button.parentElement.childNodes[1])
			{
				eventObj = {
					expand_metadata: {
						field_name: button.parentElement.childNodes[1].innerText,
						parent_doc: MICE.getLocationForParentTable(button.parentElement, styleInfo)
					}
				};
			}
			else
			{
				eventObj = {
					expand_metadata: {
						parent_doc: MICE.getLocationForParentTable(button.parentElement, styleInfo)
					}
				};
			}
		}
		else
		{
			eventObj = {
				expand_metadata: {
					target_doc: MICE.getLocationForChildTable(button.parentElement.parentElement.parentElement, styleInfo)
				}
			};
		}
		MICE.logger(eventObj);
	}
}



/**
 * Finds matching documents, highlights them, and draws connecting lights
 * @param event, mouse enter event 
 */
MICE.highlightDocuments = function(event)
{
	var row = event.srcElement;
	var miceStyles = InterfaceStyle.getMiceStyleDictionary(row.mmdType);
	var styleInfo = {styles: miceStyles, type: row.mmdType};
	
	if(row.className == styleInfo.styles.expandButton)
		row = row.parentElement;
	
	// Only fieldLabelContainer or fieldLabelContainerOpened rows can be highlighted
	if(row.className.indexOf(styleInfo.styles.fieldLabelContainerOpened) == 0 
				|| row.className.indexOf(styleInfo.styles.fieldLabelContainer) == 0)
	{
		// Highlight row
		MICE.highlightLabel(row);
		
		var table = row.parentElement.parentElement.getElementsByClassName(styleInfo.styles.valueCol)[0];
		
		// label_at top or bottom
		if (table == null)
		{
			var sibling = (button.parentElement.parentElement.nextSibling == null) ?
				button.parentElement.parentElement.previousSibling : 
				button.parentElement.parentElement.nextSibling; 
			table = sibling.getElementsByClassName(styleInfo.styles.valueCol)[0];
		}

		
		// Search the table for a document location
		var location = null;
		
		var aTags = table.getElementsByTagName("a");
		for (var i = 0; i < aTags.length; i++)
		{
			if(aTags[i].className.indexOf(styleInfo.styles.fieldValue) != -1)
			{
				location = aTags[i].href;
				break;
			}
		}
		// Did the table have a document location?
		if(location != null)
		{	
			MICE.clearAllCanvases(styleInfo);		
						
			// Find matches in the DocumentMap
			var matches = [];
			for(var i = 0; i < RendererBase.documentMap.length; i++)
			{
				if(RendererBase.documentMap[i].matches(location))
				{
					if(RendererBase.documentMap[i].container.style.display != "none")
						matches.push(RendererBase.documentMap[i].container);
				}	
				
			}
			
			// console.log(location);
			
			// Draw the lines to each match
			for(var i = 0; i < matches.length; i++)			
			{
				MICE.drawConnectionLine(matches[i], row, styleInfo);		
			}			
		}
	}
	return false;
}

/**
 * Highlights the given label
 * @param label, HTML object to add the styling to 
 */
MICE.highlightLabel = function(label)
{
	var labelClassName = label.className.split(" ", 1)[0];
	label.className = labelClassName + " highlight";
}

/**
 * Unhighlights the given label
 * @param label, HTML object to change the styling of
 */
MICE.unhighlightLabel = function(label)
{
	var labelClassName = label.className.split(" ", 1)[0];
	label.className = labelClassName + " unhighlight";
}

// Constant offsets for the connection-lines
var METADATA_LINE_X_OFFSET = 6;
var METADATA_LINE_Y_OFFSET = 9;

/**
 * Draw a line connecting the target to the source
 * @param target HTML object
 * @param source HTML source
 */
MICE.drawConnectionLine = function(target, source, styleInfo)
{
	// Don't draw connection lines in ideaMACHE
	if(typeof session != "undefined")
	{
		return;
	}
	
	
	// Get the first label of the target
	var labelCol = target.getElementsByClassName(styleInfo.styles.labelCol)[0];
	// access fieldLabel from labelCol and not metadataRow which can return a nested value
	// if this label was not rendered due to hide_label=true
	var label = labelCol.getElementsByClassName(styleInfo.styles.fieldLabel)[0];
	
	// Highlight the target label
	if (label)
		MICE.highlightLabel(label.parentElement);
	else // if label is hidden
		label = target.getElementsByClassName(styleInfo.styles.valueCol)[0];

	// Get the canvas

	
		var canvases = document.getElementsByClassName(styleInfo.styles.lineCanvas);
		
		// TODO - fix canvas finding, needs to find the least common canvas,
		// the smallest canvas that contains both target and source
		
		for(var i = canvases.length - 1; i >= 0; i--)
		{	
			canvases[i];	
		}
		
		canvas = canvases[canvases.length - 1];		
	
		
	var startRect = label.getClientRects()[0];
	var endRect = source.getClientRects()[0];	
		
	// Don't draw the line if the source and target are in the same container
	if(canvas != null && startRect && Math.abs(startRect.top - endRect.top) > 12)
	{	
		var ctx = canvas.getContext('2d');
			
		var containerRect = canvas.parentElement.getClientRects()[0];
						
		ctx.lineTo(1, startRect.top - containerRect.top + METADATA_LINE_Y_OFFSET);
		ctx.lineTo(1, endRect.top - containerRect.top + METADATA_LINE_Y_OFFSET);
		ctx.lineTo(endRect.left - containerRect.left + METADATA_LINE_X_OFFSET, endRect.top - containerRect.top + METADATA_LINE_Y_OFFSET);
		ctx.strokeStyle = "rgba(200, 44, 4, 0.4)";
		ctx.lineWidth = 3;
		ctx.lineCap = "round";
		ctx.stroke();
	}
	
}

MICE.clearAllCanvases = function(styleInfo)
{
	var canvases = document.getElementsByClassName(styleInfo.styles.lineCanvas);
		for(var i = 0; i < canvases.length; i++)
		{
			var containerRect =  canvases[i].parentElement.getClientRects()[0];
			if(containerRect != null)
			{
				canvases[i].width = containerRect.width;
				canvases[i].height = containerRect.height;
			}
		}
	
}

/**
 * Unhighlights all documents, reverting highlight styling and clearing canvases 
 * @param event, mouse exit event
 */
MICE.unhighlightDocuments = function(event, styleInfo)
{
	if (event)
	{
		button = event.target;
		var miceStyles = InterfaceStyle.getMiceStyleDictionary(button.mmdType);
		styleInfo = {styles: miceStyles, type: button.mmdType};
	}
	
	var labels = document.getElementsByClassName(styleInfo.styles.fieldLabelContainerOpened);
	for(var i = 0; i < labels.length; i++)
	{
		MICE.unhighlightLabel(labels[i]);
		labels[i].style.background = "white";
	}
	if (styleInfo != null){
	labels = document.getElementsByClassName(styleInfo.styles.fieldLabelContainer);
	for(var i = 0; i < labels.length; i++)
		MICE.unhighlightLabel(labels[i]);
	
	MICE.clearAllCanvases(styleInfo);
	}
}

/**
 * Creat the HTML for the laadingRow
 * @return HTML TR object for the lodaing row
 */
MICE.createLoadingRow = function(styleInfo)
{
	var row = document.createElement('tr');
	
	var loadingRow = document.createElement('div');
		loadingRow.className = styleInfo.styles.loadingRow;
		loadingRow.innerText = "Loading document...";
		loadingRow.textContent = "Loading document...";
		
	row.appendChild(loadingRow);
	return row;
}

MICE.morePlease = function(event)
{
	var moreData = JSON.parse(event.target.lastChild.textContent);
	
	var parentRow =  event.target.parentElement.parentElement;
	var parentTable = parentRow.parentElement;
	
	//remove More Button	
	parentTable.removeChild(parentRow);
	
	// Build and add extra rows
	var miceStyles = InterfaceStyle.getMiceStyleDictionary(moreData.type);
	var styleInfo = {styles: miceStyles, type: moreData.type};
	MICE.buildMetadataTable(parentTable, moreData.isChild, false, moreData.data, moreData.fields, styleInfo);
	
	// TODO add logging for the 'More' button
	
}

MICE.getLocationForParentTable = function(element, styleInfo)
{
	while(element.className != styleInfo.styles.metadataTableDiv && element.className != styleInfo.styles.rootMetadataTableDiv)
	{
		element = element.parentElement;
	}
	
	var aTags = element.getElementsByTagName("a");
	if(aTags.length > 0)
	{
		// console.log("parentTable loc: " + aTags[0].href);
		return aTags[0].href;	
	}	
	return "none";
}

MICE.getLocationForChildTable = function(element, styleInfo)
{
	var valueCol = element.getElementsByClassName(styleInfo.styles.valueCol)[0];
	
	// label_at top or bottom
	if (valueCol == null)
	{
		var sibling = (element.nextSibling == null) ? element.previousSibling : element.nextSibling; 
		valueCol = sibling.getElementsByClassName(styleInfo.styles.valueCol)[0];
	}
	
	if (valueCol)
	{
		var tables = valueCol.getElementsByClassName(styleInfo.styles.rootMetadataTableDiv);
		
		if (tables.length > 0)
		{
			table = tables[0];
			
			var aTags = table.getElementsByTagName("a");
			if(aTags.length > 0)
			{
				return aTags[0].href;
			}
		}
	}
	return "none";
}



