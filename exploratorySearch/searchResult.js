/**
 * 
 */

function SearchResult(location, type, metadata){
	this.location = location;
	this.type = type;
	this.metadata = metadata;
	//this.title = title;
}

SearchResult.prototype.addSearchResultExpandCollapseButton = function(searchResultX){
	var searchRCollapseButton = document.createElement('div');
	searchRCollapseButton.className = 'searchResultCollapseButton ';
	searchRCollapseButton.onclick = ExpSearchApp.expandCollapseSearchResult;
	var searchRCollapseSymbol = document.createElement('div');
	searchRCollapseSymbol.className = 'searchResultCollapseSymbol ';

	searchRCollapseSymbol.style.display = 'block';
	var searchRExpandSymbol = document.createElement('div');
	searchRExpandSymbol.className = 'searchResultExpandSymbol ';
	searchRExpandSymbol.style.display = 'none';
	
	
	searchRCollapseButton.appendChild(searchRExpandSymbol);
	searchRCollapseButton.appendChild(searchRCollapseSymbol);
	
	return searchRCollapseButton;
} 

SearchResult.prototype.addSearchHandle = function(searchResultX){
	var searchHandle = document.createElement('div');
	searchHandle.className = "searchResultHandle";
	searchHandle.appendChild(SearchResult.prototype.addSearchResultExpandCollapseButton(searchResultX));
	//Creates three rows of stacked black squares to indicate drag and droppability!
	for (var i = 0; i < 2; i++){
		var grip = document.createElement('div');
		grip.className = 'grip';
		grip.innerHTML = '<p>&#x25A0;&#x25A0;&#x25A0;</p>';
		searchHandle.appendChild(grip);
	}
	
	
	//Drag and dro prelated attributes
	searchHandle.setAttribute("draggable", "true");
	searchHandle.setAttribute('ondragstart', 'clippingDragStart(event)');
	searchHandle.setAttribute('ondragend', 'clippingDragEnd(event)');
	return searchHandle;
}

SearchResult.prototype.addSearchResultDisplay = function(searchResultX, parent){
	var newSearchDisplay = document.createElement('div');
	newSearchDisplay.className = "indResultContainer";
	parent.appendChild(newSearchDisplay);
	
	var rendering = document.createElement('div');
	rendering.className="metadataRendering";
	if (searchResultX.metadata != null){
		//newSearchDisplay.innerHTML = "THERE IS METADATA HERE, YOU DOFUS";
		/*Alright, here's where things get sketchmode. We're going to call buildMetadata table
		 * and use that the draw our lovely little metadata fields. Pray, bretheren, that the MICE
		 * gods have mercy upon our code*/
		var visual = document.createElement('div');
		
		
		visual.className = 'metadataContainer';
		visual.setAttribute('mdType', searchResultX.metadata[0].parentMDType);
		var mdtable = MICE.buildMetadataTable(null, false, true, searchResultX.metadata, 10, DEFAULT_MICE_STYLE);

		if(mdtable)
		{
			// Clear out the container so that it will only contain the new metadata table
			// Add the HTML5 canvas for the drawing of connection lines
			var canvas = document.createElement("canvas");
				canvas.className = 'lineCanvas';
			
			// Add the table and canvas to the interior container
			visual.appendChild(mdtable);
			visual.appendChild(canvas);
			
			// Add the interior container to the root contianer
			rendering.appendChild(visual);
						
		}
		
		newSearchDisplay.appendChild(SearchResult.prototype.addSearchHandle(searchResultX));
		newSearchDisplay.appendChild(rendering);
		rendering.setAttribute('onmousedown', 'ExpSearchApp.removeQuerySearchBox(event)')
		rendering.setAttribute('onmouseup', 'ExpSearchApp.textSelected(event)');
	}
	else{
		var miceContainer = document.createElement('div');
		miceContainer.className = "metadataRendering";
		newSearchDisplay.appendChild(SearchResult.prototype.addSearchHandle(searchResultX));
		newSearchDisplay.appendChild(miceContainer);
		
		MetadataLoader.render(MICE.render, miceContainer, searchResultX.location, true);
		miceContainer.setAttribute('onmousedown', 'ExpSearchApp.removeQuerySearchBox(event)')
		miceContainer.setAttribute('onmouseup', 'ExpSearchApp.textSelected(event)');
	}

}
