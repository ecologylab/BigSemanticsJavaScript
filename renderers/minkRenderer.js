/**
 * 
 */

var Mink = {};
var FIRST_LEVEL_FIELDS = 20;
var FIELDS_TO_EXPAND = 10;
Mink.rootDocToCollections = new Map;
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


Mink.recursiveIsLinked = function(metadataField){
	
		if(metadataField.child_type != 'video' && metadataField.child_type != 'image' && metadataField.child_type != 'audio'){		
			var collectionLinks = {};
			collectionLinks.links = [];
			collectionLinks.name = metadataField.name;
			for (var j = 0; j < metadataField.value.length; j++){
				var childField = metadataField.value[j];
				if(typeof(childField.value) == "object"){
					if(childField.value.length > 0){
							if(childField.value[0].navigatesTo != null){
								return true;
							}else{
								return Mink.recursiveIsLinked(childField);
							}
						}
					}
					
				}
		
				
			
			
		}
		//composite
		else{
			var compLinks = {};
			compLinks.links = [];
			compLinks.name = metadataField.name;

			if(metadataField.value[0].navigatesTo != null){
				return true;
			}else{
				for(var l = 0; l < metadataField.value.length; l++){
					if(typeof(metadataField.value[l]) === "object")
						return Mink.recursiveIsLinked(metadataField.value[l]);

				}
			}
		}
	
	return false;

}

