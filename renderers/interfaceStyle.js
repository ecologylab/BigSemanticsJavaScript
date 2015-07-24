/*
 * A mapping of metadata types to their css class names
 * 
 */

var DEFAULT_MICE_STYLE = {
	styles : {
	    metadataRendering : "ecologylab-metadataRendering",
	    metadataContainer : "ecologylab-metadataContainer",
	    metadataTableDiv : "ecologylab-metadataTableDiv",
	    rootMetadataTableDiv : "ecologylab-rootMetadataTableDiv",
	    metadataRow : "ecologylab-metadataRow",
	    metadataTable : "ecologylab-metadataTable",
	    metadata_h1 : "ecologylab-metadata_h1",
	    fieldLabel : "ecologylab-fieldLabel",
	    fieldLabelImage : "ecologylab-fieldLabelImage",
	    fieldValueGoogleQuery : "ecologylab-fieldValue google_query",
	    fieldValueGoogleLink : "ecologylab-fieldValue google_link",
	    fieldValue : "ecologylab-fieldValue",
	    favicon : "ecologylab-favicon",
	    faviconICE : "ecologylab-faviconICE",
	    labelCol : "ecologylab-labelCol",
	    labelColShowDiv : "ecologylab-labelCol showDiv",
	    valueCol : "ecologylab-valueCol",
	    valueColShowDiv : "ecologylab-valueCol showDiv",
	    fieldLabelContainer : "ecologylab-fieldLabelContainer",
	    fieldLabelContainerOpened : "ecologylab-fieldLabelContainerOpened",
	    fieldLabelContainerOpenedUnhighlight : "ecologylab-fieldLabelContainerOpened unhighlight",
	    fieldLabelContainerUnhighlight : "ecologylab-fieldLabelContainer unhighlight",
	    fieldValueContainer : "ecologylab-fieldValueContainer",
	    fieldChildContainer : "ecologylab-fieldChildContainer",
	    fieldCompositeContainer : "ecologylab-fieldCompositeContainer",
	    expandButton : "ecologylab-expandButton",
	    expandButtonX : "ecologylab-expandButton X",
	    collapseButton : "ecologylab-collapseButton",
	    expandSymbol : "ecologylab-expandSymbol",
	    collapseSymbol : "ecologylab-collapseSymbol",
	    loadingRow : "ecologylab-loadingRow",
	    citeULikeButton : "ecologylab-citeULikeButton",
	    nestedPad : "ecologylab-nestedPad",
	    lineCanvas : "ecologylab-lineCanvas",
	    bigLineCanvas : "ecologylab-bigLineCanvas",
	    hidden : "ecologylab-hidden",
	    moreButton : "ecologylab-moreButton",
	    tabLabel : "ecologylab-tabLabel",
	    fieldValueImage : "ecologylab-fieldValueImage"
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
  if (typeof application_name != 'undefined') {
    if (application_name == "tweetbubble" || type == "twitter")
      return TWITTER_MICE_STYLE.styles;
  }
	
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
