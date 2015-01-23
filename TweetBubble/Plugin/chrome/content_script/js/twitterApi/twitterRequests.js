var TwitterRequests = {};

TwitterRequests.postReply = function()
{
	if (!TwitterOAuth.isAuthorized)
		TwitterOAuth.isAuthorized = TwitterOAuth.authorize();
}