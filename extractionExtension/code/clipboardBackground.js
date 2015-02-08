chrome.runtime.onMessage.addListener( function(request, sender, response){
	
	if( request.type == "copy" ){
		var store = JSON.stringify(request.load);
		localStorage["ideamache_clipboard"] = store;
	}else if( request.type == "paste"){
		var res = JSON.parse(localStorage["ideamache_clipboard"]);
		if( res ){
			response(res);
		}else{
			response("Fail");
		}
	}
	
});