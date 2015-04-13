/**
 * 
 */

var Mink = {};
var FIRST_LEVEL_FIELDS = 20;
var FIELDS_TO_EXPAND = 10;

function buildDiv(className){
	var elem = document.createElement('div');
	elem.className = className;
	return elem;
}
function buildSpan(className){
	var elem = document.createElement('span');
	elem.className = className;
	return elem;
}
Mink.initialize = function(){
	
	var minkRenderings = document.getElementsByClassName('metadataRendering');	
	
	for(var i = 0; i < minkRenderings.length; i++)
	{
		console.log("called");
		var location = minkRenderings[i].getElementsByTagName('a')[0];
		if(location)
			
			MetadataLoader.render(Mink.render, minkRenderings[i], location.href, true);
	}
}

//I refuse to go more than one level deep

Mink.makeLinkedFieldList = function(metadataFields){
	var list = [];
	
	for (var i = 0; i < metadataFields.length; i++){
		var metadataField = metadataFields[i];
		if(metadataField.child_type != null){
			if(metadataField.child_type != 'video' && metadataField.child_type != 'image' && metadataField.child_type != 'audio'){
				
				var collectionLinks = {};
				collectionLinks.links = [];
				collectionLinks.name = metadataField.name;
				for (var j = 0; j < metadataField.value.length; j++){
					var childField = metadataField.value[j];
					if(childField.value[0].navigatesTo != null){
						collectionLinks.links.push(childField.value[0].navigatesTo);
					}
					
				}
				if(collectionLinks.links.length > 0){
					list.push(collectionLinks);
				
					}
				}
			}
			//composite
			else{
				var compLinks = {};
				compLinks.links = [];
				compLinks.name = metadataField.name;

				if(metadataField.value[0].navigatesTo != null){
					compLinks.links.push(metadataField.value[0].navigatesTo);
					list.push(compLinks);
				}
			}
		
		
		
	}
	console.log(list);
	return list;
	
}
Mink.makeExplorableCollection = function(expandableCollections, linkedField){
	var expandableCollection = buildDiv('minkExplorableCollection');
	var label = buildSpan('minkExplorableCollectionLabel');
	var labelText = linkedField.name;
	labelText += ' (';
	labelText += linkedField.links.length;
	labelText += ')';
	label.innerHTML = labelText;
	
	var minkButton = buildSpan('minkExplorableCollectionButton');
	var buttonImg = document.createElement('img');
	buttonImg.className = 'minkExploreIcon';
	buttonImg.src = '../renderers/images/mink/bad_icon.png';
	minkButton.appendChild(buttonImg);
	expandableCollection.appendChild(label);
	expandableCollection.appendChild(minkButton);
	expandableCollections.appendChild(expandableCollection);
}
Mink.makeExplorableCollections = function (sideBar, linkedFields){
	var expandableCollections = buildDiv('minkExplorableCollections');
	
	for(var i = 0; i < linkedFields.length; i++){
		Mink.makeExplorableCollection(expandableCollections, linkedFields[i]);
		
	}
	sideBar.appendChild(expandableCollections);
}
Mink.makeTitle = function(parent, metadataField){
	
	var link = document.createElement('a');
	link.href = metadataField.navigatesTo;
	var linkLabel = buildDiv('minkTitleField');
	linkLabel.innerHTML = metadataField.value;
	link.appendChild(linkLabel);
	
	parent.appendChild(link);
}
Mink.makeSubheader = function(parent, metadataField){
	var text = "";
	var textHold = document.createElement('em');
	//composite or collection
	if(typeof metadataField.value != 'string'){
		if(metadataField.child_type != null){
			for (var i = 0; i < metadataField.value.length; i++){
				var childField = metadataField.value[i];
				if(typeof childField.value[0].value === 'string'){
					text += childField.value[0].value;
					text += ', ';
				}
				
				
			}
			text = text.slice(0, -2);
		}else{
			if(typeof metadataField.value[0].value === 'string'){
				text += metadataField.value[0].value;
			}
		}
	}
	//scalar
	else{
		text += metadataField.value;
	}
	
	textHold.innerHTML = text;
	parent.appendChild(textHold);
	
}
Mink.makeHeader = function(parent, metadataFields){
	var title = buildDiv('minkTitle');
	var subtitles = buildDiv('minkSubtitleContainer');
	var headeredName = [];
	for (var i = 0; i < metadataFields.length; i++){
		var field = metadataFields[i];
		//make the tile field, well the title
		if(field.name === 'title' ||field.name == 'title'){
			Mink.makeTitle(title, field);
			headeredName.push('title');
		}
		else if(field.mink_style != null){
			if(field.mink_style == 'subheader'){
				if(field.navigatesTo){
					var subHeader = document.createElement('a');
					subHeader.className= 'subtitle';
					subHeader.href = field.navigatesTo;
					Mink.makeSubheader(subHeader, field);
					subtitles.appendChild(subHeader);
					headeredName.push(field.name);
				}else{
					var subHeader = buildDiv('subtitle');
					
					Mink.makeSubheader(subHeader, field);
					subtitles.appendChild(subHeader);
					headeredName.push(field.name);
				}
		

			}
		}
	}
	parent.appendChild(title);
	parent.appendChild(subtitles);
	
	return headeredName;
}
//Initially just going to scan for collections of images

