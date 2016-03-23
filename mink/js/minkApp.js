var minkApp ={};

minkApp.explorationSpace = new ExplorationSpace();

minkApp.metadata_collection = {};
minkApp.counter = 0;
minkApp.COLLAPSED_CARD_HEIGHT = 31;
minkApp.leftMostCol = null;
minkApp.rightMostCol = null;
minkApp.maxCols = 1;
minkApp.columnKeyGen = 0;
minkApp.offScreenColumnsLeft = 0;
minkApp.offScreenColumnsRight = 0;
minkApp.favorites = [];
minkApp.currentQuery = null;
minkApp.linkToMetadataMap = new Map();
minkApp.queryMap = new Map();
var bsService = new BSExtension(['eganfccpbldleckkpfomlgcbadhmjnlf', 'gdgmmfgjalcpnakohgcfflgccamjoipd', 'elkanacmmmdgbnhdjopfdeafchmhecbf']);
//var bsService = new BSService();
minkApp.cardDuplicateMap = new Map();

function buildMenuIcon(parent, label, icon, onclick){
	var cont = buildDiv('eco-menuItem');
	var image = document.createElement('img');
	image.className = "eco-menuImage";
	image.src = icon;
	var mlabel = buildDiv('eco-menuLabel');
	mlabel.innerHTML = label;
	cont.appendChild(mlabel);
	cont.appendChild(image);
	cont.addEventListener('click', onclick);
	parent.appendChild(cont);
}
function generateUUID(){
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
}

minkApp.uuidthing = function(){
	var url = "mink::UUID"
	url += generateUUID()
	return url;
}


minkApp.favoritesMenuHandler = function(event){
	console.log(event);
	var cont = $('#minkFavorites')[0];
	//to-do: dismiss all other eco menues

	minkApp.buildBibMenu(cont);


}

minkApp.removeMenu = function(event){
	$('.eco-dropDownMenu').remove();
	document.body.removeEventListener('click', minkApp.removeMenu);
}
minkApp.removeOverlay = function(event){
	$('.eco-popup').remove();
	event.srcElement.removeEventListener('click', minkApp.removeOverlay);

}
minkApp.killEvent = function(event){
	event.stopPropagation();
	}
minkApp.buildBibMenu = function(parent){
	var container = buildDiv('eco-dropDownMenu');
	buildMenuIcon(container, 'View Bibliography', './img/ecologylab.png', minkApp.favesToBib);
	buildMenuIcon(container, 'View BibText', './img/ecologylab.png', minkApp.favesToBibTex);

	parent.appendChild(container);
	setTimeout(function(){
		document.body.addEventListener('click', minkApp.removeMenu);

	})


}

minkApp.handleFacetKeydown = function(event){
	if(event.keyCode == 13){
		minkApp.handleFacetEntry();
	}
}
minkApp.handleFacetEntry = function(event){
	var facets = getFacetsFromHTML();
	applyFacets(minkApp.currentQuery, facets);
	$('#removeFacets').removeClass('hidden')


}
minkApp.handleFacetRemoval = function(event){
	applyFacets(minkApp.currentQuery, []);
	$('#removeFacets').addClass('hidden')
	$('#minkFacetsRemovedIndicator').closest('.minkFacetMenuItem').addClass('hidden')

}


function getFacetsFromHTML(){
	//should ideally return start year, end year, and the input in that one box
	var startYearInput = $('#startYear').val();
	var endYearInput = $('#endYear').val();
	var startYear = parseInt(startYearInput);
	var endYear = parseInt(endYearInput);

	if(isNaN(startYear)){
		startYear = 0;
	}
	if(isNaN(endYear)){
		endYear = 9999;
	}

	var yearFacet = {name: "year", value: [startYear,endYear]};


	return [yearFacet];
}

/*
Filter by year early
*/
function applyFacets(query, facets){
	// //for now we support two facet types: keyword and year
	// //remove existing facet and replace with new one supplied by system
	// var numberFiltered = 0;
	// query.facets = facets;
	// //for all facets, deselect all cards that do not fit specifications
	//
	// //Finds all the cards
	// var keys = query.pileMap.keys;
	// for (var i = 0; i < keys.length; i++){
	// 	var pile = query.pileMap.get(keys[i]);
	// 		var cards = pile.cards;
	//
	// 		//for earch card compare to whichever facets we have
	//
	// 	for (var j = 0; j < cards.length; j++){
	// 		var filtered = false;
	// 		for(var k = 0; k < query.facets.length; k++){
	// 			for(var l = 0; l < cards[j].facets.length; l++){
	// 				if(query.facets[k].name == cards[j].facets[l].name){
	// 					if(query.facets[k].name == "year"){
	// 						if(!(query.facets[k].value[0] <= cards[j].facets[l].value && query.facets[k].value[1] >= cards[j].facets[l].value)){
	// 							filtered = true;
	// 							numberFiltered++;
	// 						}
	//
	// 					}
	// 				}
	//
	// 			}
	//
	// 		}
	//
	// 		cards[j].filteredOut = filtered;
	// 		minkApp.updateCardDisplay(cards[j]);
	//
	// 	}
	// }
	//
	// var indicatorString = numberFiltered.toString() + " cards removed";
	// if(numberFiltered > 0){
	// 	$('#removeFacets').removeClass('hidden')
	// 	$("#minkFacetsRemovedIndicator")[0].innerHTML = indicatorString;
	//
	// 	$('#minkFacetsRemovedIndicator').closest('.minkFacetMenuItem').removeClass('hidden')
	//
	// }
	//

}









minkApp.toggleFacetItemHandler = function(event){
	var item = $(event.srcElement).closest('.minkFacetMenuItem');
	var content = item.find('.minkFacetMenuItemContent');

	var collapsed = content.hasClass('collapsed');
	if(collapsed){
		minkApp.showFacetItem(content);
	}else{
		minkApp.hideFacetItem(content);

	}
}

minkApp.hideFacetItem= function(content){
	content.addClass('collapsed').removeClass('open');
}

minkApp.showFacetItem = function(content){
	content.removeClass('collapsed').addClass('open');
}



minkApp.toggleFacetsMenuHandler = function(event){
	var facetColumn = $(event.srcElement).closest('.minkFacetColumn');
	var collapsed = facetColumn.hasClass('collapsed');
	if(collapsed){
		minkApp.showFacetMenu(facetColumn);
	}else{
		minkApp.hideFacetMenu(facetColumn);

	}
}

minkApp.hideFacetMenu = function(facetColumn){
	facetColumn.addClass('collapsed');
	facetColumn.removeClass('open');
	facetColumn.find('.facetMenuItems').addClass('collapsed').removeClass('open');
	$('#minkColumns').removeClass('facetsMenuShowing');
	$('#minkColumns').addClass('facetsMenuHiding');

}

minkApp.showFacetMenu = function(facetColumn){
	facetColumn.removeClass('collapsed');
	facetColumn.addClass('open');
	facetColumn.find('.facetMenuItems').removeClass('collapsed').addClass('open');
	$('#minkColumns').removeClass('facetsMenuHiding');

	$('#minkColumns').addClass('facetsMenuShowing');
}


