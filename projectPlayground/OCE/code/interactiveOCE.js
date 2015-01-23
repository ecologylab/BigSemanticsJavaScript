/** Functions related to the interactions of the metadata HTML **/

/**
 * Expand or collapse a collection or composite field table.
 * @param event, mouse click event 
 */
MetadataRenderer.expandCollapseTable = function(event)
{
	var button = event.srcElement;
	
	if(button.className == "collapseSymbol" || button.className == "expandSymbol")
		button = button.parentElement;
		
	// Use the symbold to check if the table should expand or collapse
	var expandSymbol = button.getElementsByTagName("div")[0];
	if(expandSymbol.style.display == "block")
	{
		expandSymbol.style.display = "none";		
		MetadataRenderer.expandTable(MetadataRenderer.getTableForButton(button));
	}
	else if(expandSymbol.style.display == "none")
	{
		expandSymbol.style.display = "block";					
		MetadataRenderer.collapseTable(MetadataRenderer.getTableForButton(button));
	}	
}

/**
 * Get the table that corresponds to the given button through the DOM
 * @param button, HTML object of the button
 * @return corresponding table HTML object  
 */
MetadataRenderer.getTableForButton = function(button)
{
	var table = button.parentElement.parentElement.parentElement.getElementsByTagName("td")[1];
		
	while(table.rows == null)
		table = table.firstChild;
		
	while(table.rows.length == 0)
		table = table.getElementsByTagName("table")[0];
		
	return table;
}

/**
 * Expand the table, showing all of its rows
 * @param table to expand 
 */
MetadataRenderer.expandTable = function(table)
{
	for (var i = 0; i < table.rows.length; i++)
		table.rows[i].style.display = "table";

	// Remove any loading rows, just to be sure 	
	MetadataRenderer.clearLoadingRows(table);
	
	// Unlight the documents because the connection lines will be in the wrong place
	MetadataRenderer.unhighlightDocuments(null);
}

/**
 * Collapse the table, showing only the first row
 * @param table to collapse 
 */
MetadataRenderer.collapseTable = function(table)
{
	for (var i = 0; i < table.rows.length; i++)
	{
		if(i == 0)
			table.rows[i].style.display = "table";
		else
			table.rows[i].style.display = "none";
	}
	
	// Remove any loading rows, just to be sure 	
	MetadataRenderer.clearLoadingRows(table);
	
	// Unlight the documents because the connection lines will be in the wrong place
	MetadataRenderer.unhighlightDocuments(null);
}

/**
 * Remove any loadingRows from the container
 * @param container to remove loadingRows from
 */
MetadataRenderer.clearLoadingRows = function(container)
{
	var divs = container.getElementsByTagName("div");
	for( var i = 0; i < divs.length; i++)
		if(divs[i].className == "loadingRow")
			divs[i].parentElement.removeChild(divs[i]);
}

/**
 * Queue the target document for downloading and display
 * @param event, mouse click event
 */
