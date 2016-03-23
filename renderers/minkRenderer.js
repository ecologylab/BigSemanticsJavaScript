/*

	minkRenderer is used to produce summaries of meta-metadata extracted by BigSemantics
	minkRenderer is most typically called by passing minkRenderer.render as a paramater
		to renderingTask
*/


var minkRenderer = {};
minkRenderer.rootDocToCollections = new Map;
minkRenderer.rootDocToExpandedExplorables = new Map;

//renderering constants. They must be declared here to overide settings in vanillaMice.js
var FIRST_LEVEL_FIELDS = 20;
var FIELDS_TO_EXPAND = 10;

/*
	Entry point into rendering

	@task must contain
		-fields: MetadataViewModel consctructed by MetadataViewModel.js
		-url: link or UUID for the metadata
		-visual: containing element all html will be appended to
		-style: mapping of generic BigSemantics styles to particular CSS classes

*/

//TODO: Why do we reprune fields?
minkRenderer.render = function(task){

	var metadataFields = task.fields;
	var styleInfo = task.style;
	styleInfo.styles = MINK_MICE_STYLE.styles;
	var	linkedFields = task.linkedFields;


	// Create the interior HTML container

	task.visual = document.createElement('div');
	task.visual.className = "minkContentContainer";
	try{
		task.visual.setAttribute('mdType', metadataFields[0].parentMDType);
	}
	catch(err){

	}

	// Build the HTML table for the metadata
	var metadataTable = document.createElement('div');
	metadataTable.className = "minkContainer";
	minkRenderer.buildMinkShell(metadataTable, false, task.isRoot, metadataFields, FIRST_LEVEL_FIELDS, styleInfo, task.url, task.favicon);
	minkRenderer.prepareExplorableCollection(metadataTable.getElementsByClassName('minkSideBar')[0], linkedFields, task.url);

	//If media, such as a youTube video or image is present, the rendering is adjusted to show it in the snippet view
	var anyMedia = minkRenderer.buildMedia(metadataTable.getElementsByClassName('minkMedia')[0], metadataFields);
	var headerNames =
		minkRenderer.buildSnippet(metadataTable.getElementsByClassName('minkSnippet')[0], metadataFields, anyMedia, task.url, task.favicon);
	//remove media if not present
	if(!anyMedia){
		metadataTable.getElementsByClassName('minkMedia')[0].parentNode.parentNode.removeChild(metadataTable.getElementsByClassName('minkMedia')[0].parentNode);
		metadataTable.getElementsByClassName('minkSnippet')[0].setAttribute('style', '  margin-left: 8px;');
	}

	//all metadataFields that are NOT linked fields. They are built in the body
	var prunedFields = minkRenderer.removeLinkedAndHeaderFields(metadataFields, [], headerNames);

	if(prunedFields.length > 0){
		//A re-pruning is commenced...I'm not entirely sure why
		var prunedFields2 = minkRenderer.removeLinkedAndHeaderFields(metadataFields, linkedFields, headerNames);
		metadataTable.getElementsByClassName('minkOtherContent')[0].appendChild(buildDiv('minkTableRoot'));
		minkRenderer.buildTable(metadataTable.getElementsByClassName('minkTableRoot')[0], prunedFields2, task.url, styleInfo, true);
		//Adds explorables into full body that aren't part of the snippet
		var table = metadataTable.getElementsByClassName('minkTableRoot')[0];
		minkRenderer.buildTableExplorables(table, prunedFields, linkedFields, task.url);
		//If a body has been drawn and it's set to be expanded onload, the element is set to grow
		//I don't think this works at present
		if(task.mmd && task.mmd.mink_expand_always){
			metadataTable.getElementsByClassName('minkOtherContent')[0].parentNode.maxHeight = '';
		}

	}

	//if anything has been rendered
	if(metadataTable){

		// Add the table and canvas to the interior container and removes loading indicator

		$(task.container).find('.minkLoadingSpinner').remove();

		task.visual.appendChild(metadataTable);
		//Material.addMaterial(task.url, metadataTable, 2);

		// Add the interior container to the root contianer
		setTimeout(function(){
			task.container.appendChild(task.visual)
			//After a brief delay, the task will automagically grow or devalue the card as appropriate

			if(task.options){

				if(task.options.expand && !task.options.devalue){
					var titleBar = $(task.visual).find('.minkTitleClickable')[0];
					minkRenderer.grow(titleBar);
			        setTimeout( function(){
			        	var keyfields = $(task.visual).find('.minkKeyFields')[0];
						$(keyfields).slideDownTransition();
					}, 1);


				}else if(task.options.devalue){

					setTimeout( function(){
						minkRenderer.devalue(task.visual.childNodes[0]);

					}, 1);
				}
			}

		}, 0);


	}

}

