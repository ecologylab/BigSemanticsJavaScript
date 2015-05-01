/* global FieldOps */

/**
 * Semantics that transforms locations for managing variability in Document location ParsedURL arguments.
 * 
 * @author kade
 */

var PreFilter = {};

PreFilter.filter = function(location, filterObj){
	var newLocation = location;
	
	//not sure exactly how filter objects are structured. will need to be tested
	for (var i in filterObj){
		var fieldOp = filterObj.field_ops[i];
		newLocation = FieldOps.operate(newLocation, fieldOp);
	}
	
	return newLocation;
};