minkApp.buildOverlay = function(parent, bibHTML){
	var overlay = buildDiv('eco-overlay');
	parent.appendChild(overlay);
	var bibCont = buildDiv('minkBibDisplay');
	bibCont.innerHTML = bibHTML;
	bibCont.addEventListener('click', minkApp.killEvent);
	parent.appendChild(bibCont);
}
minkApp.buildBibPopUp = function(parent, bibHTML){
	var popUp = buildDiv('eco-popup');
	minkApp.buildOverlay(popUp, bibHTML);
	parent.appendChild(popUp);
	setTimeout(function(){
		popUp.addEventListener('click', minkApp.removeOverlay);
	}, 10);
}
minkApp.favesToBib = function(){
	var bibGen = new BibTexGenerator('../bsjsCore/citeproc/modern-language-association-with-url.csl', '../bsjsCore/citeproc/locales-en-US.xml');

	for (var i = 0; i < minkApp.favorites.length; i++){
		var md = minkApp.linkToMetadataMap.get(minkApp.favorites[i].url);
		bibGen.addDocument( new BibTexDocument(minkApp.favorites[i].url, md));
	}

	bibGen.getBibHTML(function(bibHTML){
		minkApp.buildBibPopUp(document.body, bibHTML);
		//alert(bibHTML)
	});
}

minkApp.favesToBibTex = function(){
	var bibGen = new BibTexGenerator('../bsjsCore/citeproc/modern-language-association-with-url.csl', '../bsjsCore/citeproc/locales-en-US.xml');

	for (var i = 0; i < minkApp.favorites.length; i++){
		var md = minkApp.linkToMetadataMap.get(minkApp.favorites[i].url);
		bibGen.addDocument( new BibTexDocument(minkApp.favorites[i].url, md));
	}

	bibGen.getBibString(function(bibString){
		minkApp.buildBibPopUp(document.body, bibString);
		//alert(bibHTML)
	});
}
//remove from Space




minkApp.signalFavorite = function(event){
	var card = $(event.srcElement).closest('.minkCardContainer')[0];
	var exExp = $(card).find('.minkExplorablesExpander')[0];
	var minkTitleClickable = $(card).find('.minkTitleClickable')[0];

	var url = exExp.getAttribute('url');
	var favicon = $(minkTitleClickable).children('.minkFavicon')[0].src;
	var mdname = $(minkTitleClickable).children('.minkTitleField')[0].childNodes[0].innerHTML;
	var detailDetails = {type: 'minkfavorite', url: url, favicon: favicon, mdname: mdname, html: card};
	var eventDetail = {detail: detailDetails, bubbles: true};
	var myEvent = new CustomEvent("minkevent", eventDetail);
	event.target.dispatchEvent(myEvent);
}
minkApp.removeButtonHandler = function(event){
	var minkCardHTML = $(event.srcElement).closest('.minkCardContainer')[0];
	var pileId = minkCardHTML.parentNode.getAttribute('pileid');
	var pile = minkApp.currentQuery.pileMap.get(pileId);
	for (var i = 0 ; i < pile.cards.length; i++){
		if (pile.cards[i].url == minkCardHTML.getAttribute('minkcardid')){
			minkApp.removeCard(pile, pile.cards[i]);

		}
	}

}
minkApp.cardRemovalAfterAnimation = function(event){
	event.currentTarget.removeEventListener('animationend', minkApp.cardRemovalAfterAnimation);
	event.currentTarget.style.display = "none";
}
minkApp.removeCard = function(pile, card){
	var index = $(card.html).index();
	pile.cards[index].removed = true;
	var cards = minkApp.cardDuplicateMap.get(card.url);
	var reval = true;
	for (var i = 0; i < cards.length; i++){
		minkApp.updateCardDisplay(cards[i], reval);
		reval = reval && false;
	}
}
minkApp.openLink = function(event){
	var link = event.currentTarget.getAttribute('outlink');
	  var win = window.open(link, '_blank');

}

minkApp.buildLinkOutControl = function(parent, link){
	var olc = buildDiv('minkCardControl')
	olc.innerHTML = '<i class="material-icons">open_in_new</i>';
	olc.addEventListener('click', minkApp.openLink);
	olc.setAttribute('outlink', link)

	//Material.addMaterial((link + "::o"), olc, 2);
	parent.appendChild(olc);
}

minkApp.buildCardControls = function(parent, link){
	var controlCont = buildDiv('minkCardControls hidden');
	var r = buildDiv('minkCardControl')

	r.innerHTML = '<i class="material-icons">remove_circle_outline</i>';
	r.addEventListener('click', minkApp.removeButtonHandler)



	//see if mink::uuid, link, or mink::lin;


	var f = buildDiv('minkCardControl')
	f.innerHTML = '<i class="material-icons">bookmark_border</i>';
	f.addEventListener('click', minkApp.signalFavorite)


	controlCont.appendChild(f);
	if(link.startsWith('mink::')){
		var sublink = link.substring(6);
		if(!sublink.startsWith('UIDD')){
			minkApp.buildLinkOutControl(controlCont, sublink)
		}
	}else{
		minkApp.buildLinkOutControl(controlCont, link)

	}
	controlCont.appendChild(r);
//	Material.addMaterial((link + "::r"), r, 2);
	//Material.addMaterial((link + "::f"), f, 2);

	parent.appendChild(controlCont)
}

minkApp.showCardControls = function(event){
	$(event.srcElement).children('.minkCardControls')[0].style.opacity = "1";
	$(event.srcElement).children('.minkCardControls')[0].style.pointerEvents = "auto";

}
minkApp.hideCardControls = function(event){
	$(event.srcElement).children('.minkCardControls')[0].style.opacity = "0";
	$(event.srcElement).children('.minkCardControls')[0].style.pointerEvents = "none";

}





function setIntervalX(callback, delay, repetitions) {
    var x = 0;
    var intervalID = window.setInterval(function () {

       callback();

       if (++x === repetitions) {
           window.clearInterval(intervalID);
       }
    }, delay);
}

function isCardDuplicate(bucket, id){
	for (var i = 0; i < bucket.length; i++){
		if (bucket[i].displayed && bucket[i] != id){
			return true;
		}
	}
	return false;
}


function pileIDGen(url, collection){
	if(collection){
		return url + '|' + collection;
	}
	else{
		return url + '|' + 'base_url';
	}


}


minkApp.restoreQueryFromHistory = function(event){
	var cont = event.srcElement.parentNode;
	var queryId = cont.getAttribute('id');
	if (queryId == minkApp.currentQuery.uuid){
		return
	}else{
		try{
			var q = minkApp.queryMap.get(queryId);
			minkApp.hidePreviousQuery();
			minkApp.currentQuery = q;
			minkApp.rebuildCurrentQuery();
		}catch(e){
			console.log('error: ' + e);
		}

	}
}
minkApp.newColumnId = function(){
	minkApp.columnKey++;
	return (minkApp.columnKey-1);
}
minkApp.initialize = function(minkAppHTML){
	//Dumb code that sets at 3 columns instead of checking stuff. putting this here now
	//In case there's a responsive future to be had
	minkApp.baseCol = minkAppHTML.childNodes[0];
	var columns = $(minkAppHTML).find(".minkColumn");
	//minkApp.currentQuery.columns = columns;
	minkApp.leftMostCol = columns[0];
	minkApp.rightMostCol = columns[0];
	columns[0].setAttribute('column', '0');
	minkApp.maxCols = 3;
	minkApp.HTML = minkAppHTML;

	$(".minkBackButton").css('display', 'none');
	$(".minkForwardButton").css('display', 'none');


}


