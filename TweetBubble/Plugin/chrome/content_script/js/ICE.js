
// replace different hyperlink elements with styled divs.
// queue asynchronous population of these divs using loading of webpages via background script

var expandIconPath = chrome.extension.getURL("content_script/img/expand_icon.png");	// "https://abs.twimg.com/favicons/favicon.ico";
var collapseIconPath = chrome.extension.getURL("content_script/img/collapse_icon.png");

var instance;

//call to get and replace divs, queue w on-demand prioritizing
function processPage()
{
	layoutExpandableItems(document, false); // re-layout given page with the expandable version of selected few items
}

function processMetadata(node)
{
	layoutExpandableItems(node, true); 	// re-layout items in expanded metadata
}

function onScrollHandler()
{
	processPage();
}

function isExpanded(icon)
{
	return (icon.src == collapseIconPath)? true : false;
}

function downloadRequester(expandableItemUrl)
{
	chrome.extension.sendRequest({load: expandableItemUrl}, function(response) {
		  console.log(response);
		  MetadataRenderer.setMetadata(response.doc);
		  MetadataRenderer.setMetaMetadata(response.mmd);
	});
}

function expandCollapseItem()
{
	console.log("event received");
	var expandCollapseIcon = instance.getIcon(this);
	var collapse = isExpanded(expandCollapseIcon); 
		
	if (collapse)
	{
		expandCollapseIcon.src = expandIconPath;
		MetadataRenderer.removeMetadataDisplay(this);
	}
	else
	{
		expandCollapseIcon.src = collapseIconPath;
		
		var urlPrefix = instance.getUrlPrefix();
		
		// this refers to the element from which event handler was fired
		var expandableItemUrl = instance.getExpandableItemUrl(this);
		expandableItemUrl = urlPrefix + expandableItemUrl;
		console.log(expandableItemUrl);
		
		// relegate task of selecting apt parent to specific instance 
		var parent = instance.getContainer(this);
			
		MetadataRenderer.addMetadataDisplay(parent, expandableItemUrl, true, null, this);
		
		//request loading of webpage
		downloadRequester(expandableItemUrl);
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
		expandableItem.addEventListener('click', expandCollapseItem);
		
		// remove or add the identifying attribute to prevent re-processing
		instance.setProcessed(expandableItem);
		
		// add isMetadata attribute (useful in later custom handling)
		instance.setMetadataBoolean(expandableItem, isMetadata);
	}
}

//run_at is document_end i.e. after DOM is complete but before images and frames are loaded
MetadataRenderer.initMetadataRenderings();

if (MetadataRenderer.setMetadataProcessor)
	MetadataRenderer.setMetadataProcessor(processMetadata);

if (MetadataRenderer.setDocumentDownloader)
	MetadataRenderer.setDocumentDownloader(downloadRequester);

Logger.init();

instance = getICEInstance();

processPage();

window.addEventListener("scroll", onScrollHandler);