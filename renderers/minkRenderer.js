/**
 * 
 */

var Mink = {};
var FIRST_LEVEL_FIELDS = 20;
var FIELDS_TO_EXPAND = 10;
Mink.rootDocToCollections = new Map;
Mink.rootDocToExpandedExplorables = new Map;
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
/*
Mink.initialize = function(){
	
	var minkRenderings = document.getElementsByClassName('metadataRendering');	
	
	for(var i = 0; i < minkRenderings.length; i++)
	{
		console.log("called");
		var location = minkRenderings[i].getElementsByTagName('a')[0];
		if(location)
			
			MetadataLoader.render(Mink.render, minkRenderings[i], location.href, true);
	}
}*/


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
			if(metadataField.value[0]){
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
	target = $(target).closest(".minkExplorableField")[0];
		 
	target.setAttribute('expanded', 'true');
	var rooturl = target.getAttribute('rooturl');
	var collectionname = target.getAttribute('collectionname');
	var links = Mink.rootDocToCollections.get(rooturl).get(collectionname);
	console.log(links);
	var detailDetails = {rooturl: rooturl, collectionname: collectionname, links: links, type: 'minknewpile'};
	var eventDetail = {detail: detailDetails, bubbles: true};
	  var myEvent = new CustomEvent("minkevent", eventDetail);
	  target.dispatchEvent(myEvent);
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
Mink.stopParentHoverCSS = function(event){
	$(event.target.parentNode).removeClass('minkTitleBarHoverEffect');
}
Mink.returnParentHoverCSS = function(event){
	$(event.target.parentNode).addClass('minkTitleBarHoverEffect');
}
Mink.signalFavorite = function(event){
	var url = $(event.target).siblings('.minkExplorablesExpander')[0].getAttribute('url');
	console.log(url)
	var favicon = $(event.target).siblings('.minkTitleClickable').children('.minkFavicon')[0].src;
	var mdname = $(event.target).siblings('.minkTitleClickable').children('.minkTitleField')[0].childNodes[0].innerHTML;
	var detailDetails = {type: 'minkfavorite', url: url, favicon: favicon, mdname: mdname};
	var eventDetail = {detail: detailDetails, bubbles: true};
	var myEvent = new CustomEvent("minkevent", eventDetail);
	event.target.dispatchEvent(myEvent);
}

Mink.explorableButton = function(event){
	var target = event.target;
	
	var expandables = Mink.rootDocToExpandedExplorables.get(target.getAttribute('url'));
	if(expandables.length < 1){
		var titlebar = $(target).siblings('.minkTitleClickable')[0];
		Mink.grow(titlebar);
	}else{
		//expand/collapse 'em all
		var shouldHide = true;
		if(target.getAttribute('show') == 'true'){
			shouldHide = false;
			target.setAttribute('show', 'false');

		}else{
			target.setAttribute('show', 'true');

		}
		
		var explorables = $(target).closest('.minkContainer').find('.minkExplorableField');
		for(var i = 0; i < explorables.length; i++){
			if($(explorables[i]).attr('expanded') == 'true' && expandables.indexOf($(explorables[i]).attr('collectionname')) > -1){
			var detailDetails = {type: 'minkshowhide', hide: shouldHide};
			var eventDetail = {detail: detailDetails, bubbles: true};
			var myEvent = new CustomEvent("minkevent", eventDetail);
			explorables[i].dispatchEvent(myEvent);
			}
		}
		
		
	}
}
Mink.makeTitle = function(metadataFields, url, styleInfo){
	
	var headerContainer = buildDiv('minkTitleBar minkTitleBarHoverEffect');
	var clickableToExpand = buildSpan('minkTitleClickable');
	
	
	//	headerContainer.appendChild(plus);
	var imageCont = document.createElement('img');
	imageCont.className = "minkFavicon";
	imageCont.src = 	BSUtils.getFaviconURL(url);
	clickableToExpand.appendChild(imageCont);
	var metadataField;
	for (var i = 0; i < metadataFields.length; i++){
		var field = metadataFields[i];
		if(field.mmdName === 'title' ||field.mmdName == 'title'){
			metadataField = field;
			break;
		}
	}
	if(metadataField!=null){
	var link = document.createElement('span');
	link.className = "minkTitleField";
	link.href = metadataField.navigatesTo;
	link.innerHTML = "<span>" + metadataField.value + "</span>";
	clickableToExpand.appendChild(link);
	}
	headerContainer.appendChild(clickableToExpand);
	var pinIcon = document.createElement('img');
	pinIcon.src = "../renderers/images/mink/star.png";
	pinIcon.addEventListener('click', Mink.signalFavorite);
	pinIcon.addEventListener('mouseenter', Mink.stopParentHoverCSS);
	pinIcon.addEventListener('mouseleave', Mink.returnParentHoverCSS);	pinIcon.className = "minkPinIcon";
	headerContainer.appendChild(pinIcon);	
	
	//function to find number of explorables
	var explorableCount = Mink.getExplorableCount(metadataFields);
		var explorableButton = buildSpan('minkExplorablesExpander filledExpander');
		explorableButton.innerHTML = explorableCount;
		explorableButton.addEventListener('mouseenter', Mink.stopParentHoverCSS);
		explorableButton.addEventListener('mouseleave', Mink.returnParentHoverCSS);
		explorableButton.addEventListener('click', Mink.explorableButton);
		explorableButton.setAttribute('url', url);
		headerContainer.appendChild(explorableButton);
		if(explorableCount < 1){
			explorableButton.style.display = 'none';
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
	clickableToExpand.addEventListener('click', Mink.growHandler);
	
	return headerContainer;
	
}


Mink.childLabelTitles = function(metadataField){
	var text = "";

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
	
	return text;
}

/*
 * 
 * Holds a combination of key fields (as defined in mmd) and fields with explorables
 * 
 */

Mink.makeSubheader = function(parent, metadataField){
	
	
	
	if(metadataField.mink_style == "show_label"){
		var label = buildSpan('minkSnippetLabel');
		if(metadataField.label != "" && metadataField.label != null){
			label.innerHTML = BSUtils.toDisplayCase(metadataField.label);

		}else{
			label.innerHTML = BSUtils.toDisplayCase(metadataField.name);
		}
		parent.appendChild(label);
	}
	var value = buildSpan('');
	//composite or collection
	if(typeof metadataField.value != 'string'){

		value.innerHTML = Mink.childLabelTitles()
	}
	//scalar
	else{
		value.innerHTML = metadataField.value;
	}
	parent.appendChild(value);
	
	
}
Mink.makeExplorable = function(parent, field, explorableMap, baseUrl){
	var explorableField = buildDiv('minkExplorableField');
	var linkedUrls = explorableMap.get(field.name)
	var prefixText = "";
	//Use field name as label or use titles as label
	if(field.explorable_label == 'title'){
		prefixText = Mink.childLabelTitles(field);
				
	}else{
		if(field.label != "" && field.label != null){
			prefixText = BSUtils.toDisplayCase(field.label);

		}else{
			prefixText = BSUtils.toDisplayCase(field.name);
		}
		
	}
	explorableField.appendChild(buildDiv('minkExplorableFieldLabelPrefix'));
	explorableField.childNodes[0].innerHTML = prefixText;
	explorableField.appendChild(buildSpan('minkExplorableFieldLabelSuffix unfilledExpander'));
	explorableField.childNodes[1].innerHTML = "  (" + linkedUrls.length + ")";
	explorableField.setAttribute('rooturl', baseUrl);
	explorableField.setAttribute('collectionname', field.name);
	explorableField.addEventListener('click', Mink.showExplorableLinks);
	parent.appendChild(explorableField);
	return linkedUrls.length;
}
Mink.makeSnippet = function(parent, metadataFields, isMedia, url){
	var subtitles = buildDiv('minkSubtitleContainer');
	var explorables = buildDiv('minkExplorablesContainer');
	var expCount = 0;
	var videoFrame = null;
	var headeredName = [];
	var explorableMap = Mink.rootDocToCollections.get(url)
	var explorableColNames = explorableMap.keys;
	console.log(explorableColNames);
	var fieldNames = [];
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
		else if(field.show_in_snippet && explorableColNames.indexOf(field.name) < 0){
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
		else if(field.show_in_snippet && explorableColNames.indexOf(field.name) >= 0){
			
			headeredName.push(field.name);
			expCount += Mink.makeExplorable(explorables, field, explorableMap, url);
		}
		else if(field.mink_style != null){
			if(field.mink_style == "main_video"){
			
				//<iframe width="560" height="315" src="https://www.youtube.com/embed/NUI9I1HU19I" frameborder="0" allowfullscreen></iframe>
				videoFrame = document.createElement("iframe");
				videoFrame.setAttribute('allowfullscreen', '')
				videoFrame.className="minkVideo";
				if(isMedia){
					videoFrame.width = 367;
					videoFrame.height = 206;
				}else{

					videoFrame.width = 480;
					videoFrame.height = 270;
				}
				
				videoFrame.setAttribute('frameborder', '0');
				videoFrame.src = field.value;
				parent.appendChild(videoFrame);

				console.log("victory");
		}
		}
	
			
		
	
	
	
	}
	
	
	if(videoFrame){
		parent.appendChild(videoFrame);
	}
	if(subtitles.childNodes.length > 0){
		parent.appendChild(subtitles);

	}
	if(explorableColNames.length > 0){
		parent.appendChild(explorables);
	}
	/*for(var i = 0; i < videos.length; i++){
	
	parent.style.width = '560px';
	parent.style.height = '315px';
}*/
	parent.parentNode.setAttribute('explorables', expCount);
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
					var image = buildDiv('minkSnippetImage');
					var imageCont = document.createElement('img');
					imageCont.src = child.value[0].navigatesTo;
					if(field.minkHeight != null && field.minkWidth != null){
						imageCont.style.height =  field.minkHeight + "px";
						imageCont.style.width =  field.minkWidth + "px";

					}
					image.appendChild(imageCont);
					images.push(image);
					
				}
					
			}
		}
		//potential composite media
		else if(field.composite_type != null){
			if(field.composite_type == 'image'){
				var image = buildDiv('minkSnippetImage');
				var imageCont = document.createElement('img');
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
Mink.makeTableExplorables = function(parent, metadataFields, linkedFields, url){
	var explorableMap = Mink.rootDocToCollections.get(url)
	var count = Mink.getExplorableCount(metadataFields);
	var explorableColNames = explorableMap.keys;
	var explorables = buildDiv('minkExplorablesContainer');
	explorables.setAttribute('explorableCount', count);
	for(var i = 0; i < metadataFields.length; i++){
		var field = metadataFields[i];
		if(explorableColNames.indexOf(field.name) >=0 && !field.show_in_snippet){
			Mink.makeExplorable(explorables, field, explorableMap, url);
		}
		
	}
	
	parent.appendChild(explorables);
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
	
	var metadataTable = document.createElement('div');
	metadataTable.className = "minkContainer";
	Mink.buildMinkShell(metadataTable, false, task.isRoot, metadataFields, FIRST_LEVEL_FIELDS, styleInfo, task.url);

	linkedFields = Mink.makeLinkedFieldList(metadataFields);
	Mink.makeExplorableCollections(metadataTable.getElementsByClassName('minkSideBar')[0], linkedFields, task.url);
	var anyMedia = Mink.makeMedia(metadataTable.getElementsByClassName('minkMedia')[0], metadataFields);
	var headerNames = Mink.makeSnippet(metadataTable.getElementsByClassName('minkSnippet')[0], metadataFields, anyMedia, task.url);
	

	if(!anyMedia){
		metadataTable.getElementsByClassName('minkMedia')[0].parentNode.parentNode.removeChild(metadataTable.getElementsByClassName('minkMedia')[0].parentNode);
		metadataTable.getElementsByClassName('minkSnippet')[0].setAttribute('style', '  margin-left: 8px;');
	}
	var prunedFields = Mink.removeLinkedAndHeaderFields(metadataFields, [], headerNames);
	//Mink.makeTable(metadataTable.getElementsByClassName('minkTable')[0], prunedFields, task.url, styleInfo);
	
	if(prunedFields.length > 0){

		//Mink.buildMoreButton(metadataTable.getElementsByClassName('minkSnippet')[0]);
		var prunedFields2 = Mink.removeLinkedAndHeaderFields(metadataFields, linkedFields, headerNames);
		metadataTable.getElementsByClassName('minkOtherContent')[0].appendChild(buildDiv('minkTableRoot'));
		Mink.makeTable(metadataTable.getElementsByClassName('minkTableRoot')[0], prunedFields2, task.url, styleInfo, true);
		/*readd explorables*/
		var table = metadataTable.getElementsByClassName('minkTableRoot')[0];
		Mink.makeTableExplorables(table, prunedFields, linkedFields, task.url);
		
		
		if(task.mmd.mink_expand_always){
			metadataTable.getElementsByClassName('minkOtherContent')[0].parentNode.maxHeight = '';
		}
		
}
	
	
	if(metadataTable)
	{
		    
		// Add the HTML5 canvas for the drawing of connection lines
		// Add the table and canvas to the interior container
			
		task.visual.appendChild(metadataTable);
		
		// Add the interior container to the root contianer
		setTimeout(function(){task.container.appendChild(task.visual)}, /*(Math.floor((Math.random() * 10) + 1))*50*/0);
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
}
Mink.grow = function(target, doNotUpdateStatus){
	target.removeEventListener('click', Mink.growHandler);
	target.addEventListener('click', Mink.shrinkHandler);
	while(!$(target).hasClass("minkTitleBar")){
		target = target.parentNode;
	}
	
	var container = target.parentNode;
	
	var minkExpander = container.getElementsByClassName('minkExplorablesExpander')[0];
	
	var toAdd = $(container).find(".minkExplorableFieldLabelSuffix");
	for(var i = 0; i < toAdd.length; i++){
		$(toAdd[i]).removeClass('unfilledExpander');
	}
	if(!doNotUpdateStatus){
		var contentContainer = $(target).closest('.minkContentContainer')[0];
		$(contentContainer).attr('grown', 'true');

	}
	var mink = container.getElementsByClassName('minkKeyFields')[0];
        $(mink).slideDownTransition();
	var moreExpander = container.getElementsByClassName('minkDetailExpanderContainer')[0];
	
	
	var detailExplorables = $(mink).find('.minkExplorableField');
	var explorablesLeftForExpander = 0;
	/*Attach other piles to expander*/
	for(var i = 0; i < detailExplorables.length; i++){
		if($(detailExplorables[i]).attr('expanded') == 'true'){
			var rooturl = $(detailExplorables[i]).attr('rooturl');
			var collectionname = $(detailExplorables[i]).attr('collectionname');

			var detailDetails = {rooturl: rooturl, collectionname: collectionname, newroot: minkExpander, type: 'minkshowmore'};
			var eventDetail = {detail: detailDetails, bubbles: true};
			var myEvent = new CustomEvent("minkevent", eventDetail);
			detailExplorables[i].dispatchEvent(myEvent);
			var previous = Mink.rootDocToExpandedExplorables.get(rooturl);
			if(previous == null){
				previous = [];
			}
			previous.splice(previous.indexOf(collectionname), 1);
			explorablesLeftForExpander = previous.length;
			Mink.rootDocToExpandedExplorables.put(rooturl, previous);
		}
	}
	if(explorablesLeftForExpander > 0){
		$(minkExpander).addClass('unfilledExpander');
		minkExpander.innerHTML = mink.getAttribute('explorables');
	}
	setTimeout(function(){moreExpander.style.display = ''}, 250, moreExpander);

	if(explorablesLeftForExpander > 0)
		$(minkExpander).addClass('unfilledExpander');

	var detail = container.getElementsByClassName('minkDetailExpander')[0];
	if (detail.getAttribute('revealme') == 'true'){
		Mink.showMore(detail);
	}
}
Mink.growHandler = function(event){
	event.stopPropagation();

	Mink.grow(event.target);
	//moreExpander.style.display = '';
	
}


Mink.focus = function(event){
	
	var container = $(event.target).closest(".minkOtherContent");
	var unfocusingNode = $(event.target.parentNode).hasClass('focus');
	//If text is being selected, ignore
	 var sel = window.getSelection();
	 if (sel.rangeCount && sel.type == 'Range' && sel.toString() != ""){
		   return;
	 }
	
	 //If nodes already focused clear previous focus and preHeight from DOM
	var potentiallyFocusedNodes = $(container).find('.focus');
	for (var i = 0; i < potentiallyFocusedNodes.length; i++){
		$(potentiallyFocusedNodes[i]).removeClass('focus');
	}
	if(potentiallyFocusedNodes.length > 0){

		var container = $(event.target).closest('.minkContainer')[0];
		var mink = container.getElementsByClassName('minkOtherContentWrapper')[0];
		var previousHeight = $(mink).attr('prevHeight');
		$(mink).slideUpTransition();
	}
	//Focus on node
	
	if(!unfocusingNode){
		$(event.target.parentNode).addClass('focus');
		$(event.target).addClass('focus');

		var container = $(event.target.parentNode).closest('.minkContainer')[0];
	//	var otherFields = document.getElementsByClassName('minkOther')
		var mink = container.getElementsByClassName('minkDetailExpander')[0];
		Mink.showMore(mink);

	}
}


Mink.shrink = function(target, doNotUpdateStatus){
	target.removeEventListener('click', Mink.shrinkHandler);
	target.addEventListener('click', Mink.growHandler);
	while(!$(target).hasClass("minkTitleBar")){
		target = target.parentNode;
	}
	
	var container = target.parentNode;
	var mink = container.getElementsByClassName('minkKeyFields')[0];

	var minkExpander = container.getElementsByClassName('minkExplorablesExpander')[0];
	var contentContainer = $(target).closest('.minkContentContainer')[0];

	$(minkExpander).removeClass('unfilledExpander');
	var toAdd = $(container).find(".minkExplorableFieldLabelSuffix");
	for(var i = 0; i < toAdd.length; i++){
		$(toAdd[i]).addClass('unfilledExpander');
	}
	var detailExplorables = $(mink).find('.minkExplorableField');
	
	/*Attach other piles to expander*/
	for(var i = 0; i < detailExplorables.length; i++){
		if($(detailExplorables[i]).attr('expanded') == 'true'){
			var rooturl = $(detailExplorables[i]).attr('rooturl');
			var collectionname = $(detailExplorables[i]).attr('collectionname');

			var detailDetails = {rooturl: rooturl, collectionname: collectionname, newroot: minkExpander, type: 'minkshowless'};
			var eventDetail = {detail: detailDetails, bubbles: true};
			var myEvent = new CustomEvent("minkevent", eventDetail);
			minkExpander.dispatchEvent(myEvent);
			var previous = Mink.rootDocToExpandedExplorables.get(rooturl);
			if(previous == null){
				previous = [];
			}
			if(previous.indexOf(collectionname) < 0){
				previous.push(collectionname)

			}
			Mink.rootDocToExpandedExplorables.put(rooturl, previous);
		}
	}
	
	
	if(!doNotUpdateStatus){
		var contentContainer = $(target).closest('.minkContentContainer')[0];
		$(contentContainer).attr('grown', 'false');

	}
	var moreExpander = container.getElementsByClassName('minkDetailExpanderContainer')[0];
	moreExpander.style.display = 'none';
	//Check to collapse table as well
	var detail = container.getElementsByClassName('minkDetailExpander')[0];
	Mink.showLess(detail, null, true);
	minkExpander.innerHTML = parseInt(mink.getAttribute('explorables')) + parseInt(minkExpander.innerHTML);
	$(mink).slideUpTransition(true);
}
Mink.shrinkHandler = function(event){
	event.stopPropagation();

	Mink.shrink(event.target);
	

}


Mink.showMoreHandler = function(event){
	Mink.showMore(event.target);

}
Mink.showMore = function(target){
	var container = target.parentNode.parentNode;
	
	
	var minkTables = container.getElementsByClassName('minkOtherContent')[0].parentNode;
	
	var detailExplorables = $(minkTables).find('.minkExplorableField');
	var expander = $(container.parentNode.parentNode).find('.minkExplorablesExpander')[0]
	$(expander).addClass('unfilledExpander');
	for(var i = 0; i < detailExplorables.length; i++){
		if($(detailExplorables[i]).attr('expanded') == 'true'){
			var rooturl = $(detailExplorables[i]).attr('rooturl');
			var collectionname = $(detailExplorables[i]).attr('collectionname');

			var detailDetails = {rooturl: rooturl, collectionname: collectionname, newroot: expander, type: 'minkshowmore'};
			var eventDetail = {detail: detailDetails, bubbles: true};
			var myEvent = new CustomEvent("minkevent", eventDetail);
			detailExplorables[i].dispatchEvent(myEvent);
			
			var previous = Mink.rootDocToExpandedExplorables.get(rooturl);
			if(previous == null){
				previous = [];
			}
			previous.splice(previous.indexOf(collectionname), 1);
			Mink.rootDocToExpandedExplorables.put(rooturl, previous);
		}
	}
	
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
	
	/*
	 * If any collections are expanded, find the total number of explorables and show them in the top explorable bubble and
	 * re-anchor the animation
	 */
	
	var detailExplorables = $(minkTables).find('.minkExplorableField');
	var expander = $(container.parentNode.parentNode).find('.minkExplorablesExpander')[0]
	var explorableCount = $(minkTables).find('.minkExplorablesContainer')[0].getAttribute('explorableCount');
	expander.innerHTML = explorableCount;
	$(expander).removeClass('unfilledExpander');
	for(var i = 0; i < detailExplorables.length; i++){
		if($(detailExplorables[i]).attr('expanded') == 'true'){
			var rooturl = $(detailExplorables[i]).attr('rooturl');
			var collectionname = $(detailExplorables[i]).attr('collectionname');

			var detailDetails = {rooturl: rooturl, collectionname: collectionname, newroot: expander, type: 'minkshowless'};
			var eventDetail = {detail: detailDetails, bubbles: true};
			var myEvent = new CustomEvent("minkevent", eventDetail);
			expander.dispatchEvent(myEvent);
			
			
			var previous = Mink.rootDocToExpandedExplorables.get(rooturl);
			if(previous == null){
				previous = [];
			}
			if(previous.indexOf(collectionname) < 0){
				previous.push(collectionname)

			}
			Mink.rootDocToExpandedExplorables.put(rooturl, previous);
		}
	}

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
	control1Icon.addEventListener('click', Mink.shrinkHandler);
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
	var header = buildDiv('minkSnippet');
	
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
	var minkMoreLess = buildDiv('minkDetailExpanderContainer');
	var moreLessLabel = buildDiv('minkDetailExpander');
	moreLessLabel.addEventListener('click', Mink.showMoreHandler);
	moreLessLabel.innerHTML = "more";
	minkMoreLess.style.display = 'none';
	minkMoreLess.appendChild(moreLessLabel)
	minkBody.appendChild(minkMoreLess);
	var otherContentWrapper = buildDiv('minkOtherContentWrapper height-transition height-transition-hidden');
	otherContentWrapper.appendChild(buildDiv('minkOtherContent'));
	minkBody.appendChild(otherContentWrapper)
	
	minkMain.appendChild(minkBody);
	//minkMain.appendChild(minkSideBar);

	table.appendChild(minkMain);


	
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