/*
	Interal functions that produce HTML

	Note on naming conventions:
		all 'build' functions prepare HTML and attach it to their parent element
*/

//Builds the skeleton and title field

minkRenderer.buildMinkShell = function(table, isChildTable, isRoot, metadataFields, fieldCount, styleInfo, url, favicon){

	//Mink.buildShellControls(table, metadataFields);

	var title = minkRenderer.buildTitle(table, metadataFields, url, styleInfo, null, favicon)
	//table.appendChild(title);

	var minkMain = document.createElement('div');
	minkMain.className = "mink";
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
	minkBody.appendChild(minkRow);

	var minkMoreLess = buildDiv('minkDetailExpanderContainer');
	var moreLessLabel = buildDiv('minkDetailExpander');
	moreLessLabel.addEventListener('click', minkRenderer.showMoreHandler);
	moreLessLabel.innerHTML =
	'<div class="minkDetailExpanderLabel">full card</div>  <i class="material-icons">aspect_ratio</i></div>';

	minkMoreLess.style.display = 'none';
	minkMoreLess.appendChild(moreLessLabel)
	var otherContentWrapper = buildDiv('minkOtherContentWrapper height-transition height-transition-hidden');
	otherContentWrapper.appendChild(buildDiv('minkOtherContent'));
	minkBody.appendChild(otherContentWrapper)
	minkBody.appendChild(minkMoreLess);

	minkMain.appendChild(minkBody);

	table.appendChild(minkMain);

}


//Constructs and appends the TitleBar

minkRenderer.buildTitle = function(parent, metadataFields, url, styleInfo, expCount, minkfav){

	var headerContainer = buildDiv('minkTitleBar minkTitleBarHoverEffect');
	var clickableToExpand = buildSpan('minkTitleClickable');

	var imageCont = document.createElement('img');
	imageCont.className = "minkFavicon";
	if(minkfav){
		imageCont.src = BSUtils.getFaviconURL(minkfav);
	}else{
		imageCont.src = BSUtils.getFaviconURL(url);
	}

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

	//Builds the explorationTab for showing/hiding piles
	//It's hidden by default until mink is collapsed
	var explorableButton = buildSpan('minkExplorablesExpander unfilledExpander');

	explorableButton.addEventListener('mouseenter', minkRenderer.stopParentHoverCSS);
	explorableButton.addEventListener('mouseleave', minkRenderer.returnParentHoverCSS);
	explorableButton.addEventListener('click', minkRenderer.explorableButton);
	explorableButton.setAttribute('url', url);
	headerContainer.appendChild(explorableButton);

	clickableToExpand.addEventListener('click', minkRenderer.growHandler);

	parent.appendChild(headerContainer);
}

//Prepares the html for explorables but does not append it yey
minkRenderer.prepareExplorableCollection = function (sideBar, linkedFields, url){

	var expandableCollections = buildDiv('minkExplorableCollections');
	var listOfCols = [];
	var linkedUrlMap = new Map;

	for(var i = 0; i < linkedFields.length; i++){

		minkRenderer.prepareExplorable(expandableCollections, linkedFields[i], url);
		//if linked fields are direct links, just add them. Else, find the links and extract the hell outta them
		linkedUrlMap.put(linkedFields[i].name, linkedFields[i].links);
		listOfCols.push(linkedFields[i].name);

	}

	minkRenderer.rootDocToCollections.put(url, linkedUrlMap);

}

