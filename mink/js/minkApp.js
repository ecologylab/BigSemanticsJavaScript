var minkApp ={};
minkApp.piles = [];
minkApp.pileMap = new Map;
minkApp.queries = [];
minkApp.trails = [];
minkApp.metadata_collection = {};
minkApp.counter = 0;
minkApp.COLLAPSED_CARD_HEIGHT = 31;

function setIntervalX(callback, delay, repetitions) {
    var x = 0;
    var intervalID = window.setInterval(function () {

       callback();

       if (++x === repetitions) {
           window.clearInterval(intervalID);
       }
    }, delay);
}
function minkCard(url, div){
	this.url = url;
	this.html = div;
}

function minkPile(id, cards, root, html){
	this.id = id;
	this.cards = cards;
	this.collapsed = false;
	this.rootHTML = root;
	this.HTML = html;
	this.visible = true;
}


function pileIDGen(url, collection){
	var pileId = url + '|' + collection;
	return pileId
}
minkApp.minkEventHandler = function(event){
	 
	 if(event.detail.type == 'minknewpile'){
		//Draw in the new minks in right-hand column and connect with cool curves
		 var secondaryColumn = $("#minkExpandColumn")[0];
		 var pile = minkApp.buildPile(secondaryColumn, event.detail.links, event.detail.rooturl, event.detail.collectionname, event.srcElement)
		 minkApp.piles.push(pile);
		 minkApp.pileMap.put(pileIDGen(event.detail.rooturl, event.detail.collectionname), pile);
		 event.srcElement.addEventListener('click', minkApp.showHidePileHandler);
		 event.srcElement.removeEventListener('click', Mink.showExplorableLinks);
	 }else if(event.detail.type == 'minkshowless'){
		 var id = pileIDGen(event.detail.rooturl, event.detail.collectionname);
		 var pile = minkApp.pileMap.get(id);
		 pile.rootHTML = event.srcElement;
	 }else if(event.detail.type=='minkshowmore'){
		 var id = pileIDGen(event.detail.rooturl, event.detail.collectionname);
		 var pile = minkApp.pileMap.get(id);
		 pile.rootHTML = event.srcElement;
	 }else if(event.detail.type=="minkshowhide"){
		 minkApp.showHidePileHandler(event);
	 }
	 
}
minkApp.toggleDisplay = function(event){
	if(event.target.style.display != 'none'){
		event.target.style.display = 'none';
	}else{
		event.target.style.display = '';
	}
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
	if(numberOfCards >= 3){
		//pile.style.minHeight = (2 * minkApp.COLLAPSED_CARD_HEIGHT + 20) + 'px';
	}
	$(pile).attr('collapsed', 'true');
}
minkApp.expandPile = function(pile){
	var cardCount = pile.childNodes.length;
	pile.style.minHeight = "";
	//pile.style.height = (cardCount * 39 -2 ) + "px";
	pile.style.marginTop =  '0px';
	$(pile).attr('collapsed', 'false');

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
	if(pile.visible || hide){
		pile.visible = false;
		$(pile.HTML.parentNode).removeClass('minkPileWrapperShow');
		$(pile.HTML.parentNode).addClass('minkPileWrapperHide');
		$(pile.rootHTML).attr('expanded', 'false');
		pile.HTML.parentNode.addEventListener('animationend', minkApp.toggleDisplay);


	}else{
		pile.visible = true;
		pile.HTML.parentNode.removeEventListener('animationend', minkApp.toggleDisplay);

		pile.HTML.parentNode.style.display = '';
		$(pile.HTML.parentNode).removeClass('minkPileWrapperHide');
		$(pile.HTML.parentNode).addClass('minkPileWrapperShow');
		$(pile.rootHTML).attr('expanded', 'true');



	}
	
}
minkApp.showHidePileHandler = function(event){
	var rootHTML = $(event.target).closest('.minkExplorableField')[0];
	var url = $(rootHTML).attr('rooturl');
	var collection = $(rootHTML).attr('collectionname');
	var id = pileIDGen(url, collection);
	
	var pile = minkApp.pileMap.get(id);
	minkApp.showHidePile(pile, event.detail.hide);
	
	
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

	for(var i = 0; i < kids.length; i++){
		if($(pile).attr('collapsed')!= 'true'){
			console.log('shrinking')
			var target = $(kids[i]).find(".minkTitleClickable")[0];
			var contentContainer = $(target).closest('.minkContentContainer')[0];
			if($(contentContainer).attr('grown') == "true"){
				Mink.shrink(target, true);
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
					kids[i].style.transform = "translate(" + (10) + "px)";

				}
				if(i > 2){
					kids[i].style.opacity =0;

				}
	
			}else{
				kids[i].style.transform = 'translateX(-5px)';
			}
		}else{
			console.log('expanding')
			var target = $(kids[i]).find(".minkTitleClickable")[0];
			var contentContainer = $(target).closest('.minkContentContainer')[0];
			if($(contentContainer).attr('grown') == "true"){
				Mink.grow(target, true);
			}
			
				kids[i].style.transform = "none";
				kids[i].style.zIndex = '';
				kids[i].style.opacity = '1';
			
		}
		
	}
	if($(pile).attr('collapsed')!= 'true'){
		minkApp.minimizePile(pile, kids.length);
		var ph = $(pile).outerHeight();
		var $el = $(pile);
		$el.css('height', ph + 'px');

		setTimeout(function() {
            $el.css({
                "height":  (2 * minkApp.COLLAPSED_CARD_HEIGHT + 20) + 'px'
            });
        }, 1);
		//First card becomes front by going down to the middle of the pile.
		var firstCard = kids[0];
		
		
		//minkApp.formStack(kids[1], kids[2]);
	}else{

		    
		minkApp.expandPile(pile, kids.length);
		var ph = pile.scrollHeight -8;
		$(pile).css('height', ph + 'px')
		setTimeout(function() {
			;
			$(pile).css('height', '')
        }, 500);
		//First card becomes front by going down to the middle of the pile.
		/*var firstCard = kids[0];
		minkApp.toMiddleOfPile(firstCard, pile);
		minkApp.formStack(kids[1], kids[2]);*/
	}
  
	
	//Two others shrink down to a smaller size
	//a
	
	
}
minkApp.buildCards = function(parent, links){
	var cards = [];
	parent.addEventListener('minkloaded', minkApp.addCardToPile);
	//Note, in the future will use yin's structure from google doc. In the meantime, just gonna do it 'the easy way'
	minkApp.counter = links.length;
	//Builds card
	//parent.style.height = (links.length * 39 -2 ).toString() + "px";
	for(var i = 0; i < links.length; i++){
		var link = links[i];
		//Right now I just tell mink to render it with a static message, but I should add loading icons and some kinda queue
		//gonna look through kade's code
		var cardDiv = buildDiv('minkCardContainer');
		parent.appendChild(cardDiv);
		RendererBase.addMetadataDisplay(cardDiv, link, false, null, true, false, Mink.render);
		var card = new minkCard(link, cardDiv);
		cards.push(card);
	}
	return cards;

}
minkApp.buildPile = function(parent, links, rooturl, collectionname, src){
	console.log('links: ');
	console.log(links);
	var wrapper= buildDiv('minkPileWrapper');
	var collapseButton = buildDiv('sampleCollapse');
	collapseButton.innerHTML = "BUTTON";
	collapseButton.addEventListener('click', minkApp.expandCollapsePile);
	var newPile = buildDiv('minkPile minkPileExpanded');
	parent.appendChild(wrapper);
	var pileId = rooturl + '|' + collectionname;
	wrapper.appendChild(collapseButton);

	var pile = new minkPile(pileId, minkApp.buildCards(newPile, links), src, newPile);
	wrapper.appendChild(newPile);
	
	
	return pile;
	//Logic to let varius maps and storage representations know about what's going one
	//In thefuture will also need to handle stuff involving the canvas.
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

 // start the mainloop
function redrawCanvas(){
	var canvas = document.getElementById('minkAppCanvas');
	var ctx = canvas.getContext('2d');
	ctx.clearRect ( 0 , 0 , canvas.width, canvas.height );
	  ctx.canvas.height = window.innerHeight;

	var canvasY = canvas.getBoundingClientRect().top;
	var canvasX = canvas.getBoundingClientRect().left;
	for (var i = 0; i < minkApp.piles.length; i++){
		var pile = minkApp.piles[i];
		if (pile.visible){
			var rootRect = pile.rootHTML.getBoundingClientRect();
			var rootAttachPointX = rootRect.left + rootRect.width - canvasX;
			var rootAttachPointY = (rootRect.top + rootRect.height / 2) - canvasY;
			
			var pileRect = pile.HTML.getBoundingClientRect();
			var pileTopAttachPointX = pileRect.left - canvasX;
			var pileTopAttachPointY = (pileRect.top) - canvasY;
			
			var pileBotAttachPointX = pileRect.left - canvasX;
			var pileBotAttachPointY = (pileRect.top) + pileRect.height - canvasY;

			
			var pathSplitX = rootAttachPointX + 1/2 * (pileTopAttachPointX - rootAttachPointX);
			var pathSplitY = (pileTopAttachPointY + pileRect.height/2);
		
			ctx.beginPath();
			ctx.strokeStyle = '#999999';
			ctx.moveTo(rootAttachPointX, rootAttachPointY);
			ctx.bezierCurveTo((rootAttachPointX + (1/2 * Math.abs(pathSplitX - rootAttachPointX))), rootAttachPointY, pathSplitX - (1/2 * Math.abs((pathSplitX - rootAttachPointX))), pathSplitY, pathSplitX, pathSplitY);
			ctx.stroke();
			
			ctx.beginPath();
			ctx.strokeStyle = '#999999';
			ctx.moveTo(pathSplitX, pathSplitY);
			ctx.bezierCurveTo((pathSplitX + (1/2 * Math.abs(pileTopAttachPointX - pathSplitX))), pathSplitY, pileTopAttachPointX - (1/2 * Math.abs((pileTopAttachPointX - pathSplitX))), pileTopAttachPointY, pileTopAttachPointX, pileTopAttachPointY);
			ctx.stroke();
			
			ctx.beginPath();
			ctx.strokeStyle = '#999999';
			ctx.moveTo(pathSplitX, pathSplitY);
			ctx.bezierCurveTo((pathSplitX + (1/2 * Math.abs((pileBotAttachPointX - pathSplitX)))), pathSplitY, pileBotAttachPointX - (1/2 * Math.abs((pileBotAttachPointX - pathSplitX))), pileBotAttachPointY, pileBotAttachPointX, pileBotAttachPointY);
			ctx.stroke();

		}
	}
	
	
	//Find all expanded collections and draw lines to the top and bottom of their piles
}
function onBodyLoad() {
	var minkapp = $("#minkAppContainer")[0];

	var canvas = document.createElement('canvas');
	canvas.className = "minkAppCanvas";
	canvas.width = 1280;
	canvas.height = 1080;
	canvas.id = 'minkAppCanvas';
	animFrame(recursiveAnim);

	
	
	$(minkapp).prepend(canvas);

	RendererBase.idealRenderer = false;
	$(".collapse").collapse();
	minkapp.addEventListener('minkevent', minkApp.minkEventHandler);
	
 
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


var MDC_rawMetadata = "";
var MDC_rawMMD = "";

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
function checkForMissingMetadata()
{
	var url = document.getElementById("targetURL").value;
	var content = document.getElementById("mdcIce");		
	
	// if the tab doesnt have metadata
	if(content.getElementsByClassName("metadataContainer").length == 0 && content.getElementsByClassName("twMetadataContainer").length == 0)
	{
		if (MetadataLoader.isExtensionMetadataDomain(url))
			MetadataLoader.getMetadata(url, "MetadataLoader.setMetadata", reload_md);
	}	
}

function onEnterShowMetadata(event)
{
  if(event.keyCode == 13)
    showMetadata(); 
}

function showMetadata(url)
{
  var url = document.getElementById("targetURL").value;
  var content = document.getElementById("mdcIce");
  
  var hostname = window.location.hostname;
  var port = window.location.port;
  //SEMANTIC_SERVICE_URL = "http://" + hostname + ":" + port + "/BigSemanticsService/";
  SEMANTIC_SERVICE_URL = "http://localhost:8080/BigSemanticsService/";
 
  if(window.history.pushState)
  {
  	  window.history.pushState("state", "Mink Demo", "index.html?url="+url)    
  }
  
  MetadataLoader.clearDocumentCollection();
  var refreshCheckbox = document.getElementById('force_reload').checked;

  while(document.getElementById('mdcIce').childNodes.length > 0){
	  document.getElementById('mdcIce').removeChild(document.getElementById('mdcIce').childNodes[0]);
  }

  RendererBase.addMetadataDisplay(content, url, false, null, true, refreshCheckbox, Mink.render);

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