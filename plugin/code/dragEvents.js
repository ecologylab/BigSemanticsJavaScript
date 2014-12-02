document.addEventListener("dragstart", extractOnDrag);

function extractOnDrag(event) 
{
	reset();
	display = false;
	callService(MMD);
	attachInfo(event);
}

/*
 * attaches the needed information to the target node before it sends metadata to ideamache
 */
function attachInfo(event)
{	
	console.log("extracting again . . ");
	console.log(event);
	var obj = new Object();
	obj.metadata = serializedMeta;
	obj.source = document.URL;
	obj.xpath = getPath(event.target);
	
	if (document.URL.indexOf("https://twitter.com") == 0)
	{
		obj.tweetUrl = getTwitterStatusUrl(event.target);
		if (obj.tweetUrl)
			obj.tweetUrl = "https://twitter.com" + obj.tweetUrl;
	}
	
	event.dataTransfer.setData("application/json",JSON.stringify(obj));
}

/*
 * gets xpath of target node of clipping
 */
function getPath(element)
{
	if (element.id != "")
	{
		return '//*[@id="'+element.id+'"]';
	}
	if (element == document.body)
	{
		return element.tagName.toLowerCase();
	}
	
	var parent = element.parentNode;
	var siblings = parent.childNodes;
	
	for (var i = 0; i < siblings.length; i++)
	{
		var sibling = siblings[i];
		if (sibling == element)
		{
			return getPath(element.parentNode) + '/' + element.tagName.toLowerCase();
		}
	}
}

function getTwitterStatusUrl(elt)
{
	var tweetUrl = null;
	while (elt)
	{
		if (elt.className && (elt.className == "StreamItem js-stream-item" || elt.className == "content"))
			break;
		else
			elt = elt.parentNode;
	}
	if (elt)
	{
		var tweetUrlElt = null;
		//user profile
		if (elt.className == "StreamItem js-stream-item")
		{
			tweetUrlElt = elt.getElementsByClassName("ProfileTweet-timestamp js-permalink js-nav js-tooltip")[0];
			tweetUrl = tweetUrlElt.getAttribute("href");
		}
		//home feed, hashtag
		if (elt.className == "content")
		{
			tweetUrlElt = elt.getElementsByClassName("tweet-timestamp js-permalink js-nav js-tooltip")[0];
			tweetUrl = tweetUrlElt.getAttribute("href");
		}
	}
	return tweetUrl;
}