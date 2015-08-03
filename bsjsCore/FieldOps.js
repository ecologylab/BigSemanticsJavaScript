/* jshint -W004 */
/* global console*/


/**
 * Semantics that transforms locations for managing variability in Document location ParsedURL arguments.
 * 
 * @author kade
 */
var PreFilter = {};

PreFilter.filter = function(location, filterObj){
	var newLocation = location;
	
	//not sure exactly how filter objects are structured. will need to be tested
	for (var i in filterObj.ops){
		var fieldOp = filterObj.ops[i];
		newLocation = FieldOps.operate(newLocation, fieldOp);
	}
	
	return newLocation;
};

/************************************************************************************************************/

var FieldOps = {};

FieldOps.operate = function(str, fieldOp){
	
	if (fieldOp.append)
		str = append(str, fieldOp.value);
	else if (fieldOp.decode_url)
		str = decodeUrl(str);
	else if (fieldOp.get_param)
		str = getParam(str, fieldOp.get_param.name, fieldOp.get_param.otherwise);
	else if (fieldOp.match)
		str = match(str, fieldOp.match.pattern, fieldOp.match.group);
	else if (fieldOp.override_params)
		str = overrideParams(str);
	else if (fieldOp.prepend)
		str = prepend(str, fieldOp.value);
	else if (fieldOp.replace)
		str = replace(str, fieldOp.replace.pattern, fieldOp.replace.to);
	else if (fieldOp.set_param)
		str = setParam(str, fieldOp.set_param.name, fieldOp.set_param.value);
	else if (fieldOp.strip)
		str = strip(str, fieldOp.strip.any_of);
	else if (fieldOp.strip_param)
		str = stripParam(str, fieldOp.strip_param.name);
	else if (fieldOp.substring)
		str = substring(str, fieldOp.substring);
	
	return str;
};

//NO TEST CASE
function append(str, value){
	return str + value;
}

//NO TEST CASE
function decodeUrl(str){
	return decodeURI(str);
}

function getParam(str, name, otherwise){
	var stripped = str.split("?")[0];
	var param;
    var params = [];
    var queryString = (str.indexOf("?") !== -1) ? str.split("?")[1] : "";
	
    if (queryString !== "") {
        params = queryString.split("&");
        for (var i = params.length - 1; i >= 0; i -= 1) {
            if (name === params[i].split("=")[0]) {
				return params[i].split("=")[1];
			}
        }
    }
    return otherwise;
}

function match(str, pattern, group){
	try {
		var result = str.match(new RegExp(pattern));
		
		result = group ? result[group] : result[0] ;
		return result;
	}
	catch(e) {
		console.log(pattern + " is not valid javascript regex");
		return str;	
	}
}

//replaces params before the # with the ones after. 
function overrideParams(url){
	var stripped = url.split("?")[0];
	var queryString = (url.indexOf("?") !== -1) ? url.split("?")[1] : "";
	
	if (queryString !== "") {
		var beforeHash = queryString.split("#")[0];
		var afterHash = queryString.split("#")[1];

		var beforeParams = beforeHash.split("&");
		var afterParams = afterHash.split("&");

		var newValues = {};
		for (var a in afterParams){
			newValues[afterParams[a].split("=")[0]] = afterParams[a].split("=")[1];
		}

		for (var p in beforeParams){
			var param = beforeParams[p].split("=")[0];
			if (param in newValues){
				beforeParams[p] = param + "=" + newValues[param];
			}
		}

		stripped = stripped + "?" + beforeParams.join("&");
	}
	
	return stripped;
}

//NO TEST CASE
function prepend(str, value){
	return value + str;
}

function replace(str, pattern, to){
	try {
		return str.replace(new RegExp(pattern, 'g'), to);
	}
	catch(e) {
		console.log(pattern + " is not valid javascript regex");
		return str;	
	}
}

