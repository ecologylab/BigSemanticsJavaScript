var TwitterOAuth = {};

TwitterOAuth.isAuthorized = false;

TwitterOAuth.getBaseString = function(method, url, params) 
{
	// assuming no percent encoding needed for keys
	var keys = Object.keys(params).sort();
	var s = "";
	for (var i = 0; i < keys.length; ++i) 
	{
		var key = keys[i];
		s += (i == 0 ? "" : "&") + key + "=" + encodeURIComponent(params[key]);
	}

	var result = method + "&" + encodeURIComponent(url) + "&" + encodeURIComponent(s);
	console.log("base string: " + result);
	return result;
}


TwitterOAuth.generateNonce = function(len)
{
	var nonce = "";
    var charSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    // to avoid any possible duplicate between study and normal usage
    //var len = 42;
    
    for (var i = 0; i < len; i++)
        nonce += charSet.charAt(Math.floor(Math.random() * charSet.length));

    return nonce;
}

TwitterOAuth.createOAuthSignature = function(oauth_callback, oauth_consumer_key, 
		oauth_nonce, oauth_signature_method, oauth_timestamp, oauth_version)
{
	//for now, just hardcode
	var inp = 'POST&https%3A%2F%2Fapi.twitter.com%2Foauth%2Frequest_token&oauth_callback%3Dhttp%253A%252F%252Fecologylab.net%26oauth_consumer_key%3DiMCPirVCd4ev6ttdrf7gweW86%26oauth_nonce%3D' +
				oauth_nonce + '%26oauth_signature_method%3DHMAC-SHA1%26oauth_timestamp%3D' +
				oauth_timestamp + '%26oauth_version%3D1.0'; //must be text, if you use Base64 or HEX then change hmacInputType on line 72
	console.log("base string1: " + inp);
	var inpKey = 'vffQZeOOM2bGbsKZijwAIis0wK1RSTsffS6uyL7yPxZtXalxq1&';
	return calcHMAC(inp, inpKey);
}

TwitterOAuth.requestToken = function()
{
	var xhr = new XMLHttpRequest();
	var url = "https://api.twitter.com/oauth/request_token";
	
	xhr.onreadystatechange = function() {
		
		console.log("state: " + xhr.readyState + " status: " + xhr.status);
		
		if (xhr.readyState==4 && xhr.status==200)
	    {
			console.log(xhr.response);
			if (xhr.response)
			{
				var retValues = xhr.response.split('&');
				
				var oauth_token_secret_str = "oauth_token_secret=";
				for (var i = 0; i < retValues.length; ++i)
				{
					if (retValues[i].indexOf(oauth_token_secret_str) == 0)
					{
						TwitterOAuth.storeOAuthObject({"oauth_token_secret": retValues[i].substr(oauth_token_secret_str.length)});
					}
				}
				for (var i = 0; i < retValues.length; ++i)
				{
					if (retValues[i].indexOf("oauth_token=") == 0)
					{
						var redirect_url = "https://api.twitter.com/oauth/authenticate?" + retValues[i];
						window.open(redirect_url, 'Sign-In');
					}
				}
			}
	    }
	};
	
	xhr.open("POST", url, true);
	
	var params = {
		    "oauth_callback": window.location,
		    "oauth_consumer_key": "iMCPirVCd4ev6ttdrf7gweW86",
		    "oauth_nonce": TwitterOAuth.generateNonce(42),
		    "oauth_signature_method": "HMAC-SHA1", 
		    "oauth_timestamp": String(Math.floor(Date.now() / 1000)),
		    "oauth_version": "1.0"
		  };
	console.log("params = ");
	console.log(params);
		
	var baseString = TwitterOAuth.getBaseString("POST", url, params);

	var consumerSecret = "vffQZeOOM2bGbsKZijwAIis0wK1RSTsffS6uyL7yPxZtXalxq1";
	var sig = calcHMAC(baseString, consumerSecret + "&");
	console.log("signature: " + sig);
	params["oauth_signature"] = sig;

	var auth = "OAuth ";
	var keys = Object.keys(params);
	for (var i = 0; i < keys.length; ++i) {
	    var key = keys[i];
	    auth += (i == 0 ? "" : ", ") + key + "=\"" + encodeURIComponent(params[key]) + "\"";
	}
	console.log("auth header: " + auth);	

	//var userAgent = "Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.99 Safari/537.36";			
	
    //xhr.setRequestHeader("User-Agent", userAgent);
    //xhr.setRequestHeader("HOST", "api.twitter.com");
	xhr.setRequestHeader("Accept", "*/*");
	xhr.setRequestHeader("Authorization", auth);
		
	console.log("command line:\n" + "curl --request 'POST' 'https://api.twitter.com/oauth/request_token' --header 'Authorization: " + auth + "'");
	xhr.send();
}

