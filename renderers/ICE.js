
// replace different hyperlink elements with styled divs.
// queue asynchronous population of these divs using loading of webpages via background script

var iconDir = "";
if (application_name == "mdc")
	iconDir = "../renderers/images/tweetBubble/";
else if (application_name == "ideamache")
	iconDir = "/static/mache/code/BigSemanticsJS/renderers/images/tweetBubble/";
else if (application_name == "tweetbubble")//tweetbubble
	iconDir = chrome.extension.getURL("content_script/img/");
else if (application_name == "dod")
	iconDir = "../../BigSemanticsJavascript/renderers/images/tweetBubble/";

var expandIconPath =  iconDir + "expand_icon.png";	// "https://abs.twimg.com/favicons/favicon.ico";
var collapseIconPath = iconDir + 	"collapse_icon.png";

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
	addScrollBackAndCollapseForContainers();
	addOtherEventHandlers();
}

function processMetadata(node)
{
	layoutExpandableItems(node, true); 	// re-layout items in expanded metadata
	addExternalURLHandlers();
}

function downloadRequester(expandableItemUrl, container)
{
	if (!isExtension)
	{
		//document.dispatchEvent(new Event("tweetbubbleExternal"));
		var message = {
				type : "extractionRequest",
				sender : container,
				detail : {
					url : expandableItemUrl
				}
			};
			ExtensionInterface.dispatchMessage(message);
			console.log("requested extension for metadata: " + location);
	}
	else
	{
		chrome.extension.sendRequest({load: expandableItemUrl}, function(response) {
			console.log(response);
			MetadataLoader.setMetadata(response.doc, false);
			MetadataLoader.setMetaMetadata(response.mmd);
		});
	}
}

function onUpdateHandler()
{
	if (MetadataLoader.logger)
	{
		var eventObj = {
			scroll: {
				offsetX: window.pageXOffset,
				offsetY: window.pageYOffset
			}
		}
		MetadataLoader.logger(eventObj);
	}
	processPage();
}

function isExpanded(icon)
{
	return (icon.src == collapseIconPath)? true : false;
}
function tbRecieve(){
	event.data.mmd.renderer = 'tweetbubble';
	MetadataLoader.setMetadata(event.data.md, false);
	MetadataLoader.setMetaMetadata(event.data.mmd);
	
}
function expandCollapseItem(event)
{
	console.log("event received");
	var item = instance.getExpandedItem(this);
	
	var expandCollapseIcon = instance.getIcon(item);
	var collapse = isExpanded(expandCollapseIcon); 

	if (collapse)
	{
		expandCollapseIcon.src = expandIconPath;
		TwitterRenderer.hideMetadataDisplay(item);
	}
	else
	{
		expandCollapseIcon.src = collapseIconPath;
		
		if (instance.isCached(item))
		{
			TwitterRenderer.showMetadataDisplay(item);
		}
		else
		{
			var urlPrefix = instance.getUrlPrefix();
			
			// this refers to the element from which event handler was fired
			var expandableItemUrl = instance.getExpandableItemUrl(item);
			if (expandableItemUrl.indexOf("http") != 0)
				expandableItemUrl = urlPrefix + expandableItemUrl;
			console.log(expandableItemUrl);
			
			// relegate task of selecting apt parent to specific instance 
			var parent = instance.getContainer(item);
			var options = {
				isRoot: true,
				expandedItem: item
			};
			TwitterRenderer.addMetadataDisplay(parent, expandableItemUrl, null, TwitterRenderer.render, options);

			if(application_name != 'mdc'){

				//request loading of webpage
				//downloadRequester(expandableItemUrl, parent);
				instance.setCached(item);
			}
			else{
				var message = {
					  type : "GET_MD",
					  sender : "PAGE",
						  url : expandableItemUrl,
					  callback: 'tbRecieve'
					};
					ExtensionInterface.dispatchMessage(message);
					console.log("requested extension for metadata: " + location);
			}
		}
	}
	instance.setItemClick(event);
}

