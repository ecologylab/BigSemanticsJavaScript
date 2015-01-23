chrome.extension.onRequest.addListener(
	function(request, sender, sendResponse) {
    	if (request.loadStudySettings != null)
    		getStudySettings(request.loadStudySettings, sendResponse);
    	else if (request.storeStudySettings != null)
    		setStudySettings(request.storeStudySettings);
    	else if (request.loadOAuthTokenSecret != null)
    		getOAuthTokenSecret(request.loadOAuthTokenSecret, sendResponse);
    	else if (request.storeOAuthTokenSecret != null)
    		setOAuthTokenSecret(request.storeOAuthTokenSecret);
    	return true;	// async response    		
	}
);

function generateUserId(cond)
{
	var id = "";
    var charSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    // to avoid any possible duplicate between study and normal usage
    var len = (cond == "none")? 6 : 7;
    
    for (var i = 0; i < len; i++)
        id += charSet.charAt(Math.floor(Math.random() * charSet.length));

    return id;
}

function getStudySettings(url, sendResponse)
{
	//read params from url
	var params = url.substring(url.indexOf("?")+1);
	params = params.split("&");
	
	var prevUserId = localStorage["tweetBubbleUserId"];
	var prevCondition = localStorage["tweetBubbleStudyCondition"];
	
	for (var i = 0; i < params.length; i++)
	{
		if (params[i].indexOf("condition") == 0)
			localStorage["tweetBubbleStudyCondition"] = params[i].substring(params[i].indexOf("=")+1);
		
		if (params[i].indexOf("userid") == 0)
			localStorage["tweetBubbleUserId"] = params[i].substring(params[i].indexOf("=")+1);
	}
	
	if (!localStorage["tweetBubbleStudyCondition"])
		localStorage["tweetBubbleStudyCondition"] = "none";
	
	if (!localStorage["tweetBubbleUserId"])
		localStorage["tweetBubbleUserId"] = generateUserId(localStorage["tweetBubbleStudyCondition"]);

	sendResponse({last_userid: prevUserId, userid: localStorage["tweetBubbleUserId"], 
				last_condition: prevCondition, condition: localStorage["tweetBubbleStudyCondition"],
				agree: localStorage["agreeToInformationSheet"]});
}

function setStudySettings(options)
{
	for (var k in options)
	{
		if (options.hasOwnProperty(k))
		{
			var prop = k.toString();
			localStorage[prop] = options[k];
		}
	}
}

function setOAuthTokenSecret(oauth_token_secret)
{
	localStorage["oauth_token_secret"] = oauth_token_secret;
}

function getOAuthTokenSecret(url, sendResponse)
{
	sendResponse({oauth_token_secret: localStorage["oauth_token_secret"]});
}