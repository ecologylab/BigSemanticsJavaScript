var resultsPerPage = 5;
var startingResult;
var content;

function processResults(results)
{
  var j;
  var url;
  var jsonObj;
  var count = 0;
 
  for (var i in results["rows"])
  {
  	if (i >= startingResult + resultsPerPage)
  	{
  		break;
  	}
  	
  	jsonObj = results["rows"][i]["doc"];

  	delete jsonObj._id;
  	delete jsonObj._rev;
  	
  	for (j in jsonObj)
  	{
		url = jsonObj[j]["location"];
  	}
  	
  	content = document.getElementById("queryResult" + count);

  	MetadataRenderer.addCachedMetadataDisplay(content, url, jsonObj, true);
  	
  	count += 1;
  }
}

function queryFieldValues()
{
  startingResult = 0;
  var field = document.getElementById("fieldCase0").value;
  var document_type = document.getElementById("documentTypeCase0").value;

  var script = document.createElement('script');
  script.src = "http://128.194.128.164:8090/BigSemanticsService/query_field_values.json?callback=processResults&type=" + document_type + "&field=" + field;
  document.head.appendChild(script);
}

function queryMetadataValue()
{
  var field = document.getElementById("fieldCase1").value;
  var document_type = document.getElementById("documentTypeCase1").value;
  var value = document.getElementById("valueCase1").value;

  var script = document.createElement('script');
  script.src = "http://128.194.128.164:8090/BigSemanticsService/query_metadata_value.json?callback=processResults&type=" + document_type + "&field=" + field + "&value=" + value;
  document.head.appendChild(script);
}

function queryMetadataRange()
{
  var field = document.getElementById("fieldCase2").value;
  var document_type = document.getElementById("documentTypeCase2").value;
  var min = document.getElementById("min").value;
  var max = document.getElementById("max").value;
    
  var script = document.createElement('script');
  script.src = "http://128.194.128.164:8090/BigSemanticsService/query_metadata_range.json?callback=processResults&type=" + document_type + "&field=" + field + "&lower=" + min + "&upper=" + max;
  document.head.appendChild(script);
}

function queryMetadataKeyword()
{
  var keyword = document.getElementById("keyword").value;

  var script = document.createElement('script');
  script.src = "http://128.194.128.164:8090/BigSemanticsService/query_metadata_keyword.json?callback=processResults&keyword=" + keyword;
  document.head.appendChild(script);
}

function collapse() 
{
  $(".collapse").collapse();
}