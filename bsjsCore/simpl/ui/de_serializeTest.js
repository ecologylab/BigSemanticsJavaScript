var selectedScopeLI = null;
var selectedObjectLI = null;


function selectScope(event)
{
	if(currentPage == "testSuites")
	{
		viewScope(event);
		return;
	}
	
	if(selectedScopeLI != null)
	{
		selectedScopeLI.style.background = "#808080";
	}
	
	selectedScopeLI = event.target;
		selectedScopeLI.style.background = "lightgray";
	
	var scopeName = selectedScopeLI.innerText;
	selectedScope = getScope(scopeName);
	
	document.getElementById("selectedScope").innerText = scopeName;
	
	attemptToDe_Serialize();
}

function selectObject(event)
{
	if(currentPage == "testSuites")
	{
		viewObject(event);
		return;
	}
	
	if(selectedObjectLI != null)
	{
		selectedObjectLI.style.background = "#808080";
	}
	
	selectedObjectLI = event.target;
		selectedObjectLI.style.background = "lightgray";
	
	var objName = selectedObjectLI.innerText;
	selectedObject = getTestObject(objName);
	
	serializedObj = selectedObject;
	
	document.getElementById("fromDiv").killChildren();
	document.getElementById("fromDiv").appendChild(createUnwrappedRawPrint(selectedObject));
	
	attemptToDe_Serialize();
}

function createUnwrappedRawPrint(obj)
{
	var str = "Could not stringify due to graph structure";
	try
	{
		str = JSON.stringify(obj, undefined, 2);
	}
	catch(e)
	{
		
	}
	var pre = document.createElement('pre');
		pre.className = "unwrappedRawDisplay";
		pre.innerHTML = syntaxHighlight(str);
	
	return pre;
}

function attemptToDe_Serialize()
{
	if(selectedScope && selectedObject)
	{
		switch(currentPage)
		{
			case "deserialize" : 	attemptToDeserialize();
									break;
			case "serialize" : 		attemptToSerialize();
									break;
		}
	}
}

var scope = null;
function attemptToSerialize()
{
	scope = new SimplTypeScope(selectedScope);
		
	var obj = selectedObject;
	for(var property in obj)
	{
		obj = obj[property];
	}
	
	deserializedObj = obj;
	serializedObj = scope.serialize(obj);
	
	document.getElementById("toDiv").killChildren();
	
	try {
		document.getElementById("toDiv").appendChild(createUnwrappedRawPrint(serializedObj));
	}
	catch(e)
	{
		document.getElementById("toDiv").write("Can't display object because of graph structure");
	}
}

function attemptToDeserialize()
{
	scope = new SimplTypeScope(selectedScope);
	
	var obj = selectedObject;
	for(var property in obj)
	{
		obj = clone(obj[property]);
	}
	
	serializedObj = obj;
	deserializedObj = scope.deserialize(obj);
	
	document.getElementById("toDiv").killChildren();
	
	try {
		document.getElementById("toDiv").appendChild(createUnwrappedRawPrint(deserializedObj));
	}
	catch(e)
	{
		document.getElementById("toDiv").write("Can't display object because of graph structure");
	}
}