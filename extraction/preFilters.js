/**
 * Semantics that transforms locations, with set_param, strip_param semantic actions inside it, 
 * for managing variability in Document location ParsedURL arguments.
 * 
 * @author kade
 */

var PreFilter = {};

PreFilter.filter = function(location, filterObj){
	
	for (var p in filterObj.param_ops){
		var filterOp = filterObj.param_ops[p];
		//TODO execute the filter
			
		if (filterOp.strip_param){
			//strip
		}
		
		if (filterOp.set_param){
			//set
		}
		
	}
	
	return location;
};
