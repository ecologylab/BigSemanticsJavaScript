var DEFAULT_MICE_STYLE = {
	styles : {
	    metadataRendering : "metadataRendering",
	    metadataContainer : "metadataContainer",
	    metadataTableDiv : "metadataTableDiv",
	    rootMetadataTableDiv : "rootMetadataTableDiv",
	    metadataRow : "metadataRow",
	    metadataTable : "metadataTable",
	    metadata_h1 : "metadata_h1",
	    fieldLabel : "fieldLabel",
	    fieldLabelImage : "fieldLabelImage",
	    fieldValueGoogleQuery : "fieldValue google_query",
	    fieldValueGoogleLink : "fieldValue google_link",
	    fieldValue : "fieldValue",
	    favicon : "favicon",
	    faviconICE : "faviconICE",
	    labelCol : "labelCol",
	    labelColShowDiv : "labelCol showDiv",
	    valueCol : "valueCol",
	    valueColShowDiv : "valueCol showDiv",
	    fieldLabelContainer : "fieldLabelContainer",
	    fieldLabelContainerOpened : "fieldLabelContainerOpened",
	    fieldLabelContainerOpenedUnhighlight : "fieldLabelContainerOpened unhighlight",
	    fieldLabelContainerUnhighlight : "fieldLabelContainer unhighlight",
	    fieldValueContainer : "fieldValueContainer",
	    fieldChildContainer : "fieldChildContainer",
	    fieldCompositeContainer : "fieldCompositeContainer",
	    expandButton : "expandButton",
	    expandButtonX : "expandButton X",
	    collapseButton : "collapseButton",
	    expandSymbol : "expandSymbol",
	    collapseSymbol : "collapseSymbol",
	    loadingRow : "loadingRow",
	    citeULikeButton : "citeULikeButton",
	    nestedPad : "nestedPad",
	    lineCanvas : "lineCanvas",
	    bigLineCanvas : "bigLineCanvas",
	    hidden : "hidden",
	    moreButton : "moreButton",
	    tabLabel : "tabLabel",
	    fieldValueImage : "fieldValueImage"
	}	
};

var TWITTER_MICE_STYLE = {
	types : ["twitter_microblog", "twitter_search_results", "twitter_status"],
	styles : {
	    metadataRendering : "metadataRendering",
	    metadataContainer : "twMetadataContainer",
	    metadataTableDiv : "twMetadataTableDiv",
	    rootMetadataTableDiv : "twRootMetadataTableDiv",
	    metadataRow : "twMetadataRow",
	    metadataTable : "twMetadataTable",
	    metadata_h1 : "twMetadata_h1",
	    fieldLabel : "twFieldLabel",
	    fieldLabelImage : "twFieldLabelImage",
	    fieldValue : "twFieldValue",
	    favicon : "favicon",
	    faviconICE : "twFaviconICE",
	    labelCol : "twLabelCol",
	    labelColShowDiv : "twLabelCol showDiv",
	    valueCol : "twValueCol",
	    valueColShowDiv : "twValueCol showDiv",
	    fieldLabelContainer : "twFieldLabelContainer",
	    fieldLabelContainerOpened : "twFieldLabelContainerOpened",
	    fieldLabelContainerOpenedUnhighlight : "twFieldLabelContainerOpened unhighlight",
	    fieldLabelContainerUnhighlight : "twFieldLabelContainer unhighlight",
	    fieldValueContainer : "twFieldValueContainer",
	    fieldChildContainer : "twFieldChildContainer",
	    fieldCompositeContainer : "twFieldCompositeContainer",
	    expandButton : "twExpandButton",
	    expandButtonX : "twExpandButton X",
	    collapseButton : "twCollapseButton",
	    expandSymbol : "twExpandSymbol",
	    collapseSymbol : "twCollapseSymbol",
	    citeULikeButton : "citeULikeButton",
	    loadingRow : "twLoadingRow",
	    nestedPad : "twNestedPad",
	    lineCanvas : "twLineCanvas",
	    bigLineCanvas : "twBigLineCanvas",
	    hidden : "twHidden",
	    moreButton : "twMoreButton",
	    fieldValueSub : "twFieldValue sub",
	    fieldCompositeContainerHighlightTweet : "twFieldCompositeContainer highlightTweet",
	    tweetSemantics : "tweetSemantics",
	    tweetSemanticsRow : "tweetSemanticsRow",
	    tweetSemanticsDiv : "tweetSemanticsDiv",
	    fieldValueImage : "twFieldValueImage"
	}
};

var miceStyles = [TWITTER_MICE_STYLE];

var InterfaceStyle = {};

InterfaceStyle.getMiceStyleDictionary = function(type)
{
	if (application_name == "tweetbubble" || type == "twitter")
		return TWITTER_MICE_STYLE.styles;
	
	for (var i = 0; i < miceStyles.length; i++)
	{
		var types = miceStyles[i].types;
		for (var j = 0; j < types.length; j++)
		{
			if (type == types[j])
				return miceStyles[i].styles;
		}
	}
	return DEFAULT_MICE_STYLE.styles; 
};