/**
 * Semantics that transforms locations for managing variability in Document location ParsedURL arguments.
 * 
 * @author kade
 */

var PreFilter = {};

PreFilter.filter = function(location, filterObj){
	var newLocation = location;
	
	for (var p in filterObj.param_ops){
		var filterOp = filterObj.param_ops[p];
		//TODO execute the filter
			
		if (filterOp.strip_param){
			newLocation = stripParam(newLocation, filterOp.strip_param.name);
		}
		else if (filterOp.set_param){
			newLocation = setParam(newLocation, filterOp.set_param.name, filterOp.set_param.value);
		}	
	}
	
	if (filterObj.regex){
		var regex = new RegExp(filterObj.regex.match, 'g');
		var replace = filterObj.regex.replace;
		newLocation = newLocation.replace(regex,replace);
	}
	
	
	if (filterObj.strip_params_but){
		newLocation = stripParamsBut(newLocation, filterObj.strip_params_but);
	}
	
	//if filterObj.overide_params
	
	return newLocation;
};

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