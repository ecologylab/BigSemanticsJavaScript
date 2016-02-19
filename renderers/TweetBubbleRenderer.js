
/**
 * custom rendering for Twitter Metadata expansion
 */
var isExtension = (typeof chrome !== "undefined" && typeof chrome.extension !== "undefined");
var TwitterRenderer = {};

var metadataProcessor = null;
var requestDocumentDownload = null;

//var colors = ['#FFFFCC', '#BBE2FA', '#FAE3C8', '#D8CAE8', '#FFD0C9', '#D4DEFF', '#D5EEF2']; // use hex values
TwitterRenderer.colors = ['rgb(255, 255, 204)', 'rgb(187, 226, 250)', 'rgb(250, 227, 200)', 'rgb(216, 202, 232)',
              'rgb(255, 208, 201)', 'rgb(212, 222, 255)', 'rgb(213, 238, 242)']; // use rgb for direct comparison
TwitterRenderer.lastColorIndex = Math.floor(Math.random() * TwitterRenderer.colors.length);

//var isExtension = (typeof chrome !== "undefined" && typeof chrome.extension !== "undefined");
TwitterRenderer.imgDir = "";
if (application_name == "mdc")
	TwitterRenderer.imgDir = "../renderers/images/tweetBubble/";
else if (application_name == "ideamache")
	TwitterRenderer.imgDir = "/static/mache/code/BigSemanticsJS/renderers/images/tweetBubble/";
else if (application_name == "tweetbubble")//tweetbubble
	TwitterRenderer.imgDir = chrome.extension.getURL("content_script/img/");
else if (application_name == "dod")
	TwitterRenderer.imgDir = "../../BigSemanticsJavascript/renderers/images/tweetBubble/";

TwitterRenderer.replyIconPath1 = isExtension ? chrome.extension.getURL("content_script/img/reply_221.png") : TwitterRenderer.imgDir + "reply_221.png";
TwitterRenderer.retweetIconPath1 = isExtension ? chrome.extension.getURL("content_script/img/retweet_221.png") : TwitterRenderer.imgDir + "retweet_221.png";
TwitterRenderer.favoriteIconPath1 = isExtension ? chrome.extension.getURL("content_script/img/favorite_221.png") : TwitterRenderer.imgDir + "favorite_221.png";
TwitterRenderer.replyIconPath2 = isExtension ? chrome.extension.getURL("content_script/img/reply_153.png") : TwitterRenderer.imgDir + "reply_153.png";
TwitterRenderer.retweetIconPath2 = isExtension ? chrome.extension.getURL("content_script/img/retweet_153.png") : TwitterRenderer.imgDir + "retweet_153.png";
TwitterRenderer.favoriteIconPath2 = isExtension ? chrome.extension.getURL("content_script/img/favorite_153.png") : TwitterRenderer.imgDir + "favorite_153.png";
TwitterRenderer.retweetIconPath3 = isExtension? chrome.extension.getURL("content_script/img/retweet_on.png") :	TwitterRenderer.imgDir + "retweet_on.png";
TwitterRenderer.favoriteIconPath3 = isExtension? chrome.extension.getURL("content_script/img/favorite_on.png") : TwitterRenderer.imgDir + "favorite_on.png";
TwitterRenderer.FIRST_LEVEL_FIELDS = 20;
TwitterRenderer.FIELDS_TO_EXPAND = 10;

/**
 * Create the metadataRendering, add it to the HTML container, and complete the RenderingTask
 * @param task, RenderingTask to complete 
 */
TwitterRenderer.render = function (task) {
    var metadataFields = task.fields;
    var styleInfo = task.style;

    var bRenderedInitial = false;
    if (task.visual) {
        bRenderedInitial = true;
        // remove the initial table containing title and loading rows
        while (task.visual.hasChildNodes())
            task.visual.removeChild(task.visual.lastChild);
    }
    else {
        // Create the interior HTML container
        task.visual = document.createElement('div');
        task.visual.className = styleInfo.styles.metadataContainer;
    }
    task.visual.setAttribute('mdType', metadataFields[0].parentMDType);

    // Build the HTML table for the metadata
    MetadataLoader.currentDocumentLocation = task.url;

    var metadataTable = TwitterRenderer.buildMetadataTable(task.table, false, task.isRoot, metadataFields, TwitterRenderer.FIRST_LEVEL_FIELDS, styleInfo, task.bgColorObj, true);
    //TwitterRenderer.buildMetadataDisplay(task.isRoot, task.mmd, task.metadata, task.url, bgColor)

    if (metadataTable) {
        // Clear out the container so that it will only contain the new metadata table
        if (!task.isRoot) {
            while (task.container.hasChildNodes())
                task.container.removeChild(task.container.lastChild);
        }

        // Add the HTML5 canvas for the drawing of connection lines
        var canvas = document.createElement("canvas");
        canvas.className = styleInfo.styles.lineCanvas;

        // Add the table and canvas to the interior container
        task.visual.appendChild(metadataTable);
        task.visual.appendChild(canvas);

        // Add the interior container to the root container
        if (!bRenderedInitial)
            task.container.appendChild(task.visual);

        if (metadataProcessor)
            metadataProcessor(task.visual);

        if (MetadataLoader.logger) {
            var eventObj = {
                show_metadata: {
                    primary_doc: task.url
                }
            }
            MetadataLoader.logger(eventObj);
        }

        // Create and add a new DocumentContainer to the list
        RendererBase.documentMap.push(new TwitterDocumentContainer(task.url, task.additionalUrls, task.container, true, task.expandedItem, task.visual));

        // Remove any highlighting of documents as the addition of the new table will cause the connection-lines to be out of place
        MICE.unhighlightDocuments(null, styleInfo);

    }

        // If there isn't a metadata table to display then keep the old visual and remove the loading indicator
    else
        MICE.clearLoadingRows(task.container, styleInfo);

    // Remove the RenderingTask from the queue
    //MetadataLoader.queue.splice(MetadataLoader.queue.indexOf(task), 1);
    processPage();
}

/**
 * Retrieves the target metadata and meta-metadata, constructs the metadata table, and appends it to the container.
 * @param container, the HTML object which the final metadata rendering will be appened into
 * @param url, url of the target document
 * @param isRoot, true if this is the root metadata for the rendering,
 * 		needed because styling is slightly different for the root metadata rendering
 */
TwitterRenderer.addMetadataDisplay = function(container, url, clipping, renderer, options){
	var isRoot = options.isRoot;
	var expandedItem = options.expandedItem;
	
	var visual = null;
    var bgColor = null;
    var bgColorObj = null;
    if ((url.indexOf("twitter.com") != -1 || application_name == "tweetbubble") ||
			(expandedItem && ((expandedItem.mmdType && expandedItem.mmdType.indexOf("twitter") != -1)
					|| (expandedItem.className && expandedItem.className.indexOf("pretty-link twitter-timeline-link") != -1)))) {
        bgColor = TwitterRenderer.getNextColor(container);
        bgColorObj = { color: bgColor, bFirstField: true };

        if (expandedItem)
            expandedItem.mmdType = "twitter";

        if (isRoot)
            visual = TwitterRenderer.renderInitial(container, url, isRoot, expandedItem, bgColorObj);
    }
	
	if(options == null){
		options = {};
	}
  // If we already have metadata and mmd provided, we skip BigSemantics and
  // render the metadata immediately
  if (clipping != null) {
    if (clipping.metadata != null && clipping.mmd != null) {
      //var task = new RenderingTask(url, true, null, null, container, null, renderer, clipping.mmd, clipping.metadata)
    	  var task = new TweetBubbleRenderingTask(url, isRoot, null, null, container, null, renderer, 
    			  						clipping.mmd, clipping.metadata, expandedItem, visual, bgColorObj);	
      task.handler(task);
      if(options.callback){
        options.callback({mmd: clipping.mmd, metadata: clipping.metadata});
      }
      return;
    }
  }

  //Otherwise, we prepare to call BigSemantics
  //var task = new RenderingTask(url, true, clipping, null, container, null, renderer);
  var task = new TweetBubbleRenderingTask(url, isRoot, clipping, null, container, null, renderer, 
									null, null, expandedItem, visual, bgColorObj);

  if (clipping != null) {
    if (!clipping.metadata && clipping.rawMetadata) {
      clipping.rawMetadata = simpl.deserialize(clipping.rawMetadata);
      clipping.rawMetadata.deserialized = true;
      clipping.metadata = BSUtils.unwrap(clipping.rawMetadata);
      
    }
  }

  if (clipping != null && clipping.metadata) {
  clipping.metadata = BSUtils.unwrap(clipping.metadata);

    bsService.onReady(function() {
      bsService.loadMmd(clipping.metadata.mm_name, options, function(err, mmd){
        if (err) { console.error(err); return; }
        task.mmd = mmd;
        task.mmd = simpl.graphExpand(task.mmd);
        task.metadata = clipping.metadata;
        task.handler(task);
        if(options.callback){
        	options.callback(md_and_mmd);
        }
      });
    });
  } else {
    bsService.onReady(function(){
      bsService.loadMetadata(url, options, function(err, md_and_mmd){
        if (err) { console.error(err); return; }
        
        if(bsService.constructor.name == "BSAutoSwitch"){
        	  console.log("loadMetadata result from " + bsService.bsImpl.constructor.name + ": ", md_and_mmd);

        }else{
      	  console.log("loadMetadata result from " + bsService.constructor.name + ": ", md_and_mmd);

        }
        	
        
        task.mmd = md_and_mmd.mmd;
        task.mmd = simpl.graphExpand(task.mmd);
        task.metadata = md_and_mmd.metadata;
        task.handler(task);
        if(options.callback){
        	options.callback(md_and_mmd);
        }
        
        
      })
    });
    // MetadataLoader.getMetadata(url, "MetadataLoader.setMetadata", reloadMD);
  }
  
}