function scrollBackAndCollpaseHandler(event)
{
	if (MetadataLoader.logger && !instance.isItemClick(event))
	{
		//container clicked
		var eventObj = instance.getContainerClickedEventObj(this);
		MetadataLoader.logger(eventObj);
	}
		
	var elt = this;
	var y = 0;        
    while (elt && (typeof elt.offsetTop !== "undefined") && !isNaN(elt.offsetTop))
    {
    	y += elt.offsetTop;
    	elt = elt.offsetParent;
    }
    
    if (window.pageYOffset > y)
	{
		var containers = instance.getContainers(this);
		var documentContainers = [];
		
		for (var i = 0; i < containers.length; i++)
		{
			documentContainers = 
					documentContainers.concat(TwitterRenderer.getDocumentContainersByContainer(containers[i]));
		}
		
		if (documentContainers.length > 0)
			TwitterRenderer.animateScrollBackAndCollapse(y, 
					{content_expansions: documentContainers, metadata_expansion_buttons: []});
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
		instance.setExpandableItemProcessed(expandableItem);
		
		// add isMetadata attribute (useful in later custom handling)
		instance.setMetadataBoolean(expandableItem, isMetadata);
	}
}

function addScrollBackAndCollapseForContainers() 
{
	var containersXPath = instance.getContainersXPath();
	var containersXPathResult = 
		document.evaluate(containersXPath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	
	for (var i = 0; i < containersXPathResult.snapshotLength; i++)
	{
		var container = containersXPathResult.snapshotItem(i);
		if (!instance.isProcessed(container))
		{
			instance.addTargetEventListener(container, 'click', scrollBackAndCollpaseHandler);
			instance.setProcessed(container);
		}
	}
}

function ajaxContentUpdate()
{
	if (MetadataLoader.logger)
	{
		var eventObj = {
			ajax_update: {
				url: currentUrl
			}
		}
		MetadataLoader.logger(eventObj);
	}
	
	setTimeout(function() {
		if(experiment_condition == mice_condition)
			processPage();
		else
			processDefaultConditionClicks(document);
	}, 1000);
}

function logExternalURLClick(event) 
{
	instance.setItemClick(event);
	if (MetadataLoader.logger)
	{
		var eventObj = instance.getExternalURLClickedEventObj(this);
		MetadataLoader.logger(eventObj);
	}
}

function addExternalURLHandlers() 
{
	var externalURLsXPath = instance.getExternalURLsXPath();
	var externalURLsXPathResult = 
		document.evaluate(externalURLsXPath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	
	for (var i = 0; i < externalURLsXPathResult.snapshotLength; i++)
	{
		var externalURL = externalURLsXPathResult.snapshotItem(i);
		if (!instance.isProcessed(externalURL))
		{
			instance.addTargetEventListener(externalURL, 'click', logExternalURLClick);
			instance.checkAndSetExternalUrlTarget(externalURL);
			instance.setProcessed(externalURL);
		}		
	}
}

function addOtherEventHandlers()
{
	addExternalURLHandlers();
	
	instance.addOtherEventHandlers();
}

function defaultConditionOnUpdateHandler()
{
	if (MetadataLoader.logger)
	{
		var eventObj = {
			scroll: {
				offsetX: window.pageXOffset,
				offsetY: window.pageYOffset
			}
		}
		MetadataLoader.logger(eventObj);
	}
	processDefaultConditionClicks(document);
}

function defaultConditionItemClick(event)
{
	instance.setItemClick(event);
	if (MetadataLoader.logger)
	{
		//item clicked
		var eventObj = instance.getItemClickedEventObj(this);
		MetadataLoader.logger(eventObj);
	}
}

function defaultConditionContainerClick(event)
{
	if (MetadataLoader.logger && !instance.isItemClick(event))
	{
		//container clicked
		var eventObj = instance.getContainerClickedEventObj(this);
		MetadataLoader.logger(eventObj);
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
		if (!instance.checkDefaultConditionItemProcessed(expandableItem))
		{
			instance.addClickEventListener(expandableItem, defaultConditionItemClick);
			
			// remove or add the identifying attribute to prevent re-processing
			instance.setDefaultConditionItemProcessed(expandableItem);			
		}
	}
	
	var containersXPath = instance.getContainersXPath();
	var containersXPathResult = 
		document.evaluate(containersXPath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	
	for (var i = 0; i < containersXPathResult.snapshotLength; i++)
	{
		var container = containersXPathResult.snapshotItem(i);
		if (!instance.isProcessed(container))
		{
			instance.addTargetEventListener(container, 'click', defaultConditionContainerClick);
			instance.setProcessed(container);
		}
	}
	
	addOtherEventHandlers();
}

function processUrlChange(newUrl)
{
	if (MetadataLoader.logger)
	{
		//url_changed
		var eventObj = {
			url_changed: {
				old_url: currentUrl,
				new_url: newUrl
			}
		}
		MetadataLoader.logger(eventObj);
	}
	
	currentUrl = newUrl;
	
	if(experiment_condition == mice_condition)
		processPage();
	else
		processDefaultConditionClicks(document);
}

function run_script(userid, cond, username)
{
	instance = getICEInstance();
	
	if(experiment_condition == mice_condition)
	{
//		TwitterRenderer.initialize();

		if (TwitterRenderer.setMetadataProcessor)
			TwitterRenderer.setMetadataProcessor(processMetadata);

		if (TwitterRenderer.setDocumentDownloader)
			TwitterRenderer.setDocumentDownloader(downloadRequester);

//		if (isExtension)
//		{
//			Logger.init(userid, cond);
//		}

		processPage();
		
		if (isExtension)
		{
			window.addEventListener("scroll", onUpdateHandler);
		}
	}
	else
	{
		if (isExtension)
		{
			Logger.init(userid, cond);
		}
		
		processDefaultConditionClicks(document);
		
		if (isExtension)
		{
			window.addEventListener("scroll", defaultConditionOnUpdateHandler);
		}
	}
	
	currentUrl = document.URL;
	if (isExtension)
		instance.validateUserInfo(username);
	
	if (isExtension) 
	{
		setInterval(function() {
			instance.addAJAXContentListener(ajaxContentUpdate);
		}, 5000);
	}
}

function processInfoSheetResponse(resp, cancelType)
{
	if (cancelType == "access_grant")
	{
		var resp1 = (resp == Util.YES)? undefined : resp;
		chrome.extension.sendRequest({storeStudySettings: {"agreeToAccessGrant": resp, "agreeToInformationSheet": resp1}});
	}
	else if (cancelType == "infosheet_disagree")
	{
		chrome.extension.sendRequest({storeStudySettings: {"agreeToInformationSheet": resp}}, function(response) {
			var url = document.URL;
			var paramIndex = url.indexOf('?'); 
			if (paramIndex != -1)
				url = url.substr(0, paramIndex);
			window.location.replace(url);
		});
	}
	//if (resp == Util.YES)
		//run_script(userid, response_condition);
}

function isAccessGranted(response)
{
	if (response.oauth_token && response.oauth_token_secret)
	{
		return true;
	}
	else
	{
		var params = document.URL.substr(document.URL.indexOf('?') + 1).split('&');
		var oauth_token = null;
		var oauth_verifier = null;
		var oauth_token_str = "oauth_token=";
		var oauth_verifier_str = "oauth_verifier=";
		for (var i = 0; i < params.length; i++)
		{
			if (params[i].indexOf(oauth_token_str) == 0)
			{
				oauth_token = params[i].substr(oauth_token_str.length);
			}
			if (params[i].indexOf(oauth_verifier_str) == 0)
			{
				oauth_verifier = params[i].substr(oauth_verifier_str.length);
			}
		}
		if (oauth_token && oauth_verifier)
		{
			TwitterOAuth.accessTokenHelper(oauth_token, oauth_verifier);
			return true;
		}
		else
		{
			return false;
		}
	}
}

function logPendingDeclines(userId, access_grant, info_sheet)
{
	if (MetadataLoader.logger && typeof access_grant !== "undefined" && typeof info_sheet !== "undefined")
	{
		var eventObj = {
			agree: {
				userid: userId,
				accessgrant: access_grant,
				infosheet: info_sheet
			}
		}
		MetadataLoader.logger(eventObj);
		chrome.extension.sendRequest({storeStudySettings: {"loggedPending": true}});
	}
}

//run_at is document_end i.e. after DOM is complete but before images and frames are loaded
if (!isExtension)
{
	experiment_condition = mice_condition;
	if (document.URL.indexOf("https://twitter.com") != 0)
		run_script('imExtTest', mice_condition);
}
else
{
	chrome.extension.sendRequest({loadStudySettings: document.URL}, function(response) {
		  
		if (response && response.condition != "none")
			experiment_condition = response.condition;
		else
			experiment_condition = mice_condition;
		
		Logger.init(response.userid, response.condition);
		if (!response.loggedDeclines)
		{
			logPendingDeclines(response.userid, response.agreeAccessGrant, response.agree);
		}
		
		if (response && response.agreeAccessGrant != Util.NO && !isAccessGranted(response))
		{
			Util.promptUserForAccessGrant(processInfoSheetResponse, response.userid);
		}
		else
		{
			if (response && response.agree == Util.YES)
			{
				run_script(response.userid, response.condition, response.username);
			}
			else
			{
				if (response && response.agree != Util.NO)
				{
					response_condition = response.condition;
					userid = response.userid;
					Util.getInformationSheetResponse(processInfoSheetResponse, response.userid);
				}
				//if (window.confirm(Util.info_sheet))
					//processInfoSheetResponse(Util.YES);
			}
		}
		
		if (MetadataLoader.logger)
		{
			if (response && (response.last_userid != response.userid || response.last_condition != response.condition))
			{
				var eventObj = {
					change_settings: {
						lastUserId: response.last_userid,
						currUserId: response.userid,
						lastCond: response.last_condition,
						currCond: response.condition,
						infoSheetAgree: response.agree,
						user_info: response.user_info
					}
				}
				MetadataLoader.logger(eventObj);
			}
		}
	});
}

if (isExtension)
{
	chrome.runtime.onMessage.addListener(
		function(request, sender, sendResponse) {
			
		if (request.url != null)
			processUrlChange(request.url);
	});
}

function updateIconsPath(imgDir)
{
	TwitterRenderer.imgDir = imgDir;
	iconDir = imgDir;
	
	TwitterRenderer.replyIconPath1 = TwitterRenderer.imgDir + "reply_221.png";
	TwitterRenderer.retweetIconPath1 = TwitterRenderer.imgDir + "retweet_221.png";
	TwitterRenderer.favoriteIconPath1 = TwitterRenderer.imgDir + "favorite_221.png";
	TwitterRenderer.replyIconPath2 = TwitterRenderer.imgDir + "reply_153.png";
	TwitterRenderer.retweetIconPath2 = TwitterRenderer.imgDir + "retweet_153.png";
	TwitterRenderer.favoriteIconPath2 = TwitterRenderer.imgDir + "favorite_153.png";
	TwitterRenderer.retweetIconPath3 = TwitterRenderer.imgDir + "retweet_on.png";
	TwitterRenderer.favoriteIconPath3 = TwitterRenderer.imgDir + "favorite_on.png";

	expandIconPath =  iconDir + "expand_icon.png";
	collapseIconPath = iconDir + "collapse_icon.png";
}

