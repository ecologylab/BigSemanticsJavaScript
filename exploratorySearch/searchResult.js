/**
 * 
 */

var filterIdIndex = 0;
//Uses types as keys
var locationDictionary = {}
locationDictionary['google_search'] = "http://www.google.com";
locationDictionary['bing_search_xpath'] = "http://www.bing.com";
locationDictionary['acm_portal_search'] = "http://dl.acm.org/";
locationDictionary['research_gate_search'] = "http://www.researchgate.net/";
locationDictionary['google_scholar_search'] = "http://scholar.google.com";

function SearchResult(location, type, rank, metadata){
	
	this.location = location;
	//If a searchResult appears multiple time, then the type
	//of the other search(es) is recorded here.
	this.additionTypes = [];
	this.type = type;
	this.metadata = metadata;
	this.id = "result" + filterIdIndex.toString();
	this.rank = rank;
	filterIdIndex++;
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

SearchResult.prototype.getParentSearchLocations = function(){
	var listOfLocations = [];
	var mainLocation = locationDictionary[this.type];
	listOfLocations.push(mainLocation);
	for (var i = 0; i < this.additionTypes.length; i++){
		var location = locationDictionary(this.additionalLocation[i]);
		listOfLocations.push(location);
	}
	return listOfLocations;
}
SearchResult.prototype.addFaviconBar = function(searchResult, parent){
	var faviconBar = document.createElement('div');
	faviconBar.className = "faviconBar";
	var iconLocations = searchResult.getParentSearchLocations();

	var faviconRow;
	for (var i = 0; i < iconLocations.length; i++){
		if (i % 2 == 0){
			faviconRow = document.createElement('div');
			faviconRow.className="faviconRow";
			searchResult.addFavicon(iconLocations[i], faviconRow);
			faviconBar.appendChild(faviconRow);
		}
		else{
			searchResult.addFavicon(iconLocations[i], faviconRow);
		}
		
	}
	parent.appendChild(faviconBar);
}
SearchResult.prototype.addFavicon = function(location, parent){
	
	var favicon = document.createElement('img');
	favicon.className = "searchResultFavicon";
	favicon.src = "http://g.etfv.co/" + location;
	parent.appendChild(favicon);
	
}
SearchResult.prototype.addSearchResultDisplay = function(searchResultX, parent){
	var newSearchDisplay = document.createElement('div');
	//newSearchDisplay.setAttribute('draggable', true);
	newSearchDisplay.setAttribute('dragstart', 'clippingDragStart(event)');
	newSearchDisplay.className = "indResultContainer";
	
	//recursiveDragEventInjector(newSearchDisplay, clippingDragStart);
	
	parent.appendChild(newSearchDisplay);

	var sideBar = document.createElement('div');
	sideBar.className = 'searchResultSideBar';
	newSearchDisplay.appendChild(sideBar);
	
	sideBar.appendChild(SearchResult.prototype.addSearchHandle(searchResultX));
	
	
	
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
		

		newSearchDisplay.appendChild(rendering);
		/*rendering.setAttribute('onmousedown', 'ExpSearchApp.removeQuerySearchBox(event)')
		rendering.setAttribute('onmouseup', 'ExpSearchApp.textSelected(event)');
		*/
		//rendering.setAttribute("draggable", true);
		$(rendering).on({
			//  dragstart: clippingDragStart,
			  
			  mousedown: ExpSearchApp.removeQuerySearchBox,
			  mouseup: ExpSearchApp.textSelected
			});
		rendering.setAttribute('id', searchResultX.id);
	}
	else{
		var miceContainer = document.createElement('div');
		miceContainer.className = "metadataRendering";

		newSearchDisplay.appendChild(miceContainer);
		
		MetadataLoader.render(MICE.render, miceContainer, searchResultX.location, true);
		/*miceContainer.setAttribute('onmousedown', 'ExpSearchApp.removeQuerySearchBox(event)')
		miceContainer.setAttribute('onmouseup', 'ExpSearchApp.textSelected(event)');*/
		//miceContainer.setAttribute("draggable", true);
		$(miceContainer).on({
			 //dragstart: clippingDragStart,
			
			  mousedown: ExpSearchApp.removeQuerySearchBox,
			  mouseup: ExpSearchApp.textSelected
			});
		miceContainer.setAttribute('id', searchResultX.id);
	}
	var rightBar = document.createElement('div');
	rightBar.className = "searchResultRightBar";
	searchResultX.addFaviconBar(searchResultX, rightBar);
	newSearchDisplay.appendChild(rightBar);
}