minkApp.addQueryToHistory = function(){
	//build HTML representation for new query
	//if representation of current query already has a qLevel, dont build one, else add
	//add representation to appropriate qLvl
}
/*
minkApp.markPileOutOfView = function(pileID){
	var pile = minkApp.pileMap.
}

minkApp.markColumnOutOfView = function(column){
	var piles = $(column).find('.minkPile');
	for (var i = 0; i < piles.length; i++){
		var id = piles.getAttribute('pileid');
		minkApp.markPileOutOfView(id);
	}
}
*/
minkApp.hidePreviousQuery = function(){
	var keys = minkApp.currentQuery.pileMap.keys;
	for (var i = 0; i < keys.length; i++){
		var pile = minkApp.currentQuery.pileMap.get(keys[i]);
		var cards = pile.cards;
		for (var j = 0; j < cards.length; j++){
			cards[j].inView = false;
			cards[j].displayed = false;

		}
	}
	$("#minkColumns").empty();
	minkApp.leftMostCol =null;
	minkApp.rightMostCol = null;
	$('#contextTitle')[0].innerHTML = "";

	//remove add query button visbility by default
	$('.minkNewQueryButton').removeClass('visible');
	//mak
	//Clear facets
	$('#startYear')[0].value = "1000";
	$('#endYear')[0].value = "3000";
	$('#facetkeyword')[0].value = "";
	$('#removeFacets').addClass('hidden');
	$('#minkFacetsRemovedIndicator')[0].innerHTML = "";


}

minkApp.updateCardDisplay = function(card, reval){
	var bucket = minkApp.cardDuplicateMap.get(card.url);
	var previousD = card.displayed;
	card.displayed = !card.removed && !card.filteredOut;

	if (card.displayed){

		if(!previousD){
			card.html.style.display = "";
			$(card.html).addClass('animatingRestore');
		}
		if($(card.html).hasClass('devalued') && reval){
			minkRenderer.revalue(card.html);
			card.displayed = true;

		}else if(card.duplicate){
			minkRenderer.devalue(card.html);
		}

		minkApp.updateDuplicateCount(card.pile);

	}else{
		//only animate removal iff  not already removed
		if(previousD){
			$(card.html).removeClass('animatingRestore');

			$(card.html).addClass('animatingRemoval');
			card.html.addEventListener("animationend", minkApp.cardRemovalAfterAnimation);

		}

		minkApp.updateDuplicateCount(card.pile);

	}
}

/*

TODO - apple facets
*/

minkApp.rebuildCurrentQuery = function(){
	//
	minkApp.hidePreviousQuery();
	//
	var keys = minkApp.currentQuery.pileMap.keys;
	for (var i = 0; i < keys.length; i++){
		var pile = minkApp.currentQuery.pileMap.get(keys[i]);
		var c = $(pile.HTML).closest('.minkColumn')[0];
		var cnum = parseInt(c.getAttribute('column'));
		if(cnum > 0 && cnum <= 3){
			var cards = pile.cards;
			for (var j = 0; j < cards.length; j++){
				cards[j].inView = true;
				minkApp.updateCardDisplay(cards[j]);
			}
			minkApp.updateDuplicateCount(pile);
		}


	}
	$('#contextTitle')[0].innerHTML =  minkApp.currentQuery.contextTitle;

	var columns = minkApp.currentQuery.columns;
	var cont = $('#minkColumns')[0];
	for(var i = 0; i < columns.length; i++){
		cont.appendChild(columns[i]);
	}
	$(('#' + minkApp.currentQuery.uuid)).children('.minkNewQueryButton').addClass('visible');


	$('#startYear').value = minkApp.currentQuery.facets[0].value[0].toString();
	$('#endYear')[0].value = minkApp.currentQuery.facets[0].value[1].toString();
	if(minkApp.currentQuery.facets[1]){
		$('#facetkeyword')[0].value = minkApp.currentQuery.facets[1].value;

	}else{
		$('#facetkeyword')[0].value = "";
	}

	applyFacets(minkApp.currentQuery, minkApp.currentQuery.facets);







}
minkApp.queryHighlight = function(event){
	var qLevel = $(event.srcElement).closest('.qLevel')[0];
	if(qLevel){
		$(qLevel).addClass('minkQHighlight');
	}else{
		$(event.srcElement).addClass('minkQHighlight-color');
	}
}
minkApp.queryUnhighlight = function(event){
	var qLevel = $(event.srcElement).closest('.qLevel')[0];
	if(qLevel){
		$(qLevel).removeClass('minkQHighlight');
	}else{
		$(event.srcElement).removeClass('minkQHighlight-color');
	}

}



minkApp.nsearchKeypress = function(event){
	 if(event && event.keyCode == 13){
		 var newQueryString = event.srcElement.value;
		 var pid = event.srcElement.getAttribute('pid');
		 var nQuery = new Query(newQueryString, ['google_scholar'], pid);


		var column;
		if(!minkApp.currentQuery){
			column = minkApp.leftMostCol;
		}else{
			minkApp.hidePreviousQuery();

			column = minkApp.buildColumn($('#minkColumns')[0]);

			column.setAttribute('column', '0');
			var c = new Column(0, column);
			$('#minkColumns')[0].appendChild(column);
		}
		$('#contextTitle')[0].innerHTML = nQuery.contextTitle;
		var pile = minkApp.buildPile(column, nQuery.urls, nQuery.urls[0], null, null, true);
		nQuery.pileMap.put(pileIDGen(nQuery.urls[0], null), pile);
		nQuery.columns.push(column);

		minkApp.currentQuery = nQuery;
		minkApp.explorationSpace.queries.push(nQuery);
		$(('#' + minkApp.currentQuery.uuid)).children('.minkNewQueryButton').addClass('visible');






	    $(event.srcElement.parentNode).remove();

	 }

}
minkApp.newQueryBox = function(event){

	//remove other search boxes
	$('minkNSearch').remove();
	//create new qlevel if needed
	var parentId = event.srcElement.parentNode.getAttribute('id');
	var parentNode = event.srcElement.parentNode;
	var parentQuery = minkApp.queryMap.get(parentId);
	var pqq = parentQuery.query;
	var level;
	if ($(parentNode).next().hasClass('qLevel')){
		level = $(parentNode).next()[0]
	}else{
		level = buildDiv('qLevel');
		$(level).insertAfter(parentNode);

	}
	//create search box
	var nsearch = document.createElement('input');
	nsearch.setAttribute('type', "text");
	nsearch.value = pqq;
	nsearch.setAttribute("autofocus", "");
	nsearch.className = "minkNSearch";
	nsearch.setAttribute('pid', parentId)
	nsearch.addEventListener('keypress', minkApp.nsearchKeypress);
	var holder = buildDiv('minkNSearchContainer');
	var x = document.createElement('img');
	x.className = 'minkNSearchX';
	x.src = './img/x.svg';
	holder.appendChild(nsearch);
	holder.appendChild(x);
	level.appendChild(holder);
	//set event listeners

}
minkApp.exploreURL = function(url){
	//checki
	if(minkApp.currentQuery){
		if(url === minkApp.currentQuery.query){
			return;
		}
	}



	for (var i = 0; i < minkApp.explorationSpace.queries.length; i++){
		if(url === minkApp.explorationSpace.queries[i].query){
			minkApp.hidePreviousQuery();
			minkApp.explorationSpace.currentQuery = minkApp.explorationSpace.queries[i];
			minkApp.rebuildCurrentQuery();
			return;
		}
	}

	//var explorationSpace = new ExplorationSpace(url, null);
	var nQuery = new Query(url);
	var column;
	if(!minkApp.currentQuery){
		column = minkApp.leftMostCol;
	}else{
		minkApp.hidePreviousQuery();

		column = minkApp.buildColumn($('#minkColumns')[0]);
		column.setAttribute('column', '0');
		var c = new Column(0, column);

		$('#minkColumns')[0].appendChild(column);
	}
	var pile = minkApp.buildPile(column, [url], url, null, null);
	$('#contextTitle')[0].innerHTML = nQuery.contextTitle;

	nQuery.pileMap.put(pileIDGen(url, null), pile);
	nQuery.columns.push(column);
	minkApp.currentQuery = nQuery;
	minkApp.explorationSpace.queries.push(nQuery);

	$(('#' + minkApp.currentQuery.uuid)).children('.minkNewQueryButton').addClass('visible');


}

