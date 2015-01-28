
var reload_md = false;
//Helpful function from http://jsfiddle.net/KJQ9K/
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


//Thanks to http://bloggerplugnplay.blogspot.in/2012/08/how-to-get-url-parameter-in-javascript.html
function getParameter(param) {
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

function showMetadata()
{
  var url = document.getElementById("targetURL").value;
  var content = document.getElementById("mdcIce");
  if (document.URL.indexOf("http://localhost:") > -1){
	  var hostname = window.location.hostname;
	  var port = window.location.port;
	  SEMANTIC_SERVICE_URL = "http://" + hostname + ":" + port + "/BigSemanticsService/";

  }
  else{
	   SEMANTIC_SERVICE_URL = "http://ecology-service.cse.tamu.edu/BigSemanticsService/";

  }
  if(window.history.pushState)
  {
   
    
  	  window.history.pushState("state", "MICE Demo", "index.html?url="+url)

    
  }
  
  MetadataLoader.clearDocumentCollection();
  var refreshCheckbox = document.getElementById('force_reload').checked;
  
  var request_md = MetadataLoader.toRequestMetadataFromService(url);
    
  MICE.addMetadataDisplay(content, url, false, null, request_md, reload_md);
  if (!request_md)
  {
	  //document.dispatchEvent(new Event("tweetbubbleExternal"));
	  var message = {
			  type : "extractionRequest",
			  sender : content,
			  detail : {
				  url : url
			  }
	  };
	  ExtensionInterface.dispatchMessage(message);
	  console.log("requested extension for metadata: " + url);
	  
	  window.setTimeout(function()
	  {
		  checkForMissingMetadata();
	  }, 5000);
  }

 //getJSONData(url);
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

//Decide whether to show default or if there's a parameter passed in
function onBodyLoad() {
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

//Extends jquery to easily get a param value from URL
(function($) {
    $.QueryString = (function(a) {
        if (a == "") return {};
        var b = {};
        for (var i = 0; i < a.length; ++i)
        {
            var p=a[i].split('=');
            if (p.length != 2) continue;
            b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
        }
        return b;
    })(window.location.search.substr(1).split('&'))
})(jQuery);


