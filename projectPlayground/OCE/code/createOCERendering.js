/** Functions related to the creation of the metadata HTML **/

/**
 * Converts the metadata into a set of metadataFields using the meta-metadata.
 * If there is visible metadata then create and return the HTML table.
 * @param isRoot, is the metadata the root document in the container (for styling)
 * @param mmd, meta-metadata for the given metadata
 * @param metadata, metadata to display
 * @return table, HTML table for the metadata or null if there is no metadata to display
 */
MetadataRenderer.buildMetadataDisplay = function(isRoot, mmd, metadata)
{
	// Convert the metadata into a list of MetadataFields using the meta-metadata.
	var metadataFields = MetadataRenderer.getMetadataFields(mmd["wrapper"]["kids"], metadata, 0);
	
	// Is there any visable metadata?
	if(MetadataRenderer.hasVisibleMetadata(metadataFields))
		// If so, then build the HTML table	
		return MetadataRenderer.buildMetadataTable(false, isRoot, metadataFields);		
		
	else
		// The metadata doesn't contain any visible fields so there is nothing to display
		return null;	
}

/**
 * Build the HTML table for the list of MetadataFields
 * @param isChildTable, true if the table belongs to a collection table, false otherwise
 * @param isRoot, true if table is the root table of the MetadataRendering
 * @param metadataFields, array of MetadataFields to be displayed
 * @return HTML table of the metadata display
 */