function toGoogleUrl(searchString){


	var terms = searchString.split(" ");
	var url = "https://www.google.com/search?q=";
	for (var x in terms){
		url += terms[x];
		url += "+";
	}
    encodeURI(url);
    console.log(url);
    return url;
}



minkApp.addSearchToQuery = function(parent, query, rooturl){

		var wrapper= buildDiv('minkPileWrapper');
		var id  = generateUUID();
		wrapper.id = id;

		var row = buildDiv('minkPileRow');
		var newPile = buildDiv('minkPile minkPileExpanded');
		var pileId = pileIDGen(rooturl);
		var pile = new minkPile(pileId, null, null, newPile, null, rooturl);
		if(minkApp.currentQuery){
			var facets = getFacetsFromHTML();
		}
		//pile.setAttribute('pileID', pileId);
		row.appendChild(newPile);
		wrapper.appendChild(row);
		newPile.setAttribute('pileid', pileId);
		parent.appendChild(wrapper);

		return pile;

}

minkApp.exploreNewQuery = function(queryString){

	if(minkApp.currentQuery){
		if(queryString === minkApp.currentQuery.query){
			return;
		}
	}



	for (var i = 0; i < minkApp.explorationSpace.queries.length; i++){
		if(queryString === minkApp.explorationSpace.queries[i].query){
			minkApp.hidePreviousQuery();
			minkApp.currentQuery = minkApp.explorationSpace.queries[i];
			minkApp.rebuildCurrentQuery();
			return;
		}
	}


	var nQuery = new Query(queryString, ['google_scholar']);
	var column;
	if(!minkApp.currentQuery){
		column = minkApp.leftMostCol;
	}else{
		minkApp.hidePreviousQuery();

		column = minkApp.buildColumn($('#minkColumns')[0]);
		column.setAttribute('column', '0');
		var c = new Column(0, column);

		$('#minkColumns')[0].appendChild(column);
	}
	$('#contextTitle')[0].innerHTML = nQuery.contextTitle;

	var pile = minkApp.addSearchToQuery(column, nQuery, nQuery.urls[0]);
	//Create a pile in the column. request md for it. then make cards, then ask minkComposer to deal with em
	MinkOracle.getSemantics(nQuery.urls[0], pile, "rootQueryMetadata", MinkOracle.prepareSearchSemantics);



	nQuery.pileMap.put(pileIDGen(nQuery.urls[0], null), pile);
	nQuery.columns.push(column);

	minkApp.currentQuery = nQuery;
	minkApp.explorationSpace.queries.push(nQuery);
	$(('#' + minkApp.currentQuery.uuid)).children('.minkNewQueryButton').addClass('visible');



}


minkApp.buildColumn = function(parent){
	var column = buildDiv('minkColumn');
	parent.appendChild(column);
	return column;
}

minkApp.toggleFavorite = function(url, mdName, faviconLink, srcHTML){

	var found = -1;

	for(var i = 0; i < minkApp.favorites.length; i++){
		if (minkApp.favorites[i].url == url){
			found = i;
		}
	}

	if(found < 0){

		/*mark the card as favorited visually and in memory*/
		var favoriteIndicator = srcHTML.getElementsByClassName('minkCardControl')[0];
		favoriteIndicator.classList.add('favorited');
		favoriteIndicator.innerHTML = '<i class="material-icons">bookmark</i>';
		$(srcHTML).find(".minkTitleBar").addClass('favorited');
		$(srcHTML).find(".minkTitleField").addClass('favorited');
		var md = minkApp.linkToMetadataMap.get(url);
		if(md){
			md = BSUtils.unwrap(md);
			if(md.year){
				var sourceInfo = md.year;
				var year = sourceInfo.replace(/[^\d]/g,'');
				md.year = year;

			}

			//quick hack
			if(md.google_authors){
				md.authors = md.google_authors;
			}
		}




		var favorite = {url: url, src: srcHTML, mdname: mdName, favicon: faviconLink, html: null};
		minkApp.favorites.push(favorite);

	}else{

		$($(srcHTML).find(".minkCardControl")[0]).removeClass('favorited');
		$($(srcHTML).find(".minkCardControl")[0])[0].innerHTML = '<i class="material-icons">bookmark_border</i>';

		$(srcHTML).find(".minkTitleBar").removeClass('favorited');
		$(srcHTML).find(".minkTitleField").removeClass('favorited');
		//find html
		minkApp.favorites.splice(found, 1);
		var selector = "[href='" + url + "']";
		$('#minkFavorites').find(selector).closest('.minkFavorite').remove();
	}

	minkApp.updateFavoritesDisplay();


}

minkApp.buildFavorite = function(favorite){
	var favoriteCont = buildDiv('minkFavorite');
	var favoriteTitle = buildDiv('minkFavoriteTitlebar');
	var favoriteIcon = document.createElement('img');
	favoriteIcon.className = "minkFavoriteIcon";
	favoriteIcon.setAttribute('src', favorite.favicon);
	var favoriteLink = document.createElement('a');
	favoriteLink.className = "minkFavoriteLink";
	favoriteLink.innerHTML = favorite.mdname;
	favoriteLink.href = favorite.url;
	favoriteTitle.appendChild(favoriteIcon);
	favoriteTitle.appendChild(favoriteLink);
	favoriteCont.appendChild(favoriteTitle);
	return favoriteCont;
}
minkApp.updateFavoritesDisplay = function(){
	var favoritesContainer = $('#minkFavorites')[0];
	favoritesContainer.childNodes = [];
	for(var i = minkApp.favorites.length-1; i >=0 ; i--){


		if(minkApp.favorites[i].html == null){
			minkApp.favorites[i].html = minkApp.buildFavorite(minkApp.favorites[i])
		}
		favoritesContainer.appendChild(minkApp.favorites[i].html);
	}
	if(minkApp.favorites.length >0){
		var expander = $('#minkFavoritesExpander')[0];
		if(!$('#minkFavoritesExpander').hasClass('nonempty')){
					$('#minkFavoritesExpander').addClass('nonempty');

		}
		$('#minkFavoritesExpander').removeClass('flash');
		setTimeout(function(){$('#minkFavoritesExpander').addClass('flash')}, 1)

	}
}
minkApp.favoritesToggleHandler = function(event){

	var minkFavorites = $('#minkFavorites');
	var expander = $('#minkFavoritesExpander');
	if(minkFavorites.hasClass('mfShow')){
		minkFavorites.removeClass('mfShow');
		minkFavorites.addClass('mfHidden');
		expander.removeClass('expanded');
		expander.addClass('deflated');


	}else if(minkApp.favorites.length > 0){
		minkFavorites.removeClass('mfHidden');
		minkFavorites.addClass('mfShow');
		expander.removeClass('deflated');
		expander.addClass('expanded');

	}


}
minkApp.buildChildPileContainer = function(parentPileId, targetColumn){
	var newContainer = buildDiv('minkPileWrapper');
	newContainer.setAttribute('parentCard', parentPileId)
	var id = generateUUID();
	newContainer.id = id;
	targetColumn.appendChild(newContainer);
	//TODO COMPOSE
	return newContainer;
}

