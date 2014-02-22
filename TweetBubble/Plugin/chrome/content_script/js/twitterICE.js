
function twitterICE() {

this.expandableItemsXPath = "//ol[@id='stream-items-id']/li//p[@class='js-tweet-text tweet-text']/a/b";

//@usernames, #hashtags, tweet tweeter, @connect tweeter
this.expandableItemsXPath2 = ".//a[@class='twitter-atreply pretty-link']/b | " + 
							 ".//a[@class='twitter-hashtag pretty-link js-nav']/b | " + 
							 ".//a[@class='account-group js-account-group js-action-profile js-user-profile-link js-nav']/strong | " + 
							 ".//a[@class='pretty-link js-user-profile-link js-action-profile-name']/strong";

this.tweetsXPath = "//ol[@id='stream-items-id']/li/div";

this.defaultConditionXPath2 = ".//a[@class='twitter-atreply pretty-link']/b";

this.replyXPath = "//li[@class='action-reply-container']/a";

this.retweetXPath = "//li[@class='action-rt-container js-toggle-state js-toggle-rt']/a";

this.favoriteXPath = "//li[@class='action-fav-container js-toggle-state js-toggle-fav']/a";

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

this.addContainerClickEventListener = function(container, listener) {
	container.addEventListener('click', listener);
};

this.setProcessed = function(elt) {
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

this.getItemClickedEventObj = function(item) 
{
	var url_p = this.getUrlPrefix() + this.getHrefAttribute(item);
	
	var eventObj = {
		click_username: {
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

this.getDefaultConditionXPath = function(isMetadata) {
	return this.defaultConditionXPath2;
};

this.setDefaultConditionProcessed = function(elt) {
	elt.parentNode.setAttribute("setProcessed", "true");
};

this.checkDefaultConditionProcessed = function(elt) {
	 var val = elt.parentNode.getAttribute("setProcessed");
	 if (val && val == "true")
		 return true;
};

this.getHrefAttribute = function(elt)
{
	return elt.parentNode.getAttribute("href");
};

var logTweetAction = function(twAction, item) {
	if (MetadataRenderer.LoggingFunction)
	{
		//a.li.ul.div
		var aNode = item.parentNode.parentNode.parentNode.getElementsByTagName('a')[0];
		
		var eventObj = {
			tweet_action: {
				name: twAction,
				url: aNode.getAttribute("href")
			}
		}
		MetadataRenderer.LoggingFunction(eventObj);
	}
};

this.replyClick = function()
{
	logTweetAction('reply', this);
};

this.retweetClick = function()
{
	logTweetAction('retweet', this);
};

this.favoriteClick = function()
{
	logTweetAction('favorite', this);
};

this.addOtherEventHandlers = function()
{
	var xpath = this.replyXPath;
	var xpathResult = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	for (var i = 0; i < xpathResult.snapshotLength; i++)
	{
		var item = xpathResult.snapshotItem(i);
		item.addEventListener('click', this.replyClick);		
	}
	
	xpath = this.retweetXPath;
	xpathResult = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	for (var i = 0; i < xpathResult.snapshotLength; i++)
	{
		var item = xpathResult.snapshotItem(i);
		item.addEventListener('click', this.retweetClick);		
	}
	
	xpath = this.favoriteXPath;
	xpathResult = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	for (var i = 0; i < xpathResult.snapshotLength; i++)
	{
		var item = xpathResult.snapshotItem(i);
		item.addEventListener('click', this.favoriteClick);		
	}
};

}

function getICEInstance()
{
	return new twitterICE();
}