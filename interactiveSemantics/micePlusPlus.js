/**
 * 
 */MICE.urlCollections = new Map;
MICE.htmlContainers = new Map;
MICE.colorMap = new Map;

MICE.filters = new Map;
var htmlID = 0;

var facetID = 0;
var usedIndices = [];
var colors = ['lightblue', '#fddee0', '#ffed7f', '#ffb74c', 'lightgreen', '#9a93aa', '#3366ff', '#c2ecb5', '#fa5d68', '#8fbc8f', '#acc3d0', '#ffa366', '#91AD74']
var colorCounter = 0;
var alphabet = ['a', 'b', 'c','d', 'e', 'f', 'g', 'h', 'i', 'j',
                'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't',
                'u', 'v', 'w', 'x', 'y', 'z', '{'];


MICE.hardCodedAuthors = new Map;

MICE.styleForRows;



MICE.buildMetadataFieldCollectionHook = function(parentUrl, metadataField, row, childTable, fieldLabelDiv, styleInfo, expandButton){
	MICE.styleForRows = styleInfo;

	var facets = document.createElement('div');
	facets.className = "facetContainer";
	

	if(metadataField.name == "references" && parentUrl == "http://dl.acm.org/citation.cfm?id=1498819&preflayout=flat"){
		var facetDiv = MICE.buildFacets(parentUrl, metadataField.mmdName, {name: "authors", facet_type: "ordinal"}, false);
		facets.appendChild(facetDiv);
		var urls = [];
		var rowWrapper;
		var row;
		for(var k = 0; k < metadataField.value.length; k++){
			var key = metadataField.value[k].value[0].navigatesTo; 
			if(key == null || key===undefined){
				key = metadataField.value[k].value[0].value;
				rowWrapper = new RowWrapper(key, row, styleInfo);
			}else{
				
				rowWrapper = new RowWrapper(metadataField.value[k].value[0].navigatesTo, row, styleInfo);
			}
			urls.push(key);
			var row = childTable.childNodes[k];
			 
			MICE.htmlContainers.put(key, row);
			htmlID++;
		}
		var urlAndTable = {};
		urlAndTable.urls = urls;
		urlAndTable.container = childTable;
		urlAndTable.expandButton = expandButton;
		MICE.urlCollections.put(metadataField.mmdName + parentUrl, urlAndTable);
	}

	MICE.collapseTable(childTable, styleInfo);			

	fieldLabelDiv.appendChild(facets);

	
	
};
MICE.filterByAuthor = function(selectedDiv, multiple){
	 if(colorCounter > 11){
		 colorCounter = 0;
	 }
	var values= [];
	if(multiple){
		for(var i = 0; i <selectedDiv.parentNode.childNodes.length; i++){
			if(selectedDiv.parentNode.childNodes[i].className == ("selectedAuthorNames")){
			}

		}
	}else{
		for(var i = 1; i <selectedDiv.parentNode.childNodes.length; i++){
			//selectedDiv.parentNode.childNodes[i].classList.remove("selectedAuthorNames");
			//selectedDiv.parentNode.childNodes[i].classList.add("authorNames");

		}
	}
	selectedDiv.classList.add("selectedAuthorNames");
	
	selectedDiv.setAttribute("style", "background-color: " + colors[colorCounter]);
	selectedDiv.setAttribute("colorindex", colorCounter);
	MICE.colorMap.put(event.target.getAttribute('key'), colorCounter);

	colorCounter++;

	selectedDiv.classList.remove("authorNames");
	var container = selectedDiv.parentNode;
	var collection = container.getAttribute("collectionname");
	var parent = container.getAttribute("parenturl");
	var colPar = collection + parent;
	var name = container.getAttribute("name");
	var filter_sort_request = MICE.filters.get(colPar);
	if(filter_sort_request == null){
		filter_sort_request = {};
		var target_collection = {};
		target_collection.parentUrls = [parent];
		target_collection.collectionName = collection;
		filter_sort_request.filter = [];
		filter_sort_request.sort = {};
		filter_sort_request.target_collection = target_collection;
	}
	
	for(var i = 0; i < filter_sort_request.filter.length; i++){
		
		values.push(filter_sort_request.filter[i].value)


		
	}	
	for(var i = 0; i < filter_sort_request.filter.length; i++){
		if (filter_sort_request.filter[i].name == name){
			filter_sort_request.filter.splice(i, 1);
			i--;
		}
	

		
	}	
	
		values.push(selectedDiv.innerHTML);

	

	for(var j = 0; j < values.length; j++){
		var facet = {}
		facet.name = name;
		facet.value = values[j];
		filter_sort_request.filter.push(facet);
	}

	MICE.filters.put(colPar, filter_sort_request);
	MICE.applyFilterSortRequest(filter_sort_request);
	
	
};
MICE.currentlyBuildingFacet;
MICE.buildAuthorFacet = function (parentUrl, collectionName, facetObj){
	
	/*
	 Add per - author paper count
	 * */
	
	
	var facet = document.createElement('div');
	facet.className = 'authorFacet';
	facet.setAttribute('name', facetObj.name);
	facet.setAttribute('id',  facetID.toString());
	facet.setAttribute('parenturl', parentUrl);
	facet.setAttribute('collectionname', collectionName);
	
	var facetLabel = document.createElement('div');
	facetLabel.className = 'authorHeader';
	facetLabel.innerHTML = "Authors";
		
	facet.appendChild(facetLabel);
	
	
	MICE.currentlyBuildingFacet = facet;
	$.getJSON( "../interactiveSemantics/authors.json", function( data, success, random ) {
		  var paperAuthors = data;
		 var divs = [];
		  for(var i = 0; i < paperAuthors.length; i++){
			  for(var j = 0; j < paperAuthors[i].authors.length; j++){
				  var aDiv = document.createElement('div');
				  aDiv.className = "authorNames"
				  aDiv.innerHTML = paperAuthors[i].authors[j];
				  if(aDiv.innerHTML == "Eugene Agichtein"){
					  var ffff = "asas";
				  }
				  aDiv.setAttribute("key", paperAuthors[i].name);
				  $(aDiv).click(function(event){
					 if(colorCounter > 11){
						 colorounter = 0;
					 }
					  if(event.target.className == "selectedAuthorNames"){
							var kids = event.target.parentNode.childNodes;
							/*for(var i = 1; i < kids.length; i++){
								kids[i].classList.remove("selectedAuthorNames");
								kids[i].classList.add("authorNames");
								kids[i].setAttribute("style", "");
							}*/
						 	event.target.classList.remove("selectedAuthorNames");
							event.target.classList.add("authorNames");
							event.target.setAttribute("style", "");
							/*var urls = MICE.urlCollections.get(collectionName + parentUrl).urls;
							var possibleContainer = MICE.htmlContainers.get(event.target.getAttribute("key")).parentNode;
							

							MICE.displayNewUrlList(urls, possibleContainer, false);*/
							//colorCounter = event.target.getAttribute('colorindex').parseInt();
							var colPar = event.target.parentNode.getAttribute('collectionname') + event.target.parentNode.getAttribute('parenturl')
							var filter_sort_request = MICE.filters.get(colPar);
							for(var f = 0; f < filter_sort_request.filter.length; f++){
								if (filter_sort_request.filter[f].value == event.target.innerHTML){
									filter_sort_request.filter.splice(f, 1);
									MICE.applyFilterSortRequest(filter_sort_request);

								}
							}


					  }	  
					 else if(event.ctrlKey){
						  MICE.filterByAuthor(event.target, true); 

					  }
					  else{
					  
						  MICE.filterByAuthor(event.target, false); 

					  }
				  });
				  var pushFlag = true;
				 for(var k = 0; k < divs.length; k++){
					 if(divs[k].innerHTML == aDiv.innerHTML){
						 pushFlag = false;
					 }
				 }
				  if(pushFlag){
					  divs.push(aDiv);

				  }
				  // MICE.currentlyBuildingFacet.appendChild(aDiv);
			  }
			 
		  }
		
		 divs.sort(function(a, b){
				var aInner = a.innerText;
				var bInner = b.innerText;
				if(aInner < bInner){
					return -1;
				}
				else if(aInner == bInner){
					return 0;
				}
				return 1;
			  });
		  
			  for(var k = 0; k < divs.length; k++){
				  MICE.currentlyBuildingFacet.appendChild(divs[k]);
			  }
	
	});
	return facet;
	

}
MICE.buildFacets = function (parentUrl, collectionName, facetObj){
	if(facetObj.name == "authors"){
		return MICE.buildAuthorFacet(parentUrl, collectionName, facetObj);
	}
	
	/*build the sort version of the facet*/
	var facet = document.createElement('div');
	facet.className = 'facet';
	var facetCheckBox = document.createElement('span');
	facetCheckBox.className = "facetCheckBox";
	var facetCheckBoxInput = document.createElement('input');
	facetCheckBoxInput.setAttribute('type', 'checkbox');
	var facetHeader = document.createElement('div');
	facetHeader.className="facetHeader";
	facetHeader.innerHTML = facetObj.name;
	
	facetCheckBoxInput.setAttribute('name', facetObj.name);
	facetCheckBoxInput.setAttribute('id',  facetID.toString());
	facetCheckBoxInput.setAttribute('parenturl', parentUrl);
	facetCheckBoxInput.setAttribute('collectionname', collectionName);
	facetCheckBoxInput.setAttribute('onclick', "MICE.sortFacet()");
	var checkBoxLabel = document.createElement('span');
	checkBoxLabel.innerHTML = 'Order: ';
	facetCheckBox.appendChild(checkBoxLabel);
	facetCheckBox.appendChild(facetCheckBoxInput);
	
	var mySlider = document.createElement('div');
	document.body.appendChild(mySlider);
	mySlider.setAttribute('id', facetID.toString());
	

	/* Establish Min and Max value displayers */
	var minLabel = document.createElement('label');
	var maxLabel = document.createElement('label');
	minLabel.setAttribute('for', 'minValue' + facetID.toString());
	maxLabel.setAttribute('for', 'maxValue' + facetID.toString());
	minLabel.innerHTML = "Min: ";
	maxLabel.innerHTML = "Max: ";
	minLabel.className = "facetLabel";
	maxLabel.className = "facetLabel";
		checkBoxLabel.className = "facetLabel";
	var minValue = document.createElement('input');
	minValue.setAttribute('type', 'text');
	minValue.setAttribute('id', 'minValue' + facetID.toString());
	minValue.value='a';
	minValue.setAttribute('onkeydown', "MICE.setSliderMinValue()");

	var maxValue = document.createElement('input');
	maxValue.setAttribute('type', 'text');
	maxValue.setAttribute('id', 'maxValue' + facetID.toString());
	maxValue.value='z';
	maxValue.setAttribute('onkeydown', "MICE.setSliderMaxValue()");
	mySlider.setAttribute('name', facetObj.name);
	mySlider.setAttribute('parenturl', parentUrl);
	mySlider.setAttribute('collectionname', collectionName);
	$( "#" + facetID.toString() ).slider({ range: true, values: [0, 25], min:0 , max: 25,
		step: 1,   
		slide: function( event, ui ) {
            $( "#minValue" + event.target.id)
            .val(alphabet[ui.values[ 0 ] ])
            $( "#maxValue" + event.target.id).val(alphabet[ui.values[ 1 ]])
         },
	 	stop: function( event, ui ) {
	 		//call the filter func
	 		var name = event.target.getAttribute('name');
	 		var parent = event.target.getAttribute('parenturl');
	 		var collection = event.target.getAttribute('collectionname');
	 		MICE.filter(ui.values[0], ui.values[1], name, parent, collection)
	 	}
		
	});

	facet.appendChild(facetHeader);
	facet.appendChild(mySlider);
	facet.appendChild(minLabel);
	facet.appendChild(minValue);
	facet.appendChild(maxLabel);
	facet.appendChild(maxValue);
	facet.appendChild(facetCheckBox);

	facetID++;


	return facet;
}
MICE.manualStartFilteringProcess = function(target, values){
	var name = target.getAttribute('name');
	var parent = target.getAttribute('parenturl');
	var collection = target.getAttribute('collectionname');
	MICE.filter(values[0], values[1], name, parent, collection)
}
MICE.sortFacet = function(){
	var checkbox = event.target;
	var parent = checkbox.getAttribute('parenturl');
	var collectionName = checkbox.getAttribute('collectionName');
	var facetName = checkbox.getAttribute('name');
	

	var filter_sort_request = MICE.filters.get((collectionName + parent));
	if(filter_sort_request == null){
		filter_sort_request = {};
		var target_collection = {};
		target_collection.parentUrls = [parent];
		target_collection.collectionName = collectionName;
		filter_sort_request.filter = [];
		filter_sort_request.sort = {};
		filter_sort_request.target_collection = target_collection;

	}
	var facet = {};
	facet.name = facetName;
	if (checkbox.checked){
		facet.direction = "ascending";
	}
	else{
		facet.direction = "descending";
	}
	filter_sort_request.sort = facet;
	MICE.filters.put(collectionName + parent, filter_sort_request);
	MICE.applyFilterSortRequest(filter_sort_request);
	
	
}

