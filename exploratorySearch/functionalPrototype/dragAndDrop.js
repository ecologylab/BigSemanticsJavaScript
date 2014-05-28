/**
 * 
 */


function entryDragStart(event){
	event.dataTransfer.setData("Text", event.target.id);
	var compContainer = document.getElementsByClassName('comparisonContainer')[0];
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
	//Set entry as beingCompared, increase its weight, render the searchSet provided, build dismissal button
	
	if(comp != null)
		ExpSearchApp.removeComparisonDisplay(comp.id, comp);
	ExpSearchApp.displayComparison(data, document.getElementById(data));

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