var selectedScopeLI = null;
var selectedObjectLI = null;


function selectScope(event)
{
	if(selectedScopeLI != null)
	{
		selectedScopeLI.style.background = "#808080";
	}
	
	selectedScopeLI = event.target;
		selectedScopeLI.style.background = "lightgray";
	
	var scopeName = selectedScopeLI.innerText;
	selectedScope = getScope(scopeName);
	
	document.getElementById("selectedScope").innerText = scopeName;
	
	attemptToDeserialize();
}

function selectObject(event)
{
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
	
	attemptToDeserialize();
}

function createUnwrappedRawPrint(obj)
{
	var str = JSON.stringify(obj, undefined, 2);
	var pre = document.createElement('pre');
		pre.className = "unwrappedRawDisplay";
		pre.innerHTML = syntaxHighlight(str);
	
	return pre;
}

function attemptToDeserialize()
{
	if(selectedScope && selectedObject)
	{
		var scope = clone(selectedScope["simpl_types_scope"]);
		simplGraphResolve(scope);
		
		var obj = selectedObject;
		for(var property in obj)
		{
			obj = clone(obj[property]);
		}
		serializedObj = obj;
		deserializedObj = simplDeserialize(scope, obj);
		
		document.getElementById("toDiv").killChildren();
		
		try {
			document.getElementById("toDiv").appendChild(createUnwrappedRawPrint(deserializedObj));
		}
		catch(e)
		{
			document.getElementById("toDiv").write("Can't display object because of graph structure");
		}
	}
}