/*TwitterRenderer.addMetadataDisplay = function (container, url, isRoot, clipping, requestMD, reloadMD, expandedItem) {
    var visual = null;
    var bgColor = null;
    var bgColorObj = null;
    if ((url.indexOf("twitter.com") != -1 || application_name == "tweetbubble") ||
			(expandedItem && ((expandedItem.mmdType && expandedItem.mmdType.indexOf("twitter") != -1)
							 || (expandedItem.className && expandedItem.className.indexOf("pretty-link twitter-timeline-link") != -1)))) {
        bgColor = TwitterRenderer.getNextColor(container);
        bgColorObj = { color: bgColor, bFirstField: true };

        if (expandedItem)
            expandedItem.mmdType = "twitter";

        if (isRoot)
            visual = TwitterRenderer.renderInitial(container, url, isRoot, expandedItem, bgColorObj);
    }

    // Add the rendering task to the queue
    var task = new TweetBubbleRenderingTask(url, container, isRoot, clipping, TwitterRenderer.render, expandedItem, visual, bgColorObj);
    MetadataLoader.queue.push(task);

    if (clipping != null && clipping.rawMetadata != null) {
        clipping.rawMetadata.deserialized = true;
        MetadataLoader.setMetadata(clipping.rawMetadata);
    }
    else {
        var requestMetadata = (typeof requestMD === "undefined") || requestMD == true;

        // Fetch the metadata from the service
        if (!isExtension && requestMetadata)
            MetadataLoader.getMetadata(url, "MetadataLoader.setMetadata", reloadMD);
    }
}*/

TwitterRenderer.renderInitial = function (container, url, isRoot, expandedItem, bgColorObj) {
    var miceStyles = InterfaceStyle.getMiceStyleDictionary("twitter");
    var styleInfo = { styles: miceStyles, type: "twitter" };

    // Create the interior HTML container
    var visual = document.createElement('div');
    visual.className = styleInfo.styles.metadataContainer;

    // render initial placeholder w only title string and loading row
    var table = TwitterRenderer.buildInitialTable(container, url, expandedItem, isRoot, styleInfo, bgColorObj);
    if (table) {
        // Add the HTML5 canvas for the drawing of connection lines
        var canvas = document.createElement("canvas");
        canvas.className = styleInfo.styles.lineCanvas;

        // Add the table and canvas to the interior container
        visual.appendChild(table);
        visual.appendChild(canvas);

        // Add the interior container to the root contianer
        container.appendChild(visual);

        if (expandedItem && bgColorObj.color)
            expandedItem.style.background = bgColorObj.color;
    }

    return visual;
}

TwitterRenderer.buildInitialTable = function (container, url, expandedItem, isRoot, styleInfo, bgColorObj) {
    var metadataFields = [];
    var table = TwitterRenderer.buildMetadataTable(null, false, isRoot, metadataFields, 0, styleInfo, bgColorObj, true);
    if (table) {
        var text = (expandedItem && expandedItem.innerText) ? expandedItem.innerText : url;
        table.appendChild(TwitterRenderer.createInitialTitleRow(text, url, styleInfo));
        table.appendChild(RendererBase.createLoadingRow(styleInfo));
    }
    return table;
}

TwitterRenderer.createInitialTitleRow = function (text, url, styleInfo) {
    var row = document.createElement('tr');

    var titleDiv = document.createElement('div');
    titleDiv.className = styleInfo.styles.fieldValueContainer;

    var aTag = document.createElement('a');
    aTag.innerText = BSUtils.removeLineBreaksAndCrazies(text);
    aTag.textContent = BSUtils.removeLineBreaksAndCrazies(text);
    aTag.href = url;
    aTag.target = "_blank";
    aTag.onclick = TwitterRenderer.logNavigate;
    aTag.className = styleInfo.styles.fieldValue;

    titleDiv.appendChild(aTag);
    row.appendChild(titleDiv);

    return row;
}

/**
 * Expand or collapse a collection or composite field table.
 * @param event, mouse click event 
 */
TwitterRenderer.expandCollapseTable = function(event)
{
	var button = event.target;
	var miceStyles = InterfaceStyle.getMiceStyleDictionary(button.mmdType);
	var styleInfo = {styles: miceStyles, type: button.mmdType};
	
	if(button.className == styleInfo.styles.collapseSymbol || button.className == styleInfo.styles.expandSymbol)
		button = button.parentElement;
		
	// Use the symbold to check if the table should expand or collapse
	var expandSymbol = button.getElementsByTagName("div")[0];
	if(expandSymbol.style.display == "block")
	{
		expandSymbol.style.display = "none";	
		button.className = styleInfo.styles.collapseButton;
		
		if (button.nextSibling && button.nextSibling.className == styleInfo.styles.fieldLabelImage)
			button.nextSibling.style.display = "";
		
		var table = MICE.getTableForButton(button, styleInfo);
		if (table)
		{
			TwitterRenderer.expandTable(table, styleInfo);
			
			if(MetadataLoader.logger && (event.name == null || event.name != "fakeEvent"))
			{			
				var eventObj = {};
				if(typeof button.location === "undefined")
				{
					if(button.parentElement.childNodes[1])
					{
						eventObj = {
							expand_metadata: {
								field_name: button.parentElement.childNodes[1].innerText,
								parent_doc: TwitterRenderer.getLocationForParentTable(button.parentElement, styleInfo)
							}
						};
					}
					else
					{
						eventObj = {
							expand_metadata: {
								parent_doc: TwitterRenderer.getLocationForParentTable(button.parentElement, styleInfo)
							}
						};
					}
				}
				else
				{
					eventObj = {
						expand_metadata: {
							target_doc: MICE.getLocationForChildTable(button.parentElement.parentElement.parentElement, styleInfo)
						}
					};
				}
				MetadataLoader.logger(eventObj);
			}
		}
	}
	else if(expandSymbol.style.display == "none")
	{
		expandSymbol.style.display = "block";			
		button.className = styleInfo.styles.expandButton;
		
		if (button.nextSibling && button.nextSibling.className == styleInfo.styles.fieldLabelImage)
			button.nextSibling.style.display = "none";
		
		var table = MICE.getTableForButton(button, styleInfo);
		if (table)
		{
			MICE.collapseTable(table, styleInfo);
			
			if(MetadataLoader.logger)
			{
				var eventObj = {};
				if(typeof button.location === "undefined")
				{
					if (button.parentElement.childNodes[1])
					{
						eventObj = {
							collapse_metadata: {
								field_name: button.parentElement.childNodes[1].innerText,
								parent_doc: TwitterRenderer.getLocationForParentTable(button.parentElement, styleInfo)
							}
						};
					}
					else
					{
						eventObj = {
							collapse_metadata: {
								parent_doc: TwitterRenderer.getLocationForParentTable(button.parentElement, styleInfo)
							}
						};
					}
				}
				else
				{
					
					eventObj = {
						collapse_metadata: {
							target_doc: MICE.getLocationForChildTable(button.parentElement.parentElement.parentElement, styleInfo)
						}
					};
				}
				MetadataLoader.logger(eventObj);
			}	
		}
	}
	
	// condition added for fakeEvent in case of show_expanded_initially
	if (event.stopPropagation)
		event.stopPropagation();
}

/**
 * Expand the table, showing all of its rows
 * @param table to expand 
 */
TwitterRenderer.expandTable = function(table, styleInfo)
{
	var rows = [];
	var elts = table.childNodes;
	
	for (var i = 0; i < elts.length; i++)
		if (elts[i].className == styleInfo.styles.metadataRow)
			rows.push(elts[i]);
	
	for (var i = 0; i < rows.length; i++)
	{
		rows[i].style.display = "table-row";
		if (metadataProcessor)
			metadataProcessor(rows[i]);
	}

	// Remove any loading rows, just to be sure 	
	MICE.clearLoadingRows(table, styleInfo);
	
	// Unlight the documents because the connection lines will be in the wrong place
	MICE.unhighlightDocuments(null, styleInfo);
	
	// Check for More and expand it
	if(table.lastChild.lastChild.lastChild.className == styleInfo.styles.moreButton)
		TwitterRenderer.morePlease({"target": table.lastChild.lastChild.lastChild});
}



