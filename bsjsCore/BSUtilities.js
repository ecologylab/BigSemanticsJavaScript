var BSUtils = {};

/** 
 * Make the string prettier by replacing underscores with spaces  
 * @param string to make over
 * @return hansome string, a real genlteman
 */
BSUtils.toDisplayCase = function(string)
{  
  var strings = string.split('_');
  var display = "";
  for (var s in strings)
  {
    display += strings[s].charAt(0).toLowerCase() + strings[s].slice(1) + " ";
  }
  return display;
}

/**
 * Remove line breaks from the string and any non-ASCII characters
 * @param string
 * @return a string with no line breaks or crazy characters
 */
BSUtils.removeLineBreaksAndCrazies = function(string)
{
  string = string.replace(/(\r\n|\n|\r)/gm," ");  
  var result = "";
  for (var i = 0; i < string.length; i++)
  {
    if (string.charCodeAt(i) < 128)
    {
      result += string.charAt(i);
    }
  }
  return result;
}


/**
 * Gets the host from a URL
 * @param url, string of the target URL
 * @return host as a string
 */
BSUtils.getHost = function(url)
{
  if (url)
  {
    if (url.match(/:\/\/(www\.)?(.[^/:]+)/) != null)
		 return "http://www." + url.match(/:\/\/(www\.)?(.[^/:]+)/)[2];
	else
		return "error getting domain";
   
  }
}

/**
 * Gets the favicon image for a url
 * @param url, string of target URL
 * @return string of the favicon url
 */
BSUtils.getFaviconURL = function(url)
{
	//return BSUtils.getHost(url) + "/favicon.ico";
	
	//return "http://g.etfv.co/" + url;
	
	return "http://www.google.com/s2/favicons?domain_url=" + url;	
}

//src: http://stackoverflow.com/questions/359788/how-to-execute-a-javascript-function-when-i-have-its-name-as-a-string
function executeFunctionByName(functionName, context) {
  var args = [].slice.call(arguments).splice(2);
  var namespaces = functionName.split(".");
  var func = namespaces.pop();
  for(var i = 0; i < namespaces.length; i++) {
    context = context[namespaces[i]];
  }
  return context[func].apply(this, args);
}