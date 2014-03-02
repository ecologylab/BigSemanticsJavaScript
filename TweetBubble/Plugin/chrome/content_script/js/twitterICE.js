
function twitterICE() {

this.expandableItemsXPath = "//ol[@id='stream-items-id']/li//p[@class='js-tweet-text tweet-text']/a/b";

//@usernames, #hashtags, tweet tweeter, @connect tweeter
this.expandableItemsXPath2 = ".//a[@class='twitter-atreply pretty-link']/b | " + 
							 ".//a[@class='twitter-hashtag pretty-link js-nav']/b | " + 
							 ".//a[@class='account-group js-account-group js-action-profile js-user-profile-link js-nav']/strong | " + 
							 ".//a[@class='pretty-link js-user-profile-link js-action-profile-name']/strong";

this.tweetsXPath = "//ol[@id='stream-items-id']/li/div";

this.externalURLsXPath = ".//a[@class='twitter-timeline-link']";

this.replyXPath = "//li[@class='action-reply-container']/a";

this.retweetXPath = "//li[@class='action-rt-container js-toggle-state js-toggle-rt']/a";

this.favoriteXPath = "//li[@class='action-fav-container js-toggle-state js-toggle-fav']/a";

this.ajaxContentXPath = "//div[@class='new-tweets-bar js-new-tweets-bar']";

this.globalNewTweetXPath = "//button[@id='global-new-tweet-button']";
var globalNewTweetTextXPath = "//div[@id='tweet-box-global']";

var newTweetXPath = "//div[@class='tweet-button']/button[@class='btn primary-btn tweet-action tweet-btn js-tweet-btn']";
var newTweetTextXPath = "//div[@id='tweet-box-mini-home-profile']";

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
	
	// get parent <a> tag; in accordance with above XPath
	var href = elt.parentNode.getAttribute("href");
	elt.parentNode.removeAttribute("href");
	
	// this attribute name shouldn't conflict with the existing ones
	elt.parentNode.setAttribute("url", href);
};

this.getExpandableItemUrl = function(item) {
	// TODO: method for retweets
	return item.parentNode.getAttribute("url");
};

this.addClickEventListener = function(item, listener) {
	item.parentNode.addEventListener('click', listener);
};

this.setExpandableItemProcessed = function(elt) {
	// still keep pretty-link part for the styling purpose 
	var eltClass = elt.parentNode.getAttribute("class");
	if (eltClass.indexOf("account-group") == 0)
	{
		elt.parentNode.setAttribute("class", "account-group js-account-group js-action-profile js-nav");
		elt.setAttribute("class", "fullname"); //initial is 'fullname js-action-profile-name'
	}
	else 
		elt.parentNode.setAttribute("class", "pretty-link");
};

// set to parent to keep similar as most other attributes
this.setCached = function(elt) {
	elt.parentNode.setAttribute("isExpanded", "true");
};

this.isCached = function(elt) {
	return elt.parentNode.getAttribute("isExpanded");
};

this.setMetadataBoolean = function(elt, isMetadata) {
	elt.parentNode.setAttribute("isMetadata", isMetadata);
};

this.setIcon = function(elt, icon) {
	icon.setAttribute("class", "expandCollapseIcon");
	elt.appendChild(icon);
};

this.getIcon = function(elt) {
	// or, set class in above function, and check for child with class name here
	return elt.lastChild;
};

//expanded item might not be same as element for which click listener was added
this.getExpandedItem = function(elt) {
	var icon = elt.getElementsByClassName("expandCollapseIcon")[0];
	return icon.parentNode;
};

this.getContainer = function(elt) {
	
	var parent = elt.parentNode;
	while (parent.nodeName.toLowerCase() !== "div")
		parent = parent.parentNode;
	
	// append to last row, if metadata, to keep tweet content together 
	if (elt.parentNode.getAttribute("isMetadata") == "true")
	{
		while (parent.className != "metadataTableDiv")
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
	var url_p = this.getUrlPrefix() + item.getAttribute("href");
	
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
	var eventObj = {
		click_externalUrl: {
			url: externalURL.getAttribute("href")
		}
	}
	return eventObj;
};

this.getDefaultConditionXPath = function(isMetadata) {
	return this.expandableItemsXPath2;
};

this.setDefaultConditionItemProcessed = function(elt) {
	elt.parentNode.setAttribute("setProcessed", "true");
};

this.checkDefaultConditionItemProcessed = function(elt) {
	 var val = elt.parentNode.getAttribute("setProcessed");
	 if (val && val == "true")
		 return true;
	 return false;
};

this.getHrefAttribute = function(elt)
{
	return elt.parentNode.getAttribute("href");
};

var logTweetAction = function(twAction, item) {
	if (MetadataRenderer.LoggingFunction)
	{
		var eventObj = "";
		if (twAction == "tweet")
		{
			var xpath = item.tweetTextXPath;
			var xpathResult = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);			
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
			var aNode = item.parentNode.parentNode.parentNode.getElementsByTagName('a')[0];
			
			eventObj = {
				tweet_action: {
					name: twAction,
					url: aNode.getAttribute("href")
				}
			}
		}
		MetadataRenderer.LoggingFunction(eventObj);
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

var composeTweetGlobalBtnClick = function(event)
{
	this.tweetTextXPath = globalNewTweetTextXPath;
	logTweetAction('tweet', this);
};

var composeTweetBtnClick = function(event)
{
	this.tweetTextXPath = newTweetXPath;
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
				item.addEventListener('click', composeTweetGlobalBtnClick);
				item.setAttribute("setProcessed", "true");
			}
		}
	}, 1000);
}

this.addOtherEventHandlers = function()
{
	var xpath = this.replyXPath;
	var xpathResult = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	for (var i = 0; i < xpathResult.snapshotLength; i++)
	{
		var item = xpathResult.snapshotItem(i);
		if (!this.isProcessed(item))
		{
			item.addEventListener('click', this.replyClick);
			this.setProcessed(item);
		}
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

}

function getICEInstance()
{
	return new twitterICE();
}