/**
 * Queue the target document for downloading and display
 * @param event, mouse click event
 */
TwitterRenderer.downloadAndDisplayDocument = function(event)
{
	var button = event.target;
	var miceStyles = InterfaceStyle.getMiceStyleDictionary(button.mmdType);
	var styleInfo = {styles: miceStyles, type: button.mmdType};
	
	if(button.className == styleInfo.styles.collapseSymbol || button.className == styleInfo.styles.expandSymbol)
		button = button.parentElement;
	
	// Update button visuals
	var expandSymbol = button.getElementsByTagName("div")[0];
		expandSymbol.style.display = "none";
		
		button.className = styleInfo.styles.collapseButton;
		
	
	// Change the onclick function of the button to expand/collapse the table
	button.onclick = TwitterRenderer.expandCollapseTable;
		
	var table = MICE.getTableForButton(button, styleInfo);
		
	// Search the table for the document location
	var location = null;
	var rows = [];
	var elts = table.childNodes;
	
	for (var i = 0; i < elts.length; i++)
		if (elts[i].className == styleInfo.styles.metadataRow)
			rows.push(elts[i]);
	
	for (var i = 0; i < rows.length; i++)
	{
		var valueCol = rows[i].childNodes[1];
		if(valueCol)
		{
			var valueDiv = valueCol.getElementsByTagName("div")[0];
			if(valueDiv)
				for (var j = 0; j < valueDiv.childNodes.length; j++)
					if(valueDiv.childNodes[j].href != null && valueDiv.childNodes[j].className != styleInfo.styles.citeULikeButton && location == null)
						location = valueDiv.childNodes[j].href;
		}
	}

	// Did the table have a document location?
	if(location)
	{
		button.location = location;
		
		// Add a loadingRow for visual feedback that the metadata is being downloaded / parsed
		table.appendChild(RendererBase.createLoadingRow(styleInfo));
		
		//var requestMD = MetadataLoader.toRequestMetadataFromService(location);
		
		var options = {
			isRoot: false,
			expandedItem: button
		};
		TwitterRenderer.addMetadataDisplay(table.parentElement, location, null, TwitterRenderer.render, options);
		/*if (!requestMD)
		{
			if (!isExtension)
			{
				//document.dispatchEvent(new Event("tweetbubbleExternal"));
				var message = {
					type : "extractionRequest",
					sender : table.parentElement,
					detail : {
						url : location
					}
				};
				ExtensionInterface.dispatchMessage(message);
				console.log("requested extension for metadata: " + location);
	
				window.setTimeout(function()
				{
					MetadataLoader.checkForMetadataFromExtension();
				}, 3000);
			}
			else if (requestDocumentDownload)
			{
				requestDocumentDownload(location);
			}
		}*/
	}
	// If there was no document location then the table must be a non-document composite in which case just expand
	else
		TwitterRenderer.expandTable(table, styleInfo);
	
	if (event.stopPropagation)
		event.stopPropagation();
	// Grow the In-Context Metadata Display
	if(TwitterRenderer.updateInContextStyling)
		TwitterRenderer.updateInContextStyling(table);
	
	if(MetadataLoader.logger)
	{			
		var eventObj = {};
			
		if(location == null)
		{	
			if (button.parentElement.childNodes[1])
			{
				eventObj = {
					expand_metadata: {
						field_name: button.parentElement.childNodes[1].innerText,
						parent_doc: TwitterRenderer.getLocationForParentTable(button.parentElement, styleInfo)
					}
				};
			}
			else
			{
				eventObj = {
					expand_metadata: {
						parent_doc: TwitterRenderer.getLocationForParentTable(button.parentElement, styleInfo)
					}
				};
			}
		}
		else
		{
			eventObj = {
				expand_metadata: {
					target_doc: location
				}
			};
		}
		MetadataLoader.logger(eventObj);
	}
}

/**
 * Finds matching documents, highlights them, and draws connecting lights
 * @param event, mouse enter event 
 */
TwitterRenderer.highlightDocuments = function (event) {
    var row = event.srcElement;
    var miceStyles = InterfaceStyle.getMiceStyleDictionary(row.mmdType);
    var styleInfo = { styles: miceStyles, type: row.mmdType };

    if (row.className == styleInfo.styles.expandButton)
        row = row.parentElement;

    // Only fieldLabelContainer or fieldLabelContainerOpened rows can be highlighted
    if (row.className.indexOf(styleInfo.styles.fieldLabelContainerOpened) == 0
				|| row.className.indexOf(styleInfo.styles.fieldLabelContainer) == 0) {
        // Highlight row
        MICE.highlightLabel(row);

        var table = row.parentElement.parentElement.getElementsByClassName(styleInfo.styles.valueCol)[0];

        // label_at top or bottom
        if (table == null) {
            var sibling = (button.parentElement.parentElement.nextSibling == null) ?
				button.parentElement.parentElement.previousSibling :
				button.parentElement.parentElement.nextSibling;
            table = sibling.getElementsByClassName(styleInfo.styles.valueCol)[0];
        }

        // Search the table for a document location
        var location = null;

        var aTags = table.getElementsByTagName("a");
        for (var i = 0; i < aTags.length; i++) {
            if (aTags[i].className.indexOf(styleInfo.styles.fieldValue) != -1) {
                location = aTags[i].href;
                break;
            }
        }
        // Did the table have a document location?
        if (location != null) {
            MICE.clearAllCanvases(styleInfo);

            // Find matches in the DocumentMap
            var matches = [];
            for (var i = 0; i < RendererBase.documentMap.length; i++) {
                if (RendererBase.documentMap[i].matches(location)) {
                    if (RendererBase.documentMap[i].container.style.display != "none")
                        matches.push(RendererBase.documentMap[i].container);
                }
            }

            //console.log(location);
            // Draw the lines to each match
            for (var i = 0; i < matches.length; i++) {
                MICE.drawConnectionLine(matches[i], row, styleInfo);
            }
        }
    }
    return false;
}

TwitterRenderer.morePlease = function (event) {
    var moreData = JSON.parse(event.target.lastChild.textContent);

    var parentRow = event.target.parentElement.parentElement;
    var parentTable = parentRow.parentElement;

    //remove More Button	
    parentTable.removeChild(parentRow);

    // Build and add extra rows
    var miceStyles = InterfaceStyle.getMiceStyleDictionary(moreData.type);
    var styleInfo = { styles: miceStyles, type: moreData.type };
    TwitterRenderer.buildMetadataTable(parentTable, moreData.isChild, false, moreData.data, moreData.fields, styleInfo, null,
																								moreData.isMetadataDisplay);

    // TODO add logging for the 'More' button

}

/**
 * DocumentContain represents a document that is part of a MetadataRendering
 * @param url, location of the document, serves as the document ID
 * @param container, HTML object which contains the rendering of this document
 * @param rendered, true if the document has been downloaded and displayed, false otherwise
 * @param expandedItem, a non-metadata item for which the display was constructed
 */
function TwitterDocumentContainer(url, additionalUrls, container, rendered, expandedItem, visual) {
    this.urls = [];
    this.urls.push(url.toLowerCase());

    if (additionalUrls) {
        for (var i = 0; i < additionalUrls.length; i++) {
            this.urls.push(additionalUrls[i].toLowerCase());
        }
    }

    this.container = container;
    this.rendered = rendered;
    this.expandedItem = expandedItem;
    this.visual = visual;
}

/**
 * Does the given url match the DocumentContainer's?
 * @param url, url to check against the DocumentContainer
 */
TwitterDocumentContainer.prototype.matches = function (url) {
    url = url.toLowerCase();
    for (var i = 0; i < this.urls.length; i++) {
        if (this.urls[i].length > 1) {
            return this.urls[i].localeCompare(url) == 0;
        }
    }
    return false;
}

/**
 * Build the HTML table for the list of MetadataFields
 * @param table, the table that the metadata fields should be rendered to, null if the table should be created
 * @param isChildTable, true if the table belongs to a collection table, false otherwise
 * @param isRoot, true if table is the root table of the MetadataRendering
 * @param metadataFields, array of MetadataFields to be displayed
 * @param fieldCount, the number of fields to render before cropping with a "More" button
 * @return HTML table of the metadata display
 */
