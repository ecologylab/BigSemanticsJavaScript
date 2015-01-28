var TwitterRequests = {};

TwitterRequests.postReply = function(tweetStr)
{
	if (!TwitterOAuth.isAuthorized)
		TwitterOAuth.isAuthorized = TwitterOAuth.authorize();
	else
	{
		chrome.extension.sendRequest({loadOAuthTokenValues: document.URL}, function(response) {
			if (response && response.oauth_token != null && response.oauth_token_secret != null)
			{
				console.log("***post tweet***: " + tweetStr);
				
				var url = "https://api.twitter.com/1.1/statuses/update.json";
				var body = "status=" + encodeURIComponent(tweetStr);
				
				var nonce = TwitterOAuth.generateNonce(32);
				var ts = String(Math.floor(Date.now() / 1000));
				var params = {
						"oauth_consumer_key": "iMCPirVCd4ev6ttdrf7gweW86",
					    "oauth_nonce": nonce,
					    "oauth_signature_method": "HMAC-SHA1", 
					    "oauth_timestamp": ts,
					    "oauth_token": response.oauth_token,
					    "oauth_version": "1.0",
					    "status": tweetStr
					  };
				console.log("params = ");
				console.log(params);
				
				var params1 = {
						"oauth_consumer_key": "iMCPirVCd4ev6ttdrf7gweW86",
					    "oauth_nonce": nonce,
					    "oauth_signature_method": "HMAC-SHA1", 
					    "oauth_timestamp": ts,
					    "oauth_token": response.oauth_token,
					    "oauth_version": "1.0",
					  };
					
				var sig = TwitterOAuth.createOAuthSignature(url, params, response.oauth_token_secret);
				
				params1["oauth_signature"] = sig;
				var auth = TwitterOAuth.createAuthorizationHeader(params1);	

				TwitterOAuth.sendRequest(url+'?'+body, TwitterRequests.handleResponse, auth);
			}
		});
	}
}

TwitterRequests.handleResponse = function(response)
{
	
}