TwitterOAuth.authorize = function()
{
	TwitterOAuth.requestToken();
//	var oauth_callback = "http://ecologylab.net";
//	var oauth_consumer_key = "iMCPirVCd4ev6ttdrf7gweW86";
//	var oauth_nonce = MetadataRenderer.generateNonce();
//	var oauth_signature_method = "HMAC-SHA1"; 
//	var oauth_timestamp = String(Math.floor(Date.now() / 1000));
//	var oauth_version = "1.0";
//	var oauth_signature = MetadataRenderer.createOAuthSignature(oauth_callback,
//			oauth_consumer_key, oauth_nonce, oauth_signature_method, oauth_timestamp, oauth_version); 
	//console.log("signature1: " + sig);
//	console.log("signature1: " + oauth_signature);
	//var encoded_oauth_signature = window.btoa(oauth_signature);
	//console.log("encoded: " + encoded_oauth_signature);
	
	// prepare request header
//	var auth1 = "OAuth oauth_callback=\"http%3A%2F%2Fecologylab.net\", " + 
//				"oauth_consumer_key=\"" + oauth_consumer_key + "\", "  +
//    			"oauth_nonce=\"" + oauth_nonce + "\", " +
//    			"oauth_signature=\"" + encodeURIComponent(oauth_signature) + "\", " + 
//    			"oauth_signature_method=\"" + oauth_signature_method + "\", " + 
//    			"oauth_timestamp=\"" + oauth_timestamp + "\", " +
//    			"oauth_version=\"" + oauth_version + "\"";
//    
//	console.log("command line1:\n" + "curl --request 'POST' 'https://api.twitter.com/oauth/request_token' --header 'Authorization: " + auth1 + "'");
}

TwitterOAuth.getAccessToken = function(oauth_token, oauth_token_secret, oauth_verifier)
{
	var xhr = new XMLHttpRequest();
	var url = "https://api.twitter.com/oauth/access_token";
	
	xhr.onreadystatechange = function() {
		
		console.log("state: " + xhr.readyState + " status: " + xhr.status);
		
		if (xhr.readyState==4 && xhr.status==200)
	    {
			console.log(xhr.response);
			if (xhr.response)
			{
				var retValues = xhr.response.split('&');
				var received_token = false;
				var received_token_secret = false;
				var oauth_token_str = "oauth_token=";
				var oauth_token_secret_str = "oauth_token_secret=";
				for (var i = 0; i < retValues.length; ++i)
				{
					if (retValues[i].indexOf(oauth_token_str) == 0)
					{
						TwitterOAuth.storeOAuthObject({"oauth_token": retValues[i].substr(oauth_token_str.length)});
						received_token = true;
						console.log(retValues[i]);
					}
					if (retValues[i].indexOf(oauth_token_secret_str) == 0)
					{
						TwitterOAuth.storeOAuthObject({"oauth_token_secret": retValues[i].substr(oauth_token_secret_str.length)});
						received_token_secret = true;
						console.log(retValues[i]);
					}
					if (received_token && received_token_secret)
						TwitterOAuth.isAuthorized = true;
				}
			}
	    }
	};
	
	xhr.open("POST", url, true);
	
	var params = {
		    "oauth_consumer_key": "iMCPirVCd4ev6ttdrf7gweW86",
		    "oauth_nonce": TwitterOAuth.generateNonce(42),
		    "oauth_signature_method": "HMAC-SHA1", 
		    "oauth_timestamp": String(Math.floor(Date.now() / 1000)),
		    "oauth_token": oauth_token,
		    "oauth_verifier": oauth_verifier,
		    "oauth_version": "1.0"
		  };
	console.log("params = ");
	console.log(params);
		
	var baseString = TwitterOAuth.getBaseString("POST", url, params);

	var consumerSecret = "vffQZeOOM2bGbsKZijwAIis0wK1RSTsffS6uyL7yPxZtXalxq1";
	var sig = calcHMAC(baseString, consumerSecret + "&" + oauth_token_secret);
	console.log("signature: " + sig);
	params["oauth_signature"] = sig;

	var auth = "OAuth ";
	var keys = Object.keys(params);
	for (var i = 0; i < keys.length; ++i) {
	    var key = keys[i];
	    auth += (i == 0 ? "" : ", ") + key + "=\"" + encodeURIComponent(params[key]) + "\"";
	}
	console.log("auth header: " + auth);	

	//var userAgent = "Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.99 Safari/537.36";			
	
    //xhr.setRequestHeader("User-Agent", userAgent);
    //xhr.setRequestHeader("HOST", "api.twitter.com");
	xhr.setRequestHeader("Accept", "*/*");
	xhr.setRequestHeader("Authorization", auth);
	
	//var body = "oauth_verifier=" + oauth_verifier;
	
	//console.log("command line:\n" + "curl --request 'POST' 'https://api.twitter.com/oauth/access_token' --header 'Authorization: " + auth + "' " + body);
	//xhr.send(body);
	console.log("command line:\n" + "curl --request 'POST' 'https://api.twitter.com/oauth/access_token' --header 'Authorization: " + auth + "' ");
	xhr.send();
}

TwitterOAuth.storeOAuthObject = function(oauth_token_obj)
{
	chrome.extension.sendRequest({storeOAuthTokenObject: oauth_token_obj});
}

TwitterOAuth.accessTokenHelper = function(oauth_token, oauth_verifier)
{
	chrome.extension.sendRequest({loadOAuthTokenValues: document.URL}, function(response) {
		if (response && response.oauth_token_secret != null)
		{
			TwitterOAuth.getAccessToken(oauth_token, response.oauth_token_secret, oauth_verifier);
		}
	});
}