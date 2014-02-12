
// replace different hyperlink elements with styled divs.
// queue asynchronous population of these divs using loading of webpages via background script

var expandIconPath = chrome.extension.getURL("content_script/img/expand_icon.png");	// "https://abs.twimg.com/favicons/favicon.ico";
var collapseIconPath = chrome.extension.getURL("content_script/img/collapse_icon.png");

var mice_condition = "mice";
var experiment_condition = null;
var response_condition = null;
var userid = null;

var currentUrl = null;
var instance = null;

//call to get and replace divs, queue w on-demand prioritizing
function processPage()
{
	layoutExpandableItems(document, false); // re-layout given page with the expandable version of selected few items
}

function processMetadata(node)
{
	layoutExpandableItems(node, true); 	// re-layout items in expanded metadata
}

function downloadRequester(expandableItemUrl)
{
	chrome.extension.sendRequest({load: expandableItemUrl}, function(response) {
		  console.log(response);
		  MetadataRenderer.setMetadata(response.doc);
		  MetadataRenderer.setMetaMetadata(response.mmd);
	});
}

function onUpdateHandler()
{
	processPage();
}

function isExpanded(icon)
{
	return (icon.src == collapseIconPath)? true : false;
}

function expandCollapseItem()
{
	console.log("event received");
	var item = instance.getExpandedItem(this);
	
	var expandCollapseIcon = instance.getIcon(item);
	var collapse = isExpanded(expandCollapseIcon); 

	if (collapse)
	{
		expandCollapseIcon.src = expandIconPath;
		MetadataRenderer.hideMetadataDisplay(item);
	}
	else
	{
		expandCollapseIcon.src = collapseIconPath;
		
		if (instance.isExpanded(item))
		{
			MetadataRenderer.showMetadataDisplay(item);
		}
		else
		{
			var urlPrefix = instance.getUrlPrefix();
			
			// this refers to the element from which event handler was fired
			var expandableItemUrl = instance.getExpandableItemUrl(item);
			expandableItemUrl = urlPrefix + expandableItemUrl;
			console.log(expandableItemUrl);
			
			// relegate task of selecting apt parent to specific instance 
			var parent = instance.getContainer(item);
				
			MetadataRenderer.addMetadataDisplay(parent, expandableItemUrl, true, null, item);
			
			//request loading of webpage
			downloadRequester(expandableItemUrl);
			instance.setExpanded(item);
		}
	}	
}

function layoutExpandableItems(node, isMetadata)
{
	//var isMetadata = (node == document)? false : true;
	var expandableItemsXPath = instance.getExpandableItemsXPath(isMetadata);
	var expandableItemsXPathResult = 
			document.evaluate(expandableItemsXPath, node, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	
	for (var i = 0; i < expandableItemsXPathResult.snapshotLength; i++) 
	{
		// expand icon
		var expandCollapseIcon = document.createElement("img");
		expandCollapseIcon.src = expandIconPath;
		
		// append expand / collapse to the @username, #hashtag links
		var expandableItem = expandableItemsXPathResult.snapshotItem(i);
		instance.setIcon(expandableItem, expandCollapseIcon);
		//expandableItem.innerText = expandableItem.innerText + "+";

		instance.removeHrefAndSetAsUrl(expandableItem);
		instance.addClickEventListener(expandableItem, expandCollapseItem);
		
		// remove or add the identifying attribute to prevent re-processing
		instance.setProcessed(expandableItem);
		
		// add isMetadata attribute (useful in later custom handling)
		instance.setMetadataBoolean(expandableItem, isMetadata);
	}
}

function defaultConditionOnUpdateHandler()
{
	processDefaultConditionClicks(document);
}

function defaultConditionClickItem()
{
	if (MetadataRenderer.LoggingFunction)
	{
		//url_popped
		var item = instance.getExpandedItem(this);
		var url_p = instance.getUrlPrefix() + instance.getHrefAttribute(item);
		
		var eventObj = {
			url_popped: {
				url: url_p
			}
		}
		MetadataRenderer.LoggingFunction(eventObj);
	}
}

function processDefaultConditionClicks(node)
{
	var expandableItemsXPath = instance.getDefaultConditionXPath();
	var expandableItemsXPathResult = 
			document.evaluate(expandableItemsXPath, node, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	
	for (var i = 0; i < expandableItemsXPathResult.snapshotLength; i++) 
	{
		var expandableItem = expandableItemsXPathResult.snapshotItem(i);
		if (!instance.checkDefaultConditionProcessed(expandableItem))
		{
			instance.addClickEventListener(expandableItem, defaultConditionClickItem);
			
			// remove or add the identifying attribute to prevent re-processing
			instance.setDefaultConditionProcessed(expandableItem);			
		}
	}
}

function processUrlChange(newUrl)
{
	if (MetadataRenderer.LoggingFunction)
	{
		//url_changed
		var eventObj = {
			url_changed: {
				oldUrl: currentUrl,
				url: newUrl
			}
		}
		MetadataRenderer.LoggingFunction(eventObj);
	}
	
	currentUrl = newUrl;
	
	if(experiment_condition == mice_condition)
		processPage();
	else
		processDefaultConditionClicks(document);
}

function run_script(userid, cond)
{
	instance = getICEInstance();
	
	if(experiment_condition == mice_condition)
	{
		MetadataRenderer.initMetadataRenderings();

		if (MetadataRenderer.setMetadataProcessor)
			MetadataRenderer.setMetadataProcessor(processMetadata);

		if (MetadataRenderer.setDocumentDownloader)
			MetadataRenderer.setDocumentDownloader(downloadRequester);

		Logger.init(userid, cond);

		processPage();

		window.addEventListener("scroll", onUpdateHandler);
	}
	else
	{
		Logger.init(userid, cond);
		
		processDefaultConditionClicks(document);
		
		window.addEventListener("scroll", defaultConditionOnUpdateHandler);
	}
	currentUrl = document.URL;
}

function processInfoSheetResponse(resp)
{
	chrome.extension.sendRequest({storeOptions: {"agreeToInformationSheet": resp}});
	if (resp == Util.YES)
		run_script(response_condition, userid);
}

//run_at is document_end i.e. after DOM is complete but before images and frames are loaded
chrome.extension.sendRequest({loadOptions: document.URL}, function(response) {
	  
	if (response && response.condition != "none")
		experiment_condition = response.condition;
	else
		experiment_condition = mice_condition;
		  
	if (response && response.agree == Util.YES)
		run_script(response.userid, response.condition);
	else
	{
		if (response && response.agree != Util.NO)
		{
			response_condition = response.condition;
			userid = response.userid;
			Util.getInformationSheetResponse(processInfoSheetResponse);
		}
		//if (window.confirm(Util.info_sheet))
			//processInfoSheetResponse(Util.YES);
	}
});

chrome.extension.onRequest.addListener(
	function(request, sender, sendResponse) {
		
	if (request.url != null)
		processUrlChange(request.url);
});

