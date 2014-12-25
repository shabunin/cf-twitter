
CF.userMain = function() {
	CF.log('Starting cf-twitter');
	CF.log(rstr2b64('Starting cf-twitter!'));
	twitterClient.saveTokensFunction = saveAccessToken;
	CF.watch(CF.FeedbackMatchedEvent, "localhost5000server", "localhost5000feedback", twitterClient.localhost5000parse);
};

