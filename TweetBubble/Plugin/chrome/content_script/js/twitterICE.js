
function twitterICE() {

this.expandableItemsXPath = "//ol[@id='stream-items-id']/li//p[@class='js-tweet-text tweet-text']/a/b";

this.expandableItemsXPath2 = ".//a[@class='twitter-atreply pretty-link']/b | .//a[@class='twitter-hashtag pretty-link js-nav']/b";

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

this.setProcessed = function(elt) {
	// still keep pretty-link part for the styling purpose 
	elt.parentNode.setAttribute("class", "pretty-link");
};

this.setMetadataBoolean = function(elt, isMetadata) {
	elt.parentNode.setAttribute("isMetadata", isMetadata);
}

this.setIcon = function(elt, icon) {
	elt.appendChild(icon);
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

}

function getICEInstance()
{
	return new twitterICE();
}