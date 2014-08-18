function handleDrag() {
	document.addEventListener("dragstart", attachInfo);
}

/*
 * attaches the needed information to the target node before it sends metadata to ideamache
 */
function attachInfo(event)
{	
	var obj = new Object();
	obj.metadata = serializedMeta;
	obj.source = document.URL;
	obj.xpath = getPath(event.target);
	
	event.dataTransfer.setData("application/json",JSON.stringify(obj));
}

/*
 * gets xpath of target node of clipping
 */
function getPath(element)
{
	//console.log("path");
	//console.log(element.id=="");
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
	//console.log(parent);
	//console.log(siblings);
	
	for (var i = 0; i < siblings.length; i++)
	{
		var sibling = siblings[i];
		if (sibling == element)
		{
			return getPath(element.parentNode) + '/' + element.tagName.toLowerCase();
		}
	}
}