minkApp.getCitationMetadata = function(){

}

minkApp.addChildPile = function(details, srcElement){

//Find which column to add new pile to
 var nextCol = null;
 var targetColumn = $(srcElement).closest(".minkColumn")[0];
 var columnNumber = parseInt(targetColumn.getAttribute('column'));
 var targetColumnNum = columnNumber + 1;
 var columns = $('.minkColumn');
 var targetColumn;
 if(columns[targetColumnNum]){
	 targetColumn = columns[targetColumnNum];
 }else{
	 targetColumn = buildDiv('minkColumn');
	 targetColumn.setAttribute('column', targetColumnNum.toString());
	 $('#minkColumns').append(targetColumn);
	 var c = new Column(targetColumnNum, targetColumn);

 }

 //Find the parentID. If parent doesn't have a childPile container, build one
  var parentPileId = $(event.srcElement).closest('.minkPile').attr('pileid');
	var parentComposeableId = $(event.srcElement).closest('.minkCardContainer')[0].id

  //get parentPile
  var parentPile = minkApp.currentQuery.pileMap.get(parentPileId);
  //get parentCard url
  var parentCard;
  for (var i = 0; i < parentPile.cards.length; i++){
  	if(event.detail.rooturl == parentPile.cards[i].url){
  		parentCard = parentPile.cards[i];
  	}
  }
	//check for childPileContainer
	var selector = '.minkPileWrapper[parentCard="' + parentCard.url + '"]'
	var childPileContainer;
	var alreadyComposed = ($(selector).length > 0);
	if(alreadyComposed){
		 childPileContainer = $(selector)[0];
	}else{
		childPileContainer = minkApp.buildChildPileContainer(parentComposeableId, targetColumn)
	}
	var pileId = pileIDGen(event.detail.rooturl, event.detail.collectionname);

	var newPileHTML = buildDiv('minkPile minkPileExpanded');
	newPileHTML.setAttribute('pileID', pileId)

	var newPile;

	newPile = new minkPile(pileId, null, parentPile.HTML, newPileHTML, parentCard, event.detail.links[0]);
	minkApp.currentQuery.pileMap.put(pileId, newPile);
	childPileContainer.appendChild(newPile.HTML);

	for(var i = 0; i < event.detail.links.length; i++){
		MinkOracle.getSemantics(event.detail.links[i], newPile, 'addCardsToPile');

	}
	/*

	if(event.detail.links.length > 1){
		MinkOracle.getSearchSemantics(event.detail.links[0], childPileContainer, 'childSearchMetadata');

	}else{
//TODO COMPOSE
		MinkOracle.getSearchSemantics(event.detail.links[0], newPileHTML, 'childSearchMetadata');
	}*/
	//  minkApp.currentQuery.pileMap.put(pileIDGen(details.rooturl, details.collectionname), pile);
	//  srcElement.addEventListener('click', minkApp.showHidePileHandler);
	//  srcElement.removeEventListener('click', minkApp.showExplorableLinksHandler);

}

minkApp.showButtons = function(container){
	$(container).find('.minkCardControls').removeClass('hidden');
}
minkApp.hideButtons = function(container){
	$(container).find('.minkCardControls').addClass('hidden');

}
minkApp.minkEventHandler = function(event){

	 if(event.detail.type == 'minknewpile'){

		 minkApp.addChildPile(event.detail, event.srcElement);



	 }else if(event.detail.type == "rootQueryMetadata"){
		 minkApp.addParentlessPile(event);
	 }else if(event.detail.type == "addCardsToPile"){
		 	minkApp.addChildCards(event);
	 }
	 else if(event.detail.type == 'minkshowless'){
		 var id = pileIDGen(event.detail.rooturl, event.detail.collectionname);
		 var pile = minkApp.currentQuery.pileMap.get(id);
		 pile.rootHTML = event.srcElement;
	 }else if(event.detail.type=='minkshowmore'){
		 var id = pileIDGen(event.detail.rooturl, event.detail.collectionname);
		 var pile = minkApp.currentQuery.pileMap.get(id);
		 pile.rootHTML = event.srcElement;
	 }else if(event.detail.type=="minkshowhide"){
		 minkApp.showHidePileHandler(event);
	 }else if(event.detail.type=="minkbuttons"){
	 	if(event.detail.show){
	 		minkApp.showButtons(event.detail.html)
	 	}else{
	 		minkApp.hideButtons(event.detail.html)

	 	}
	 }
	 else if(event.detail.type=='minkfavorite'){
		 minkApp.toggleFavorite(event.detail.url, event.detail.mdname, event.detail.favicon, event.detail.html);
	 }

}

minkApp.addChildCards = function(event){



	var pileID = event.srcElement.getAttribute('pileID');
	var pile =  minkApp.currentQuery.pileMap.get(pileID);
	pile.semantics = event.detail.semantics;
	pile.semantics.results.links = pile.semantics.results.links.slice(0, 4)
	var wrapper = $(pile.HTML).closest('.minkPileWrapper')[0];
	$(pile).find('.minkLoadingSpinner').remove();
	/*
	if the iteration canary is visble, give the pile a new URL as the new results URL so that buildPile knows to make it
	a  new card loader. If the canary has 'died' then delete any existing more loaders

	*/
	var semantics = event.detail.semantics;
	var formerIndex = semantics.urlIndex;
	var loader = $(pile.HTML).closest('.minkPileWrapper').find('.minkPileLoader')[0];
	semantics.incrementUrl(loader);


	var cards = minkApp.buildCards(pile);
	pile.cards = cards;
	var detailDetails = {type: 'makespace', container: pile.HTML};



	if(minkApp.currentQuery){
	 var facets = getFacetsFromHTML();
	 applyFacets(minkApp.currentQuery, facets);

	}
	if(semantics.canary){
	 minkApp.buildPileMoreLoader(wrapper, pile, semantics.iterableURL, semantics.searchUrl);
	}

}


