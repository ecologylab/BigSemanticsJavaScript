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
				
				var xhr = new XMLHttpRequest();
				var url = "https://api.twitter.com/1.1/statuses/update.json";
				
				xhr.onreadystatechange = function() {
					
					console.log("state: " + xhr.readyState + " status: " + xhr.status);
					
					if (xhr.readyState==4 && xhr.status==200)
				    {
						console.log(xhr.response);												
				    }
				};
				
				xhr.open("POST", url, true);
				
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
					
				var baseString = TwitterOAuth.getBaseString("POST", url, params);

				var consumerSecret = "vffQZeOOM2bGbsKZijwAIis0wK1RSTsffS6uyL7yPxZtXalxq1";
				var sig = calcHMAC(baseString, consumerSecret + "&" + response.oauth_token_secret);
				console.log("signature: " + sig);
				params1["oauth_signature"] = sig;

				var auth = "OAuth ";
				var keys = Object.keys(params1);
				for (var i = 0; i < keys.length; ++i) {
				    var key = keys[i];
				    auth += (i == 0 ? "" : ", ") + key + "=\"" + encodeURIComponent(params1[key]) + "\"";
				}
				console.log("auth header: " + auth);	

				//var userAgent = "Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.99 Safari/537.36";			
				
			    //xhr.setRequestHeader("User-Agent", userAgent);
			    //xhr.setRequestHeader("HOST", "api.twitter.com");
				xhr.setRequestHeader("Accept", "*/*");
				xhr.setRequestHeader("Authorization", auth);
				
				var body = "status=" + encodeURIComponent(tweetStr);
				
				console.log("command line:\n" + "curl --request 'POST' 'https://api.twitter.com/1.1/statuses/update.json' --header 'Authorization: " + auth + "' " + body);
				xhr.send(body);
				//console.log("command line:\n" + "curl --request 'POST' 'https://api.twitter.com/oauth/access_token' --header 'Authorization: " + auth + "' ");
				//xhr.send();
			}
		});
	}
}