TwitterRenderer.buildMetadataTable = function (table, isChildTable, isRoot, metadataFields, fieldCount, styleInfo, bgColorObj, isMetadataDisplay) {
    if (!table) {
        table = document.createElement('div');

        if (isRoot || isMetadataDisplay) {
            table.className = styleInfo.styles.rootMetadataTableDiv;
            if (bgColorObj) {
                table.style.background = TwitterRenderer.makeTinge(bgColorObj.color);
            }
            table.onclick = TwitterRenderer.stopEventPropagation;
        }
        else {
            table.className = styleInfo.styles.metadataTableDiv;
            // TODO: differentiate between downloaded to use tinged
            if (!isChildTable)
                table.style.background = 'white';
        }
    }

    var viewedTweets = [];

    // Iterate through the metadataFields which are already sorted into display order
    for (var i = 0; i < metadataFields.length; i++) {

        var row = document.createElement('div');
        row.className = styleInfo.styles.metadataRow;

        // if the maximum number of fields have been rendered then stop rendering and add a "More" expander
        if (fieldCount <= 0) {
            var nameCol = document.createElement('div');
            nameCol.className = styleInfo.styles.labelColShowDiv;

            var valueCol = document.createElement('div');
            valueCol.className = styleInfo.styles.valueColShowDiv;
            //TODO - add "more" expander
            var moreCount = metadataFields.length - i;

            var fieldValueDiv = document.createElement('div');
            fieldValueDiv.className = styleInfo.styles.moreButton;
            fieldValueDiv.textContent = "More... (" + moreCount + ")";
            fieldValueDiv.onclick = TwitterRenderer.morePlease;

            var moreData = {
                "fields": TwitterRenderer.FIELDS_TO_EXPAND,
                "isChild": isChildTable,
                "data": metadataFields.slice(i, metadataFields.length),
                "type": styleInfo.type,
                "isMetadataDisplay": isMetadataDisplay
            };


            var detailsSpan = document.createElement('span');
            detailsSpan.className = styleInfo.styles.hidden;
            detailsSpan.textContent = JSON.stringify(moreData);

            fieldValueDiv.appendChild(detailsSpan);

            valueCol.appendChild(fieldValueDiv);

            row.appendChild(nameCol);
            row.appendChild(valueCol);

            table.appendChild(row);

            break;
        }

        var metadataField = metadataFields[i];

        if (metadataField.value) {
            if (metadataField.name == "id") {
                viewedTweets.push(metadataField.value);
            }

            // If the field is an empty array then move on to the next field
            if (metadataField.value.length != null && metadataField.value.length == 0)
                continue;

            if (metadataField.concatenates_to != null)
                continue;

            var expandButton = null;
            var fieldObj = TwitterRenderer.buildMetadataField(metadataField, isChildTable, fieldCount, row, styleInfo, bgColorObj);
            expandButton = fieldObj.expand_button;

            var fieldObjs = [];
            fieldObjs.push(fieldObj);

            var innerRow = null;
            if (metadataField.concatenates.length > 0) {
                innerRow = document.createElement('div');
                innerRow.className = styleInfo.styles.metadataRow;
            }
            else
                innerRow = row;

            for (var j = 0; j < metadataField.concatenates.length; j++) {
                fieldObj = TwitterRenderer.buildMetadataField(metadataField.concatenates[j], isChildTable, fieldCount, row, styleInfo, bgColorObj);
                fieldObjs.push(fieldObj);
            }

            for (var j = 0; j < fieldObjs.length; j++) {
                var nameCol = fieldObjs[j].name_col;
                var valueCol = fieldObjs[j].value_col;
                fieldCount = fieldObjs[j].count;

                // append name and value in the needed order
                if (metadataField.label_at != null) {
                    if (metadataField.label_at == "top" || metadataField.label_at == "bottom") {
                        var innerTable = document.createElement('div');
                        var row1 = document.createElement('div');
                        var row2 = document.createElement('div');
                        innerTable.style.display = 'table';
                        row1.className = styleInfo.styles.metadataRow;
                        row2.className = styleInfo.styles.metadataRow;
                        if (metadataField.label_at == "top") {
                            row1.appendChild(nameCol);
                            row2.appendChild(valueCol);
                        }
                        else {
                            row1.appendChild(valueCol);
                            row2.appendChild(nameCol);
                        }
                        innerTable.appendChild(row1);
                        innerTable.appendChild(row2);

                        var td = document.createElement('div');
                        td.style.display = 'table-cell';
                        td.appendChild(innerTable);

                        // to still make labels align well with fields having label_at left
                        if (metadataField.concatenates.length == 0) {
                            var tdDummy = document.createElement('div');
                            tdDummy.style.display = 'table-cell';
                            innerRow.appendChild(tdDummy);
                        }
                        innerRow.appendChild(td);
                    }
                    else if (metadataField.label_at == "right") {
                        innerRow.appendChild(valueCol);
                        innerRow.appendChild(nameCol);
                    }
                    else {
                        innerRow.appendChild(nameCol);
                        innerRow.appendChild(valueCol);
                    }
                }
                else {
                    innerRow.appendChild(nameCol);
                    innerRow.appendChild(valueCol);
                }
            }

            if (metadataField.concatenates.length > 0) {
                // new table for inner row
                var outerTable = document.createElement('div');
                outerTable.style.display = 'table';
                outerTable.style.width = "100%";
                outerTable.appendChild(innerRow);

                var tdOuter = document.createElement('div');
                tdOuter.style.display = 'table-cell';
                tdOuter.appendChild(outerTable);

                var tdDummy1 = document.createElement('div');
                tdDummy1.style.display = 'table-cell';

                row.appendChild(tdDummy1);
                row.appendChild(tdOuter);
            }
            table.appendChild(row);

            if (expandButton != null && (metadataField.show_expanded_initially == "true"
										|| metadataField.show_expanded_always == "true")) {
                var fakeEvent = {};
                fakeEvent.target = expandButton;
                fakeEvent.name = "fakeEvent";
                //console.log("fake event ready");
                TwitterRenderer.expandCollapseTable(fakeEvent);

                //TODO: introduce semantics for hiding after expand
                if (metadataField.composite_type == "tweet") {
                    var buttonParent = expandButton.parentNode;
                    buttonParent.removeChild(expandButton);
                    //expandButton.style.visibility = "hidden";
                }
            }
        }
    }

    if (MetadataLoader.logger && viewedTweets.length > 0) {
        eventObj = {
            tweet_action: {
                name: "twb_view_tweets",
                tweets: viewedTweets
            }
        }
        MetadataLoader.logger(eventObj);
    }

    return table;
}
TwitterRenderer.makeLinks = function(field){
	var text = field.innerHTML;
	var components = text.split(/\s*[\s]\s*/);
	field.innerHTML = "";
	for (var i = 0; i < components.length; i++){
		var component = components[i];
		var newElem;
		if (component.indexOf('@') == 0){
			var value = component.slice(1);
			var newElem = document.createElement('a');
			newElem.innerHTML = component;
			newElem.href = 'https://twitter.com/' + value;
			newElem.className = 'tb-link'
			
		}else if (component.indexOf('#') == 0){
			var value = component.slice(1);
			var newElem = document.createElement('a');
			newElem.innerHTML = component;
			newElem.href = 'https://twitter.com/hashtag/' + value;
			newElem.className = 'tb-link'

			
		}else if (component.indexOf('http://') == 0){
			var value = component.slice(1);
			var newElem = document.createElement('a');
			newElem.innerHTML = component;
			newElem.href = component;
			newElem.className = 'tb-link'
		}else if(component.indexOf('https://') == 0){
			var value = component.slice(1);
			var newElem = document.createElement('a');
			newElem.innerHTML = component;
			newElem.href = component;
			newElem.className = 'tb-link'
		}else if(component.indexOf('pic.twitter') == 0){
			var value = component.slice(1);
			var newElem = document.createTextNode('');

		}else{
			newElem = document.createTextNode(component);
		}
		field.appendChild(newElem);
		field.appendChild(document.createTextNode(' '));
	}
	
}
/**
 * Build the HTML representation for MetadataField
 * @param metadataField, MetadataField to be rendered
 * @param isChildTable, true if the field is child of a collection table, false otherwise
 * @param fieldCount, the number of fields that are rendered before cropping with a "More" button
 * @param row, the containing element
 * @return HTML representation of the metadata field, expandButton, and fieldCount
 */