minkApp.attachCard = function(task){

	if($(task.container).hasClass('minkCardContainer')){
		task.container.id = generateUUID();
		minkRenderer.render(task);

	}else{
		var cont = task.container;
		var cardDiv = buildDiv('minkCardContainer');
		minkApp.buildCardControls(cardDiv, task.url);
		cardDiv.id = generateUUID();
		task.container = cardDiv;
		cont.appendChild(cardDiv);
		minkRenderer.render(task);

	}



	var parentCardId = $(task.container).closest('.minkPileWrapper').attr('parentcard');
	var composeable;

	window.setTimeout(function(){
		composeable = new Composeable(task.container, task.container.id, parentCardId);

			MinkComposer.insertComposeable(composeable);
	}, 350)


}

//buildCards is used when and only when you already have a full set of metadata and mmd and viewmodels
minkApp.buildCards = function(pile){
	var parent = pile.HTML;
	var links = pile.semantics.results.links;
	var favUrl = pile.semantics.faviconLink
	var cards = [];
	parent.addEventListener('minkloaded', minkApp.addCardToPile);
	//Note, in the future will use yin's structure from google doc. In the meantime, just gonna do it 'the easy way'
	minkApp.counter = links.length;
	//Builds card
	//parent.style.height = (links.length * 39 -2 ).toString() + "px";

	var faviconLink = favUrl;

	for(var i = 0; i < links.length; i++){
		var link = links[i];
		var cardDiv = buildDiv('minkCardContainer');
		cardDiv.addEventListener('mouseenter', minkApp.showCardControls);
		cardDiv.addEventListener('mouseleave', minkApp.hideCardControls);

	 	minkApp.buildCardControls(cardDiv, link);
		parent.appendChild(cardDiv);

		var spinner = document.createElement('img');
		spinner.src = "./img/loading.gif";
		spinner.className = "minkLoadingSpinner";
		cardDiv.appendChild(spinner);
		cardDiv.setAttribute('minkCardId', link)
		var card = new minkCard(link, cardDiv, pile);

    	var metadata = MinkOracle.viewModelMap.get(link);
			metadata['minkfav'] = faviconLink;

    	var yr = minkApp.polishYear(metadata);
    	if(yr){
				var year = parseInt(yr);
		  	if(!isNaN(year)){

		  	}
	    	var yearFacet = new Facet('year', year, 'ordinal', 'num');
	    	card.facets.push(yearFacet);
			}
			var clipping = {viewModel: metadata};
			var options = {expand: true, callback: minkApp.contextualize, devalue: card.duplicate, viewmodel: MinkOracle.viewModelMap}
			MinkSemantics.addMetadataDisplay(cardDiv, link, clipping, minkApp.attachCard, options);
			cards.push(card)
		}

		return cards;

}

minkApp.addParentlessPile = function(event){
	var pileID = event.srcElement.getAttribute('pileID');
	var pile =  minkApp.currentQuery.pileMap.get(pileID);
	pile.semantics = event.detail.semantics;
	pile.semantics.results.links = pile.semantics.results.links.slice(0, 5)

	var wrapper = $(pile.HTML).closest('.minkPileWrapper')[0];
	$(pile).find('.minkLoadingSpinner').remove();
	/*
	if the iteration canary is visble, give the pile a new URL as the new results URL so that buildPile knows to make it
	a  new card loader. If the canary has 'died' then delete any existing more loaders

	*/
	var semantics = event.detail.semantics;
	var formerIndex = semantics.urlIndex;
	var loader = $(pile.HTML).closest('.minkPileWrapper').find('.minkPileLoader')[0];
	semantics.incrementUrl(loader);


	var cards = minkApp.buildCards(pile);
	pile.cards = cards;


	if(minkApp.currentQuery){
	 var facets = getFacetsFromHTML();
	 applyFacets(minkApp.currentQuery, facets);

	}
	if(semantics.canary){
	 minkApp.buildPileMoreLoader(wrapper, pile, semantics.iterableURL, semantics.searchUrl);
	}

	console.log(event.detail.links);

}



