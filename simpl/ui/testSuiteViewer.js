
function initTestSuites(scopeHandler, objHandler)
{
	if(getUrlVars()["suite"])
	{
		var suiteNameFromUrl = getUrlVars()["suite"].substring(0, getUrlVars()["suite"].indexOf("#"));
		var suiteFromUrl = getSuite(suiteNameFromUrl);
		
		if(suiteFromUrl)
		{
			testSuite = suiteFromUrl;
		}
		else
		{
			testSuite = simplTestSuites[0];
		}
	}
		
	if(testSuite)
	{
		setTestSuite(testSuite, scopeHandler, objHandler);
	}
	
	suiteList = document.getElementById("suiteList");
	suiteList.killChildren();
	
	for(var i in simplTestSuites)
	{
		var obj = simplTestSuites[i];
		var li = document.createElement('li');
			li.innerText = obj.name;
			li.onclick = selectTestSuite;
		
		suiteList.appendChild(li);
	}
}

function setTestSuite(testSuite, scopeHandler, objHandler)
{
	if(getUrlVars()["suite"] != testSuite.name)
	{
		var baseUrl = document.location.href.substring(0, document.location.href.indexOf("?", 0));
		var hash = document.location.hash;
		document.location = baseUrl + "?suite=" + testSuite.name + hash;
	}
	// init label
	document.getElementById("selectedTestSuite").innerText = testSuite.name;
	
	// init type list
	var scopeList = document.getElementById("typeScopeList");
	scopeList.killChildren();
	
	for(var i in testSuite.typeScopes)
	{
		var scope = testSuite.typeScopes[i];
		var li = document.createElement('li');
		li.onclick = scopeHandler;
		li.innerText = scope["simpl_types_scope"]["name"];
		
		scopeList.appendChild(li);
	}
	
	// init test object list
	var objList = document.getElementById("testDataList");
	objList.killChildren();
	
	for(var i in testSuite.testSimplObjects)
	{
		var obj = testSuite.testSimplObjects[i];
		var li = document.createElement('li');
			li.onclick = objHandler;
		
		for(var property in obj)
			li.innerText = property;
		
		objList.appendChild(li);
	}
	
	objList = document.getElementById("testAppDataList");
	objList.killChildren();
	
	for(var i in testSuite.testUserObjects)
	{
		var obj = testSuite.testUserObjects[i];
		var li = document.createElement('li');
			li.onclick = objHandler;
		
		for(var property in obj)
			li.innerText = property;
		
		objList.appendChild(li);
	}
}

var selectedListItem = null;

function viewScope(event)
{
	if(selectedListItem != null)
	{
		selectedListItem.style.background = "#808080";
	}
	
	selectedListItem = event.target;
		selectedListItem.style.background = "lightgray";
	
	var scopeName = selectedListItem.innerText;
	var scope = getScope(scopeName);
	
	
	showObject(scope, document.getElementById("content"));	
}

function viewObject(event)
{
	if(selectedListItem != null)
	{
		selectedListItem.style.background = "#808080";
	}
	
	selectedListItem = event.target;
		selectedListItem.style.background = "lightgray";
	
	var objName = event.target.innerText;
	var obj = getTestObject(objName);
	
	
	showObject(obj, document.getElementById("content"));
}

function showObject(obj, containerDiv)
{
	var controls = createControls(obj);
	var rawPrint = createRawPrint(obj);
	var prettyPrint = createPrettyPrint(obj);
	
	
	containerDiv.killChildren();
		
	containerDiv.appendChild(controls);
	containerDiv.appendChild(rawPrint);
	containerDiv.appendChild(prettyPrint);
	
	if(isSimplTypeScope(obj))
	{
		showPretty();	
	}
	else
	{
		showRaw();
	}
}

function selectTestSuite(event)
{
	var suiteName = event.target.innerText;
	testSuite = getSuite(suiteName);
	
	if(testSuite)
		setTestSuite(testSuite, selectScope, selectObject);
	document.getElementById("suiteDropDown").style.display = "none";
}

function getSuite(name)
{
	for(i in simplTestSuites)
	{
		if(simplTestSuites[i].name == name)
			return simplTestSuites[i];
	}
	return null;
}

function openSuiteDropDown()
{
	 document.getElementById("suiteDropDown").style.display = "block";
}

function createControls(obj)
{	
	var div = document.createElement('div');
		div.id = "displayControls";
	
	var prettyButton = document.createElement('a');
		prettyButton.className = "button";
		prettyButton.id = "prettyButton";
		prettyButton.innerText = "Pretty";
		
		if(isSimplTypeScope(obj))
		{
			prettyButton.className = "selected";
			prettyButton.onclick = showPretty;
			prettyStyle = "button";
		}
		else
		{
			prettyButton.className = "disabled";
			prettyStyle = "disabled";
		}
		
	var rawButton = document.createElement('a');
		rawButton.className = "button";
		rawButton.id = "rawButton";
		rawButton.innerText = "Raw";
		rawButton.onclick = showRaw;
		
	div.appendChild(prettyButton);
	div.appendChild(rawButton);
	return div;
}

function createRawPrint(obj)
{
	var str = JSON.stringify(obj, undefined, 2);
	var pre = document.createElement('pre');
		pre.id = "rawDisplay";
		pre.innerHTML = syntaxHighlight(str);
	
	return pre;
}

function getScope(name)
{
	for(var i in testSuite.typeScopes)
	{
		var scope = testSuite.typeScopes[i];
		if(name == scope["simpl_types_scope"]["name"])
			return scope;
	}
	return null;
}

function getTestObject(name)
{
	for(var i in testSuite.testSimplObjects)
	{
		var obj = testSuite.testSimplObjects[i];		
		for(var property in obj)
		{
			if(name == property)
				return obj;
		}
	}
	for(var i in testSuite.testUserObjects)
	{
		var obj = testSuite.testUserObjects[i];		
		for(var property in obj)
		{
			if(name == property)
				return obj;
		}
	}
	return null;
}

function isSimplTypeScope(obj)
{
	var firstKey = null;
	for(var property in obj)
	{
		firstKey = property;
	}
	
	if(firstKey == "simpl_types_scope")
	{
		return true;
	}
	return false;
}

var prettyStyle = "";

function showPretty()
{	
	document.getElementById("prettyDisplay").style.display = "block";
	document.getElementById("rawDisplay").style.display = "none";
	
	document.getElementById("prettyButton").className = "selected";
	document.getElementById("rawButton").className = "button";
}

function showRaw()
{	
	document.getElementById("prettyDisplay").style.display = "none";
	document.getElementById("rawDisplay").style.display = "block";
	
	document.getElementById("prettyButton").className = prettyStyle;
	document.getElementById("rawButton").className = "selected";
}

function getUrlVars()
{
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}




















