function minkCard(url, div, pile){
	this.url = url;
	this.html = div;
	this.facets = [];
	this.filteredOut = false;
	//is the cards pile in view?
	this.inView = true;
	//is the card already displayed in another pile
	this.displayed;
	var bucket = minkApp.cardDuplicateMap.get(this.url)
	if(bucket){
		bucket.push(this);
		this.displayed = !isCardDuplicate(bucket, this);
		this.duplicate = true;
		//Mink.devalue(this.html);

	}else{
		minkApp.cardDuplicateMap.put(this.url, [this]);
		this.displayed = true;
		this.duplicate = false;
	}
	this.pile = pile;
	this.removed = false;
	minkApp.cardMap.put(this.url, this)


}

minkCard.prototype.setOnScreen = function(onScreen){
	this.onScreen = onScreen;
	if(onScreen){
		if(!this.removed){
			if(this.valuedByUser || this.valuedByMink){
				this.displayed = 'valued';
			}else if(this.filteredOut){
				this.displayed = 'none'

			}else{
				this.displayed = 'devalued';
			}
		}else{
			this.displayed = 'none'
		}
	}
	else{
		this.displayed = 'none';

	}
	this.updateDisplay();
}
minkCard.prototype.setValuedByMink = function(valuedByMink){
	this.valuedByMink = valuedByMink;
	if(!removed && this.onScreen){
		this.displayed = 'valued'
	}else{
		this.displayed = 'none';
	}
	this.updateDisplay();

}
minkCard.prototype.updateDisplay = function(){
}
/*


onScreen - is the card supposed to be in view?
isDuplicate - does more than one version exist with mink?
removed - card is removed by user
valuedByUser - User has manually expanded card
 - System has decided card should be shown
valuedByUser :== true | false
	true if user has expanded a devalued card
	else false
valuedByMink :== true | false
	true
		if "first with URL to appear in the minkApp" and isDuplicate and not removed
		if "no other valued cards in bucket*" and isDuplicate and not removed
	else false


	*stateful
favorited :== none | thisCard | thisURL
	thisCard if this particular card was favorited
	thisURL if another card in bucket has been favorited
	else none
display :== none | valued | devalued
	none if removed by user or offscreen
	valued if (valuedByUser or valuedByMink) && onscreen && not removed
	devalued if (!valuedByUser and !valuedByMink) && onscreen && not removed




*/