minkApp.toggleDisplay = function(event){
	if(event.target.style.display != 'none'){
		event.target.style.display = 'none';
	}else{
		event.target.style.display = '';
	}
	event.target.removeEventListener('animationend',minkApp.toggleDisplay )
}
minkApp.formStack = function(secondCard, thirdCard){
	secondCard.style.transform = "translateY(" + (-1/2 * minkApp.COLLAPSED_CARD_HEIGHT + 4) + "px)";
	secondCard.style.zIndex = "3";

	if(thirdCard){
		thirdCard.style.transform = "translate(5px, " + (-1/2 * minkApp.COLLAPSED_CARD_HEIGHT - 8) + "px)";
		thirdCard.style.zIndex = "2";


	}
}
minkApp.minimizePile = function(pile, numberOfCards){
	var oldHeight = pile.clientHeight;
	var newHeight;
	var ph = $(pile).outerHeight();
	var $el = $(pile);
	$el.css('height', ph + 'px');
	newHeight = ((2.5 * minkApp.COLLAPSED_CARD_HEIGHT) + 4);

	$(pile).attr('collapsed', 'true');


	var speed = ((newHeight - oldHeight)) / (0.25);

//	$(pile).css('height', ph + 'px')
	//every 1/60'th of a second, add, 1/60th of speed to height
	var thisInterval = setInterval(function() {
		var float = parseFloat(pile.style.height.substring(0, (pile.style.height.length-2)));
		float += ((1/60)*speed)
		ph =  float.toString()  + "px";
		$(pile).css('height', ph)
    }, (1/60 * 1000));
	setTimeout(function(){clearInterval(thisInterval);
		pile.style.height = newHeight.toString() + "px";
	}, 250);






}
minkApp.expandPile = function(pile){
	var cardCount = pile.childNodes.length;
	pile.style.minHeight = "";
	pile.style.marginTop =  '0px';
	$(pile).attr('collapsed', 'false');
	var speed = 0;
	if(cardCount > 3){
		speed = (((cardCount) * 41) - pile.clientHeight) * 2; //pixels per second
	}else if(cardCount == 3){
		speed = (141-106)/(.5);
	}
	var ph = pile.clientHeight -8;
//	$(pile).css('height', ph + 'px')
	//every 1/60'th of a second, add, 1/60th of speed to height
	var thisInterval = setInterval(function() {
	/*	var float = parseFloat(pile.style.height.substring(0, (pile.style.height.length-2)));
		float += ((1/60)*speed)
		ph =  float.toString()  + "px";*/
		var totalHeight = 0;
		$(pile).children().each(function(){
		    totalHeight = totalHeight + $(this).outerHeight(true) + 8;
		});
		if(totalHeight < pile.clientHeight){
			ph = totalHeight + "px"
		}else{
			ph = pile.clientHeight + "px";

		}

		$(pile).css('height', ph)
    }, (1/60 * 1000));
	setTimeout(function(){clearInterval(thisInterval); $(pile).css('height', '')}, 500);

}
minkApp.displayNone = function(event){
	var target = event.target;
	if(!$(target).hasClass('minkCardContainer')){
	 target = $(event.target).closest('.minkCardContainer')[0];
	}
	target.style.display = 'none';
}
minkApp.resumeAnimation = function(event){
	var target = event.target;
	if(!$(target).hasClass('minkCardContainer')){
	 target = $(event.target).closest('.minkCardContainer')[0];
	}
	var mcontainer = $(target).find(".minkContainer")[0];
}
minkApp.showHidePile = function(pile, hide){
	console.log('yeah');
	if(hide){
		pile.visible = false;
		$(pile.HTML).closest('.minkPileWrapper').removeClass('minkPileWrapperShow');
		$(pile.HTML).closest('.minkPileWrapper').addClass('minkPileWrapperHide');
		$(pile.rootHTML).attr('expanded', 'false');
		$(pile.HTML).closest('.minkPileWrapper')[0].addEventListener('animationend', minkApp.toggleDisplay);
		//handle kids

	}else{
		pile.visible = true;
		$(pile.HTML).closest('.minkPileWrapper')[0].removeEventListener('animationend', minkApp.toggleDisplay);

		$(pile.HTML).closest('.minkPileWrapper')[0].style.display = '';
		$(pile.HTML).closest('.minkPileWrapper').removeClass('minkPileWrapperHide');
		$(pile.HTML).closest('.minkPileWrapper').addClass('minkPileWrapperShow');
		$(pile.HTML).closest('.minkPileWrapper').attr('expanded', 'true');
		//handle kids


	}

	for(var i = 0; i < pile.kids.length; i++){
		minkApp.showHidePile(pile.kids[i], hide)
	}


}
minkApp.showHidePileHandler = function(event){
	var rootHTML = $(event.target).closest('.minkExplorableField')[0];
	var url = $(rootHTML).attr('rooturl');
	var collection = $(rootHTML).attr('collectionname');
	var id = pileIDGen(url, collection);

	var pile = minkApp.currentQuery.pileMap.get(id);
	minkApp.showHidePile(pile, pile.visible)



}
minkApp.expandCollapsePile = function(event){
	var pile = $(event.currentTarget).closest('.minkPileWrapper')[0];
	pile = $(pile).find('.minkPile')[0];
	var kids = $(pile).children('.minkCardContainer');
	/*
	 * Hide all faceted controls, etc.
	 */

	/*
	 * Check for uncollapseable cards, put one in front of stack
	 */

	/*
	 * If none are uncollapseable, shrink all cards to snippet form and put behind first card
	 */
	var ogHeight = pile.clientHeight -8;

	for(var i = 0; i < kids.length; i++){
		if($(pile).attr('collapsed')!= 'true'){
			console.log('shrinking')
			var target = $(kids[i]).find(".minkTitleClickable")[0];
			var controls = $(kids[i]).find(".minkCardControls").css('display', 'none');

			var contentContainer = $(target).closest('.minkContentContainer')[0];
			if($(contentContainer).attr('grown') == "true"){
				minkRenderer.shrink(target, true);
			}
			kids[i].style.zIndex = kids.length - i;

			if(i>0){
				/*$(kids[i]).removeClass('animatingExpand');
				$(kids[i]).addClass('animatingCollapse');
				kids[i].addEventListener("animationend", minkApp.displayNone, false);*/

				if(i == 1){
					kids[i].style.transform = "translate(0px, " + (-1/2 * minkApp.COLLAPSED_CARD_HEIGHT - (8 * (i)) + 8) + "px)";

				}else if (i < 3 && i > 1){
					kids[i].style.transform = "translate(" + (5*(i-1)) + "px, " + (-1/2 * minkApp.COLLAPSED_CARD_HEIGHT - (8 * (i-1)) - 8) + "px)";

				}
				else{
					kids[i].style.transform = "translateY(" + (-i*20) + "px)";

				}
				if(i > 2){
					kids[i].style.display = 'none';

				}

			}else{
				kids[i].style.transform = 'translateX(-5px)';
			}
		}else{
			console.log('expanding')
			var target = $(kids[i]).find(".minkTitleClickable")[0];
			var contentContainer = $(target).closest('.minkContentContainer')[0];
			var controls = $(kids[i]).find(".minkCardControls").css('display', '');

			if($(contentContainer).attr('grown') == "true"){
				minkRenderer.grow(target, true);
			}

				kids[i].style.transform = "none";
				kids[i].style.zIndex = '';
				kids[i].style.opacity = '1';
				kids[i].style.display= "";

		}

	}
	if($(pile).attr('collapsed')!= 'true'){
		minkApp.minimizePile(pile, kids.length, ogHeight);

		//minkApp.formStack(kids[1], kids[2]);
	}else{


		minkApp.expandPile(pile, kids.length);

		//First card becomes front by going down to the middle of the pile.
		/*var firstCard = kids[0];
		minkApp.toMiddleOfPile(firstCard, pile);
		minkApp.formStack(kids[1], kids[2]);*/
	}


	//Two others shrink down to a smaller size
	//a


}

minkApp.buildDuplicateCount = function(pile){
	var dupCont = buildDiv('minkDupIndicator');
	var dupCount = 0;
	for (var i = 0; i < pile.cards.length; i++){
		if(pile.cards[i].duplicate && !pile.cards[i].displayed){
			dupCount++;
		}
	}
	if(dupCount > 0){
		var txt = dupCount.toString() + " duplicate cards hidden";
		dupCont.innerHTML = txt;

	}
	//pile.HTML.appendChild(dupCont);
}
minkApp.updateDuplicateCount = function(pile){
	/*var dupCont = $(pile.HTML).find('.minkDupIndicator')[0];
	var dupCount = 0;
	var rmCount = 0;
	for (var i = 0; i < pile.cards.length; i++){
		if(pile.cards[i].duplicate && !pile.cards[i].displayed && !pile.cards[i].removed){
			dupCount++;
		}
		if(pile.cards[i].removed){
			rmCount++;
		}
	}
	if(dupCount > 0){
		var txt = dupCount.toString() + " duplicate cards hidden";
		dupCont.innerHTML = txt;
	}else if(rmCount == pile.cards.length){
		dupCont.innerHTML = "all cards removed";
	}else{
		dupCont.innerHTML = "";
	}
	*/

}


minkApp.contextualize = function(md_and_mmd){
	var ct = $('#contextTitle')[0];
	var unwrapped = BSUtils.unwrap(md_and_mmd.metadata)

	if(ct.innerHTML == '' && minkApp.currentQuery.query  == unwrapped.location){
		ct.innerHTML = unwrapped.title;
		minkApp.currentQuery.contextTitle = unwrapped.title;
	}
}

minkApp.polishYear = function(metadata){
	var values = metadata.value;
	var year;
	for(var i = 0; i < values.length; i++){
		if(values[i].name == 'source_info'){
			var sourceInfo = values[i].value;
			year = sourceInfo.replace(/[^\d]/g,'');

		}
	}
	if(year != "" && year != null && (!isNaN(parseInt(year)))){
		for(var i = 0; i < values.length; i++){
			if(values[i].name == 'year'){
				if(isNaN(parseInt (values[i].value))){
					values[i].value = year;
				}


			}
		}
		return year;
	}
}








minkApp.getSearchResultLinks = function(task){
	var list = [];
	var metadataFields = task.fields;
	var metadata = task.metadata;

	for (var i = 0; i < metadataFields.length; i++){

		var metadataField = metadataFields[i];

		if(task.isSearchResultsCollection(metadataField)){

			var collectionLinks = {};
			collectionLinks.links = [];
			collectionLinks.name = metadataField.name;
			for (var i = 0; i < metadataField.value.length; i++){
				try{
					collectionLinks.links.push(task.getDestinationPageLink(metadataField.value[i], true, metadata));
				}catch(err){
					var wasteTime = 2;
				}
			}
			list.push(collectionLinks);


		}
	}
	return list[0];
}










