var testSuite = null;

function setup()
{
	initTestSuite();
}

function initTestSuite()
{
	testSuite = simplTestSuites[0];
	if(testSuite)
	{
		// init label
		document.getElementById("selectedTestSuite").innerText = testSuite.name;
		
		// init type list
		var scopeList = document.getElementById("typeScopeList");
		scopeList.killChildren();
		
		for(var i in testSuite.typeScopes)
		{
			var scope = testSuite.typeScopes[i];
			var li = document.createElement('li');
			li.onclick = selectScope;
			li.innerText = scope["simpl_types_scope"]["name"];
			
			scopeList.appendChild(li);
		}
		
		// init test object list
		var objList = document.getElementById("testDataList");
		objList.killChildren();
		
		for(var i in testSuite.testObjects)
		{
			var obj = testSuite.testObjects[i];
			var li = document.createElement('li');
				li.onclick = selectObject;
			
			for(var property in obj)
				li.innerText = property;
			
			objList.appendChild(li);
		}
	}
}

function selectScope(event)
{
	var scopeName = event.target.innerText;
	var scope = getScope(scopeName);
	displayRawJSON(scope);
	
}

function selectObject(event)
{
	var objName = event.target.innerText;
	var obj = getTestObject(objName);
	displayRawJSON(obj);
}

function displayRawJSON(obj)
{
	var str = JSON.stringify(obj, undefined, 2);
	var pre = document.createElement('pre');
		pre.innerHTML = syntaxHighlight(str);
	
	document.getElementById('content').killChildren();
	
	document.getElementById('content').appendChild(pre); 
	console.log(pre);
}

function getScope(name)
{
	for(var i in testSuite.typeScopes)
	{
		var scope = testSuite.typeScopes[i];
		if(name == scope["simpl_types_scope"]["name"])
			return scope["simpl_types_scope"];
	}
	return null;
}

function getTestObject(name)
{
	for(var i in testSuite.testObjects)
	{
		var obj = testSuite.testObjects[i];		
		for(var property in obj)
		{
			if(name == property)
				return obj;
		}
	}
	return null;
}
