MetadataRenderer.buildMetadataTable = function(isChildTable, isRoot, metadataFields)
{
	var table = document.createElement('table');
	
	if(!isRoot)
		table.className = "metadataTable";
	
	// Iterate through the metadataFields which are already sorted into display order
	for(var key in metadataFields)
	{		
		var row = document.createElement('tr');
		var nameCol = document.createElement('td');
			nameCol.className = "labelCol";
			
		var valueCol = document.createElement('td');
			valueCol.className = "valueCol";
			
		var metadataField = metadataFields[key];
		
		if(metadataField.value)
		{
			// If the field is an empty array then move on to the next field
			if(	metadataField.value.length != null && metadataField.value.length == 0)
				break;
			
			if(metadataField.scalar_type)
			{				
				// Currently it only rendered Strings, Dates, Integers, and ParsedURLs
				if(metadataField.scalar_type == "String" || metadataField.scalar_type == "Date" ||metadataField.scalar_type == "Integer" || metadataField.scalar_type == "ParsedURL")
				{	
					if(metadataField.name)
					{
						var fieldLabel = document.createElement('p');
							fieldLabel.className = "fieldLabel";
							fieldLabel.innerText = MetadataRenderer.toDisplayCase(metadataField.name);
						
						var fieldLabelDiv = document.createElement('div');
							fieldLabelDiv.className = "fieldLabelContainer";
						
						fieldLabelDiv.appendChild(fieldLabel);
						nameCol.appendChild(fieldLabelDiv);
					}
					
					// If the field is a URL then it should show the favicon and an A tag
					if(metadataField.scalar_type == "ParsedURL")
					{
						// Uses http://getfavicon.appspot.com/ to resolve the favicon
						var favicon = document.createElement('img');
							favicon.className = "favicon";
							favicon.src = "http://g.etfv.co/" + metadataField.navigatesTo;
						
						var aTag = document.createElement('a');
						aTag.innerText = MetadataRenderer.removeLineBreaksAndCrazies(metadataField.value);
						aTag.href = metadataField.value;
						aTag.className = "fieldValue";
					
						var fieldValueDiv = document.createElement('div');
							fieldValueDiv.className = "fieldValueContainer";
						
						fieldValueDiv.appendChild(favicon);
						fieldValueDiv.appendChild(aTag);
						valueCol.appendChild(fieldValueDiv);
					}
				
					// If the field navigates to a link then it should show the favicon and an A tag
					else if( metadataField.navigatesTo)
					{				
						// Uses http://getfavicon.appspot.com/ to resolve the favicon
						var favicon = document.createElement('img');
							favicon.className = "favicon";
							favicon.src = "http://g.etfv.co/" + metadataField.navigatesTo;
						
						var aTag = document.createElement('a');
							aTag.className = "fieldValue";
							aTag.target = "_blank";
							aTag.innerText = MetadataRenderer.removeLineBreaksAndCrazies(metadataField.value);
							aTag.href = metadataField.navigatesTo;
						
						var fieldValueDiv = document.createElement('div');
							fieldValueDiv.className = "fieldValueContainer";						
						
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
							fieldValue.innerText = MetadataRenderer.removeLineBreaksAndCrazies(metadataField.value);										
							
						var fieldValueDiv = document.createElement('div');
							fieldValueDiv.className = "fieldValueContainer";
						
						fieldValueDiv.appendChild(fieldValue);
						valueCol.appendChild(fieldValueDiv);
					}
															
					row.appendChild(nameCol);
					row.appendChild(valueCol);
				}		
			}
			
			else if(metadataField.composite_type != null)
			{
				/** Label Column **/
				var childUrl = MetadataRenderer.guessDocumentLocation(metadataField.value);
				
				var fieldLabelDiv = document.createElement('div');
					fieldLabelDiv.className = "fieldLabelContainer";
					fieldLabelDiv.style.minWidth = "36px";					
					
				// Is the document already rendered?								
				if(childUrl != "" && MetadataRenderer.isRenderedDocument(childUrl) )
				{
					// If so, then don't allow the document to be expaned, to prevent looping						
					fieldLabelDiv.className = "fieldLabelContainerOpened";				
				}
				else
				{
					// If the document hasn't been download then display a button that will download it
					var expandButton = document.createElement('div');
						expandButton.className = "expandButton";
						
					expandButton.onclick = MetadataRenderer.downloadAndDisplayDocument;
					expandButton.onmouseover = MetadataRenderer.highlightDocuments;
					expandButton.onmouseout = MetadataRenderer.unhighlightDocuments;
							
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
					if(!isChildTable)
					{
						var fieldLabel = document.createElement('p');
							fieldLabel.className = "fieldLabel";
							fieldLabel.innerText = MetadataRenderer.toDisplayCase(metadataField.name);
						
						fieldLabelDiv.appendChild(fieldLabel);
					}
				}
				
				nameCol.appendChild(fieldLabelDiv);
				
				/** Value Column **/
				
				var fieldValueDiv = document.createElement('div');
					fieldValueDiv.className = "fieldCompositeContainer";
				
				// Build the child table for the composite
				var childTable =  MetadataRenderer.buildMetadataTable(false, false, metadataField.value);
				
				// If the childTable has more than 1 row, collapse table
				if(metadataField.value.length > 1)
					MetadataRenderer.collapseTable(childTable);			
				
				fieldValueDiv.appendChild(childTable);				
				
				var nestedPad = document.createElement('div');
					nestedPad.className = "nestedPad";
				
				nestedPad.appendChild(childTable);
				
				fieldValueDiv.appendChild(nestedPad);
				
				valueCol.appendChild(fieldValueDiv);
				
				// Add the unrendered document to the documentMap
				MetadataRenderer.documentMap.push(new DocumentContainer(childUrl, row, false));
				
				// Add event handling to highlight document connections		
				nameCol.onmouseover = MetadataRenderer.highlightDocuments;
				nameCol.onmouseout = MetadataRenderer.unhighlightDocuments;
				
				row.appendChild(nameCol);
				row.appendChild(valueCol);
			}
			
			else if(metadataField.child_type != null)
			{		
				if(metadataField.name != null)
				{
					var fieldLabel = document.createElement('p');
						fieldLabel.className = "fieldLabel";
						fieldLabel.innerText = MetadataRenderer.toDisplayCase(metadataField.name);
						
						fieldLabel.innerText += "(" + metadataField.value.length + ")";
						
					var fieldLabelDiv = document.createElement('div');
							fieldLabelDiv.className = "fieldLabelContainer";
					
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
					fieldLabelDiv.appendChild(fieldLabel);
					nameCol.appendChild(fieldLabelDiv);
				}
					
				var fieldValueDiv = document.createElement('div');
					fieldValueDiv.className = "fieldChildContainer";
				
				var childTable =  MetadataRenderer.buildMetadataTable(true, false, metadataField.value);
				if(metadataField.value.length > 1)
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

/** 
 * Make the string prettier by replacing underscores with spaces  
 * @param string to make over
 * @return hansome string, a real genlteman
 */
MetadataRenderer.toDisplayCase = function(string)
{	
	var strings = string.split('_');
	var display = "";
	for(var s in strings)
		display += strings[s].charAt(0).toLowerCase() + strings[s].slice(1) + " ";

	return display;
}

/**
 * Remove line breaks from the string and any non-ASCII characters
 * @param string
 * @return a string with no line breaks or crazy characters
 */
MetadataRenderer.removeLineBreaksAndCrazies = function(string)
{
	string = string.replace(/(\r\n|\n|\r)/gm," ");	
	var result = "";
	for (var i = 0; i < string.length; i++)
        if (string.charCodeAt(i) < 128)
            result += string.charAt(i);
 
	return result;
}