// Utilities

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
  for (var s = 0; s < strings.length; s++)
  {
    display += strings[s].charAt(0).toLowerCase() + strings[s].slice(1) + " ";
  }
  return display;
}

// Unwrap a metadata object.
//
// For example: an Amazon Product metadata object sometimes takes the form of
//
//   { 'amazon_product': { 'mm_name': 'amazon_product', ... } }
//
// This is redundant because we now require all metadata object contain the
// 'mm_name' field. This function unwraps the (first) real metadata object if
// found in the input target. Otherwise, it returns the input target unchanged.
BSUtils.unwrap = function(target) {
  if (typeof target == 'object' && target != null) {
    if (target.mm_name || target.meta_metadata_name) {
      // the target itself is an unwrapped metadata.
      return target;
    }
    // temporary fix: the extraction code has a bug that child metadata do not
    // have mm_name or meta_metadata_name. this needs to be fixed.
    if (target.location || target.download_status) {
      return target;
    }
    // otherwise, return the first child with mm_name
    var keys = Object.keys(target);
    for (var i in keys) {
      var key = keys[i];
      if (typeof target[key] == 'object' && target[key] != null) {
        if (target[key].mm_name || target[key].meta_metadata_name) {
          return target[key];
        }
      }
    }
  }
  return target;
}

// Unwrap a meta-metadata object. Returns the input object if it does not look
// like a meta-metadata object.
BSUtils.unwrapMmd = function(wrapped) {
  if (typeof wrapped === 'object' && wrapped != null) {
    var keys = Object.keys(wrapped);
    if (keys.length == 1 && keys[0] === 'meta_metadata') {
      return wrapped['meta_metadata'];
    }
  }
  return wrapped;
}

// Wrap a metadata object.
//
// If input is not a metadata object, just return it.
BSUtils.wrap = function(metadata) {
  if (typeof metadata === 'object' && metadata != null) {
    var typeName = metadata.mm_name || metadata.meta_metadata_name;
    if (typeof typeName === 'string') {
      var result = new Object();
      result[typeName] = metadata;
      return result;
    }
  }
  return metadata;
}

BSUtils.getType = function(metadata) {
  if (typeof metadata == 'object' && metadata != null) {
    if ('meta_metadata_name' in metadata) {
      return metadata['meta_metadata_name'];
    }
    if ('mm_name' in metadata) {
      return metadata['mm_name'];
    }
  }
  return null;
}

/**
 * Remove line breaks from the string and any non-ASCII characters
 * @param string
 * @return a string with no line breaks or crazy characters
 */
BSUtils.removeLineBreaksAndCrazies = function(string)
{
  if (typeof string === 'string') {
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
  } else {
    console.warn("Not a string: " + string);
    return string;
  }
}

/**
 * Gets the favicon image for a url
 * @param url, string of target URL
 * @return string of the favicon url
 */
BSUtils.getFaviconURL = function(url)
{
	return "http://www.google.com/s2/favicons?domain_url=" + url;	
}

// src: http://stackoverflow.com/questions/359788/how-to-execute-a-javascript-function-when-i-have-its-name-as-a-string
function executeFunctionByName(functionName, context) {
  var args = [].slice.call(arguments).splice(2);
  var namespaces = functionName.split(".");
  var func = namespaces.pop();
  for(var i = 0; i < namespaces.length; i++) {
    context = context[namespaces[i]];
  }
  return context[func].apply(this, args);
}

// get base url
function getPosition(str, m, i) 
{
  return str.split(m, i).join(m).length;
}

// for use in Node.js:
if (typeof module == 'object') {
  module.exports = BSUtils;
}

