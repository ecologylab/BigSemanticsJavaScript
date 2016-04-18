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
				var method = "POST";	
				
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
					
				var sig = TwitterOAuth.createOAuthSignature(url, params, response.oauth_token_secret, method);
				
				params1["oauth_signature"] = sig;
				var auth = TwitterOAuth.createAuthorizationHeader(params1);	

				TwitterOAuth.sendRequest(url+'?'+body, callback, auth, method);
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
			var method = "POST";
			
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
			
				
			var sig = TwitterOAuth.createOAuthSignature(url, params, response.oauth_token_secret, method);
			params["oauth_signature"] = sig;

			var auth = TwitterOAuth.createAuthorizationHeader(params);	

			TwitterOAuth.sendRequest(url, callback, auth, method);			
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
			var method = "POST";

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
				
			var sig = TwitterOAuth.createOAuthSignature(url, params, response.oauth_token_secret, method);
			
			params1["oauth_signature"] = sig;
			var auth = TwitterOAuth.createAuthorizationHeader(params1);	

			TwitterOAuth.sendRequest(url+'?'+body, callback, auth, method);			
		}
		else
		{
			//fallback?
			callback(tweetId, true);
		}
	});
}

// username is same as the screen_name required by the api
TwitterRequests.getTimelineTweets = function(username, callback)
{
	chrome.extension.sendRequest({loadOAuthTokenValues: document.URL}, function(response) {
		if (response && response.oauth_token != null && response.oauth_token_secret != null && username)
		{
			console.log("***timeline tweets***: " + username);
			
			var url = "https://api.twitter.com/1.1/statuses/user_timeline.json";
			var body = "screen_name=" + username;
			var method = "GET";

			var nonce = TwitterOAuth.generateNonce(32);
			var ts = String(Math.floor(Date.now() / 1000));
			var params = {
					"oauth_consumer_key": "iMCPirVCd4ev6ttdrf7gweW86",
				    "oauth_nonce": nonce,
				    "oauth_signature_method": "HMAC-SHA1", 
				    "oauth_timestamp": ts,
				    "oauth_token": response.oauth_token,
				    "oauth_version": "1.0",
				    "screen_name": username
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
				
			var sig = TwitterOAuth.createOAuthSignature(url, params, response.oauth_token_secret, method);
			
			params1["oauth_signature"] = sig;
			var auth = TwitterOAuth.createAuthorizationHeader(params1);	

			TwitterOAuth.sendRequest(url+'?'+body, callback, auth, method);		
		}
		else
		{
			//fallback?
			callback(username, true);
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
		TwitterRenderer.setRetweetIconOn(respObj.retweeted_status.id_str);
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
		TwitterRenderer.setFavoriteIconOn(respObj.id_str);
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

TwitterRequests.timelineTweetsCallback = function(respJson, apiFailed)
{
	if (apiFailed)
	{
		
	}
	else
	{
		var resp = jQuery.parseJSON(respJson);
		if (resp && resp[0] && resp[0].user && resp[0].user.screen_name)
		{
			var url = "https://api.twitter.com/1.1/statuses/user_timeline.json";
			chrome.extension.sendRequest({bindMetadata: url, jsonData: {tweets: resp}}, function(response) {
				console.log(response);
			});
		}
	}
}

TwitterRequests.addTrackRequest = function(keyword, callback)
{
	var response = {};
	response.oauth_token = localStorage["oauth_token"];
	response.oauth_token_secret = localStorage["oauth_token_secret"];
	//chrome.extension.sendRequest({loadOAuthTokenValues: document.URL}, function(response) {
		if (response && response.oauth_token != null && response.oauth_token_secret != null)
		{
			console.log("***user_stream***: ");
			
			var url = "https://userstream.twitter.com/1.1/user.json";
			var body = "track=" + encodeURIComponent(keyword);
				
			var method = "GET";	
			
			var nonce = TwitterOAuth.generateNonce(32);
			var ts = String(Math.floor(Date.now() / 1000));
			var params = {
					"oauth_consumer_key": "iMCPirVCd4ev6ttdrf7gweW86",
				    "oauth_nonce": nonce,
				    "oauth_signature_method": "HMAC-SHA1", 
				    "oauth_timestamp": ts,
				    "oauth_token": response.oauth_token,
				    "oauth_version": "1.0",
				    "track": keyword
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
				
			var sig = TwitterOAuth.createOAuthSignature(url, params, response.oauth_token_secret, method);
			
			params1["oauth_signature"] = sig;
			var auth = TwitterOAuth.createAuthorizationHeader(params1);

			TwitterOAuth.sendStreamingRequest(url+'?'+body, callback, auth, method);
		}
		else
		{
			//fallback?
			callback(true);
		}
	//});
}

TwitterRequests.trackRequestCallback = function(resp)
{
	//console.log(resp);
	//split response into different track keywords
	var respMsgs = resp.split(/\r\n/);
	for (var i = 0; i < respMsgs.length; i++)
	{
		if (respMsgs[i] && respMsgs[i] != "")
		{
			var respMsgObj = jQuery.parseJSON(respMsgs[i]);
			if (respMsgObj && respMsgObj.created_at)
			{
				var trackWords = TrackRequests.getMatchingKeywords("twitter", respMsgObj.text);
				for (var j = 0; j < trackWords.length; j++)
					TrackRequests.addUpdate("twitter", trackWords[j], respMsgs[i]);
			}
		}
		//else if (respMsgs[i]){}
	}
	//var respObj = jQuery.parseJSON(resp);	
}

// web intent fallback
TwitterRequests.openUrlInNewWindow = function(url)
{
	var url = this.getAttribute("url");
	window.open(url, 'Tweet', "height=500,width=500");
}

if (userStreamCount == 0)
{
	//TwitterRequests.openUserStream(function(resp) {console.log("*****" + resp + "*****")});
}