//NO TEST CASE
function setParam(url, name, value){
	var stripped = url.split("?")[0];
	var param;
    var params = [];
    var queryString = (url.indexOf("?") !== -1) ? url.split("?")[1] : "";
	
    if (queryString !== "") {
        params = queryString.split("&");
		if (params.length > 0){
        	stripped = stripped + "?" + params.join("&") + "&" + name + "=" + value;
		}
		else {
			stripped = stripped + "?" + name + "=" + value;
		}
    }
    return stripped;
}

//NO TEST CASE
function strip(str, anyOf){
	if (!(anyOf)){
        return str.trim();
    }
    else{
		console.log(str)
		if(str.indexOf(anyOf) > str.indexOf('?')){
			var startRemove = str.indexOf(anyOf);
			var endRemove = str.substring(startRemove).indexOf('&');
			if(endRemove > -1){
				str = str.replace(str.substring(startRemove, endRemove), "");

			}else{
				str = str.replace(str.substring(startRemove, str.length), "");

			}
			
			console.log(str);
		}
    	/*var a = 0;
		var b = str.lengextth - 1;
		while (a <= b && containsAny(anyOf, str[a])){
		  a++;
		}
		while (b >= a && containsAny(anyOf, str[b])){
		  b--;
		}
		return (a <= b) ? str.substring(a, b + 1) : "";*/
    	
    	
    }
	return str;
}

//source: http://stackoverflow.com/questions/16941104/remove-a-parameter-to-the-url-with-javascript
function stripParam(url, name){
	var stripped = url.split("?")[0];
	var param;
    var params = [];
    var queryString = (url.indexOf("?") !== -1) ? url.split("?")[1] : "";
	
    if (queryString !== "") {
        params = queryString.split("&");
        for (var i = params.length - 1; i >= 0; i -= 1) {
            param = params[i].split("=")[0];
            if (param === name) {
                params.splice(i, 1);
            }
        }
		if (params.length > 0){
        	stripped = stripped + "?" + params.join("&");
		}
    }
    return stripped;
}

function stripParamsBut(url, keepParams){
	var stripped = url.split("?")[0];
	var param;
    var params = [];
    var queryString = (url.indexOf("?") !== -1) ? url.split("?")[1] : "";
	
    if (queryString !== "") {
        params = queryString.split("&");
        for (var i = params.length - 1; i >= 0; i -= 1) {
            param = params[i].split("=")[0];
            
			var keep = false;
			for (var p in keepParams){
				if (param === keepParams[p]) {
					keep = true;
				}
			}
			
			if (!keep) {
                params.splice(i, 1);
            }
        }
		if (params.length > 0){
        	stripped = stripped + "?" + params.join("&");
		}
    }
    return stripped;
}


function substring(str, substringOp){
	var a = 0;
	if (substringOp.after){
		var p = str.indexOf(substringOp.after);
		if (p >= 0){
			a = p + substringOp.after.length;
		}
	}
	else if (substringOp.inclusiveAfter){
		var p = str.indexOf(substringOp.inclusiveAfter);
		if (p >= 0){
			a = p;
		}
	}
	else{
		a = substringOp.begin;
	}

	var b = str.length;
	if (substringOp.before){
		var p = str.lastIndexOf(substringOp.before);
		if (p >= 0){
		  b = p;
		}
	}
	else if (substringOp.inclusiveBefore){
		var p = str.lastIndexOf(substringOp.inclusiveBefore);
		if (p >= 0){
		  b = p + substringOp.inclusiveBefore.length;
		}
	}
	else{
		b = (substringOp.end === 0) ? str.length : substringOp.end;
	}

	return str.substring(a, b);
}

/*******Helpers********/

function containsAny(s, c){
	return s.indexOf(c) > -1;
}

// for use in Node:
if (typeof module == 'object') {
  module.exports = {
    PreFilter: PreFilter,
    FieldOps: FieldOps
  }
}