TwitterRenderer.buildMetadataField = function(metadataField, isChildTable, fieldCount, row, styleInfo, bgColorObj)
{
	var imageLabel = (metadataField.value_as_label == "") ?	false : metadataField.value_as_label.type == "image";
	
	var nameCol = document.createElement('div');
	if (!metadataField.show_expanded_always) { 
		//|| (metadataField.composite_type != null && metadataField.composite_type == "tweet")) {	
		nameCol.className = styleInfo.styles.labelCol;
	}
	else if(metadataField.composite_type != null && metadataField.composite_type != "image" && !imageLabel){
		nameCol.className = styleInfo.styles.labelCol;
		nameCol.style.display = "none";
	}
	
	var valueCol = document.createElement('div');
		valueCol.className = styleInfo.styles.valueCol;
	
	if(metadataField.composite_type != null && metadataField.composite_type != "image" && !imageLabel){
		valueCol.className = styleInfo.styles.valueCol;
		valueCol.style.position = "relative";
		valueCol.style.left = "-9px";
	}	
		
	var expandButton = null;	
	
	if(metadataField.scalar_type)
	{				
		// Currently it only rendered Strings, Dates, Integers, and ParsedURLs
		if(metadataField.scalar_type == "String" || metadataField.scalar_type == "Date" ||metadataField.scalar_type == "Integer" || metadataField.scalar_type == "ParsedURL")
		{
			if(metadataField.name && !metadataField.hide_label)
			{
				var fieldLabelDiv = document.createElement('div');
					fieldLabelDiv.className = styleInfo.styles.fieldLabelContainerUnhighlight;
				
				if (bgColorObj && bgColorObj.bFirstField)
					fieldLabelDiv.style.background = bgColorObj.color;
					
				var label = RendererBase.getFieldLabel(metadataField);
				if (label.type == "scalar")
				{
					var fieldLabel = document.createElement('p');
						fieldLabel.className = styleInfo.styles.fieldLabel;
						fieldLabel.innerText = BSUtils.toDisplayCase(label.value);
						fieldLabel.textContent = BSUtils.toDisplayCase(label.value);
						
					fieldLabelDiv.appendChild(fieldLabel);	
				}
				else if (label.type == "image")
				{
					var img = document.createElement('img');
						img.className = styleInfo.styles.fieldLabelImage;
						img.src = ViewModeler.getImageSource(label.value);
						
					fieldLabelDiv.appendChild(img);	
				}			
				
				nameCol.appendChild(fieldLabelDiv);
			}
			
			// If the field is a URL then it should show the favicon and an A tag
			if(metadataField.scalar_type == "ParsedURL")
			{
				// Uses http://getfavicon.appspot.com/ to resolve the favicon
				var favicon = document.createElement('img');
					favicon.className = styleInfo.styles.faviconICE;
					favicon.src = BSUtils.getFaviconURL(metadataField.navigatesTo);
					
				var aTag = document.createElement('a');
				aTag.innerText = BSUtils.removeLineBreaksAndCrazies(metadataField.value);
				aTag.textContent = BSUtils.removeLineBreaksAndCrazies(metadataField.value);
				
				aTag.href = metadataField.value;
				aTag.onclick = TwitterRenderer.logNavigate;
				
				aTag.className = styleInfo.styles.fieldValue;
						
				if(metadataField.style_name != null && metadataField.style_name != "")
					aTag.classList.add(metadataField.style_name);
			
				var fieldValueDiv = document.createElement('div');
					fieldValueDiv.className = styleInfo.styles.fieldValueContainer;
				if (bgColorObj && bgColorObj.bFirstField)
					aTag.style.background = bgColorObj.color;	
				
				fieldValueDiv.appendChild(favicon);
				fieldValueDiv.appendChild(aTag);
				valueCol.appendChild(fieldValueDiv);
			}
		
			// If the field navigates to a link then it should show the favicon and an A tag
			else if( metadataField.navigatesTo)
			{				
				// Uses http://getfavicon.appspot.com/ to resolve the favicon
				var favicon = document.createElement('img');
					favicon.className = styleInfo.styles.faviconICE;
					favicon.src = BSUtils.getFaviconURL(metadataField.navigatesTo);
					
				var aTag = document.createElement('a');
					aTag.className = styleInfo.styles.fieldValue;
					if(metadataField.style_name != "null" && metadataField.style_name!=""){
						aTag.classList.add(metadataField.style_name);
					}
					
					aTag.target = "_blank";
					aTag.innerText = BSUtils.removeLineBreaksAndCrazies(metadataField.value);
					aTag.textContent = BSUtils.removeLineBreaksAndCrazies(metadataField.value);
					
					aTag.href = metadataField.navigatesTo;
					aTag.onclick = TwitterRenderer.logNavigate;
										
					if(metadataField.style_name != null && metadataField.style_name != "")
						aTag.classList.add(metadataField.style_name);
				var fieldValueDiv = document.createElement('div');
					fieldValueDiv.className = styleInfo.styles.fieldValueContainer;
				if (bgColorObj && bgColorObj.bFirstField)
					aTag.style.background = bgColorObj.color;	
				
				// For the current WWW study the rendering should have incontext CiteULike bookmarklets for specific types of metadata
				//WWWStudy.addCiteULikeButton(fieldValueDiv, metadataField.parentMDType, metadataField.navigatesTo)						
				
				fieldValueDiv.appendChild(favicon);
				fieldValueDiv.appendChild(aTag);
				valueCol.appendChild(fieldValueDiv);
			}
			
			// If there is no navigation then just display the field value as text
			else
			{
				var fieldValue = document.createElement('p');
					fieldValue.className = styleInfo.styles.fieldValue;
					
				if (metadataField.extract_as_html)
				{
					fieldValue.innerHTML = BSUtils.removeLineBreaksAndCrazies(metadataField.value);
				}
				else
				{
					fieldValue.innerText = BSUtils.removeLineBreaksAndCrazies(metadataField.value);
					fieldValue.textContent = BSUtils.removeLineBreaksAndCrazies(metadataField.value);
				}
				
				if (metadataField.name == "post_date" || metadataField.name == "username")
					fieldValue.className = styleInfo.styles.fieldValueSub;
				
				if (metadataField.name == "id")
					fieldValue = TwitterRenderer.getTweetSemanticsDiv(metadataField.value, styleInfo);
													
				if(metadataField.style_name != null)
					fieldValue.className += " "+metadataField.style_name;

				var fieldValueDiv = document.createElement('div');
					fieldValueDiv.className = styleInfo.styles.fieldValueContainer;
				if (bgColorObj && bgColorObj.bFirstField)
					fieldValue.style.background = bgColorObj.color;
				//Go back and change all #.*, @.*, and http:.* to links
				if(fieldValue.tagName == 'P'){
					//TwitterRenderer.makeLinks(fieldValue)

				}
				fieldValueDiv.appendChild(fieldValue);
				valueCol.appendChild(fieldValueDiv);
			}
			
			if (bgColorObj && bgColorObj.bFirstField)
				bgColorObj.bFirstField = false;								
		
			fieldCount--;
		}		
	}
	
	else if (metadataField.composite_type != null && metadataField.composite_type == "image")
	{
		var label = RendererBase.getFieldLabel(metadataField);
		
		if(metadataField.name && !metadataField.hide_label && (!isChildTable || label.type == "image"))
		{
			var fieldLabelDiv = document.createElement('div');
				fieldLabelDiv.className = styleInfo.styles.fieldLabelContainerUnhighlight;
			
			if (bgColorObj && bgColorObj.bFirstField)
				fieldLabelDiv.style.background = bgColorObj.color;
			
			if (label.type == "scalar")
			{
				var fieldLabel = document.createElement('p');
					fieldLabel.className = styleInfo.styles.fieldLabel;
					fieldLabel.innerText = BSUtils.toDisplayCase(label.value);
					fieldLabel.textContent = BSUtils.toDisplayCase(label.value);
				
				fieldLabelDiv.appendChild(fieldLabel);	
			}
			else if (label.type == "image")
			{
				var img = document.createElement('img');
					img.className = styleInfo.styles.fieldLabelImage;
					img.src = ViewModeler.getImageSource(label.value);

				fieldLabelDiv.appendChild(img);
			}		
			
			nameCol.appendChild(fieldLabelDiv);
		}
		
		var img1 = document.createElement('img');
			img1.src = ViewModeler.getImageSource(metadataField.value);
			img1.className = styleInfo.styles.fieldValueImage;
		
		var fieldValueDiv = document.createElement('div');
			fieldValueDiv.className = styleInfo.styles.fieldValueContainer;
		
		fieldValueDiv.appendChild(img1);
		valueCol.appendChild(fieldValueDiv);
	}
	
	else if(metadataField.composite_type != null && metadataField.composite_type != "image")
	{
		/** Label Column **/
		var childUrl = ViewModeler.guessDocumentLocation(metadataField.value);
		
		var fieldLabelDiv = document.createElement('div');
			fieldLabelDiv.className = styleInfo.styles.fieldLabelContainerUnhighlight;
			fieldLabelDiv.style.minWidth = "30px";
		
		if (metadataField.composite_type == "twitter_microblog")
			fieldLabelDiv.style.minWidth = "16px";
							
		// Is the document already rendered?								
		if(childUrl != "" && RendererBase.isRenderedDocument(childUrl) )
		{
			// If so, then don't allow the document to be expaned, to prevent looping						
			fieldLabelDiv.className = styleInfo.styles.fieldLabelContainerOpenedUnhighlight;				
		}
		else
		{
			if (childUrl != "" || metadataField.value.length > 1)
			{
				
				// If the document hasn't been download then display a button that will download it
				expandButton = document.createElement('div');
					expandButton.className = styleInfo.styles.expandButtonX;
				
				expandButton.onclick = TwitterRenderer.downloadAndDisplayDocument;
	
				if(childUrl != "")
				{
					expandButton.onmouseover = TwitterRenderer.highlightDocuments;
					expandButton.onmouseout = MICE.unhighlightDocuments;
				}
						
				var expandSymbol = document.createElement('div');
					expandSymbol.className = styleInfo.styles.expandSymbol;
					expandSymbol.style.display = "block";
					
				var collapseSymbol = document.createElement('div');
					collapseSymbol.className = styleInfo.styles.collapseSymbol;
					collapseSymbol.style.display = "block";						
				
				/* set mmdType to all as any may receive event */
				expandButton.mmdType = styleInfo.type;
				expandSymbol.mmdType = styleInfo.type;
				collapseSymbol.mmdType = styleInfo.type;
						
				expandButton.appendChild(expandSymbol);
				expandButton.appendChild(collapseSymbol);
				fieldLabelDiv.appendChild(expandButton);
			}
		}
		
		if(metadataField.name)
		{			
			var label = RendererBase.getFieldLabel(metadataField);
			
			//If the table isn't a child table then display the label for the composite
			if((!isChildTable || label.type == "image") && !metadataField.hide_label)
			{				
				if (label.type == "scalar")
				{
					var fieldLabel = document.createElement('p');
						fieldLabel.className = styleInfo.styles.fieldLabel;
						fieldLabel.innerText = BSUtils.toDisplayCase(label.value);
						fieldLabel.textContent = BSUtils.toDisplayCase(label.value);
					
					fieldLabelDiv.appendChild(fieldLabel);
				}
				else if (label.type == "image")
				{
					var img = document.createElement('img');
						img.className = styleInfo.styles.fieldLabelImage;
						img.src = ViewModeler.getImageSource(label.value);

					fieldLabelDiv.appendChild(img);
				}
			}
		}
		
		nameCol.appendChild(fieldLabelDiv);
		
		/** Value Column **/
		
		var fieldValueDiv = document.createElement('div');
			fieldValueDiv.className = styleInfo.styles.fieldCompositeContainer;
			
		if (metadataField.composite_type == "twitter_microblog")
			fieldValueDiv.className = styleInfo.styles.fieldCompositeContainer + " twitterMicroblog";
		
		// Build the child table for the composite
		var childTable =  TwitterRenderer.buildMetadataTable(null, false, false, metadataField.value, 1, styleInfo, bgColorObj, false);
		
		// If the childTable has more than 1 row, collapse table
		if(metadataField.value.length > 1 && !metadataField.show_expanded_always){
			MICE.collapseTable(childTable, styleInfo);			
		}
		if(metadataField.show_expanded_always){
			TwitterRenderer.expandTable(childTable, styleInfo);
		}			
		
		fieldValueDiv.appendChild(childTable);				
		
		var nestedPad = document.createElement('div');
			nestedPad.className = styleInfo.styles.nestedPad;
		
		nestedPad.appendChild(childTable);
		
		fieldValueDiv.appendChild(nestedPad);
		
		valueCol.appendChild(fieldValueDiv);
		
		// Add the unrendered document to the documentMap
		if(childUrl != "")
			RendererBase.documentMap.push(new TwitterDocumentContainer(childUrl, null, row, false, null, null));
		
		// Add event handling to highlight document connections	
		if(childUrl != "")
		{	
			nameCol.onmouseover = TwitterRenderer.highlightDocuments;
			nameCol.onmouseout = MICE.unhighlightDocuments;
			nameCol.mmdType = styleInfo.type;
		}
		
		if (metadataField.composite_type == "tweet")
		{
			fieldValueDiv.onmouseover = TwitterRenderer.highlightTweet;
			fieldValueDiv.onmouseout = TwitterRenderer.unhighlightTweet;
			fieldValueDiv.onclick = TwitterRenderer.collapseOrScrollToExpandedItem;
			fieldValueDiv.mmdType = styleInfo.type;
		}
		
		fieldCount--;
	}
	
	else if(metadataField.child_type != null)
	{		
		if(metadataField.name != null)
		{
			var fieldLabelDiv = document.createElement('div');
			fieldLabelDiv.className = styleInfo.styles.fieldLabelContainerUnhighlight;
		
			if(metadataField.value.length > 1)
			{
				var expandButton = document.createElement('div');
				expandButton.className = styleInfo.styles.expandButton;
				
				expandButton.onclick = TwitterRenderer.expandCollapseTable;
				
				var expandSymbol = document.createElement('div');
					expandSymbol.className = styleInfo.styles.expandSymbol;
					expandSymbol.style.display = "block";
					
				var collapseSymbol = document.createElement('div');
					collapseSymbol.className = styleInfo.styles.collapseSymbol;
					collapseSymbol.style.display = "block";						
			
				expandButton.mmdType = styleInfo.type;
				expandSymbol.mmdType = styleInfo.type;
				collapseSymbol.mmdType = styleInfo.type;
					
				expandButton.appendChild(expandSymbol);
				expandButton.appendChild(collapseSymbol);
				
				fieldLabelDiv.appendChild(expandButton);
			}
			
			var label = RendererBase.getFieldLabel(metadataField);
			if (label.type == "scalar")
			{
				var fieldLabel = document.createElement('p');
					fieldLabel.className = styleInfo.styles.fieldLabel;
					fieldLabel.innerText = BSUtils.toDisplayCase(label.value) + "(" + metadataField.value.length + ")";
					fieldLabel.textContent = BSUtils.toDisplayCase(label.value) + "(" + metadataField.value.length + ")";
					
				if (!metadataField.hide_label)
					fieldLabelDiv.appendChild(fieldLabel);
			}
			else if (label.type == "image")
			{
				var img = document.createElement('img');
					img.className = styleInfo.styles.fieldLabelImage;
					img.src = ViewModeler.getImageSource(label.value);

				if (!metadataField.hide_label)
					fieldLabelDiv.appendChild(img);
			}		
			
			nameCol.appendChild(fieldLabelDiv);
		}
			
		var fieldValueDiv = document.createElement('div');
			fieldValueDiv.className = styleInfo.styles.fieldChildContainer;
		
		var childTable =  TwitterRenderer.buildMetadataTable(null, true, false, metadataField.value, 1, styleInfo, bgColorObj, false);
		if(metadataField.value.length >= 1)
		{
			MICE.collapseTable(childTable, styleInfo);			
		}					
			
		var nestedPad = document.createElement('div');
			nestedPad.className = styleInfo.styles.nestedPad;
		
		nestedPad.appendChild(childTable);
		
		fieldValueDiv.appendChild(nestedPad);
		
		valueCol.appendChild(fieldValueDiv);
						
		fieldCount--;
	}
	return {name_col: nameCol, value_col: valueCol, count: fieldCount, expand_button: expandButton};
}

