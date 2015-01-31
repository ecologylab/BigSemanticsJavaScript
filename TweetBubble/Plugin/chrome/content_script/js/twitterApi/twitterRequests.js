var TwitterRequests = {};

TwitterRequests.postReply = function(tweetStr, tweetId, callback)
{
//	if (!TwitterOAuth.isAuthorized)
//		TwitterOAuth.isAuthorized = TwitterOAuth.authorize();
//	else
//	{
		chrome.extension.sendRequest({loadOAuthTokenValues: document.URL}, function(response) {
			if (response && response.oauth_token != null && response.oauth_token_secret != null && tweetId)
			{
				console.log("***post tweet***: " + tweetStr);
				
				var url = "https://api.twitter.com/1.1/statuses/update.json";
				var body = "status=" + encodeURIComponent(tweetStr);
					body += "&in_reply_to_status_id=" + tweetId;
				
				var nonce = TwitterOAuth.generateNonce(32);
				var ts = String(Math.floor(Date.now() / 1000));
				var params = {
						"in_reply_to_status_id": tweetId,
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

				TwitterOAuth.sendRequest(url+'?'+body, callback, auth);
			}
			else
			{
				//fallback?
				callback(tweetId, true);
			}
		});
//	}
}

TwitterRequests.postRetweet = function(tweetId, callback)
{
	chrome.extension.sendRequest({loadOAuthTokenValues: document.URL}, function(response) {
		if (response && response.oauth_token != null && response.oauth_token_secret != null && tweetId)
		{
			console.log("***retweet***: " + tweetId);
			
			var url = "https://api.twitter.com/1.1/statuses/retweet/" + tweetId + ".json";
			
			var nonce = TwitterOAuth.generateNonce(32);
			var ts = String(Math.floor(Date.now() / 1000));
			var params = {
					"oauth_consumer_key": "iMCPirVCd4ev6ttdrf7gweW86",
				    "oauth_nonce": nonce,
				    "oauth_signature_method": "HMAC-SHA1", 
				    "oauth_timestamp": ts,
				    "oauth_token": response.oauth_token,
				    "oauth_version": "1.0",
				  };
			console.log("params = ");
			console.log(params);
			
				
			var sig = TwitterOAuth.createOAuthSignature(url, params, response.oauth_token_secret);
			params["oauth_signature"] = sig;

			var auth = TwitterOAuth.createAuthorizationHeader(params);	

			TwitterOAuth.sendRequest(url, callback, auth);			
		}
		else
		{
			//fallback?
			callback(tweetId, true);
		}
	});
}

TwitterRequests.postFavorite = function(tweetId, callback)
{
	chrome.extension.sendRequest({loadOAuthTokenValues: document.URL}, function(response) {
		if (response && response.oauth_token != null && response.oauth_token_secret != null && tweetId)
		{
			console.log("***favorite***: " + tweetId);
			
			var url = "https://api.twitter.com/1.1/favorites/create.json";
			var body = "id=" + tweetId;

			var nonce = TwitterOAuth.generateNonce(32);
			var ts = String(Math.floor(Date.now() / 1000));
			var params = {
					"id": tweetId,
					"oauth_consumer_key": "iMCPirVCd4ev6ttdrf7gweW86",
				    "oauth_nonce": nonce,
				    "oauth_signature_method": "HMAC-SHA1", 
				    "oauth_timestamp": ts,
				    "oauth_token": response.oauth_token,
				    "oauth_version": "1.0",
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

			TwitterOAuth.sendRequest(url+'?'+body, callback, auth);			
		}
		else
		{
			//fallback?
			callback(tweetId, true);
		}
	});
}

TwitterRequests.handleResponse = function(response)
{
	
}

TwitterRequests.retweetCallback = function(resp, apiFailed)
{
	var eventObj;
	if (apiFailed)
	{
		var url = "https://twitter.com/intent/retweet?tweet_id=" + resp;
		eventObj = {
				tweet_action: {
					action: url,
					fallback: true
				}
		}
		TwitterRequests.openUrlInNewWindow(url);
	}
	else
	{
		var respObj = JSON.parse(resp);
		var act = "retweet";
		eventObj = {
			tweet_action: {
				action: act,
				retweetId: respObj.id_str,
				tweetId: respObj.retweeted_status.id_str,
				fallback: false
			}
		}
		MetadataRenderer.setRetweetIconOn(respObj.retweeted_status.id_str);
	}
	if(MetadataLoader.logger)
		MetadataLoader.logger(eventObj);
}

TwitterRequests.favoriteCallback = function(resp, apiFailed)
{
	var eventObj;
	if (apiFailed)
	{
		var url = "https://twitter.com/intent/favorite?tweet_id=" + resp;
		eventObj = {
				tweet_action: {
					action: url,
					fallback: true
				}
		}
		TwitterRequests.openUrlInNewWindow(url);
	}
	else
	{
		var respObj = JSON.parse(resp);
		var act = "favorite";
		eventObj = {
			tweet_action: {
				action: act,
				id: respObj.id_str,
				fallback: false
			}
		}
		MetadataRenderer.setFavoriteIconOn(respObj.id_str);
	}
	if(MetadataLoader.logger)
		MetadataLoader.logger(eventObj);
}

TwitterRequests.replyCallback = function(resp, apiFailed)
{
	var eventObj;
	if (apiFailed)
	{
		var url = "https://twitter.com/intent/tweet?in_reply_to=" + resp;
		eventObj = {
				tweet_action: {
					action: url,
					fallback: true
				}
		}
		TwitterRequests.openUrlInNewWindow(url);
	}
	else
	{
		var act = "reply";
		eventObj = {
			tweet_action: {
				action: act,
				id: resp.id_str,
				repy_to_id: resp.in_reply_to_status_id_str,
				fallback: false
			}
		}
	}
	if(MetadataLoader.logger)
		MetadataLoader.logger(eventObj);
}

// web intent fallback
TwitterRequests.openUrlInNewWindow = function(url)
{
	var url = this.getAttribute("url");
	window.open(url, 'Tweet', "height=500,width=500");
}
