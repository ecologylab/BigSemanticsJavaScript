var TrackRequests = {};

TrackRequests.requestQueue = [];

TrackRequests.isTimerStarted = false;

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
    	/*if (request.track != null)
    		TrackRequests.addRequest(request.track, sender, sendResponse);
    	*/
    	return true;	// async response    		
	}
);

TrackRequests.addRequest = function(expandableItemUrl, sender, sendResponse)
{
	if (!TrackRequests.isTimerStarted)
	{
		setInterval(TrackRequests.sendUpdate, 1000);
	}
	if ((expandableItemUrl.indexOf("twitter.com") != -1)
			&& ((expandableItemUrl.indexOf("hashtag") != -1) 
			|| (expandableItemUrl.indexOf("search") != -1)))
	{
		var startIndex = (expandableItemUrl.indexOf("hashtag") != -1)?
					(expandableItemUrl.indexOf("hashtag/") + 8):
					(expandableItemUrl.indexOf("search?q=") + 9);
		var endIndex = (expandableItemUrl.indexOf("hashtag") != -1)?
				(expandableItemUrl.indexOf("?")):
				(expandableItemUrl.length);			
		var trackVal = expandableItemUrl.substr(startIndex, (endIndex - startIndex));
		var requestObj = TrackRequests.findRequestObj("twitter", trackVal); 
		if (requestObj) {
			if (requestObj.tabs.indexOf(sender.tab) == -1) // same object? else compare ids
				requestObj.tabs.push(sender.tab);
		}
		else {
			//mmd
			//var mmdata = 
				//getDocumentMM("https://userstream.twitter.com/1.1/user.json?track=" + trackVal);
			
			getBS(function(err, bs) {
				if (err) { console.log(err); return; }
				var location = "https://userstream.twitter.com/1.1/user.json?track=" + trackVal;
				var options = {};
				
				bs.selectMmd(location, options, function(err, mmdata) {
					if (err) { console.log(err); return; }
					var obj = simpl.graphCollapse({mmd: mmdata});
					if (obj.mmd.meta_metadata)
						obj.mmd = obj.mmd.meta_metadata;
					
					var tabArr = [];
					tabArr.push(sender.tab);

					var prevResponses = [];
					
					requestObj = {
						type: "twitter", 
						trackKeyword: trackVal, 
						tabs: tabArr,
						url: expandableItemUrl,
						/*mmd: obj.mmd,*/
						prevResp: prevResponses
					};
					TrackRequests.requestQueue.push(requestObj);
					TwitterRequests.addTrackRequest(trackVal, TwitterRequests.trackRequestCallback);
				});
		    });
		}
	}
}

TrackRequests.clearRequests = function(closedTab)
{
	
}

TrackRequests.findRequestObj = function(type, trackKeyword)
{
	for (var i = 0; i < TrackRequests.requestQueue.length; i++) {
        if (TrackRequests.requestQueue[i].type == type && 
        		TrackRequests.requestQueue[i].trackKeyword == trackKeyword) {
            return TrackRequests.requestQueue[i];
        }
    }
	return null;
}

TrackRequests.getMatchingKeywords = function(type, text)
{
	var keywords = [];
	if (text) {
		for (var i = 0; i < TrackRequests.requestQueue.length; i++) {
	        if (TrackRequests.requestQueue[i].type == type && 
	        	text.indexOf(TrackRequests.requestQueue[i].trackKeyword) != -1) {
	            keywords.push(TrackRequests.requestQueue[i].trackKeyword);
	        }
	    }
	}	
	return keywords;
}

TrackRequests.existsPreviously = function(prevResp, respArr, respObj)
{
	for (var i = 0; i < prevResp.length; i++)
	{
		if (prevResp[i].id_str == respObj.id_str)
			return true;
	}
	for (var i = 0; i < respArr.length; i++)
	{
		if (respArr[i].id_str == respObj.id_str)
			return true;
	}
	return false;
}

TrackRequests.addUpdate = function(type, trackKeyword, resp)
{
	for (var i = 0; i < TrackRequests.requestQueue.length; i++) {
        if (TrackRequests.requestQueue[i].type == type && 
        		TrackRequests.requestQueue[i].trackKeyword == trackKeyword) {
        	
        	if (!TrackRequests.requestQueue[i].respArr) 
        		TrackRequests.requestQueue[i].respArr = new Array();
        	
        	var respObj = jQuery.parseJSON(resp);
        	if (!TrackRequests.existsPreviously(TrackRequests.requestQueue[i].prevResp,
        						TrackRequests.requestQueue[i].respArr, respObj))
        		TrackRequests.requestQueue[i].respArr.push(respObj);
        }
    }
}

TrackRequests.sendUpdate = function()
{
	for (var i = 0; i < TrackRequests.requestQueue.length; i++) {
        if (TrackRequests.requestQueue[i].respArr && 
        		TrackRequests.requestQueue[i].respArr.length > 0) {
        	
        	TrackRequests.requestQueue[i].respArr[0].track_word = 
        						TrackRequests.requestQueue[i].trackKeyword;
        	
        	getBS(function(err, bs) {
				if (err) { console.log(err); return; }
				var location = "https://userstream.twitter.com/1.1/user.json?track=xyz";
				var options = {};
				
				bs.selectMmd(location, options, function(err, mmdata) {
					if (err) { console.log(err); return; }
					
					var obj = simpl.graphCollapse({mmd: mmdata});
					if (obj.mmd.meta_metadata)
						obj.mmd = obj.mmd.meta_metadata;
					
		        	var metadata = extractMetadataFromJSON(
		        			TrackRequests.requestQueue[i].respArr, obj.mmd);//TrackRequests.requestQueue[i].mmd);
		        	
					for (var j = 0; j < TrackRequests.requestQueue[i].tabs.length; j++) {
						chrome.tabs.sendMessage(TrackRequests.requestQueue[i].tabs[j].id,
								   {update: {metadata: metadata, 
									   		 mmd: obj.mmd,
											 url: TrackRequests.requestQueue[i].url}});
					}
					
					var prev = TrackRequests.requestQueue[i].respArr.splice(0, 
											TrackRequests.requestQueue[i].respArr.length);
					for (var k = 0; k < prev.length; k++) {
						TrackRequests.requestQueue[i].prevResp.push(prev[k]);
					}
				});
        	});
        }
	}
}