Mink.makeMedia = function(parent, metadataFields){
	var images = [];
	for (var i = 0; i < metadataFields.length; i++){
		var field = metadataFields[i];
		//potential collection of media
		if(field.child_type != null){
			if(field.child_type == 'image'){
				for (var j = 0; j < field.value.length; j++){
					var child = field.value[j];
					var image = buildDiv('minkHeaderImage');
					var imageCont = document.createElement('img');
					imageCont.src = child.value[0].navigatesTo;
					image.appendChild(imageCont);
					images.push(image);
				}
					
			}
		}
		//potential composite media
		else if(field.composite_type != null){
			if(field.composite_type == 'image'){
				var image = buildDiv('minkHeaderImage');
				var imageCont = document.crateElement('img');
				imageCont.src = field.value[0].navigatesTo;
				image.appendChild(imageCont);
				images.push(image);
			}
		}
	}
	console.log(images);
	var leftArrow = buildDiv('leftArrow');
	
	//no matter what I ad the place to display the left arrow and right arrow, even if I intend to hide them 
	for(var i = 0; i < images.length; i++){
		parent.appendChild(images[i]);
		if(i !=0 ){
			images[i].display = 'none';
		}
	}
	var rightArrow = buildDiv('rightArrow');
	if(images.length > 1){
		var leftChev = document.createElement('img');
		leftChev.src = '../renderers/images/mink/left.png'
		var rightChev = document.createElement('img');
		leftChev.src = '../renderers/images/mink/right.png';
		leftChev.className = 'chevron';
		rightChev.className = 'chevron';
		leftArrow.appendChild(leftChev);
		leftArrow.display = 'none';
		rightArrow.appendChild(righChev);
		parent.appendChild(leftArrow);
		parent.appendChild(rightArrow);

	}
    if(images.length < 1){
		return false;
	}else{
		return true;
	}

}

Mink.removeLinkedAndHeaderFields = function(metadataFields, linkedFields, headerNames){
	var remainingFields = [];
	var linked = [];
	var images = [];
	for (var i = 0; i < linkedFields.length; i++){
		linked.push(linkedFields[i].name);
	}
	for (var i = 0; i  < metadataFields.length; i++){
		if(metadataFields[i].child_type != null){
			if(metadataFields[i].child_type == 'image'){
				images.push(metadataFields[i].name);
			}
		}else if(metadataFields.type == 'image'){
			images.push(metadataFields[i].name);

		}
	}
	for (var i = 0; i < metadataFields.length; i++){
		if(headerNames.indexOf(metadataFields[i].name) < 0 && linked.indexOf(metadataFields[i].name) < 0 && images.indexOf(metadataFields[i].name)){
			remainingFields.push(metadataFields[i]);
		}
	}
	return remainingFields;
}