MetadataRenderer.downloadAndDisplayDocument = function(event)
{
	var button = event.srcElement;
	
	if(button.className == "collapseSymbol" || button.className == "expandSymbol")
		button = button.parentElement;
	
	// Update button visuals
	var expandSymbol = button.getElementsByTagName("div")[0];
		expandSymbol.style.display = "none";
	
	// Change the onclick function of the button to expand/collapse the table
	button.onclick = MetadataRenderer.expandCollapseTable;
	
	var table = MetadataRenderer.getTableForButton(button);
		
	// Search the table for the document location
	var location = null;
	for (var i = 0; i < table.rows.length; i++)
	{
		var valueCol = table.rows[i].getElementsByTagName("td")[1];
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
	if(location)
	{
		// Add a loadingRow for visual feedback that the metadata is being downloaded / parsed
		table.appendChild(MetadataRenderer.createLoadingRow());
		
		MetadataRenderer.addMetadataDisplay(table.parentElement, location, false);
	}
	// If there was no document location then the table must be a non-document composite in which case just expand
	else
		MetadataRenderer.expandTable(table);
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
	if(row.className == "fieldLabelContainerOpened" || row.className == "fieldLabelContainer")
	{
		// Highlight row
		MetadataRenderer.highlightLabel(row);
		
		var table = row.parentElement.parentElement.getElementsByTagName("td")[1];
		
		// Search the table for a document location
		var location = null;
		
		var aTags = table.getElementsByTagName("a");
		for (var i = 0; i < aTags.length; i++)
			if(aTags[i].className == "fieldValue")
			{
				location = aTags[i].href;
				break;
			}
		
		// Did the table have a document location?
		if(location != null)
		{	
			MetadataRenderer.clearAllCanvases();		
						
			// Find matches in the DocumentMap
			var matches = [];
			for(var i = 0; i < MetadataRenderer.documentMap.length; i++)
				if(MetadataRenderer.documentMap[i].matches(location))
					matches.push(MetadataRenderer.documentMap[i].container);			
			
			// Draw the lines to each match
			for(var i = 0; i < matches.length; i++)			
				MetadataRenderer.drawConnectionLine(matches[i], row);			
		}
	}
	return false;
}

/**
 * Highlights the given label
 * @param label, HTML object to add the styling to 
 */
MetadataRenderer.highlightLabel = function(label)
{
	label.style.background = "white";
	label.style.border = "1px solid #555";
	label.style.minHeight = "15px";
	label.style.height = "17px";	
}

/**
 * Unhighlights the given label
 * @param label, HTML object to change the styling of
 */
MetadataRenderer.unhighlightLabel = function(label)
{
	label.style.background = "#666";
	label.style.border = "";
	label.style.minHeight = "19px";	
}

// Constant offsets for the connection-lines
var METADATA_LINE_X_OFFSET = 6;
var METADATA_LINE_Y_OFFSET = 9;

/**
 * Draw a line connecting the target to the source
 * @param target HTML object
 * @param source HTML source
 */
MetadataRenderer.drawConnectionLine = function(target, source)
{
	// Get the first label of the target
	var label = target.getElementsByClassName("fieldLabel")[0];
	
	// Highlight the target label
	MetadataRenderer.highlightLabel(label.parentElement);

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

MetadataRenderer.clearAllCanvases = function()
{
	if(WWWStudy)
		WWWStudy.clearBigCanvas();
	else
	{
		var canvases = document.getElementsByClassName("lineCanvas");
		for(var i = 0; i < canvases.length; i++)
		{
			var containerRect =  canvases[i].parentElement.getClientRects()[0];
			canvases[i].width = containerRect.width;
			canvases[i].height = containerRect.height;
		}
	}
}

/**
 * Unhighlights all documents, reverting highlight styling and clearing canvases 
 * @param event, mouse exit event
 */
MetadataRenderer.unhighlightDocuments = function(event)
{
	var labels = [];
	for(var i = 0; i < MetadataRenderer.documentMap.length; i++)
	{
		labels = MetadataRenderer.documentMap[i].container.getElementsByClassName("fieldLabel");
					
		for(var k = 0; k < labels.length; k++)
			MetadataRenderer.unhighlightLabel(labels[k].parentElement);
	}
	
	labels = document.getElementsByClassName("fieldLabelContainerOpened");
	for(var i = 0; i < labels.length; i++)
	{
		MetadataRenderer.unhighlightLabel(labels[i]);
		labels[i].style.background = "white";
	}
	
	labels = document.getElementsByClassName("fieldLabelContainer");
	for(var i = 0; i < labels.length; i++)
		MetadataRenderer.unhighlightLabel(labels[i]);
	
	MetadataRenderer.clearAllCanvases();
}

/**
 * Creat the HTML for the laadingRow
 * @return HTML TR object for the lodaing row
 */
MetadataRenderer.createLoadingRow = function()
{
	var row = document.createElement('tr');
	
	var loadingRow = document.createElement('div');
		loadingRow.className = "loadingRow";
		loadingRow.innerText = "Loading document...";
		
	row.appendChild(loadingRow);
	return row;
}

var panX = 0;
var panY = 0;
var panningContainer = null;

MetadataRenderer.startDragMove = function(event)
{
	if(event.srcElement.className == "metadataRendering")
	{
		console.log(event.srcElement);
		panningContainer = event.srcElement;
	
		panX = event.pageX;
		panY = event.pageY;
		
		window.addEventListener("mousemove", MetadataRenderer.doDragMove);
		window.addEventListener("mouseup", MetadataRenderer.endDragMove);
	}
}

MetadataRenderer.doDragMove = function(event)
{	
	if(panningContainer)
	{
		MetadataRenderer.move(panningContainer, event.pageX - panX, event.pageY - panY);
		panX = event.pageX;
		panY = event.pageY;	
	}
}

MetadataRenderer.endDragMove = function(event)
{
	if(panningContainer)
	{
		panningContainer = null;
		window.removeEventListener("mousemove", MetadataRenderer.doDragMove);
		window.removeEventListener("mouseup", MetadataRenderer.endDragMove);
	}
}

MetadataRenderer.move = function(container, deltaX, deltaY)
{
	var oldTop = parseInt(container.style.top);
	var oldLeft = parseInt(container.style.left);
	
	//console.log(container.style.top);
	
	container.style.top = (oldTop + deltaY) + 'px';
	container.style.left = (oldLeft + deltaX) + 'px';
	
}






















