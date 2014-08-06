// function makeDraggable()
// {
	// console.log("Getting pictures and stuff. . .");
	// var images = document.getElementsByTagName("img");
	// var num = images.length;
// 
	// for (var i = 0; i < num; i++) {
		// images[i].draggable = true;
		// images[i].ondragstart = mouseDown;
	// }
// }


function dragStart(event)
{
	console.log(serializedMeta);
	//var data = event.dataTransfer.setData("Text",serializedMeta); //??
}


function handleDrag() {
	document.addEventListener("dragstart", attach);
}


function attach(event)
{
	//console.log(event);
	// var element = event.srcElement;
	// event.srcElement['simpl:metadata'] = serializedMeta;
	// event.srcElement.ondragstart = dragStart;
	// console.log(event);
	
	var obj = new Object();
	obj.metadata = serializedMeta;
	obj.source = document.URL;
	obj.xpath = getPath(event.target);
	//getPath(event.target);
	console.log(obj.xpath);
	//console.log(event.target);
	
	event.dataTransfer.setData("application/json",JSON.stringify(obj));
	
}

function getPath(element)
{
	console.log("path");
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