MICE.filter = function(min, max, name, parent, collection){
	var colPar = collection + parent;
	var filter_sort_request = MICE.filters.get(colPar);
	if(filter_sort_request == null){
		filter_sort_request = {};
		var target_collection = {};
		target_collection.parentUrls = [parent];
		target_collection.collectionName = collection;
		filter_sort_request.filter = [];
		filter_sort_request.sort = {};
		filter_sort_request.target_collection = target_collection;
	}
	
	for(var i = 0; i < filter_sort_request.filter.length; i++){
		if (filter_sort_request.filter[i].name == name){
			filter_sort_request.filter.splice(i, 1);
			i--;
		}
	}
	var facet = {}
	facet.name = name;
	facet.lower_limit = alphabet[min];
	max++;
	facet.upper_limit = alphabet[max];
	filter_sort_request.filter.push(facet);
	MICE.filters.put(colPar, filter_sort_request);
	MICE.applyFilterSortRequest(filter_sort_request);
	
}


MICE.giveMeAuthorValues = function(task, metadataFields, styleInfo){
	
	for(var i = 0; i < metadataFields.length; i++){
		
	}
	
	MetadataLoader.queue.splice(MetadataLoader.queue.indexOf(task), 1);

}


//This function's code is meant to imitate future debi functions. Please look forward to it!
MICE.applyFilterSortRequest = function(request){
	var collection = request.target_collection.collectionName;
	for (var i = 0; i < request.target_collection.parentUrls.length; i++){
		var parent = request.target_collection.parentUrls[i];
		var urlAndContainer = MICE.urlCollections.get(collection + parent);
		var parent = urlAndContainer.container;
		var urls = urlAndContainer.urls.slice(0);
		var passedFilterUrls = [];
		if(request.sort != null){
			urls.sort();
			if(request.sort.direction == "descending"){
				urls.reverse();
			}
		}
		var newUrlList = urls;
		passedFilterUrls = [];

		for (var i = 0; i < request.filter.length; i++){	
				for(var j = 0; j < newUrlList.length; j++){
					//Here, I'm going to implement something super specific to the ACM portal example - this
					//has nothing to do with final implementation and is strictly for my sanity.
					var immediateUrl = newUrlList[j];

					/*var pattern = "https://www\.amazon\.com/";
					var re = new RegExp("http://www\.amazon\.com/");
					immediateUrl = immediateUrl.replace(re, "");
					immediateUrl = immediateUrl.toLowerCase();*/
					
					/*PROTOTYPE 1 SPECIFIC STUFF FOLLOWs*/
					
					
					
					
					if(request.filter.lower_limit != null){
						if(!((immediateUrl >= request.filter[i].lower_limit) && (immediateUrl < request.filter[i].upper_limit))){
							//remove
							newUrlList.splice(j, 1);
							j--;
						}
					}
			
						if(request.filter[i].value != null){
							if(immediateUrl == "http://dl.acm.org/citation.cfm?id=506508&preflayout=flat"){
								var panic = "totes";
							}
							var containing = document.querySelectorAll('[key="'+immediateUrl+'"]');
							var removeFlag = false;
							for(var p = 0; p < containing.length; p++){
								
								var compareVal = containing[p].innerHTML;
								if(compareVal != request.filter[i].value){
									removeFlag = true;
									
								}
								else{
									passedFilterUrls.push(immediateUrl);
								}
								
								
							}
							
							if(removeFlag){
								
							}
							
						
						}
					
					
				
				}
		}
		if(passedFilterUrls.length > 0){
			MICE.displayNewUrlList(passedFilterUrls, parent, true);

		}else{
			MICE.displayNewUrlList(newUrlList, parent, true);

		}
	}

}