Mink.buildExpandButton = function(){
	
}
Mink.buildCollection = function(metadataFieldOrigin, isChildTable, rowOriginal, styleInfo, valueColOriginal, nameColOriginal, expandButtonOriginal, url){
	//Put the label where it belongs, and 
	var fieldLabelDiv = buildDiv('minkCollectionLabel');
	var label = RendererBase.getFieldLabel(metadataFieldOrigin);
	
	if(label.type == 'scalar'){

		fieldLabelDiv.innerText = label.value;

		fieldLabelDiv.className = styleInfo.styles.fieldLabel;

	}else if(label.type == "image"){
		var image = document.createElement("img");
		image.src = label.value;
		img.className = styleInfo.styles.fieldLabelImage;

	}
	
	nameColOriginal.appendChild(fieldLabelDiv);
	
	
	
	var fields = metadataFieldOrigin.value;
	
	for(var i = 0; i < fields.length; i++){
		var row = buildDiv('minkTableRow');
		var metadataField = fields[i];
		var nameCol = document.createElement('div');
		
		if (!metadataField.show_expanded_always ){	
			nameCol.className = "minkTableNameCol";
		}
		else if(metadataField.composite_type != null && metadataField.composite_type != "image"){
			nameCol.className = "minkTableNameCol";
			nameCol.style.display = "none";
		}
		var valueCol = document.createElement('div');
		
			valueCol.className = "minkTableValueCol";
		
		var expandButton = null;	
		
		if(metadataField.scalar_type)
		{				
			MICE.buildScalarField(metadataField ,styleInfo, valueCol, nameCol);
		}
		
		else if (metadataField.composite_type != null && metadataField.composite_type == "image")
		{
			MICE.buildImageField(metadataField, isChildTable, styleInfo, valueCol, nameCol);
		}
		//We're going to focus on non-image composites that have a location
		else if(metadataField.composite_type != null && metadataField.composite_type != "image")
		{
			expandButton = Mink.buildCompositeField(metadataField, isChildTable, row, styleInfo, valueCol, nameCol, expandButton, url);
			
			
		}
		
		else if(metadataField.child_type != null)
		{		
			expandButton = Mink.buildCollection(metadataField, isChildTable, row, styleInfo, valueCol, nameCol, expandButton);
			
		}
		
		
		if(nameCol.hasChildNodes()){
			row.appendChild(nameCol);

		}
		row.appendChild(valueCol);
		valueColOriginal.appendChild(row);
		
	}
	
	
}

Mink.showMore = function(event){
	console.log('ta-dagh');
	var row = event.target.parentNode.parentNode;
	
	row.removeChild(row.getElementsByClassName('minkMoreButtonContainer')[0]);
	var minkBody = row.parentNode.parentNode;
	var minkTables = minkBody.getElementsByClassName('minkOtherContent');
	for (var i = 0; i < minkTables.length; i++){
			minkTables[i].style.display = "";
		
	}
	Mink.buildLessButton(row);
}
Mink.showLess = function(event){
	var row = event.target.parentNode.parentNode;
	row.removeChild(row.getElementsByClassName('minkMoreButtonContainer')[0]);
	var minkBody = row.parentNode.parentNode;
	var minkTables = minkBody.getElementsByClassName('minkOtherContent');
	for (var i = 0; i < minkTables.length; i++){
			minkTables[i].style.display = "none";
		
	}
	Mink.buildMoreButton(row);
}
Mink.buildLessButton = function(parent){
	var moreContainer = buildDiv('minkMoreButtonContainer');
	var moreButton = buildDiv('minkLessButton');
	moreButton.addEventListener('click', Mink.showLess);
	moreButton.appendChild(document.createTextNode('less'));
	/*var leftEllip = buildDiv('minkHDottedLine');
	var rightEllip = buildDiv('minkHDottedLine');
	leftEllip.innerHTML = ".........";
	rightEllip.innerHTML = ".........";
	moreContainer.appendChild(leftEllip);*/
	moreContainer.appendChild(moreButton);
//	moreContainer.appendChild(rightEllip);
	$(parent).append($(moreContainer));
}
Mink.buildMoreButton = function(parent){
	var moreContainer = buildDiv('minkMoreButtonContainer');
	var moreButton = buildDiv('minkMoreButton');
	moreButton.addEventListener('click', Mink.showMore);
	moreButton.appendChild(document.createTextNode('more'));
	/*var leftEllip = buildDiv('minkHDottedLine');
	var rightEllip = buildDiv('minkHDottedLine');
	leftEllip.innerHTML = ".........";
	rightEllip.innerHTML = ".........";
	moreContainer.appendChild(leftEllip);*/
	moreContainer.appendChild(moreButton);
	//moreContainer.appendChild(rightEllip);
	$(parent).append($(moreContainer));
}