TwitterRenderer.getLocationForParentTable = function (element, styleInfo) {
    while (element.className != styleInfo.styles.rootMetadataTableDiv) {
        element = element.parentElement;
    }

    var aTags = element.getElementsByTagName("a");
    if (aTags.length > 0) {
        return aTags[0].href;
    }
    return "none";
}

/**
 * Get a suitable color for the expansion
 * @param container, element that contains expansion
 */
TwitterRenderer.getNextColor = function (container) {
    var index = -1;
    if (container.colors && (container.colors.length < TwitterRenderer.colors.length)) {
        var i = 0;
        // iterate to find unused color
        while (i < container.colors.length - 1) {
            if (container.colors[i + 1] != (container.colors[i] + 1)) {
                index = container.colors[i] + 1;
                break;
            }
            i++;
        }

        if (i == container.colors.length - 1)
            index = (container.colors[i] + 1) % TwitterRenderer.colors.length;

        if (index == -1)
            index = (++TwitterRenderer.lastColorIndex) % TwitterRenderer.colors.length;
        else
            TwitterRenderer.lastColorIndex = index;
    }
    else {
        container.colors = [];
        index = (++TwitterRenderer.lastColorIndex) % TwitterRenderer.colors.length;
    }

    container.colors.push(index);
    container.colors.sort();

    return TwitterRenderer.colors[index];
}

/**
 * Removes the color from list of used colors
 * @param container, element that contained the expansion
 * @param color, color used for the expansion
 */
TwitterRenderer.removeColor = function (container, color) {
    for (var i = 0; i < container.colors.length; i++) {
        if (color == TwitterRenderer.colors[container.colors[i]]) {
            container.colors.splice(i, 1);
            break;
        }
    }
}

/**
 * 
 */