//This code strips down the parent Collection display and rebuilds from the rubble
MICE.displayNewUrlList = function(urls, parentContainer, fancyColors){

	while(parentContainer.hasChildNodes()){
		parentContainer.removeChild(parentContainer.childNodes[0]);
	}
	for(var i = 0; i < urls.length; i++){
		parentContainer.appendChild(MICE.htmlContainers.get(urls[i]));
		if(fancyColors){
			var cindex = MICE.colorMap.get(urls[i]);
			MICE.htmlContainers.get(urls[i]).childNodes[1].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[].setAttribute("style", "background-color: " + colors[cindex] + "; border-radius: 8px");

		}
		else{
			MICE.htmlContainers.get(urls[i]).childNodes[1].childNodes[0].childNodes[0].childNodes[0].childNodes[0].setAttribute("style", "");

		}

	}

	MICE.expandTable(parentContainer, MICE.styleForRows);

}

MICE.setSliderMinValue = function(){
	if(event.keyCode == 13){
		var value = event.target.value;
		//Is the value valid?
		if (alphabet.indexOf(value) >= 0){
			var curMax = $( event.target.parentNode.childNodes[0] ).slider( "option", "values")[1];
			if (curMax<alphabet.indexOf(value)){
				alert("Min must be higher than max");

			}else{
				$( event.target.parentNode.childNodes[0] ).slider( "option", "values", [alphabet.indexOf(value), curMax] );
	
				MICE.manualStartFilteringProcess($( event.target.parentNode.childNodes[0] )[0], $( event.target.parentNode.childNodes[0] ).slider( "option", "values"));
			}
			
		}
		//Display error of some kind
		else{
			alert("Enter value in range 'a' - 'z'");
		}
	}
}
MICE.setSliderMaxValue = function(){
	if(event.keyCode == 13){
		var value = event.target.value;
		//Is the value valid?
		if (alphabet.indexOf(value) >= 0){
			var curMin = $( event.target.parentNode.childNodes[0] ).slider( "option", "values")[0];
			if (curMin>alphabet.indexOf(value)){
				alert("Max must be lower than min");

			}
			else{
				$( event.target.parentNode.childNodes[0] ).slider( "option", "values", [curMin, alphabet.indexOf(value)] );
				MICE.manualStartFilteringProcess($( event.target.parentNode.childNodes[0] )[0], $( event.target.parentNode.childNodes[0] ).slider( "option", "values"));

			}
			
		}
		//Display error of some kind
		else{
			alert("Enter value in range 'a' - 'z'");
		}
	}}