minkRenderer.prepareExplorable = function(expandableCollections, linkedField, url){

	var expandableCollection = buildDiv('minkExplorableCollection');
	var label = buildSpan('minkExplorableCollectionLabel');
	var labelText = BSUtils.removeLineBreaksAndCrazies(BSUtils.toDisplayCase(linkedField.name));
	labelText += ' (';

	if(linkedField.count){
		var theCount =  linkedField.count.replace(/[^\d]/g,'');

		labelText += theCount;

	}else{
		labelText += linkedField.links.length;

	}
	labelText += ')';
	label.innerHTML = labelText;

	var listOfLinks = [];

	var minkButton = buildSpan('minkExplorableCollectionButton');
	var buttonImg = document.createElement('img');
	buttonImg.className = 'minkExploreIcon';
	buttonImg.src = '../renderers/images/mink/bad_icon.png';
	minkButton.appendChild(buttonImg);
	expandableCollection.addEventListener('click', minkRenderer.showExplorableLinksHandler);

	expandableCollection.setAttribute("rooturl", url);
	expandableCollection.setAttribute("collectionname", linkedField.name);

	expandableCollection.appendChild(label);
	expandableCollection.appendChild(minkButton);
	expandableCollections.appendChild(expandableCollection);

}

//Builds media representation and reports to parent whether or not any media actually exists
minkRenderer.buildMedia = function(parent, metadataFields){

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

//Builds the snippet representation of a mink element
minkRenderer.buildSnippet = function(parent, metadataFields, isMedia, url){

	var subtitles = buildDiv('minkSubtitleContainer');
	var explorables = buildDiv('minkExplorablesContainer');
	var expCount = 0;
	var videoFrame = null;
	var headeredName = [];
	var explorableMap = minkRenderer.rootDocToCollections.get(url)
	var explorableColNames = explorableMap.keys;
	var fieldNames = [];

	for (var i = 0; i < metadataFields.length; i++){
		var field = metadataFields[i];

		if(i == 4){
			var t = 0;
		}
		//make the tile field, well the title
		if(field.name == "title"){
			headeredName.push(field.name);
		}
		else if(field.show_in_snippet && explorableColNames.indexOf(field.name) < 0){

			if(field.navigatesTo){
				var subHeader = document.createElement('a');
				subHeader.className= 'subtitle';
				subHeader.href = field.navigatesTo;
				minkRenderer.buildSubheader(subHeader, field);
				subtitles.appendChild(subHeader);
				headeredName.push(field.name);
			}else{
				var subHeader = buildDiv('subtitle');

				minkRenderer.buildSubheader(subHeader, field);
				subtitles.appendChild(subHeader);
				headeredName.push(field.name);
			}

		}
		else if(field.show_in_snippet && explorableColNames.indexOf(field.name) >= 0){

			headeredName.push(field.name);
			expCount += minkRenderer.buildExplorable(explorables, field, explorableMap, url);

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
//Builds 'subheaders' (fields in the snippet)
minkRenderer.buildSubheader = function(parent, metadataField){

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

		value.innerHTML = minkRenderer.childLabelTitles()
	}
	//scalar
	else{
		value.innerHTML = metadataField.value;
	}

	parent.appendChild(value);

}

minkRenderer.buildExplorable = function(parent, field, explorableMap, baseUrl){

	var explorableField = buildDiv('minkExplorableField');
	var linkedUrls = explorableMap.get(field.name)
	var prefixText = "";
	//Use field name as label or use titles as label
	if(field.explorable_label == 'title'){
		prefixText = minkRenderer.childLabelTitles(field);

	}else{
		if(field.label != "" && field.label != null){
			prefixText = BSUtils.toDisplayCase(field.label);

		}else{
			prefixText = BSUtils.toDisplayCase(field.name);
		}

	}

	explorableField.appendChild(buildDiv('minkExplorableFieldLabelPrefix'));
	explorableField.appendChild(buildSpan('minkExplorableFieldLabelSuffix unfilledExpander'));

	var fieldCount = linkedUrls.length;
	if(field.field_as_count){
		fieldCount = field.field_as_count.value;
		fieldCount = fieldCount.replace(/[^\d]/g,'');
	}

	//explorableField.childNodes[1].innerHTML = "  "+ fieldCount + "";
		explorableField.childNodes[0].innerHTML = ""+ fieldCount + "  " + prefixText;

	explorableField.setAttribute('rooturl', baseUrl);
	explorableField.setAttribute('collectionname', field.name);

	explorableField.addEventListener('click', minkRenderer.signalExplorableLinks);

	parent.appendChild(explorableField);

	return linkedUrls.length;
}


/*
	Internal functions that manipulate the metadataFields and other data given to minkRenderer
*/

minkRenderer.childLabelTitles = function(metadataField){

	var text = "";

	if(!metadataField)
		return "";

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

minkRenderer.removeLinkedAndHeaderFields = function(metadataFields, linkedFields, headerNames){

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
			if(metadataFields[i].mmdName != 'title'){
				remainingFields.push(metadataFields[i]);

			}
		}
	}

	return remainingFields;
}

/*
	Signals that communicate interactions with mink or particularly important data to containing app
*/

//Communicates the links available to an explorable to a containing app

minkRenderer.signalExplorableLinks = function(event){

	var target = event.target;
	target = $(target).closest(".minkExplorableField")[0];

	target.setAttribute('expanded', 'true');
	var rooturl = target.getAttribute('rooturl');
	var collectionname = target.getAttribute('collectionname');
	var links = minkRenderer.rootDocToCollections.get(rooturl).get(collectionname);
	var detailDetails = {rooturl: rooturl, collectionname: collectionname, links: links, type: 'minknewpile'};
	var eventDetail = {detail: detailDetails, bubbles: true};
	var myEvent = new CustomEvent("minkevent", eventDetail);

	target.dispatchEvent(myEvent);

}

minkRenderer.signalShowMore = function(targetChild){
	try{
		var composeableHTML = $(targetChild).closest('.minkCardContainer');
		var composeableID = composeableHTML.attr('id');

		var detailDetails = {type: 'growbelow', composeableID: composeableID};
		var eventDetail = {detail: detailDetails, bubbles: true};
		var myEvent = new CustomEvent("composerevent", eventDetail);
		targetChild.dispatchEvent(myEvent);

	}catch(err){

	}
}
minkRenderer.signalShowLess = function(targetChild){
	try{
		var composeableHTML = $(targetChild).closest('.minkCardContainer');
		var composeableID = composeableHTML.attr('id');

		var detailDetails = {type: 'pullup', composeableID: composeableID};
		var eventDetail = {detail: detailDetails, bubbles: true};
		var myEvent = new CustomEvent("composerevent", eventDetail);
		targetChild.dispatchEvent(myEvent);

	}catch(err){

	}
}


minkRenderer.signalShowHideChild = function(expandables, target){
	if(expandables.length < 1){
			var titlebar = $(target).siblings('.minkTitleClickable')[0];
			minkRenderer.grow(titlebar);
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

minkRenderer.signalReAddButtons = function(minkCard){

	var detailDetails = {type: 'minkbuttons', show: true, html: minkCard};
	var eventDetail = {detail: detailDetails, bubbles: true};
	var myEvent = new CustomEvent("minkevent", eventDetail);
	minkCard.dispatchEvent(myEvent);

}

minkRenderer.signalRemoveButtons = function(minkCard){

	var detailDetails = {type: 'minkbuttons', show: false, html: minkCard};
	var eventDetail = {detail: detailDetails, bubbles: true};
	var myEvent = new CustomEvent("minkevent", eventDetail);
	minkCard.dispatchEvent(myEvent);

}



minkRenderer.buildTable = function(parent, fields, url, styleInfo, isRoot){

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
			valueCol.childNodes[0].addEventListener('click', minkRenderer.focusHandler);

		}

		else if (metadataField.composite_type != null && metadataField.composite_type == "image")
		{
			MICE.buildImageField(metadataField, isChildTable, styleInfo, valueCol, nameCol);
		}
		//We're going to focus on non-image composites that have a location
		else if(metadataField.composite_type != null && metadataField.composite_type != "image")
		{
			expandButton = minkRenderer.buildCompositeField(metadataField, isChildTable, row, styleInfo, valueCol, nameCol, expandButton, url);


		}

		else if(metadataField.child_type != null)
		{
			expandButton = minkRenderer.buildCollection(metadataField, isChildTable, row, styleInfo, valueCol, nameCol, expandButton);


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

minkRenderer.buildCollection = function(metadataFieldOrigin, isChildTable, rowOriginal, styleInfo, valueColOriginal, nameColOriginal, expandButtonOriginal, url){

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
			valueCol.childNodes[0].addEventListener('click', minkRenderer.focusHandler);
		}

		else if (metadataField.composite_type != null && metadataField.composite_type == "image")
		{
			MICE.buildImageField(metadataField, isChildTable, styleInfo, valueCol, nameCol);
		}
		//We're going to focus on non-image composites that have a location
		else if(metadataField.composite_type != null && metadataField.composite_type != "image")
		{
			expandButton = minkRenderer.buildCompositeField(metadataField, isChildTable, row, styleInfo, valueCol, nameCol, expandButton, url);


		}

		else if(metadataField.child_type != null)
		{
			expandButton = minkRenderer.buildCollection(metadataField, isChildTable, row, styleInfo, valueCol, nameCol, expandButton);

		}


		if(nameCol.hasChildNodes()){
			row.appendChild(nameCol);

		}
		row.appendChild(valueCol);
		valueColOriginal.appendChild(row);

	}


}




minkRenderer.buildCompositeField = function(metadataField, isChildTable, row, styleInfo, valueCol, nameCol, expandButton, url){

	var childTable =  minkRenderer.buildTable(valueCol, metadataField.value, null, styleInfo);

}

minkRenderer.buildScalarField = function(metadataField){
	console.log('build scalar field ' + metadataField);
}

minkRenderer.buildTableExplorables = function(parent, metadataFields, linkedFields, url){

	var explorableMap = minkRenderer.rootDocToCollections.get(url)
	var count = 0;
	var explorableColNames = explorableMap.keys;
	var explorables = buildDiv('minkExplorablesContainer');
	explorables.setAttribute('explorableCount', count);

	for(var i = 0; i < metadataFields.length; i++){
		var field = metadataFields[i];

		if(explorableColNames.indexOf(field.name) >=0 && !field.show_in_snippet){
			minkRenderer.buildExplorable(explorables, field, explorableMap, url);
		}

	}

	parent.appendChild(explorables);
}

/*
	Event listeners
*/
minkRenderer.showMoreHandler = function(event){
	minkRenderer.showMore(event.target);

}

minkRenderer.stopParentHoverCSS = function(event){
	$(event.target.parentNode).removeClass('minkTitleBarHoverEffect');
}

minkRenderer.returnParentHoverCSS = function(event){
	$(event.target.parentNode).addClass('minkTitleBarHoverEffect');
}

minkRenderer.explorableButtonHandler = function(event){

	var target = event.target;
	var expandables = minkRenderer.rootDocToExpandedExplorables.get(target.getAttribute('url'));
	minkRenderer.signalShowHideChild(expandables, target);


}

minkRenderer.growHandler = function(event){

	event.stopPropagation();
	minkRenderer.grow(event.target);

}

minkRenderer.showExplorableLinksHandler = function(event){

	var target = event.target;
	target = $(target).closest(".minkExplorableField")[0];

	target.setAttribute('expanded', 'true');
	var rooturl = target.getAttribute('rooturl');
	var collectionname = target.getAttribute('collectionname');

	var links = minkRenderer.rootDocToCollections.get(rooturl).get(collectionname);
	var detailDetails = {rooturl: rooturl, collectionname: collectionname, links: links, type: 'minknewpile'};
	var eventDetail = {detail: detailDetails, bubbles: true};
	var myEvent = new CustomEvent("minkevent", eventDetail);
	target.dispatchEvent(myEvent);

}

minkRenderer.focusHandler = function(event){

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
		minkRenderer.showMore(mink);

	}
}

minkRenderer.shrinkHandler = function(event){

	event.stopPropagation();
	minkRenderer.shrink(event.target);

}

minkRenderer.showLessHandler = function(event){

	minkRenderer.showLess(event.target, true);

}

/*
	Functions for interacting with mink
*/

minkRenderer.grow = function(target, doNotUpdateStatus){
	try{

		target.removeEventListener('click', minkRenderer.growHandler);
		target.addEventListener('click', minkRenderer.shrinkHandler);
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
				var previous = minkRenderer.rootDocToExpandedExplorables.get(rooturl);

				if(previous == null){
					previous = [];
				}

				previous.splice(previous.indexOf(collectionname), 1);
				explorablesLeftForExpander = previous.length;
				minkRenderer.rootDocToExpandedExplorables.put(rooturl, previous);
			}

		}
		setTimeout(function(){
			moreExpander.style.display = ''
		}, 1, moreExpander);

		$(minkExpander).removeClass('filledExpander');
		$(minkExpander).addClass('unfilledExpander');

		var detail = container.getElementsByClassName('minkDetailExpander')[0];
		if (detail.getAttribute('revealme') == 'true'){
			minkRenderer.showMore(detail, true);
		}
		minkRenderer.signalShowMore(target);
		minkRenderer.signalReAddButtons($(target).closest('.minkCardContainer')[0]);

	}catch(err){

	}

}

