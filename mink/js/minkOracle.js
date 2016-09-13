var MinkOracle = {};
MinkOracle.viewModelMap = new Map();

function SearchSemantics(task, resultIDs, iterableURL, canary){
  this.searchUrl = task.url;
  this.canary = canary;
  this.perPage = parseInt(task.mmd['wrapper'].results_per_page);
  this.faviconLink = BSUtils.getFaviconURL(this.searchUrl);
  this.results = resultIDs;
  this.iterableURL = iterableURL;
  this.mmdType = task.mmd['wrapper'].name;
  this.urlIndex = 0;
}

SearchSemantics.prototype.incrementUrl = function(loaderButtonHTML, pileHTML){

  this.urlIndex = this.urlIndex + parseInt(this.perPage);
  if(loaderButtonHTML){
   if(!this.canary){
      $(loader).remove();
    }else{
      var nextCardUrl = this.searchUrl;
      var queryStart = nextCardUrl.indexOf(this.iterableURL);
      if(queryStart > 0){
        nextCardUrl = nextCardUrl.substring(0, queryStart);
      }
      nextCardUrl = nextCardUrl + this.iterableURL + this.urlIndex.toString();
      loader.setAttribute('loadme', nextCardUrl);

    }

  }else{
      //build the html for the "load more cards button"
      var loader = buildDiv('minkPileLoader');
      loader.innerHTML = "load more results";
      loader.alt = "adds the next page of results to the search environment";
      var nextCardUrl = this.searchUrl;
      var queryStart = nextCardUrl.indexOf(this.iterableURL);
      if(queryStart > 0){
        nextCardUrl = nextCardUrl.substring(0, queryStart);
      }
      nextCardUrl = nextCardUrl + this.iterableURL + this.urlIndex.toString();
      loader.setAttribute('loadme', nextCardUrl);
      loader.setAttribute('pileid', pileHTML.getAttribute('pileid'));
      pileHTML.appendChild(loader);
      loader.addEventListener('click', minkApp.loadMoreFromPile);
      var loaderComp = new FloatingComposeable(loader);
  }
}


MinkOracle.getSearchResultLinks = function(task){
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
MinkOracle.prepareGenericSemantics = function(task){
  try{
    minkApp.attachCard(task);
    var eventName = task.options.minkeventName

      var detailDetails = {type: eventName, task: task, parentCard: task.options.parentCard};
      var eventDetail = {detail: detailDetails, bubbles: true};
      var myEvent = new CustomEvent('minkevent', eventDetail);
      task.container.dispatchEvent(myEvent);


  }catch(e){

  }
}
MinkOracle.prepareSearchSemantics = function(task){

  try{

    var minkLinks = MinkOracle.getSearchResultLinks(task);
    var metadata = BSUtils.unwrap(task.metadata);
    //a link to the associated
    var iteratableURL = task.mmd['wrapper'].search_result_iterator;
    /*
    if there is are more children to load, set the canary to be true/alive
    */
    var canaryAlive = false;
    var canaryField = task.mmd['wrapper'].final_page_canary;
    if(metadata[canaryField] != null && metadata[canaryField] != ""){
      canaryAlive = true;
    }


    //gs search hardcode for now
    for(var j = 0; j < metadata.search_results.length; j++){
      var url2 = "mink::" + metadata.search_results[j]['google_scholar_search_result'].document_link;
      url2 = url2.toLowerCase();
      var betterMD = metadata.search_results[j];
      minkApp.linkToMetadataMap.put(url2, betterMD);

    }
    console.log(minkLinks);

    var eventName = task.options.minkeventName;

    var semantics = new SearchSemantics(task, minkLinks, iteratableURL, canaryAlive);
    var detailDetails = {type: eventName, semantics: semantics, parentCard: task.options.parentCard};

    var eventDetail = {detail: detailDetails, bubbles: true};
    var myEvent = new CustomEvent('minkevent', eventDetail);
    task.container.dispatchEvent(myEvent);

  }catch (e){
    console.log("Error getting search md for " + task.url);
  }

}
/*
  Gets, sets appropriate metadata for  SEARCH url. MinkOracle.prepareSearchSemantics will send
  a minkevent to be handled by the minkEventHandler once it's done
*/
MinkOracle.getSemantics = function(url, pile, minkeventName, parentCard){


  var opt = {url: url, pile: pile, minkeventName: minkeventName, parentCard: parentCard};
  bsService.selectMmd(url, opt, function(err, result, options){
      if (err){

      }

    try{
      var newOptions = {viewmodel: MinkOracle.viewModelMap, minkeventName: options.minkeventName, parentCard: parentCard};
      result = result['wrapper'];
      if(result.name == "google_scholar_search"){
        MinkSemantics.addMetadataDisplay(options.pile.HTML, options.url, null, MinkOracle.prepareSearchSemantics, newOptions);

      }else if (result.name){
        MinkSemantics.addMetadataDisplay(options.pile.HTML, options.url, null, MinkOracle.prepareGenericSemantics, newOptions);

      }
      console.log(result);
    }catch(e){

    }


  });

}
