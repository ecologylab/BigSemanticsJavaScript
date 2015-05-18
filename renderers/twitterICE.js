
function twitterICE() {

this.usernameXPath = "//li[@class='current-user']/a";	
	
this.expandableItemsXPath = "//ol[@id='stream-items-id']/li//p[@class='js-tweet-text tweet-text']/a/b";

//@usernames, #hashtags, tweet tweeter, @connect tweeter, new layout tweet tweeter
this.expandableItemsXPath2 = ".//a[@class='twitter-atreply pretty-link js-nav'] | " + 
							 ".//a[@class='twitter-hashtag pretty-link js-nav'] | " + 
							 ".//a[@class='account-group js-account-group js-action-profile js-user-profile-link js-nav'] | " + 
							 ".//a[@class='pretty-link js-user-profile-link js-action-profile-name'] | " +
							 ".//a[@class='ProfileTweet-originalAuthorLink u-linkComplex js-nav js-user-profile-link']/span | " +
							 ".//a[@class='twitter-timeline-link']  | " + 
							 ".//a[@class='tb-link']";
this.expandableItemsXPath3 = ".//a[@class='twitter-atreply pretty-link js-nav'] | " + 
							 ".//a[@class='twitter-hashtag pretty-link js-nav'] | " + 
							 ".//a[@class='account-group js-account-group js-action-profile js-user-profile-link js-nav'] | " + 
							 ".//a[@class='pretty-link js-user-profile-link js-action-profile-name'] | " +
							 ".//a[@class='ProfileTweet-originalAuthorLink u-linkComplex js-nav js-user-profile-link']/span";

this.tweetsXPath = "//ol[@id='stream-items-id']/li/div | " +
					"//div[@class='GridTimeline-items']/div[@class='Grid']//div[@class='StreamItem js-stream-item']/div";

this.externalURLsXPath = ".//a[@class='pretty-link twitter-timeline-link'] | .//a[@class='twitter-timeline-link']";

this.replyXPath = "//span[@class='Icon Icon--reply']";

this.retweetXPath = "//span[@class='Icon Icon--retweet']";

this.favoriteXPath = "//span[@class='Icon Icon--favorite']";

this.ajaxContentXPath = "//div[@class='new-tweets-bar js-new-tweets-bar ']";

this.globalNewTweetXPath = "//button[@id='global-new-tweet-button']";
//var globalNewTweetTextXPath = "//div[@id='tweet-box-global']";

var newTweetXPath = "//div[@class='tweet-button']/button";
var newTweetTextXPath = ".//div[@id='tweet-box-global'] | .//div[@id='tweet-box-mini-home-profile']";

this.urlPrefix = "https://twitter.com";

this.getUrlPrefix = function() {
	return this.urlPrefix;
};

this.getExpandableItemsXPath = function(isMetadata) {
	return this.expandableItemsXPath2;
//	if (isMetadata)
//		return this.expandableItemsXPath2;
//	else	
//		return this.expandableItemsXPath;
};

this.getContainersXPath = function() {
	return this.tweetsXPath;
}

this.removeHrefAndSetAsUrl = function(elt) {
	var eltClass = elt.getAttribute("class");
	if (eltClass && eltClass.indexOf("ProfileTweet-originalAuthor") == 0)	//span class for new layout tweet tweeter
	{
		elt = elt.parentNode;
	}
	// get parent <a> tag; in accordance with above XPath
	var href = elt.getAttribute("href");
	elt.removeAttribute("href");
	
	// this attribute name shouldn't conflict with the existing ones
	elt.setAttribute("url", href);
};

this.getExpandableItemUrl = function(item) {
	// TODO: method for retweets
	var eltClass = item.getAttribute("class");
	if (eltClass && eltClass.indexOf("ProfileTweet-originalAuthor") == 0)	//span class for new layout tweet tweeter
	{
		item = item.parentNode;
	}
	return item.getAttribute("url");
};

this.addClickEventListener = function(item, listener) {
	item.addEventListener('click', listener);
};

this.setExpandableItemProcessed = function(elt) {
	// still keep pretty-link part for the styling purpose 
	var eltClass = elt.getAttribute("class");
	if (eltClass.indexOf("account-group") == 0)
	{
		elt.setAttribute("class", "account-group js-account-group js-action-profile js-nav");
		var childElt = elt.getElementsByClassName("fullname js-action-profile-name")[0]
		if (childElt)
			childElt.setAttribute("class", "fullname"); //initial is 'fullname js-action-profile-name'
	}
	else if (eltClass.indexOf("ProfileTweet-originalAuthor") == 0)	//span class for new layout tweet tweeter
	{
		elt.parentNode.setAttribute("class", "ProfileTweet-originalAuthorLink u-linkComplex js-user-profile-link js-nav");
		//elt.setAttribute("class", "fullname"); //initial is 'fullname js-action-profile-name'
	}
	else if (eltClass.indexOf("twitter-timeline-link") == 0)
	{
		elt.setAttribute("class", "pretty-link twitter-timeline-link");
	}
	else
		elt.setAttribute("class", "pretty-link");
};

// set to element to keep similar as most other attributes
this.setCached = function(elt) {
	elt.setAttribute("isExpanded", "true");
};

this.isCached = function(elt) {
	return elt.getAttribute("isExpanded");
};

this.setMetadataBoolean = function(elt, isMetadata) {
	elt.setAttribute("isMetadata", isMetadata);
};

this.setIcon = function(elt, icon) {
	icon.setAttribute("class", "expandCollapseIcon");
	elt.insertBefore(icon, elt.firstChild);
};

this.getIcon = function(elt) {
	// or, set class in above function, and check for child with class name here
	return elt.firstChild;
};

//expanded item might not be same as element for which click listener was added
this.getExpandedItem = function(elt) {
	// or, just return elt
	var icon = elt.getElementsByClassName("expandCollapseIcon")[0];
	return icon.parentNode;
};

this.getContainer = function(elt) {
	
	var parent = elt.parentNode;
	while (parent.nodeName.toLowerCase() !== "div")
		parent = parent.parentNode;
	
	// new layout tweet teweeter
	var eltClass = parent.getAttribute("class");
	if (eltClass && eltClass.indexOf("ProfileTweet-authorDetails") == 0)
	{
		//	parent = parent.parentNode;
		var lineBreak = document.createElement('br');
		var lineBreak1 = document.createElement('br');
		parent.appendChild(lineBreak);
		parent.appendChild(lineBreak1);
	}
	
	// append to last row, if metadata, to keep tweet content together 
	if (elt.getAttribute("isMetadata") == "true")
	{
		while (parent.className != "twMetadataTableDiv" && parent.className != "twRootMetadataTableDiv")
			parent = parent.parentNode;
		
		// metadataRow.tableCell
		parent = parent.lastChild.lastChild;
	}
	
	return parent;
};

this.getContainers = function(tweet) {
	var containers = [];
	
	var contentDiv = tweet.getElementsByClassName("content")[0];
	if (contentDiv)
		containers.push(contentDiv);
	
	var streamHeaderDiv = tweet.getElementsByClassName("stream-item-header")[0];
	if (streamHeaderDiv)
		containers.push(streamHeaderDiv);
	
	return containers;
}

this.addTargetEventListener = function(target, eventtype, listener) {
	target.addEventListener(eventtype, listener);
};

this.setProcessed = function(elt) {
	elt.setAttribute("setProcessed", "true");
};

this.isProcessed = function(elt) {
	 var val = elt.getAttribute("setProcessed");
	 if (val && val == "true")
		 return true;
	 return false;
};

this.getItemClickedEventObj = function(item) 
{
	var url_p = item.getAttribute("href");
	if (url_p && url_p.indexOf("http") == -1)
		url_p = this.getUrlPrefix() + url_p;
	
	var eventObj = {
		click_name_tag: {
			url: url_p
		}
	}
	return eventObj;
};

this.getContainerClickedEventObj = function(tweet) 
{
	var eventObj = {
		click_tweet: {
			id: tweet.getAttribute("data-tweet-id")
		}
	}
	return eventObj;
};

this.getExternalURLClickedEventObj = function(externalURL)
{
	var urlVal = externalURL.getAttribute("url");
	if (!urlVal)
		urlVal = externalURL.getAttribute("href");
	
	var eventObj = {
		click_externalUrl: {
			url: urlVal
		}
	}
	return eventObj;
};

this.getDefaultConditionXPath = function(isMetadata) {
	return this.expandableItemsXPath3;
};

this.setDefaultConditionItemProcessed = function(elt) {
	elt.setAttribute("setProcessed", "true");
};

this.checkDefaultConditionItemProcessed = function(elt) {
	 var val = elt.getAttribute("setProcessed");
	 if (val && val == "true")
		 return true;
	 return false;
};

this.getHrefAttribute = function(elt)
{
	return elt.getAttribute("href");
};

var logTweetAction = function(twAction, item) {
	if (MetadataLoader.logger)
	{
		var eventObj = "";
		if (twAction == "tweet" && item.parentNode.parentNode && item.parentNode.parentNode.parentNode)
		{
			var xpathResult = document.evaluate(newTweetTextXPath, item.parentNode.parentNode.parentNode,
														null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);			
			var txtBox = xpathResult.singleNodeValue;
			
			if (txtBox && txtBox.firstChild) {
			
				eventObj = {
					tweet_action: {
						name: twAction,
						url: txtBox.firstChild.textContent
					}
				}
			}
		}	
		else
		{	
			//a.li.ul.div
			var aNode = item.parentNode.parentNode.parentNode.parentNode.parentNode;
			var aNodeTweetId = aNode.getAttribute("data-tweet-id");
			var actionUrl;
			if (aNodeTweetId)
			{
				actionUrl = aNodeTweetId;
			}
			else
			{
				aNode = item.parentNode.parentNode.parentNode.parentNode.parentNode.getElementsByClassName('time')[0];
				if (aNode)
				{
					var aNode2 = aNode.getElementsByTagName('a')[0];
					if (aNode2)
						actionUrl = aNode2.getAttribute("href");
				}
			}
			
			eventObj = {
				tweet_action: {
					name: twAction,
					url: actionUrl
				}
			}
		}
		MetadataLoader.logger(eventObj);
	}
};

this.setItemClick = function(evt)
{
	evt.isItemClick = true;
};

this.isItemClick = function(evt)
{
	return evt.isItemClick;
};

this.replyClick = function()
{
	logTweetAction('reply', this);
};

this.retweetClick = function(event)
{
	logTweetAction('retweet', this);
	event.isItemClick = true;
};

this.favoriteClick = function(event)
{
	logTweetAction('favorite', this);
	event.isItemClick = true;
};

var composeTweetBtnClick = function(event)
{
	logTweetAction('tweet', this);
};

this.addedGlobalNewTweetHandler = false;

this.addGlobalNewTweetHandler = function()
{
	setTimeout(function() {
		xpath = newTweetXPath;
		xpathResult = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
		for (var i = 0; i < xpathResult.snapshotLength; i++)
		{
			var item = xpathResult.snapshotItem(i);
			
			var val = item.getAttribute("setProcessed");
			if (!val || val == "false")
			{
				item.addEventListener('click', composeTweetBtnClick);
				item.setAttribute("setProcessed", "true");
			}
		}
	}, 1000);
}

this.addOtherEventHandlers = function()
{
	var viewedTweets = [];
	
	var xpath = this.replyXPath;
	var xpathResult = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	for (var i = 0; i < xpathResult.snapshotLength; i++)
	{
		var item = xpathResult.snapshotItem(i);
		if (!this.isProcessed(item))
		{
			item.addEventListener('click', this.replyClick);
			this.setProcessed(item);
			
			var aNode = item.parentNode.parentNode.parentNode.parentNode.parentNode;
			var aNodeTweetId = aNode.getAttribute("data-tweet-id");
			if (aNodeTweetId)
			{
				viewedTweets.push(aNodeTweetId);
			}
			else
			{
				aNode = item.parentNode.parentNode.parentNode.parentNode.parentNode.getElementsByClassName('time')[0];
				if (aNode)
				{
					var aNode2 = aNode.getElementsByTagName('a')[0];
					if (aNode2)
						viewedTweets.push(aNode2.getAttribute("href"));
				}
			}
		}
	}
	if (MetadataLoader.logger && viewedTweets.length > 0)
	{
		eventObj = {
			tweet_action: {
				name: "view_tweets",
				tweets: viewedTweets
			}
		}
		MetadataLoader.logger(eventObj);
	}
	
	xpath = this.retweetXPath;
	xpathResult = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	for (var i = 0; i < xpathResult.snapshotLength; i++)
	{
		var item = xpathResult.snapshotItem(i);
		if (!this.isProcessed(item))
		{
			item.addEventListener('click', this.retweetClick);
			this.setProcessed(item);
		}		
	}
	
	xpath = this.favoriteXPath;
	xpathResult = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	for (var i = 0; i < xpathResult.snapshotLength; i++)
	{
		var item = xpathResult.snapshotItem(i);
		if (!this.isProcessed(item))
		{
			item.addEventListener('click', this.favoriteClick);
			this.setProcessed(item);
		}
	}
	
	xpath = newTweetXPath;
	xpathResult = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	for (var i = 0; i < xpathResult.snapshotLength; i++)
	{
		var item = xpathResult.snapshotItem(i);
		if (!this.isProcessed(item))
		{
			item.addEventListener('click', composeTweetBtnClick);
			this.setProcessed(item);
		}
	}
	
	if (!this.addedGlobalNewTweetHandler)
	{
		xpath = this.globalNewTweetXPath;
		xpathResult = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
		
		var item = xpathResult.singleNodeValue;
		if (item)
			item.addEventListener('click', this.addGlobalNewTweetHandler);
		
		this.addedGlobalNewTweetHandler = true;
	}
};

this.ajaxItem = null;

this.addAJAXContentListener = function(callback)
{
	var ajaxContentXPath = this.ajaxContentXPath;
	var ajaxContentXPathResult = 
		document.evaluate(ajaxContentXPath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	
	for (var i = 0; i < ajaxContentXPathResult.snapshotLength; i++)
	{
		if (this.ajaxItem != ajaxContentXPathResult.snapshotItem(i))
		{
			this.ajaxItem = ajaxContentXPathResult.snapshotItem(i);
			
			// as parent keeps changing but is actually a larger clickable area
			this.ajaxItem.parentNode.addEventListener('click', callback);
		}
	}
};

this.getExternalURLsXPath = function() {
	return this.externalURLsXPath;
};

this.checkAndSetExternalUrlTarget = function(elt) {
	if (elt.getAttribute("target") != "_blank")
		elt.setAttribute("target", "_blank");
};

this.validateUserInfo = function(prevUsername)
{
	var usernameNode = document.evaluate(this.usernameXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
	var usernameResult = usernameNode.getAttribute("href");
	if (usernameResult && usernameResult.length > 1)
		usernameResult = usernameResult.substr(1);
	
	if (usernameResult && usernameResult != prevUsername)
	{
		chrome.extension.sendRequest({userInfo: usernameResult}, function(response) {
			if (response && response.doc) {
				var twUser = response.doc;
				twUser.tweets = {};
				
				if (MetadataLoader.logger)
				{
					if (!prevUsername)
					{
						var eventObj = {
							user_info: {
								username: usernameResult,
								info: twUser
							}
						}
						MetadataLoader.logger(eventObj);
					}
					else
					{
						var eventObj = {
							change_user_info: {
								prev_username: prevUsername,
								new_username: usernameResult,
								info: twUser
							}
						}
						MetadataLoader.logger(eventObj);
					}
				}
			}
		});
	}
};

this.logScrolledTweetIds = function(prevYOffset, newYOffset)
{
//	var end1, end2; // end1 < end2
//	if (prevYOffset < newYOffset) //scroll down
//	{
//		end2 = newYOffset + window.innerHeight;
//		end1 = end2 - (newYOffset - prevYOffset);	
//	}
//	else // scroll up
//	{
//		end1 = newYOffset;
//		end2 = end1 + (prevYOffset - newYOffset);
//	}
//	var twitterElts;
//	if (document.URL.indexOf("https://twitter.com/search") == 0 || document.URL.indexOf("https://twitter.com/search"))
//	{
//		twitterElts = document.getElementsByClassName("content");
//		for (var i = 0; twitterElts.length; i++)
//		{
//			if (twitterElts[i] && twitterElts[i].parentElement)
//			{
//				var elt = twitterElts[i].parentElement;
//		
//				var rect = elt.getBoundingClientRect();
//				if (rect.top)
//				{
//					
//				}
//			}
//		}
//	}
//	else
//	{
//		twitterElts = document.getElementsByClassName("StreamItem js-stream-item");
//		for (var i = 0; twitterElts.length; i++)
//		{
//			var elt = twitterElts[i];
//			var rect = elt.getBoundingClientRect();
//			if (rect.top)
//			{
//				
//			}
//		}
//	}
//	
//	var twbElements = document.getElementsByClassName("tweetSemanticsRow");
//	for (var i = 0; twbElements.length; i++)
//	{
//		var elt = twbElements[i];
//		var rect = elt.getBoundingClientRect();
//		if (rect.top)
//		{
//			
//		}
//	}
	
};

}

function getICEInstance()
{
	return new twitterICE();
}