minkRenderer.shrink = function(target, doNotUpdateStatus){

	target.removeEventListener('click', minkRenderer.shrinkHandler);
	target.addEventListener('click', minkRenderer.growHandler);
	while(!$(target).hasClass("minkTitleBar")){
		target = target.parentNode;
	}

	var container = target.parentNode;
	var mink = container.getElementsByClassName('minkKeyFields')[0];

	var minkExpander = container.getElementsByClassName('minkExplorablesExpander')[0];
	var contentContainer = $(target).closest('.minkContentContainer')[0];

	$(minkExpander).removeClass('unfilledExpander');
	$(minkExpander).addClass('filledExpander');

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
			var previous = minkRenderer.rootDocToExpandedExplorables.get(rooturl);
			if(previous == null){
				previous = [];
			}
			if(previous.indexOf(collectionname) < 0){
				previous.push(collectionname)

			}
			minkRenderer.rootDocToExpandedExplorables.put(rooturl, previous);
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
	minkRenderer.showLess(detail, null, true, true);
	$(mink).slideUpTransition(true);

	minkRenderer.signalRemoveButtons($(target).closest('.minkCardContainer')[0]);
	minkRenderer.signalShowLess(target);

}

minkRenderer.showMore = function(target, doNotSignal){

	try{
		 target = $(target).closest('.minkDetailExpander')[0];
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

				var previous = minkRenderer.rootDocToExpandedExplorables.get(rooturl);
				if(previous == null){
					previous = [];
				}

				previous.splice(previous.indexOf(collectionname), 1);
				minkRenderer.rootDocToExpandedExplorables.put(rooturl, previous);
			}
		}

		//if ($(minkTables).hasClass("height-transition-hidden"))
	    $(minkTables).slideDownTransition($(minkTables).outerHeight());

		target.innerHTML = '<div class="minkDetailExpanderLabel">shrink card</div>  <i class="material-icons">aspect_ratio</i></div>';
		target.setAttribute('revealme', 'true');
		target.removeEventListener('click', minkRenderer.showMoreHandler);
		target.addEventListener('click', minkRenderer.showLessHandler);
		if(!doNotSignal)
			minkRenderer.signalShowMore(target);
	}catch(err){

	}

}

