var TwitterOAuth = {};

TwitterOAuth.isAuthorized = false;

TwitterOAuth.streamingXhr = new XMLHttpRequest();

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

TwitterOAuth.createOAuthSignature = function(url, params, oauth_token_secret, method)
{
	var baseString = TwitterOAuth.getBaseString(method, url, params);
	var consumerSecret = "vffQZeOOM2bGbsKZijwAIis0wK1RSTsffS6uyL7yPxZtXalxq1";
	var sig = calcHMAC(baseString, consumerSecret + "&" + oauth_token_secret);
	console.log("signature: " + sig);
	return sig;
}

TwitterOAuth.createAuthorizationHeader = function(params)
{
	var auth = "OAuth ";
	var keys = Object.keys(params);
	for (var i = 0; i < keys.length; ++i) {
	    var key = keys[i];
	    auth += (i == 0 ? "" : ", ") + key + "=\"" + encodeURIComponent(params[key]) + "\"";
	}
	console.log("auth header: " + auth);
	return auth;
}

TwitterOAuth.sendRequest = function(url, callback, auth, method)
{
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		
		console.log("state: " + xhr.readyState + " status: " + xhr.status);
		
		if (xhr.readyState==4 && xhr.status==200)
	    {
			//console.log(xhr.response);
			callback(xhr.response);
	    }
	};
	
	xhr.open(method, url, true);
	
	xhr.setRequestHeader("Accept", "*/*");
	xhr.setRequestHeader("Authorization", auth);
		
	console.log("command line:\n" + "curl --request '" + method + "' '" + url + "' --header 'Authorization: " + auth + "'");
	xhr.send();
}

TwitterOAuth.sendStreamingRequest = function(url, callback, auth, method)
{
	TwitterOAuth.streamingXhr.onreadystatechange = function() {
		
		console.log("state: " + TwitterOAuth.streamingXhr.readyState + " status: " + TwitterOAuth.streamingXhr.status);
		
		if ((TwitterOAuth.streamingXhr.readyState==3 || TwitterOAuth.streamingXhr.readyState==4) 
				&& TwitterOAuth.streamingXhr.status==200)
	    {
			//console.log(TwitterOAuth.streamingXhr.response);
			callback(TwitterOAuth.streamingXhr.response);
	    }
		//TODO: handle HTTP 420
	};
	
	TwitterOAuth.streamingXhr.open(method, url, true);
	
	TwitterOAuth.streamingXhr.setRequestHeader("Accept", "*/*");
	TwitterOAuth.streamingXhr.setRequestHeader("Authorization", auth);
		
	console.log("command line:\n" + "curl --request '" + method + "' '" + url + "' --header 'Authorization: " + auth + "'");
	TwitterOAuth.streamingXhr.send();	
}

TwitterOAuth.abortStreamingRequest = function()
{
	TwitterOAuth.streamingXhr.abort();
}

TwitterOAuth.getRequestToken = function()
{
	var url = "https://api.twitter.com/oauth/request_token";
	var method = "POST";
	
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
		
	var sig = TwitterOAuth.createOAuthSignature(url, params, "", method);
	params["oauth_signature"] = sig;

	var auth = TwitterOAuth.createAuthorizationHeader(params);
	
	TwitterOAuth.sendRequest(url, TwitterOAuth.handleRequestTokenResponse, auth, method);
}

TwitterOAuth.handleRequestTokenResponse = function(response)
{
	if (response)
	{
		var retValues = response.split('&');
		
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

TwitterOAuth.getAccessToken = function(oauth_token, oauth_token_secret, oauth_verifier)
{
	var url = "https://api.twitter.com/oauth/access_token";
	var method = "POST";
	
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
		
	var sig = TwitterOAuth.createOAuthSignature(url, params, oauth_token_secret, method);
	params["oauth_signature"] = sig;

	var auth = TwitterOAuth.createAuthorizationHeader(params);
	
	TwitterOAuth.sendRequest(url, TwitterOAuth.handleAccessTokenResponse, auth, method);

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

TwitterOAuth.handleAccessTokenResponse = function(response)
{
	if (response)
	{
		var retValues = response.split('&');
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

TwitterOAuth.storeOAuthObject = function(oauth_token_obj)
{
	chrome.extension.sendRequest({storeOAuthTokenObject: oauth_token_obj});
}

TwitterOAuth.authorize = function()
{
	TwitterOAuth.getRequestToken();
}