minkApp.buildPileMoreLoader = function (parent, pile, pattern, url){
	/*var loader = buildDiv('minkPileLoader');
	var urlToLoad = url + pattern;
	loader.setAttribute('loadnext', urlToLoad);
	loader.addEventListener('click', minkApp.addNewCardsToPile);
	loader.innerHTML = 'explore further';



	parent.appendChild(loader);*/
}








/*
 *
 * Everything below here is essentially default bootstrap stuff and remnants of the MICE visualizer
 */



/*
 * NOTE: I'm going to rely on the service, since this is a test of a renderer, not a full app
 */function getParameter(param) {
  var val = document.URL;

  var loc = val.indexOf(param);

  if(loc === -1) {
    return -1;
  } else {
    var url = val.substr(loc);
    var n=url.replace(param+"=","");
    return n;
  }
}
 var reload_md = false;

 var mainloop = function() {
     updateGame();
     drawGame();
 };

 var animFrame = window.requestAnimationFrame;

 var recursiveAnim = function() {
     redrawCanvas();
     animFrame( recursiveAnim );
 };

function onBodyLoad() {

	var minkapp = $("#minkAppContainer")[0];


	/*
	Material shading of UI
	*/
	var favoritesHTML = $('#minkFavorites')[0];
	var queryHTML = $('#minkQueries')[0];
	var minkAppBar = $('#minkToolbar')[0];
	Material.addMaterial('minkFavorites', favoritesHTML, 2);
	Material.addMaterial('minkQueries', queryHTML, 2);
	Material.addMaterial('minkToolbar', minkAppBar, 4);


	var c = new Column(0, document.getElementById('minkC0'));

	//SEMANTIC_SERVICE_URL = "http://128.194.128.84:8080/BigSemanticsService/";

	  if (document.URL.indexOf("http://localhost:") > -1 || document.URL.indexOf("file:///") > -1){


			SEMANTIC_SERVICE_URL = "http://localhost:8080/BigSemanticsService/";

	  }
	  else{
		   SEMANTIC_SERVICE_URL = "http://ecology-service.cse.tamu.edu/BigSemanticsService/";

	  }
	var canvas = document.createElement('canvas');
	canvas.className = "minkAppCanvas";
	canvas.width = 1800;
	canvas.height = 1480;
	canvas.id = 'minkAppCanvas';
	animFrame(recursiveAnim);



	$(minkapp).prepend(canvas);

	RendererBase.idealRenderer = false;
	$(".collapse").collapse();
	minkapp.addEventListener('minkevent', minkApp.minkEventHandler);
	minkapp.addEventListener('composerevent', MinkComposer.composeEventHandler);

	minkApp.initialize(minkapp);

  //Try to get passed in parameter url
  var n = getParameter("url");
  if(n == -1) {
    showMetadata();
  } else {
    var linkInput = document.getElementById("targetURL");
    linkInput.value=decodeURIComponent(n);
    showMetadata();
  }
}
function syntaxHighlight(json) {
	  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
	    var cls = 'number';
	    if (/^"/.test(match)) {
	        if (/:$/.test(match)) {
	            cls = 'key';
	        } else {
	            cls = 'string';
	        }
	    } else if (/true|false/.test(match)) {
	        cls = 'boolean';
	    } else if (/null/.test(match)) {
	        cls = 'null';
	    }
	    return '<span class="' + cls + '">' + match + '</span>';
	  });
	}


//Stringify the JSON and make it pretty looking



//Sets the value of the link text box in the linking modal view
function setLinkValue()
{
  var linkInput = document.getElementById("modalLinkValue");
  var targetURL = document.getElementById("targetURL").value;
  var linkURL = document.URL;

  //If a target URL is already included in the document.URL, strip it out
  if(getParameter("url") != -1) {
    var loc = linkURL.indexOf("?url=");
    linkURL = linkURL.substr(0, loc);
  }

  //Append the targetURL for the new link
  linkInput.defaultValue=linkURL + "?url=" + encodeURIComponent(targetURL);
}

function onNewMMD(metametadata) {
  rawMMD = metametadata;
  console.log(metametadata);
}

function onNewMetadata(metadata) {
  rawMetadata = metadata;

	console.error("Error: calling onNewMetadata()");

  updateJSON(true);

  //Hate this but it's necessary for now... Service does funky redirect stuff when you request MMD with a URL
  var first;
  for(first in metadata)
    break;

  $.ajax({
    url: 'http://ecology-service.cse.tamu.edu/BigSemanticsService/mmd.jsonp',
    jsonp: 'callback',
    dataType: 'jsonp',
    data: { name: first},
    success: onNewMMD
  });

}

function getJSONData (targeturl)
{
	console.error("Error: calling getJSONData()");

  $.ajax({
    url: 'http://ecology-service.cse.tamu.edu/BigSemanticsService/metadata.jsonp',
    jsonp: 'callback',
    dataType: 'jsonp',
    data: { url: targeturl},
    success: onNewMetadata
  });

}
function toggleReload(){
	reload_md = !reload_md;
}

function onEnterShowMetadata(event)
{
  if(event.keyCode == 13)
    showMetadata();
}

function isUrl(string){
	var valid = /^(ftp|http|https):\/\/[^ "]+$/.test(string);
	return valid;
}

function showMetadata(url)
{
	if (url){
		if(isUrl(url)){
			minkApp.exploreURL(url);
		}else{
			minkApp.exploreNewQuery(url);
		}

	}else{
		var url = document.getElementById("targetURL").value;
		if(isUrl(url)){
			minkApp.exploreURL(url);
		}else{
			minkApp.exploreNewQuery(url);
		}

	}


}

(function ($) {
    /*
        jquery.slide-transition plug-in

        Requirements:
        -------------
        You'll need to define these two styles to make this work:

        .height-transition {
            -webkit-transition: max-height 0.5s ease-in-out;
            -moz-transition: max-height 0.5s ease-in-out;
            -o-transition: max-height 0.5s ease-in-out;
            transition: max-height 0.5s ease-in-out;
            overflow-y: hidden;
        }
        .height-transition-hidden {
            max-height: 0;
        }

        You need to wrap your actual content that you
        plan to slide up and down into a container. This
        container has to have a class of height-transition
        and optionally height-transition-hidden to initially
        hide the container (collapsed).

        <div id="SlideContainer"
                class="height-transition height-transition-hidden">
            <div id="Actual">
                Your actual content to slide up or down goes here
            </div>
        </div>

        To call it:
        -----------
        var $sw = $("#SlideWrapper");

        if (!$sw.hasClass("height-transition-hidden"))
            $sw.slideUpTransition();
        else
            $sw.slideDownTransition();
    */
    $.fn.slideUpMinkApp = function() {
        return this.each(function() {
            var $el = $(this);
            $el.css("max-height", "0");
            $el.addClass("height-transition-hidden");

        });
    };

    $.fn.slideUpMinkApp = function() {
        return this.each(function() {
            var $el = $(this);
            $el.removeClass("height-transition-hidden");

            // temporarily make visible to get the size
            $el.css("max-height", "none");
            var height = $el.outerHeight();

            // reset to 0 then animate with small delay
            $el.css("max-height", "0");

            setTimeout(function() {
                $el.css({
                    "max-height": height
                });
            }, 1);
        });
    };
})(jQuery);