minkRenderer.showLess = function(target, keepClosed, absolutelyShrink, doNotSignal){

	try{
		target = $(target).closest('.minkDetailExpander')[0];

		var	container = target.parentNode.parentNode;
		var minkTables = container.getElementsByClassName('minkOtherContent')[0].parentNode;;

		/*
		 * If any collections are expanded, find the total number of explorables and show them in the top explorable bubble and
		 * re-anchor the animation
		 */

		var detailExplorables = $(minkTables).find('.minkExplorableField');
		var expander = $(container.parentNode.parentNode).find('.minkExplorablesExpander')[0]
		var explorableCount = $(minkTables).find('.minkExplorablesContainer')[0].getAttribute('explorableCount');
		$(expander).removeClass('unfilledExpander');

		for(var i = 0; i < detailExplorables.length; i++){
			if($(detailExplorables[i]).attr('expanded') == 'true'){

				var rooturl = $(detailExplorables[i]).attr('rooturl');
				var collectionname = $(detailExplorables[i]).attr('collectionname');

				var detailDetails = {rooturl: rooturl, collectionname: collectionname, newroot: expander, type: 'minkshowless'};
				var eventDetail = {detail: detailDetails, bubbles: true};
				var myEvent = new CustomEvent("minkevent", eventDetail);
				expander.dispatchEvent(myEvent);


				var previous = minkRenderer.rootDocToExpandedExplorables.get(rooturl);
				if(previous == null){
					previous = [];
				}
				if(previous.indexOf(collectionname) < 0){
					previous.push(collectionname)

				}
				minkRenderer.rootDocToExpandedExplorables.put(rooturl, previous);
			}
		}

		$(minkTables).slideUpTransition(true);
		target.innerHTML = '<div class="minkDetailExpanderLabel">full card</div>  <i class="material-icons">aspect_ratio</i></div>';
		if(keepClosed){
			target.setAttribute('revealme', 'false');

		}
		target.removeEventListener('click', minkRenderer.showLessHandler);
		target.addEventListener('click', minkRenderer.showMoreHandler);
		if(!doNotSignal)
			minkRenderer.signalShowLess(target);

	}
	catch(err){
		console.log('empty container, removing');
		container.parentNode.removeChild(container);
	}
}

