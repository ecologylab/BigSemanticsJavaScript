/*
 * NOTE: I'm going to rely on the service, since this is a test of a renderer, not a full app
 */function getParameter(param) {
  var val = document.URL;

  var loc = val.indexOf(param);

  if(loc === -1) {
    return -1;
  } else {
    var url = val.substr(loc);
    var n=url.replace(param+"=","");
    return n;
  }
}
 var reload_md = false;
function onBodyLoad() {
	RendererBase.idealRenderer = false;
	$(".collapse").collapse();

  //Register button call backs
  $('#mmdJsonButton').on('click', function (e) {

    $button = $('#mmdJsonButton');
    $otherButton = $('#mdJsonButton');
    if(!$button.hasClass("active")) {
      //This means it's not currently selected
      $otherButton.removeClass("btn-primary");
      $button.addClass("btn-primary");

      updateJSON(false);
    }

  });

  $('#moreMice').on('click', function (e) {
    $icon = $('#moreMiceIcon')

    if($icon.hasClass("icon-chevron-right"))
    {
      $icon.removeClass("icon-chevron-right");
      $icon.addClass("icon-chevron-down");
    }
    else
    {
      $icon.removeClass("icon-chevron-down");
      $icon.addClass("icon-chevron-right");
    }
  });

  $('#moreData').on('click', function (e) {
    $icon = $('#moreDataIcon')

    if($icon.hasClass("icon-chevron-right"))
    {
      $icon.removeClass("icon-chevron-right");
      $icon.addClass("icon-chevron-down");
    }
    else
    {
      $icon.removeClass("icon-chevron-down");
      $icon.addClass("icon-chevron-right");
    }
  });

  $('#mdJsonButton').on('click', function (e) {
    $button = $('#mdJsonButton');
    $otherButton = $('#mmdJsonButton');
    if(!$button.hasClass("active")) {
      //This means it's not currently selected
      $otherButton.removeClass("btn-primary");
      $button.addClass("btn-primary");

      updateJSON(true);
    }
  });

  //Try to get passed in parameter url
  var n = getParameter("url");
  if(n == -1) {
    showMetadata();
  } else {
    var linkInput = document.getElementById("targetURL");
    linkInput.value=decodeURIComponent(n);
    showMetadata();
  }
}
function syntaxHighlight(json) {
	  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
	    var cls = 'number';
	    if (/^"/.test(match)) {
	        if (/:$/.test(match)) {
	            cls = 'key';
	        } else {
	            cls = 'string';
	        }
	    } else if (/true|false/.test(match)) {
	        cls = 'boolean';
	    } else if (/null/.test(match)) {
	        cls = 'null';
	    }
	    return '<span class="' + cls + '">' + match + '</span>';
	  });
	}


var MDC_rawMetadata = "";
var MDC_rawMMD = "";

//Stringify the JSON and make it pretty looking
function updateJSON(isMetadata)
{ 
  var input = "";
  if(isMetadata) {
    input = MDC_rawMetadata;
  } else {
    input = MDC_rawMMD;
  }

  var content = document.getElementById("mdcJsonPP");
  var output = JSON.stringify(input, undefined, 4);
  content.innerHTML = syntaxHighlight(output);
}

//Sets the value of the link text box in the linking modal view
function setLinkValue()
{
  var linkInput = document.getElementById("modalLinkValue");
  var targetURL = document.getElementById("targetURL").value;
  var linkURL = document.URL;

  //If a target URL is already included in the document.URL, strip it out
  if(getParameter("url") != -1) {
    var loc = linkURL.indexOf("?url=");
    linkURL = linkURL.substr(0, loc);
  }

  //Append the targetURL for the new link
  linkInput.defaultValue=linkURL + "?url=" + encodeURIComponent(targetURL);
}

function onNewMMD(metametadata) {
  rawMMD = metametadata;
  console.log(metametadata);
}

function onNewMetadata(metadata) {
  rawMetadata = metadata;
  
	console.error("Error: calling onNewMetadata()");
  
  updateJSON(true);

  //Hate this but it's necessary for now... Service does funky redirect stuff when you request MMD with a URL
  var first;
  for(first in metadata)
    break;

  $.ajax({
    url: 'http://ecology-service.cse.tamu.edu/BigSemanticsService/mmd.jsonp',
    jsonp: 'callback',
    dataType: 'jsonp',
    data: { name: first},
    success: onNewMMD
  });

}

function getJSONData (targeturl)
{
	console.error("Error: calling getJSONData()");
	
  $.ajax({
    url: 'http://ecology-service.cse.tamu.edu/BigSemanticsService/metadata.jsonp',
    jsonp: 'callback',
    dataType: 'jsonp',
    data: { url: targeturl},
    success: onNewMetadata
  });
  
}
function toggleReload(){
	reload_md = !reload_md;
}
function checkForMissingMetadata()
{
	var url = document.getElementById("targetURL").value;
	var content = document.getElementById("mdcIce");		
	
	// if the tab doesnt have metadata
	if(content.getElementsByClassName("metadataContainer").length == 0 && content.getElementsByClassName("twMetadataContainer").length == 0)
	{
		if (MetadataLoader.isExtensionMetadataDomain(url))
			MetadataLoader.getMetadata(url, "MetadataLoader.setMetadata", reload_md);
	}	
}

function onEnterShowMetadata(event)
{
  if(event.keyCode == 13)
    showMetadata(); 
}

function showMetadata(url)
{
  var url = document.getElementById("targetURL").value;
  var content = document.getElementById("mdcIce");
  
  var hostname = window.location.hostname;
  var port = window.location.port;
  //SEMANTIC_SERVICE_URL = "http://" + hostname + ":" + port + "/BigSemanticsService/";
  SEMANTIC_SERVICE_URL = "http://localhost:8080/BigSemanticsService/";
 
  if(window.history.pushState)
  {
  	  window.history.pushState("state", "Mink Demo", "index.html?url="+url)    
  }
  
  MetadataLoader.clearDocumentCollection();
  var refreshCheckbox = document.getElementById('force_reload').checked;

  while(document.getElementById('mdcIce').childNodes.length > 0){
	  document.getElementById('mdcIce').removeChild(document.getElementById('mdcIce').childNodes[0]);
  }

  RendererBase.addMetadataDisplay(content, url, false, null, true, refreshCheckbox, Mink.render);

}