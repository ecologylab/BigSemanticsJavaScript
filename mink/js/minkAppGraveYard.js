minkApp.goBackHandler = function(event){
	console.log('hahaha')
	minkApp.goBackwards(1);

}
minkApp.goForwardsHandler = function(event){
	console.log('hahaha')
	minkApp.moveForward();

}
//if new Column is true, ignore code about opneing a new colun
minkApp.moveForward = function(newColumn){
	//

	var already = false;
	 for(var i = 0; i < minkApp.currentQuery.columns.length; i++){
		  var colNo = parseInt(minkApp.currentQuery.columns[i].getAttribute('column'));

		  if(colNo == 1){
			  minkApp.currentQuery.columns[i].classList.add('minkDeletingColumn');
			  minkApp.currentQuery.columns[i].addEventListener('animationend', minkApp.toggleDisplay)
			  minkApp.currentQuery.columns[i].setAttribute('column', "0");

			  }
		  else if(colNo == 2){
				  minkApp.leftMostCol = minkApp.currentQuery.columns[i];
		  }

		  if(colNo > 1 && (already == false))
			  minkApp.currentQuery.columns[i].setAttribute('column', (colNo - 1).toString());


		 if(colNo == (minkApp.maxCols) && (newColumn != true) && (already == false)){
			  minkApp.currentQuery.columns[(i+1)].setAttribute('column', minkApp.maxCols.toString());
			  minkApp.rightMostCol = minkApp.currentQuery.columns[(i+1)];
			  minkApp.rightMostCol.style.display = '';
			  $(minkApp.rightMostCol).removeClass("minkDeletingColumnRight");
			  //this is a hacky way to ensure this code is only executed one
			  already = true;

		 }
	 }
		minkApp.offScreenColumnsLeft++;
		if(minkApp.offScreenColumnsRight > 0){
			minkApp.offScreenColumnsRight--;

		}
		$(".minkBackButton").css('display', '');
		$(".leftPlaceholder").css('display', 'none');

		if(minkApp.offScreenColumnsRight < 1){
			$(".minkForwardButton").css('display', 'none');
			$(".rightPlaceholder").css('display', '');

		}
		minkApp.currentQuery.column++;

}
minkApp.goBackwards = function(howMany){
	 for(var i = 0; i < minkApp.currentQuery.columns.length; i++){
		  var colNo = parseInt(minkApp.currentQuery.columns[i].getAttribute('column'));
		  if(colNo == 1){
			  minkApp.currentQuery.columns[(i-1)].setAttribute('column', "1");
			  minkApp.leftMostCol = minkApp.currentQuery.columns[(i-1)];
			  minkApp.leftMostCol.style.display = '';
			  $(minkApp.leftMostCol).removeClass("minkDeletingColumn");


		  }
		  if(colNo == minkApp.maxCols){
			  minkApp.currentQuery.columns[i].classList.add('minkDeletingColumnRight');
			  minkApp.currentQuery.columns[i].addEventListener('animationend', minkApp.toggleDisplay)
			  minkApp.currentQuery.columns[i].setAttribute('column', "0");


		  }else if(colNo > 0){
			  minkApp.currentQuery.columns[i].setAttribute('column', (colNo + 1).toString());

		  }
	 }
	 minkApp.offScreenColumnsRight++;
		minkApp.offScreenColumnsLeft--;

	 $(".minkForwardButton").css('display', '');
	 $(".rightPlaceholder").css('display', 'none');

	 if(minkApp.offScreenColumnsLeft < 1){
			$(".minkBackButton").css('display', 'none');
			 $(".leftPlaceholder").css('display', '');

		}
	minkApp.currentQuery.column--;

}
minkApp.buildPile = function(parent, links, rooturl, collectionname, src, expandChildren){
	expandChildren = false;
	console.log('links: ');
	console.log(links);
	var wrapper= buildDiv('minkPileWrapper');
	var row = buildDiv('minkPileRow');

	if(src){
		var collapseButton = buildDiv('sampleCollapse');
		collapseButton.addEventListener('click', minkApp.expandCollapsePile);
		row.appendChild(collapseButton);


	}

	var newPile = buildDiv('minkPile minkPileExpanded');
	parent.appendChild(wrapper);

	var pileId = pileIDGen(rooturl, collectionname);
	var parentPile = null;
			var parentCard = null;

	if(src){
		var parentPileHTML = $(src).closest('.minkPile')[0];
		parentPile = minkApp.currentQuery.pileMap.get(parentPileHTML.getAttribute('pileid'));
		for(var i = 0; i < parentPile.cards.length; i++){
			var intermediate = parentPile.cards[i].url.toLowerCase();
			if (src.getAttribute('rooturl') == intermediate){
				parentCard = parentPile.cards[i];
			}
		}


	}
	var pile = new minkPile(pileId, null, src, newPile, parentPile, rooturl, parentCard);

	pile.cards = minkApp.buildCards(newPile, links, expandChildren, pile);

	if(minkApp.currentQuery){
		var facets = getFacetsFromHTML();
		//applyFacets(minkApp.currentQuery, facets);

	}

	//pile.setAttribute('pileID', pileId);
	row.appendChild(newPile);
	wrapper.appendChild(row);
	newPile.setAttribute('pileid', pileId);
	minkApp.buildDuplicateCount(pile);
	if(parentPile)
		parentPile.kids.push(pile);




	return pile;
	//Logic to let varius maps and storage representations know about what's going one
	//In thefuture will also need to handle stuff involving the canvas.
}

minkApp.buildCards = function(parent, links, expandCards, pile, favUrl){
	var cards = [];
	parent.addEventListener('minkloaded', minkApp.addCardToPile);
	//Note, in the future will use yin's structure from google doc. In the meantime, just gonna do it 'the easy way'
	minkApp.counter = links.length;
	//Builds card
	//parent.style.height = (links.length * 39 -2 ).toString() + "px";

	var faviconLink = favUrl;
	if(links[(links.length-1)].startsWith("fav::")){
		faviconLink = links.pop();
		faviconLink = faviconLink.substring(5);
	}
	for(var i = 0; i < links.length; i++){
		var link = links[i];
		//Right now I just tell mink to render it with a static message, but I should add loading icons and some kinda queue
		//gonna look through kade's code
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
		cards.push(card);


		//check to see if there's metadata contained therein{
		if(link.startsWith('mink::')){
			var metadata = MinkOracle.viewModelMap.get(link);
			metadata['minkfav'] = faviconLink;



			/*
		    VERY HACKY THING
		    takes Source_info and processes it into a year field. Really shouldn't be done here but we're demo'ing
		    */
		    //here metadata is a viewmodel and md is just metadata
	    	var metadata = MinkOracle.viewModelMap.get(link);
	    	var yr = minkApp.polishYear(metadata);
	    	if(yr){
	    		var year = parseInt(yr);
		    	if(!isNaN(year)){

		    	}
		    	var yearFacet = new Facet('year', year, 'ordinal', 'num');
		    	card.facets.push(yearFacet);

	    	}
		    if(metadata['source_info']){

		    }
		    //devalue passed into mink?
			var clipping = {viewModel: metadata};
			minkApp.cardSemantics(cardDiv, link, clipping, {expand: true, callback: minkApp.contextualize, devalue: card.duplicate, viewmodel: MinkOracle.viewModelMap});

		}else{
			minkApp.cardSemantics(cardDiv, link, null, {expand: true, callback: minkApp.contextualize, devalue: card.duplicate, viewmodel: MinkOracle.viewModelMap});

		}

	}

	return cards;

}
