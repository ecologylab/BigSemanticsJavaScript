
function twitterICE() {

this.expandableItemsXPath = "//ol[@id='stream-items-id']/li//p[@class='js-tweet-text tweet-text']/a/b";

//@usernames, #hashtags, tweet tweeter, @connect tweeter
this.expandableItemsXPath2 = ".//a[@class='twitter-atreply pretty-link']/b | " + 
							 ".//a[@class='twitter-hashtag pretty-link js-nav']/b | " + 
							 ".//a[@class='account-group js-account-group js-action-profile js-user-profile-link js-nav']/strong | " + 
							 ".//a[@class='pretty-link js-user-profile-link js-action-profile-name']/strong";

this.defaultConditionXPath2 = ".//a[@class='twitter-atreply pretty-link']/b";

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

this.removeHrefAndSetAsUrl = function(elt) {
	var href = elt.parentNode.getAttribute("href");
	elt.parentNode.removeAttribute("href");
	// this attribute name shouldn't conflict with the existing ones
	elt.parentNode.setAttribute("url", href);
};

this.getExpandableItemUrl = function(item) {
	// TODO: method for retweets
	// get <a> hyperlink parent tag; in accordance with above XPath
	// var parent = item.parentNode;
	return item.parentNode.getAttribute("url");
};

this.addClickEventListener = function(item, listener) {
	item.parentNode.addEventListener('click', listener);
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

this.setExpanded = function(elt) {
	elt.parentNode.setAttribute("isExpanded", "true");
};

this.isExpanded = function(elt) {
	return elt.parentNode.getAttribute("isExpanded");
};

this.setMetadataBoolean = function(elt, isMetadata) {
	elt.parentNode.setAttribute("isMetadata", isMetadata);
};

this.setIcon = function(elt, icon) {
	icon.setAttribute("class", "expandCollapseIcon");
	elt.appendChild(icon);
};

//expanded item might not be same as element for which click listener was added
this.getExpandedItem = function(elt) {
	var icon = elt.getElementsByClassName("expandCollapseIcon")[0];
	return icon.parentNode;
};

this.getIcon = function(elt) {
	// or, set class in above function, and check for child with class name here
	return elt.lastChild;
};

this.getContainer = function(elt) {
	
	var parent = elt.parentNode;
	while (parent.nodeName.toLowerCase() !== "div")
		parent = parent.parentNode;
	
	// append to last row, if metadata, to keep tweet content together 
	if (elt.parentNode.getAttribute("isMetadata") == "true")
	{
		// metadataTableDiv
		while (parent.className != "metadataTableDiv")
			parent = parent.parentNode;
		
		// row.valueCol.fieldValueContainer
		parent = parent.lastChild.lastChild.lastChild;
	}
	
	return parent;
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

}

function getICEInstance()
{
	return new twitterICE();
}