TwitterRenderer.makeTinge = function (color) {
    var rgb = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/i.exec(color);
    var r = parseInt(rgb[1]);
    var g = parseInt(rgb[2]);
    var b = parseInt(rgb[3]);
    r = r + Math.floor((255 - r) * 0.75);
    g = g + Math.floor((255 - g) * 0.75);
    b = b + Math.floor((255 - b) * 0.75);
    return 'rgb(' + r + ", " + g + ", " + b + ")";
}

TwitterRenderer.highlightTweet = function (event) {
    var fieldValueDiv = event.currentTarget;
    var miceStyles = InterfaceStyle.getMiceStyleDictionary(fieldValueDiv.mmdType);
    var styleInfo = { styles: miceStyles };

    fieldValueDiv.className = styleInfo.styles.fieldCompositeContainerHighlightTweet;
}

TwitterRenderer.unhighlightTweet = function (event) {
    var fieldValueDiv = event.currentTarget;
    var miceStyles = InterfaceStyle.getMiceStyleDictionary(fieldValueDiv.mmdType);
    var styleInfo = { styles: miceStyles };

    fieldValueDiv.className = styleInfo.styles.fieldCompositeContainer;
}

TwitterRenderer.animateScrollBackAndCollapse = function (top, containers) {
    var y = top;
    var contentExpansionContainers = containers.content_expansions;
    var metadataExpansionButtons = containers.metadata_expansion_buttons;

    var animateScroll = function () {
        if ((window.pageYOffset - (y - 50)) > 0) {
            var scroll = (window.pageYOffset - (y - 50)) > 100 ?
    									100 : (window.pageYOffset - (y - 50));
            window.scrollTo(window.scrollX, (window.pageYOffset - scroll));
            setTimeout(animateScroll, 10);
        }
        else {
            for (var i = 0; i < contentExpansionContainers.length; i++) {
                var hideVisual = function (visual) {
                    visual.style.display = "none";
                }

                contentExpansionContainers[i].expandedItem.firstChild.src = expandIconPath;
                contentExpansionContainers[i].visual.style.opacity = 0.1;

                setTimeout(hideVisual, 330, contentExpansionContainers[i].visual);
            }
            for (var i = 0; i < metadataExpansionButtons.length; i++) {
                var fakeEvent = {};
                fakeEvent.target = metadataExpansionButtons[i];
                fakeEvent.name = "fakeEvent";
                //console.log("fake event ready");
                TwitterRenderer.expandCollapseTable(fakeEvent);
            }
        }
    };
    animateScroll();
}

TwitterRenderer.collapseOrScrollToExpandedItem = function (event) {
    var elt = event.currentTarget;
    var miceStyles = InterfaceStyle.getMiceStyleDictionary(elt.mmdType);
    var styleInfo = { styles: miceStyles };

    var y = 0;
    while (elt && (typeof elt.offsetTop !== "undefined") && !isNaN(elt.offsetTop)) {
        y += elt.offsetTop;
        elt = elt.offsetParent;
    }

    if (window.pageYOffset > y) {
        //window.scrollTo(window.scrollLeft, (y - 50));
        var containers = TwitterRenderer.getFirstLevelDocumentContainers(event.currentTarget, styleInfo);
        TwitterRenderer.animateScrollBackAndCollapse(y, containers);
    }
    event.stopPropagation();
}

TwitterRenderer.stopEventPropagation = function (event) {
    event.stopPropagation();
}

/**
 * Does the given item match the DocumentContainer's?
 * @param item, expandedItem to check against the DocumentContainer
 * @return DocumentContainer if there's a match, null otherwise
 */
TwitterRenderer.getDocumentContainerByExpandedItem = function (item) {
    for (var i = 0; i < RendererBase.documentMap.length; i++)
        if (RendererBase.documentMap[i].expandedItem == item)
            return RendererBase.documentMap[i];

    return null;
}

TwitterRenderer.getDocumentContainersByContainer = function (container) {
    var containers = [];
    for (var i = 0; i < RendererBase.documentMap.length; i++)
        if (RendererBase.documentMap[i].container == container)
            containers.push(RendererBase.documentMap[i]);

    return containers;
}

/**
 * show the metadata display
 * @param expandedItem, item for which display was constructed
 */
TwitterRenderer.showMetadataDisplay = function (expandedItem) {
    var dc = TwitterRenderer.getDocumentContainerByExpandedItem(expandedItem);
    if (dc) {
        // metadata display
        dc.visual.style.display = "";
        dc.visual.style.opacity = 1;

        if (MetadataLoader.logger) {
            var eventObj = {
                show_metadata: {
                    primary_doc: dc.urls[0]
                }
            }
            MetadataLoader.logger(eventObj);
        }
    }
}

/**
 * hide the metadata display
 * @param expandedItem, item for which display was constructed
 */
TwitterRenderer.hideMetadataDisplay = function (expandedItem) {
    var dc = TwitterRenderer.getDocumentContainerByExpandedItem(expandedItem);
    if (dc) {
        // metadata display
        dc.visual.style.display = "none";

        if (MetadataLoader.logger) {
            var eventObj = {
                hide_metadata: {
                    primary_doc: dc.urls[0]
                }
            }
            MetadataLoader.logger(eventObj);
        }
    }
}

/**
 * get the document containers existing inside given element
 * @param elt, element containing the DocumentContainer(s)
 */
TwitterRenderer.getFirstLevelDocumentContainers = function (elt, styleInfo) {
    //check for content expansions	
    //fieldCompositeContainer.nestedPad.metadataTableDiv.metadataRow.valueCol
    var container = elt.lastChild.lastChild.lastChild.lastChild;
    var contentExpansions = TwitterRenderer.getDocumentContainersByContainer(container);

    //check for metadata expansions
    //fieldCompositeContainer.nestedPad.metadataTableDiv.rows
    var rows = elt.lastChild.lastChild.childNodes;
    var metadataExpansions = [];
    for (var i = 0; i < rows.length; i++) {
        var labelCol = rows[i].getElementsByClassName(styleInfo.styles.labelCol)[0];
        var valueCol = rows[i].getElementsByClassName(styleInfo.styles.valueCol)[0];

        if (valueCol.firstChild.className.indexOf(styleInfo.styles.fieldCompositeContainer) != -1) {
            var labelContainerChildren = labelCol.firstChild.childNodes;

            for (var j = 0; j < labelContainerChildren.length; j++)
                if (labelContainerChildren[j].className == styleInfo.styles.collapseButton)
                    metadataExpansions.push(labelContainerChildren[j]);
        }
    }
    return { content_expansions: contentExpansions, metadata_expansion_buttons: metadataExpansions };
}

/**
 * Sets the processing function for metadata
 * @param fnMetadataProcessor, metadata processing function
 */
TwitterRenderer.setMetadataProcessor = function (fnMetadataProcessor) {
    metadataProcessor = fnMetadataProcessor;
}

/**
* Sets the function for requesting document download
* @param fnRequestDownload
*/
TwitterRenderer.setDocumentDownloader = function (fnDownloadRequester) {
    requestDocumentDownload = fnDownloadRequester;
}

TwitterRenderer.postRetweet = function () {
    var tweetId = this.getAttribute("tweetId");
    TwitterRequests.postRetweet(tweetId, TwitterRequests.retweetCallback);
}

TwitterRenderer.postFavorite = function () { 
	var tweetId = this.getAttribute("tweetId");
    TwitterRequests.postFavorite(tweetId, TwitterRequests.favoriteCallback);
}

TwitterRenderer.postReply = function () {
    var textareaParentDiv = this.parentElement.parentElement.parentElement; // button.valueCol.row.table
    var replyBoxTextarea = textareaParentDiv.getElementsByTagName('textarea')[0];
    var tweetId = this.getAttribute("tweetId");

    var tweetStr = replyBoxTextarea.value;
    TwitterRequests.postReply(tweetStr, tweetId, TwitterRequests.replyCallback);

    var replyBoxValueCol = replyBoxTextarea.parentElement;
    while (replyBoxValueCol.hasChildNodes())
        replyBoxValueCol.removeChild(replyBoxValueCol.lastChild);

    var textDiv = document.createElement("div");
    textDiv.innerHTML = "Your reply has been posted!";
    textDiv.textContent = "Your reply has been posted!";
    replyBoxValueCol.appendChild(textDiv);

    var hideText = function (txtParent) {
        while (txtParent.hasChildNodes())
            txtParent.removeChild(txtParent.lastChild);
    }

    window.setTimeout(hideText, 1000, replyBoxValueCol);

    var replyButtonRow = replyBoxValueCol.parentElement.nextSibling;
    var replyButtonRowParent = replyButtonRow.parentElement;
    replyButtonRowParent.removeChild(replyButtonRow);
}

