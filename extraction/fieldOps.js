/*
append
decodeurl
-fieldop
-fieldopscope
getParam
match
overrideparams
prepend
replace
setparam
strip
stripparam
stripparamsbut
substring
*/

var FieldOps = {};

FieldOps.operate = function(str, fieldOp){
	if (fieldOp.replace)
		str = replace(str, fieldOp.replace.pattern, fieldOp.replace.to);
	
	return str;
};


function append(str){
	return str;
}

function decodeUrl(str){
	return str;
}

function getParam(str){
	return str;
}

function match(str){
	return str;
}

function overrideParams(str){
	return str;
}

function prepend(str){
	return str;
}

function replace(str, pattern, to){
	return str.replace(new RegExp(pattern, 'g'), to);
}

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

function strip(str){
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

function substring(str){
	return str;
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