minkRenderer.devalue = function(minkContainer){
	//shrink
	var titleField = $(minkContainer).find('.minkTitleField')[0];
	minkRenderer.shrink(titleField);
	//disable mouse events
	var titleClickable = $(minkContainer).find('.minkTitleClickable')[0];
	titleClickable.removeEventListener('click', minkRenderer.growHandler);
	titleClickable.removeEventListener('click', minkRenderer.shrinkHandler);
	titleField.removeEventListener('click', minkRenderer.growHandler);
	titleField.removeEventListener('click', minkRenderer.shrinkHandler);

	//change title, favicon
	var fav = $(minkContainer).find('.minkFavicon');
	$(titleField).addClass('devalued');
	fav.addClass('devalued');
	$(minkContainer).addClass('devalued');

	//hide explorable label
	$(minkContainer).find('.minkExplorablesExpander').css('display', 'none');
	minkRenderer.signalRemoveButtons(minkContainer);
	//add 'show duplicate on hover'
	//tbd
}

minkRenderer.revalue = function(minkContainer){
	//grow
	var titleField = $(minkContainer).find('.minkTitleField')[0];
	minkRenderer.grow(titleField);

	//enable mouse events
	var titleClickable = $(minkContainer).find('.minkTitleClickable')[0];
	titleClickable.addEventListener('click', minkRenderer.shrinkHandler);
	//change title, favicon
	var fav = $(minkContainer).find('.minkFavicon');
	$(titleField).removeClass('devalued');
	fav.removeClass('devalued');
	$(minkContainer).removeClass('devalued');
	//show explorable label
	$(minkContainer).find('.minkExplorablesExpander').css('display', '');
	minkRenderer.signalReaAddButtons(minkContainer);

	//remove 'show duplicate on hover'

}


/*
	EXPIREMENT FOR SLIDING ANIMATIONS
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

/*
	Helper functions
*/

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