//Note: thiese fields should never be linked, but they may stil lhave a lot of metadata in them
Mink.buildCompositeField = function(metadataField, isChildTable, row, styleInfo, valueCol, nameCol, expandButton, url){
	/*var fieldLabelDiv = buildDiv('minkCompositeLabel');
	var label = RendererBase.getFieldLabel(metadataField.value[0]);
	
	if(label.type == 'scalar'){

		fieldLabelDiv.innerText = label.value;

		fieldLabelDiv.className = styleInfo.styles.fieldLabel;

	}else if(label.type == "image"){
		var image = document.createElement("img");
		image.src = label.value;
		img.className = styleInfo.styles.fieldLabelImage;

	}
	
	nameCol.appendChild(fieldLabelDiv);*/
	
	
	
	
	var childTable =  Mink.makeTable(valueCol, metadataField.value, null, styleInfo);
	
		
	
	
	
	
}

Mink.buildScalarField = function(metadataField){
	
}

Mink.makeTable = function(parent, fields, url, styleInfo, isRoot){
	
	if(fields == null){	
		return;
	}
	//styleInfo.styles = MINK_MICE_STYLE;
	//var newTable = MICE.buildMetadataTable(null, false, true, fields, FIRST_LEVEL_FIELDS, styleInfo);
	var isChildTable = true;
	var newTable = buildDiv('minkTable');
	//iterate through fields, building name and value cols for each and then call appropriate renderer base function.
	for(var i = 0; i < fields.length; i++){
		var row = buildDiv('minkTableRow');
		if(isRoot && i != (fields.length-1)){
			row.classList.add('rootRow');
		}
		var metadataField = fields[i];
		var nameCol = document.createElement('div');
		
		if (!metadataField.show_expanded_always ){	
			nameCol.className = "minkTableNameCol";
		}
		else if(metadataField.composite_type != null && metadataField.composite_type != "image" && !imageLabel){
			nameCol.className = "minkTableNameCol";
			nameCol.style.display = "none";
		}
		var valueCol = document.createElement('div');
		
			valueCol.className = "minkTableValueCol";
		
		if(metadataField.composite_type != null && metadataField.composite_type != "image" && !imageLabel){
			valueCol.className = "minkTableValueCol";
		}
		
		var expandButton = null;	
		
		if(metadataField.scalar_type)
		{				
			MICE.buildScalarField(metadataField ,styleInfo, valueCol, nameCol);
		}
		
		else if (metadataField.composite_type != null && metadataField.composite_type == "image")
		{
			MICE.buildImageField(metadataField, isChildTable, styleInfo, valueCol, nameCol);
		}
		//We're going to focus on non-image composites that have a location
		else if(metadataField.composite_type != null && metadataField.composite_type != "image")
		{
			expandButton = Mink.buildCompositeField(metadataField, isChildTable, row, styleInfo, valueCol, nameCol, expandButton, url);
			
			
		}
		
		else if(metadataField.child_type != null)
		{		
			expandButton = Mink.buildCollection(metadataField, isChildTable, row, styleInfo, valueCol, nameCol, expandButton);
			
			
		}
		if(nameCol.hasChildNodes()){
			row.appendChild(nameCol);

		}
		row.appendChild(valueCol);
		newTable.appendChild(row);
		
	}
	
	var container = buildDiv('minkMDContainer');
	container.appendChild(newTable);
	parent.appendChild(container);
}
Mink.render = function(task){
	
	var metadataFields = task.fields;
	var styleInfo = task.style;
	styleInfo.styles = MINK_MICE_STYLE.styles;
	// Create the interior HTML container
	task.visual = document.createElement('div');
	task.visual.className = "minkContentContainer";
	task.visual.setAttribute('mdType', metadataFields[0].parentMDType);

	// Build the HTML table for the metadata
	MetadataLoader.currentDocumentLocation = task.url;
	
	var metadataTable = document.createElement('div');
	metadataTable.className = "minkContainer";
	Mink.buildMinkShell(metadataTable, false, task.isRoot, metadataFields, FIRST_LEVEL_FIELDS, styleInfo);

	linkedFields = Mink.makeLinkedFieldList(metadataFields);
	Mink.makeExplorableCollections(metadataTable.getElementsByClassName('minkSideBar')[0], linkedFields);
	var headerNames = Mink.makeHeader(metadataTable.getElementsByClassName('minkHeader')[0], metadataFields);
	var anyMedia = Mink.makeMedia(metadataTable.getElementsByClassName('minkMedia')[0], metadataFields);
	if(!anyMedia){
		metadataTable.getElementsByClassName('minkMedia')[0].parentNode.parentNode.removeChild(metadataTable.getElementsByClassName('minkMedia')[0].parentNode);
		metadataTable.getElementsByClassName('minkHeader')[0].setAttribute('style', '  margin-left: 8px;');
	}
	var prunedFields = Mink.removeLinkedAndHeaderFields(metadataFields, linkedFields, headerNames);
	//Mink.makeTable(metadataTable.getElementsByClassName('minkTable')[0], prunedFields, task.url, styleInfo);
	
	if(prunedFields.length > 0){

		Mink.buildMoreButton(metadataTable.getElementsByClassName('minkHeader')[0]);
		
		metadataTable.getElementsByClassName('minkOtherContent')[0].appendChild(buildDiv('minkTableRoot'));

		Mink.makeTable(metadataTable.getElementsByClassName('minkTableRoot')[0], prunedFields, task.url, styleInfo, true);
		if(task.mmd.mink_expand_always){
			console.log('expanding');
		}else{
			metadataTable.getElementsByClassName('minkOtherContent')[0].style.display = 'none';
		}
}
	
	
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
		//MICE.unhighlightDocuments(null, styleInfo);
		
	}
	/*
	// If there isn't a metadata table to display then keep the old visual and remove the loading indicator
	else
		MICE.clearLoadingRows(task.container, styleInfo);
	*/
	// Remove the RenderingTask from the queue
	MetadataLoader.queue.splice(MetadataLoader.queue.indexOf(task), 1);
}
Mink.buildShellControls = function(parent){
	var controlRow = document.createElement('div');
	controlRow.className = "minkControls";
	parent.appendChild(controlRow);
	
	var control1 = document.createElement('span');
	control1.className = 'minkControl';
	var control1Icon = document.createElement('img');
	control1Icon.className = "minkControlIcon";
	control1Icon.src = '../renderers/images/mink/minus.png';
	control1.appendChild(control1Icon)
	
	var control2 = document.createElement('span');
	control2.className = 'minkControl';
	var control2Icon = document.createElement('img');
	control2Icon.className = "minkControlIcon right";
	control2Icon.src = '../renderers/images/mink/pin.png';
	control2.appendChild(control2Icon)
	
	controlRow.appendChild(control1);
	//controlRow.appendChild(control2);
	
}
Mink.buildMinkShell = function(table, isChildTable, isRoot, metadataFields, fieldCount, styleInfo){
	
	Mink.buildShellControls(table);
	var minkMain = document.createElement('div');
	minkMain.className = "mink";
	var minkBody = buildDiv('minkBody')
	var minkSideBar = buildDiv('minkSideBar')
	var minkRow = buildDiv('minkKeyFields');
	var minkMedia = buildDiv('minkMediaContainer');
	var mmedia = buildDiv('minkMedia');
	minkMedia.appendChild(mmedia);
	var header = buildDiv('minkHeader');
	minkRow.appendChild(minkMedia);
	minkRow.appendChild(header);
	minkBody.appendChild(minkRow);
	minkBody.appendChild(buildDiv('minkOtherContent'));
	
	minkMain.appendChild(minkBody);
	minkMain.appendChild(minkSideBar);

	table.appendChild(minkMain);

}
