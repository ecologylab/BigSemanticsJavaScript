
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
