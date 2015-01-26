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
				console.log("post tweet");
			}
		});
	}
}