Mink.recursiveSearchForLinked = function(metadataField, list, isRoot){
	if(metadataField.child_type != null){
		if(metadataField.child_type != 'video' && metadataField.child_type != 'image' && metadataField.child_type != 'audio'){		
			var collectionLinks = {};
			collectionLinks.links = [];
			collectionLinks.name = metadataField.name;
			for (var j = 0; j < metadataField.value.length; j++){
				var childField = metadataField.value[j];
				if(childField.value.length > 0){
					if(childField.value[0].navigatesTo != null){
						collectionLinks.links.push(childField.value[0].navigatesTo);
					}else{
						if(Mink.recursiveIsLinked(childField) && (isRoot == true)){
							console.log("COL TRUE");
							collectionLinks.links.push(childField.value[0].navigatesTo);

						}						
						//Mink.recursiveSearchForLinked(childField, list);
					}
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
			}else{
				for(var l = 0; l < metadataField.value.length; l++){
					if(typeof(metadataField.value[l]) === "object"){
						Mink.recursiveSearchForLinked(metadataField.value[l], list);
						if(Mink.recursiveIsLinked(metadataField.value[l]) && isRoot){
							console.log("COMPOSITE TRUE");
							
						}
					}

				}
			}
		}
		
}
Mink.makeLinkedFieldList = function(metadataFields){
	var list = [];
	
	for (var i = 0; i < metadataFields.length; i++){
		var metadataField = metadataFields[i];
		Mink.recursiveSearchForLinked(metadataField, list, true);
	}
		
		
		
	
	console.log(list);
	return list;
	
}

Mink.getExplorableCount = function(metadataFields){
	var count = 0;
	var linked = Mink.makeLinkedFieldList(metadataFields);
	for(var i = 0; i < linked.length; i++){
		count += linked[i].links.length;
	}
	console.log(count);
	return count;
}

Mink.showExplorableLinks = function(event){
	var target = event.target;
	while(target.className != "minkExplorableCollection"){
		target = target.parentNode;
	}
	var rooturl = target.getAttribute('rooturl');
	var collectionname = target.getAttribute('collectionname');
	var links = Mink.rootDocToCollections.get(rooturl).get(collectionname);
	console.log(links);
}
Mink.makeExplorableCollection = function(expandableCollections, linkedField, url){
	var expandableCollection = buildDiv('minkExplorableCollection');
	var label = buildSpan('minkExplorableCollectionLabel');
	var labelText = BSUtils.removeLineBreaksAndCrazies(BSUtils.toDisplayCase(linkedField.name));
	labelText += ' (';
	labelText += linkedField.links.length;
	labelText += ')';
	label.innerHTML = labelText;
	var listOfLinks = [];
		var minkButton = buildSpan('minkExplorableCollectionButton');
	var buttonImg = document.createElement('img');
	buttonImg.className = 'minkExploreIcon';
	buttonImg.src = '../renderers/images/mink/bad_icon.png';
	minkButton.appendChild(buttonImg);
	expandableCollection.addEventListener('click', Mink.showExplorableLinks);
	expandableCollection.setAttribute("rooturl", url);
	expandableCollection.setAttribute("collectionname", linkedField.name);

	expandableCollection.appendChild(label);
	expandableCollection.appendChild(minkButton);
	expandableCollections.appendChild(expandableCollection);
	
}
Mink.makeExplorableCollections = function (sideBar, linkedFields, url){
	var expandableCollections = buildDiv('minkExplorableCollections');
	var listOfCols = [];
	var linkedUrlMap = new Map;
	
	for(var i = 0; i < linkedFields.length; i++){
		Mink.makeExplorableCollection(expandableCollections, linkedFields[i], url);
		linkedUrlMap.put(linkedFields[i].name, linkedFields[i].links);
		listOfCols.push(linkedFields[i].name);

	}
	
	Mink.rootDocToCollections.put(url, linkedUrlMap);

//	sideBar.appendChild(expandableCollections);
}
Mink.makeTitle = function(metadataFields, url, styleInfo){
	
	var headerContainer = buildDiv('minkTitleBar');
	var plus = RendererBase.buildExpandButton(styleInfo);
	
		headerContainer.appendChild(plus);
	var imageCont = document.createElement('img');
	imageCont.className = "minkFavicon";
	imageCont.src = 	BSUtils.getFaviconURL(url);
	headerContainer.appendChild(imageCont);
	var metadataField;
	for (var i = 0; i < metadataFields.length; i++){
		var field = metadataFields[i];
		if(field.name === 'title' ||field.name == 'title'){
			metadataField = field;
			break;
		}
	}
	if(metadataField!=null){
	var link = document.createElement('a');
	link.className = "minkTitleField";
	link.href = metadataField.navigatesTo;
	link.innerHTML = "<span>" + metadataField.value + "</span>";
	headerContainer.appendChild(link);
	}
	
	//function to find number of explorables
	var explorableCount = Mink.getExplorableCount(metadataFields);
	if(explorableCount > 0){
		var explorableButton = buildSpan('minkExplorablesExpander');
		explorableButton.innerHTML = explorableCount;
		headerContainer.appendChild(explorableButton);

	}
	/*
	var img = new Image();
	img.onload = function () {
		var colorThief = new ColorThief();
	  console.log(colorThief.getColor(img));
	};
	//
	img.crossOrigin = '*';

	img.src = BSUtils.getFaviconURL(url);
	img.className = "minkFavicon";
	headerContainer.appendChild(img);
	
	var tmpCanvas = document.createElement('canvas');
	tmpCanvas.width = 24;
	tmpCanvas.height = 24;
	tmpCanvas.getContext('2d').drawImage(imageCont,0,0); // Or at whatever offset you like
	document.body.appendChild(tmpCanvas);
	*/
	plus.addEventListener('click', Mink.grow);
	
	return headerContainer;
	
}
Mink.makeSubheader = function(parent, metadataField){
	var text = "";
	var textHold = document.createElement('span');
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
Mink.makeHeader = function(parent, metadataFields, isMedia){
	var title = buildDiv('minkTitle');
	var subtitles = buildDiv('minkSubtitleContainer');
	var videoFrame = null;
	var headeredName = [];
	
	for (var i = 0; i < metadataFields.length; i++){
		var field = metadataFields[i];
		if(i == 4){
			var t = 0;
		}
		console.log(field.mmdName);
		//make the tile field, well the title
		if(field.name == "title"){
			headeredName.push(field.name);
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
		

			}	else if(field.mink_style == "main_video"){
				//<iframe width="560" height="315" src="https://www.youtube.com/embed/NUI9I1HU19I" frameborder="0" allowfullscreen></iframe>
				videoFrame = document.createElement("iframe");
				videoFrame.setAttribute('allowfullscreen', '')
				videoFrame.className="minkVideo";
				if(isMedia){
					videoFrame.width = 367;
					videoFrame.height = 206;
				}else{

					videoFrame.width = 510;
					videoFrame.height = 286;
				}
				
				videoFrame.setAttribute('frameborder', '0');
				videoFrame.src = field.value;
				parent.appendChild(videoFrame);

				console.log("victory");
		}
		}
	
			
		
	}
	parent.appendChild(title);
	if(videoFrame){
		parent.appendChild(videoFrame);
	}
	if(subtitles.childNodes.length > 0){
		parent.appendChild(subtitles);

	}
	/*for(var i = 0; i < videos.length; i++){
	
	parent.style.width = '560px';
	parent.style.height = '315px';
}*/
	return headeredName;
}




//Initially just going to scan for collections of images

Mink.makeMedia = function(parent, metadataFields){
	var images = [];
	var videos = []
	for (var i = 0; i < metadataFields.length; i++){
		var field = metadataFields[i];
	
		//potential collection of media
		if(field.child_type != null){
			if(field.child_type == 'image' && field.mink_style !="hide"){
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
		if(isRoot){
			row.classList.add('rootRow');
			if(i != (fields.length-1)){
				row.classList.add('notBottom');
			}
		}
		var metadataField = fields[i];
		var nameCol = document.createElement('div');
		
		if (!metadataField.show_expanded_always ){	
			nameCol.className = "minkTableNameCol";
		}
		else if(metadataField.composite_type != null && metadataField.composite_type != "image" ){
			nameCol.className = "minkTableNameCol";
			nameCol.style.display = "none";
		}
		var valueCol = document.createElement('div');
		
			valueCol.className = "minkTableValueCol";
		
		if(metadataField.composite_type != null && metadataField.composite_type != "image" ){
			valueCol.className = "minkTableValueCol";
		}
		
		var expandButton = null;	
		
		if(metadataField.scalar_type)
		{				
			MICE.buildScalarField(metadataField ,styleInfo, valueCol, nameCol);
			valueCol.childNodes[0].addEventListener('click', Mink.focus);
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
	Mink.buildMinkShell(metadataTable, false, task.isRoot, metadataFields, FIRST_LEVEL_FIELDS, styleInfo, task.url);

	linkedFields = Mink.makeLinkedFieldList(metadataFields);
	Mink.makeExplorableCollections(metadataTable.getElementsByClassName('minkSideBar')[0], linkedFields, task.url);
	var anyMedia = Mink.makeMedia(metadataTable.getElementsByClassName('minkMedia')[0], metadataFields);
	var headerNames = Mink.makeHeader(metadataTable.getElementsByClassName('minkHeader')[0], metadataFields, anyMedia);
	

	if(!anyMedia){
		metadataTable.getElementsByClassName('minkMedia')[0].parentNode.parentNode.removeChild(metadataTable.getElementsByClassName('minkMedia')[0].parentNode);
		metadataTable.getElementsByClassName('minkHeader')[0].setAttribute('style', '  margin-left: 8px;');
	}
	var prunedFields = Mink.removeLinkedAndHeaderFields(metadataFields, linkedFields, headerNames);
	//Mink.makeTable(metadataTable.getElementsByClassName('minkTable')[0], prunedFields, task.url, styleInfo);
	
	if(prunedFields.length > 0){

		//Mink.buildMoreButton(metadataTable.getElementsByClassName('minkHeader')[0]);
		
		metadataTable.getElementsByClassName('minkOtherContent')[0].appendChild(buildDiv('minkTableRoot'));

		Mink.makeTable(metadataTable.getElementsByClassName('minkTableRoot')[0], prunedFields, task.url, styleInfo, true);
		if(task.mmd.mink_expand_always){
			metadataTable.getElementsByClassName('minkOtherContent')[0].parentNode.maxHeight = '';
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
		//Find dominant color in image and decorate title, would prefer if this was done in makeTitle
		//but the script I'm using is picky

	
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

Mink.grow = function(event){
	var target = event.target;
	while(target.className != "minkTitleBar"){
		target = target.parentNode;
	}
	var exSym = target.getElementsByClassName('minkExpandSymbol')[0];
	exSym.style.display = 'none';
	var container = target.parentNode;
	var mink = container.getElementsByClassName('minkKeyFields')[0];
        $(mink).slideDownTransition();
	var moreExpander = container.getElementsByClassName('minkDetailExpanderContainer')[0];
	setTimeout(function(){moreExpander.style.display = ''}, 250, moreExpander);
	
	var detail = container.getElementsByClassName('minkDetailExpander')[0];
	if (detail.getAttribute('revealme') == 'true'){
		Mink.showMore(detail);
	}
	//moreExpander.style.display = '';
	event.target.removeEventListener('click', Mink.grow);
	event.target.addEventListener('click', Mink.shrink);
	
}

Mink.focus = function(event){
	if ($(event.target.parentNode).hasClass('focus')){
		$(event.target.parentNode).removeClass('focus');
		$(event.target).removeClass('focus');

		var container = $(event.target).closest('.minkContainer')[0];
		var mink = container.getElementsByClassName('minkOtherContentWrapper')[0];
		var previousHeight = $(mink).attr('prevHeight');
		$(mink).slideUpTransition();

	}else{
		$(event.target.parentNode).addClass('focus');
		$(event.target).addClass('focus');

		var container = $(event.target.parentNode).closest('.minkContainer')[0];
	//	var otherFields = document.getElementsByClassName('minkOther')
		var mink = container.getElementsByClassName('minkDetailExpander')[0];
		Mink.showMore(mink);

	}
}
Mink.shrink = function(event){
	var target = event.target;
	while(target.className != "minkTitleBar"){
		target = target.parentNode;
	}
	var exSym = target.getElementsByClassName('minkExpandSymbol')[0];
	exSym.style.display = 'block';

	var container = target.parentNode;
	var mink = container.getElementsByClassName('minkKeyFields')[0];
	var moreExpander = container.getElementsByClassName('minkDetailExpanderContainer')[0];
	moreExpander.style.display = 'none';
	//Check to collapse table as well
	var detail = container.getElementsByClassName('minkDetailExpander')[0];
	Mink.showLess(detail, null, true);
	
	$(mink).slideUpTransition(true);
	event.target.removeEventListener('click', Mink.shrink);
	event.target.addEventListener('click', Mink.grow);

}


Mink.showMoreHandler = function(event){
	Mink.showMore(event.target);

}
Mink.showMore = function(target){
	var container = target.parentNode.parentNode;
	
	
	var minkTables = container.getElementsByClassName('minkOtherContent')[0].parentNode;
		
	
	//if ($(minkTables).hasClass("height-transition-hidden"))
        $(minkTables).slideDownTransition($(minkTables).outerHeight());	
	target.innerHTML = "less";
	target.setAttribute('revealme', 'true');
	target.removeEventListener('click', Mink.showMoreHandler);
	target.addEventListener('click', Mink.showLessHandler);
}
Mink.showLess = function(target, keepClosed, absolutelyShrink){
	var	container = target.parentNode.parentNode;
	
	
	
	
	var minkTables = container.getElementsByClassName('minkOtherContent')[0].parentNode;
	
		
	

	$(minkTables).slideUpTransition(true);
	target.innerHTML = "more";
	if(keepClosed){
		target.setAttribute('revealme', 'false');

	}
	target.removeEventListener('click', Mink.showLessHandler);
	target.addEventListener('click', Mink.showMoreHandler);
}
Mink.showLessHandler = function(event){
	Mink.showLess(event.target, true);
	
}

Mink.buildShellControls = function(parent, metadataFields){
	var controlRow = document.createElement('div');
	controlRow.className = "minkControls";
	parent.appendChild(controlRow);
	
	var control1 = document.createElement('span');
	control1.className = 'minkControl';
	var control1Icon = document.createElement('img');
	control1Icon.className = "minkControlIcon";
	control1Icon.src = '../renderers/images/mink/minus.png';
	control1.appendChild(control1Icon)
	control1Icon.addEventListener('click', Mink.shrink);
	var control2 = document.createElement('span');
	control2.className = 'minkControl';
	var control2Icon = document.createElement('img');
	control2Icon.className = "minkControlIcon right";
	control2Icon.src = '../renderers/images/mink/pin.png';
	control2.appendChild(control2Icon)
		controlRow.appendChild(control1);

	//makes invisible title field so that we can bring it back later
	for (var i = 0; i < metadataFields.length; i++){
		var field = metadataFields[i];
		if(field.name === 'title' ||field.name == 'title'){
			Mink.makeTitle(controlRow, field, styleInfo);
			controlRow.childNodes[1].style.display='none';
		}	
	}
	
	
	//controlRow.appendChild(control2);
	
}


Mink.buildMinkShell = function(table, isChildTable, isRoot, metadataFields, fieldCount, styleInfo, url){
	
	//Mink.buildShellControls(table, metadataFields);
	
	var title = Mink.makeTitle(metadataFields, url, styleInfo)
	var minkMain = document.createElement('div');	
	minkMain.className = "mink";
	table.appendChild(title);
	var minkBody = buildDiv('minkBody')
	var minkSideBar = buildDiv('minkSideBar')
	var minkRow = buildDiv('minkKeyFields height-transition height-transition-hidden' );
	var minkMedia = buildDiv('minkMediaContainer');
	var mmedia = buildDiv('minkMedia');
	minkMedia.appendChild(mmedia);
	var header = buildDiv('minkHeader');
	
	var showHideExp = buildDiv('minkCollectionsExpander');
	var expLabel = document.createElement('div');
	expLabel.innerHTML = "1074";
	expLabel.className = "minkLinkedLabel";
	var expSubLabel = buildDiv("minkLinkedSubLabel");
	expSubLabel.innerHTML = "explorables";
	showHideExp.appendChild(expLabel);
	showHideExp.appendChild(expSubLabel);
	minkRow.appendChild(minkMedia);
	minkRow.appendChild(header);
	//minkRow.appendChild(showHideExp);
	minkBody.appendChild(minkRow);
	var otherContentWrapper = buildDiv('minkOtherContentWrapper height-transition height-transition-hidden');
	otherContentWrapper.appendChild(buildDiv('minkOtherContent'));
	minkBody.appendChild(otherContentWrapper)
	
	minkMain.appendChild(minkBody);
	//minkMain.appendChild(minkSideBar);

	table.appendChild(minkMain);

	var minkMoreLess = buildDiv('minkDetailExpanderContainer');
	var moreLessLabel = buildDiv('minkDetailExpander');
	moreLessLabel.addEventListener('click', Mink.showMoreHandler);
	moreLessLabel.innerHTML = "more";
	minkMoreLess.style.display = 'none';
	minkMoreLess.appendChild(moreLessLabel)
	table.appendChild(minkMoreLess);
	
}

/*
 * EXPIREMENT FOR SLIDING ANIMATIONS
 * 
 */

   
    $.fn.slideUpTransition = function(absolute) {
        return this.each(function() {
            var $el = $(this);
            var pHeight = $el.attr('preHeight');
            if(absolute){
                $el.css("max-height", 0);

            }else if(pHeight){
                $el.css("max-height", parseInt($el.attr('preHeight')));

            }else{
                $el.css("max-height", 0);

            }
            if(!absolute){
    		$el.removeAttr('preHeight');
            }
        
        });
    };

    $.fn.slideDownTransition = function(prevHeight) {
        console.log(prevHeight)
       if(prevHeight){
    	   $(this).attr('preHeight', prevHeight.toString());
       }
    	return this.each(function() {

    		var $el = $(this);

            $el.removeClass("height-transition-hidden");
            // temporarily make visible to get the size
            $el.css("max-height", "none");
            var height = $el.outerHeight();
            var pHeight = $el.attr('preHeight')
            if(pHeight){
                $el.css("max-height", parseInt($el.attr('preHeight')));

            }else{
                $el.css("max-height", parseInt(0));

            }
            // reset to 0 then animate with small delay

            setTimeout(function() {
                $el.css({
                    "max-height": height
                });
            }, 1);
        });
    };

