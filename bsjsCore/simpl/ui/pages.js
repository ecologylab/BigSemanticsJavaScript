var currentPage = "home";

var testSuite = null;
var selectedScope = null;
var selectedObject = null;

var serializedObj = null;
var deserializedObj = null;

function setup()
{
	buildTestSuiteSidebar();	
	initTestSuites(selectScope, selectObject);
	
	var hash = self.document.location.hash.substring(1);
	openPage(hash);
}

function openPage(pageName)
{
	switch(pageName)
	{
		case "deserialize": openDeserialize();
							break;
		case "serialize": 	openSerialize();
							break;
		case "de_serialize":openDe_Serialize();
							break;
		case "testSuites": 	openTestSuites();
							break;
	}
	
	currentPage = pageName;
}

function openTestSuites()
{
	removeCurrentPage();
	unhighlightLinks();
	
	// highlight link
	document.getElementById('testSuitesLink').className = "selectedLink";
}

function openDeserialize()
{
	removeCurrentPage();
	unhighlightLinks();
	
	// highlight link
	document.getElementById('deserializeLink').className = "selectedLink";
	
	var content = document.getElementById("content");
	
	var scopeLabel = document.createElement('span');
		scopeLabel.className = "typeScopeLabel";
		scopeLabel.innerText = "Simpl Type Scope:";
	content.appendChild(scopeLabel);
	
	var scopeName = document.createElement('span');
		scopeName.id = "selectedScope";
		scopeName.innerText = "none";
	content.appendChild(scopeName);
	
	var table = document.createElement('table');
	content.appendChild(table);
	
		var fromCol = document.createElement('td');
			fromCol.className = "testCol";
		table.appendChild(fromCol);
			
			var fromH3 = document.createElement('span');
				fromH3.innerText = "Serialized Object";
			fromCol.appendChild(fromH3);
			
			var fromVarName = document.createElement('span');
				fromVarName.className = "varName";
				fromVarName.innerText = "serializedObj";
			fromCol.appendChild(fromVarName);
			
			var fromDiv = document.createElement('div');
				fromDiv.id = "fromDiv";
			fromCol.appendChild(fromDiv);			
		
		
		var arrowCol = document.createElement('td');
			arrowCol.className = "arrowCol";
		table.appendChild(arrowCol);
					
			var arrow = document.createElement('div');
				arrow.className = "rightArrow";
			arrowCol.appendChild(arrow);
		
		
		var toCol = document.createElement('td');
			toCol.className = "testCol";
		table.appendChild(toCol);
		
			var toH3 = document.createElement('span');
				toH3.innerText = "Deserialized Object";
			toCol.appendChild(toH3);
			
			var toVarName = document.createElement('span');
				toVarName.className = "varName";
				toVarName.innerText = "deserializedObj";
			toCol.appendChild(toVarName);			
			
			var toDiv = document.createElement('div');
				toDiv.id = "toDiv";
			toCol.appendChild(toDiv);	
}

function openSerialize()
{
	removeCurrentPage();
	unhighlightLinks();
	
	// highlight link
	document.getElementById('serializeLink').className = "selectedLink";
	
	var content = document.getElementById("content");
	
	var scopeLabel = document.createElement('span');
		scopeLabel.className = "typeScopeLabel";
		scopeLabel.innerText = "Simpl Type Scope:";
	content.appendChild(scopeLabel);
	
	var scopeName = document.createElement('span');
		scopeName.id = "selectedScope";
		scopeName.innerText = "none";
	content.appendChild(scopeName);
	
	var table = document.createElement('table');
	content.appendChild(table);
	
		var fromCol = document.createElement('td');
			fromCol.className = "testCol";
		table.appendChild(fromCol);
			
			var fromH3 = document.createElement('span');
				fromH3.innerText = "Deserialized Object";
			fromCol.appendChild(fromH3);
			
			var fromVarName = document.createElement('span');
				fromVarName.className = "varName";
				fromVarName.innerText = "deserializedObj";
			fromCol.appendChild(fromVarName);
			
			var fromDiv = document.createElement('div');
				fromDiv.id = "fromDiv";
			fromCol.appendChild(fromDiv);			
		
		
		var arrowCol = document.createElement('td');
			arrowCol.className = "arrowCol";
		table.appendChild(arrowCol);
					
			var arrow = document.createElement('div');
				arrow.className = "rightArrow";
			arrowCol.appendChild(arrow);
		
		
		var toCol = document.createElement('td');
			toCol.className = "testCol";
		table.appendChild(toCol);
		
			var toH3 = document.createElement('span');
				toH3.innerText = "Serialized Object";
			toCol.appendChild(toH3);
			
			var toVarName = document.createElement('span');
				toVarName.className = "varName";
				toVarName.innerText = "serializedObj";
			toCol.appendChild(toVarName);			
			
			var toDiv = document.createElement('div');
				toDiv.id = "toDiv";
			toCol.appendChild(toDiv);	
}

function removeCurrentPage()
{
	document.getElementById('content').killChildren();
}

function unhighlightLinks()
{
	var links = document.getElementsByClassName('selectedLink');
	
	for(var i in links)
	{
		links[i].className = "applink";
	}
}

function buildTestSuiteSidebar()
{
	var sidebar = document.getElementById('sidebar');
		
	sidebar.appendChild(document.createElement('br'));
	
	var suiteButton = document.createElement('span');
		suiteButton.id = "selectTestSuite";
		
		var suiteName = document.createElement('span');
			suiteName.id = "selectedTestSuite";
			suiteName.innerText = "Selected Test Suite";
		suiteButton.appendChild(suiteName);
			
		var downArrow = document.createElement('div');
			downArrow.className = "downArrow";			
		suiteButton.appendChild(downArrow);
		
		suiteButton.onclick = openSuiteDropDown;
		
	sidebar.appendChild(suiteButton);
	
	var suiteDropDown = document.createElement('div');
		suiteDropDown.id = "suiteDropDown";
		
		var suiteList = document.createElement('ul');
			suiteList.id = "suiteList";
		suiteDropDown.appendChild(suiteList);
		
	sidebar.appendChild(suiteDropDown);
	
	var typeScopeListDiv = document.createElement('div');
		typeScopeListDiv.className = "listHolder";
		typeScopeListDiv.style.marginTop = "16px";
	sidebar.appendChild(typeScopeListDiv);
		
		var typeScopeHeader = document.createElement('h3');
			typeScopeHeader.innerText = "Simpl Type Scopes";
		typeScopeListDiv.appendChild(typeScopeHeader);
	
		var typeScopeList = document.createElement('ul');
			typeScopeList.id = "typeScopeList";
		typeScopeListDiv.appendChild(typeScopeList);
	
	
	var simplObjListDiv = document.createElement('div');
		simplObjListDiv.className = "listHolder";
	sidebar.appendChild(simplObjListDiv);
	
		var simplObjHeader = document.createElement('h3');
			simplObjHeader.innerText = "Simpl Objects";
		simplObjListDiv.appendChild(simplObjHeader);
	
		var simplObjList = document.createElement('ul');
			simplObjList.id = "testDataList";
		simplObjListDiv.appendChild(simplObjList);
		
	var appObjListDiv = document.createElement('div');
		appObjListDiv.className = "listHolder";
	sidebar.appendChild(appObjListDiv);
	
		var appObjHeader = document.createElement('h3');
			appObjHeader.innerText = "App Objects";
		appObjListDiv.appendChild(appObjHeader);
	
		var appObjList = document.createElement('ul');
			appObjList.id = "testAppDataList";
		appObjListDiv.appendChild(appObjList);
}