TwitterRenderer.createReplyBox = function () {
    if (!this.isReplyBoxVisible) {
        var tweetId = this.getAttribute("tweetId");
        var miceStyles = InterfaceStyle.getMiceStyleDictionary();
        var styleInfo = { styles: miceStyles };

        var twSemanticsValueCol = this.parentElement.parentElement.parentElement.parentElement;
        var twSemanticsParentDiv = twSemanticsValueCol.parentElement.parentElement;	//valueCol.innerMetadataRow.outerTable
        var twMetadataTableRow = twSemanticsParentDiv.parentElement.parentElement; // outerTable.td.row
        var twMetadataTableDiv = twMetadataTableRow.parentElement; // row.table

        // add textarea
        var nameCol = document.createElement('div');
        nameCol.className = styleInfo.styles.labelColShowDiv;
        var valueCol = document.createElement('div');
        valueCol.className = styleInfo.styles.valueColShowDiv;

        var replyBox = document.createElement('textarea');
        replyBox.style.width = "93%";
        valueCol.appendChild(replyBox);

        var twReplyBoxRow = document.createElement('div');
        twReplyBoxRow.className = styleInfo.styles.metadataRow;
        twReplyBoxRow.appendChild(nameCol);
        twReplyBoxRow.appendChild(valueCol);

        // add tweet button
        var nameCol2 = document.createElement('div');
        nameCol.className = styleInfo.styles.labelColShowDiv;
        var valueCol2 = document.createElement('div');
        valueCol2.className = styleInfo.styles.valueColShowDiv;

        var twButton = document.createElement('input');
        twButton.type = "button";
        twButton.value = "Tweet";
        twButton.style.background = "#0084b4";
        twButton.style.color = "white";
        twButton.addEventListener('click', TwitterRenderer.postReply);
        twButton.setAttribute("tweetId", tweetId);
        valueCol2.appendChild(twButton);
        var twButtonRow = document.createElement('div');
        twButtonRow.className = styleInfo.styles.metadataRow;
        twButtonRow.appendChild(nameCol2);
        twButtonRow.appendChild(valueCol2);

        // add textarea and button to metadatatable
        twMetadataTableDiv.appendChild(twReplyBoxRow);
        twMetadataTableDiv.appendChild(twButtonRow);

        this.isReplyBoxVisible = true;
        replyBox.focus();

        var tweeterUsernameStr;
        var tweeterRow = twMetadataTableDiv.firstChild;
        var tweeterUsernameRef = tweeterRow.getElementsByTagName("a")[0];
        if (tweeterUsernameRef && tweeterUsernameRef.className != "twFieldValue metadata_h1")
            tweeterUsernameRef = null;

        if (!tweeterUsernameRef) {
            var rootTableDiv = twMetadataTableDiv;
            while (rootTableDiv.parentElement) {
                if (rootTableDiv.className == "twRootMetadataTableDiv") {
                    tweeterUsernameRef = rootTableDiv.getElementsByTagName("a")[0];
                    break;
                }
                rootTableDiv = rootTableDiv.parentElement;
            }
        }

        if (tweeterUsernameRef) {
            tweeterUsernameStr = tweeterUsernameRef.getAttribute("href");
            if (tweeterUsernameStr) {
                var slashIndex = tweeterUsernameStr.lastIndexOf('/');
                if (slashIndex != -1)
                    tweeterUsernameStr = '@' + tweeterUsernameStr.substr(slashIndex + 1) + ' ';
                else
                    tweeterUsernameStr = '';
            }
        }

        var tweetDivs;
        while (twMetadataTableRow.previousSibling) {
            twMetadataTableRow = twMetadataTableRow.previousSibling;
            tweetDivs = twMetadataTableRow.getElementsByClassName("twFieldValue description_div");
            if (tweetDivs.length > 0)
                break;
        }
        if (tweetDivs.length > 0) {
            var tweetText = tweetDivs[0].textContent;
            var usernameRefs = tweetText.split('@');
            var usernameStr = tweeterUsernameStr;
            for (var i = 1; i < usernameRefs.length; i++) {
                var userStr = (usernameRefs[i].indexOf(' ') == -1) ?
									usernameRefs[i] : usernameRefs[i].substr(0, usernameRefs[i].indexOf(' '));
                usernameStr += '@' + userStr + ' ';
            }
            replyBox.value = usernameStr;
        }
    }
}

TwitterRenderer.highlightTweetSemanticsIcon = function () {
    var icon = this.firstChild;

    if (icon.src == TwitterRenderer.replyIconPath1)
        icon.src = TwitterRenderer.replyIconPath2;
    else if (icon.src == TwitterRenderer.retweetIconPath1)
        icon.src = TwitterRenderer.retweetIconPath2;
    else if (icon.src == TwitterRenderer.favoriteIconPath1)
        icon.src = TwitterRenderer.favoriteIconPath2;
}

TwitterRenderer.unhighlightTweetSemanticsIcon = function () {
    var icon = this.firstChild;

    if (icon.src == TwitterRenderer.replyIconPath2)
        icon.src = TwitterRenderer.replyIconPath1;
    else if (icon.src == TwitterRenderer.retweetIconPath2)
        icon.src = TwitterRenderer.retweetIconPath1;
    else if (icon.src == TwitterRenderer.favoriteIconPath2)
        icon.src = TwitterRenderer.favoriteIconPath1;
}

TwitterRenderer.setRetweetIconOn = function (id) {
    if (id) {
        var idStr = "retweetIcon" + id;
        var elt = document.getElementById(idStr);
        if (elt) {
            var icon = elt.firstChild;
            icon.src = TwitterRenderer.retweetIconPath3;
        }
    }
}

TwitterRenderer.setFavoriteIconOn = function (id) {
    if (id) {
        var idStr = "favoriteIcon" + id;
        var elt = document.getElementById(idStr);
        if (elt) {
            var icon = elt.firstChild;
            icon.src = TwitterRenderer.favoriteIconPath3;
        }
    }
}

TwitterRenderer.getTweetSemanticsDiv = function (tweetId, styleInfo) {
    var imgReply = document.createElement('img');
    imgReply.className = styleInfo.styles.tweetSemantics;
    imgReply.src = TwitterRenderer.replyIconPath1;

    var imgRetweet = document.createElement('img');
    imgRetweet.className = styleInfo.styles.tweetSemantics;
    imgRetweet.src = TwitterRenderer.retweetIconPath1;

    var imgFavorite = document.createElement('img');
    imgFavorite.className = styleInfo.styles.tweetSemantics;
    imgFavorite.src = TwitterRenderer.favoriteIconPath1;

    var a_reply = document.createElement('a');
    a_reply.className = styleInfo.styles.tweetSemantics;
    a_reply.setAttribute("url", "https://twitter.com/intent/tweet?in_reply_to=" + tweetId);
    a_reply.setAttribute("tweetId", tweetId);
    a_reply.addEventListener('click', TwitterRenderer.createReplyBox);
    a_reply.addEventListener('mouseover', TwitterRenderer.highlightTweetSemanticsIcon);
    a_reply.addEventListener('mouseout', TwitterRenderer.unhighlightTweetSemanticsIcon);
    a_reply.appendChild(imgReply);

    var a_retweet = document.createElement('a');
    a_retweet.className = styleInfo.styles.tweetSemantics;
    a_retweet.setAttribute("url", "https://twitter.com/intent/retweet?tweet_id=" + tweetId);
    a_retweet.setAttribute("id", "retweetIcon" + tweetId);
    a_retweet.setAttribute("tweetId", tweetId);
    a_retweet.addEventListener('click', TwitterRenderer.postRetweet);
    a_retweet.addEventListener('mouseover', TwitterRenderer.highlightTweetSemanticsIcon);
    a_retweet.addEventListener('mouseout', TwitterRenderer.unhighlightTweetSemanticsIcon);
    a_retweet.appendChild(imgRetweet);

    var a_favorite = document.createElement('a');
    a_favorite.className = styleInfo.styles.tweetSemantics;
    a_favorite.setAttribute("url", "https://twitter.com/intent/favorite?tweet_id=" + tweetId);
    a_favorite.setAttribute("id", "favoriteIcon" + tweetId);
    a_favorite.setAttribute("tweetId", tweetId);
    a_favorite.addEventListener('click', TwitterRenderer.postFavorite);
    a_favorite.addEventListener('mouseover', TwitterRenderer.highlightTweetSemanticsIcon);
    a_favorite.addEventListener('mouseout', TwitterRenderer.unhighlightTweetSemanticsIcon);
    a_favorite.appendChild(imgFavorite);

    var twSemanticsRow = document.createElement('div');
    twSemanticsRow.className = styleInfo.styles.tweetSemanticsRow;
    twSemanticsRow.appendChild(a_reply);
    twSemanticsRow.appendChild(a_retweet);
    twSemanticsRow.appendChild(a_favorite);

    var twSemanticsDiv = document.createElement('div');
    twSemanticsDiv.className = styleInfo.styles.tweetSemanticsDiv;
    twSemanticsDiv.appendChild(twSemanticsRow);

    return twSemanticsDiv;
}
