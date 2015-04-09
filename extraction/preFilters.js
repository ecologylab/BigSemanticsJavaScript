/**
 * Semantics that transforms locations, with set_param, strip_param semantic actions inside it, 
 * for managing variability in Document location ParsedURL arguments.
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
			newLocation = stripParam(location, filterOp.strip_param.name);
		}
		
		if (filterOp.set_param){
			//set
		}
		
	}
	
	return newLocation;
};

//source: http://stackoverflow.com/questions/16941104/remove-a-parameter-to-the-url-with-javascript
function stripParam(url, key){
	var stripped = url.split("?")[0];
	
	var param;
    var params = [];
    var queryString = (url.indexOf("?") !== -1) ? url.split("?")[1] : "";
	
    if (queryString !== "") {
        params = queryString.split("&");
        for (var i = params.length - 1; i >= 0; i -= 1) {
            param = params[i].split("=")[0];
            if (param === key) {
                params.splice(i, 1);
            }
        }
		if (params.length > 0){
        	stripped = stripped + "?" + params.join("&");
		}
    }
    return stripped;
}