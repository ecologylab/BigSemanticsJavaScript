/**
 * 
 */




//Drag and Drop Functions for Dragging Metadata Clippings

//Should send over:
//Location of md
//HTML


function clippingDragStart(event){
	var clippingHTML = event.target;
	while(clippingHTML.className != "indResultContainer"){
		clippingHTML = clippingHTML.parentNode;
	}
	/*
	var clippingClone = $(clippingHTML).clone(true)[0];
	
	//Remove event handlers from the searchHandle and metadatarendering that are specific to expSearch
	var searchHandle =  clippingClone.childNodes[0];
	var metadataRend = clippingClone.childNodes[1];
	searchHandle.draggable=false;
	searchHandle.setAttribute('ondragstart', "");
	searchHandle.setAttribute('ondragend', "");
	metadataRend.setAttribute('onmousedown', "");
	metadataRend.setAttribute('onmouseup', "");
	event.dataTransfer.setData("text/html/clipping", clippingClone.outerHTML);
	//Obtain the location for the md clipping - it should always be in the first valueCol of the metadatarendering
	//indResultContainer -> metadataRendering -> metadataContainer*/
	var locationHunter = clippingHTML.childNodes[1].childNodes[0];
	//metadataContainer -> metadataTableDiv -> metadataRow->valueCol
	locationHunter = locationHunter.childNodes[0].childNodes[0].childNodes[1];
	//valueColl->fieldValueContainer->Field_value->a
	locationHunter = locationHunter.childNodes[0].childNodes[1].href;
	//metadataContainer
	console.log(locationHunter);
	event.dataTransfer.setData("text/url/md", locationHunter);
	var grip = event.target;
	while (grip.className != 'searchResultHandle'){
		grip = grip.parentNode;
	}
	var title = grip.nextSibling.childNodes[0].childNodes[0].childNodes[0].childNodes[1].childNodes[0].childNodes[1].innerHTML;
	var type = grip.nextSibling.childNodes[0].getAttribute('mdtype');
	//logging
	var time = new Date().getTime();
	eventObj = {
		drag_start: {
	  		timestamp: time,
	  		result_title: title,
	  		result_type: type
	  	}
	 };
	 TheRecord.addEvent(eventObj); 
}
function clippingDragEnd(event){
	
}





//Drag and Drop functions for entries and the comparison display
function entryDragStart(event){
	//PLaces an X in front of the id so the recieving function can differentiate between url's and certain queries
	var idMod = 'X' + event.target.id;
	event.dataTransfer.setData("Text", idMod);
	var compContainer = document.getElementsByClassName('comparisonContainer')[0];
	var button = event.target;
	compContainer.classList.add('entryPickedUp');
  
}

function comparisonDragOver(event){
	event.preventDefault();
	var compContainer = document.getElementsByClassName('comparisonContainer entryPickedUp')[0];
	
	if (compContainer != null){
		compContainer.classList.remove('entryPickedUp');
		compContainer.classList.add('over');		

	}
	
}

function comparisonDrop(event){
	event.preventDefault();
	var comp= document.getElementById('comp');
	
	var data = event.dataTransfer.getData("Text");
	//If data is a url, render webpage in an iframe
	
	var patt = new RegExp('^http');
	//We use this to check if a link has erroneously been dragged into the comparison zone!
	if (patt.test(data)){
		console.log("Can only drag history entries into comparison column");
	}
	else{
		if(comp != null)
			ExpSearchApp.removeComparisonDisplay(comp.id, comp);
		
		//Removes the 'X' we use to ensure that a query isn't mistaken for a webpage
		data = data.substring(1);
		ExpSearchApp.displayComparison(data, document.getElementById(data));
		
	}
	//Else, render a comparison display
	

}

function comparisonDragEnter(event) {
	
}

function entryDragEnd(event){
	var compContainer = document.getElementsByClassName('comparisonContainer entryPickedUp')[0];
	if (compContainer == null){
		compContainer = document.getElementsByClassName('comparisonContainer over')[0];
		if(compContainer!=null)
			compContainer.classList.remove('over');
	}
	else{
		compContainer.classList.remove('entryPickedUp');
		

	}
}
function comparisonDragLeave(event) {
	var compContainer = document.getElementsByClassName('comparisonContainer over')[0];
	if (compContainer != null){
		
		compContainer.classList.remove('over');
		compContainer.classList.add('entryPickedUp');
	}
	
	
}