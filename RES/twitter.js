/*
 * Copyright (C) 2014 Vladimir Shabunin
 * License: http://www.gnu.org/licenses/gpl.html GPL version 2 or higher
 */


var twitterClient = {
	debug: 1,
	browserJoin: 's1',
	browserPageJoin: 'd100',
	consumer_key: '---',
	consumer_secret: '---',
	signature_method: 'HMAC-SHA1',
	redirect_uri: 'http://127.0.0.1:5000', //http://localhost:5000/
	oauth_version: '1.0',
	timestamp_offset: 3600, //3600 - for Moscow time, because after recently law time was shifted but wasn't updatet on ntp servers. so while debugging u should use 0

	globalTokenAccessToken: 'access_token',
	globalTokenAccessSecret: 'access_token_secret',
	clearTokens: function() {
		this.access_token = '';
		this.access_token_secret = '';
		CF.setToken(CF.GlobalTokensJoin, this.globalTokenAccessToken , 0);
		CF.setToken(CF.GlobalTokensJoin, this.globalTokenAccessSecret, 0);
	},
	twitterAuthorization: function() {
		var that = this;
		CF.getJoin(CF.GlobalTokensJoin, function(j, v, tokens, tags) {
		    var access_token = tokens[that.globalTokenAccessToken]; 
		    var access_token_secret = tokens[that.globalTokenAccessSecret];
		    if (access_token != 0 ) {
		    	that.access_token = access_token;
		    	that.access_token_secret = access_token_secret;
		    	that.requestVerifyCredentials();
		    } else {
		    	that.requestToken();
		    }
		});
	},
	saveGlobalTokens: function() {
		CF.setToken(CF.GlobalTokensJoin, this.globalTokenAccessToken , this.access_token);
		CF.setToken(CF.GlobalTokensJoin, this.globalTokenAccessSecret, this.access_token_secret);
	},
	requestToken: function() {
		var that = this;
		this.log('>>> REQUEST TOKEN ');
		var oauth_callback = encodeURIComponent(this.redirect_uri);
		var oauth_method = 'POST';
		var oauth_url = 'https://api.twitter.com/oauth/request_token';
		var oauth_timestamp = parseInt(timestamp.now()) + this.timestamp_offset; //

		var oauth_consumer_key = this.consumer_key;
		var oauth_signature_method = this.signature_method;
		var oauth_consumer_secret = this.consumer_secret;
		var oauth_nonce = randomString(32);
		//var oauth_token = this.access_token;
		var oauth_version = this.oauth_version;
		var sig_headers_string = 'oauth_callback=' + oauth_callback +
							'&oauth_consumer_key=' + oauth_consumer_key  +
							'&oauth_nonce=' + oauth_nonce +
							'&oauth_signature_method=' + oauth_signature_method +
							'&oauth_timestamp=' + oauth_timestamp +
							'&oauth_version=' + oauth_version;
		
		this.log('SIG HEADER STRING: ' + sig_headers_string);
		
		var signature_base_string = oauth_method + '&' + encodeURIComponent(oauth_url) + '&' + encodeURIComponent(sig_headers_string) ;
		var signature_key = oauth_consumer_secret + '&';
		this.log('SIG BASE STRING: ' +signature_base_string);
		this.log('SIG KEY: ' + signature_key);
		
		var oauth_signature = encodeURIComponent(b64_hmac_sha1(signature_key, signature_base_string));
		this.log('SIGNATURE: ' + oauth_signature);

		var authorization_header = 'OAuth oauth_callback="' + oauth_callback + '",' +
								'oauth_consumer_key="' + oauth_consumer_key + '",' +
								'oauth_nonce="' + oauth_nonce  + '",' +
								'oauth_signature="' + oauth_signature + '",' + 
								'oauth_signature_method="' + oauth_signature_method + '",' +
								'oauth_timestamp="' + oauth_timestamp + '",' +
								'oauth_version="' + oauth_version + '"';
		this.log('AUTHORIZATION HEADER: ' + authorization_header);
		var oauth_headers = {
			'User-Agent' : 'iViewer4/cf-twitter',
			'Content-Type' : 'application/x-www-form-urlencoded',
			'Authorization' : 	authorization_header,

		};

		CF.request(oauth_url, oauth_method, oauth_headers, function(status, headers, body) {
               if (status == 200) {
               		//that.log(JSON.stringify(headers));
               		//that.log(body);
               		that.parseRequestTokenResponse(body);
               		CF.setJoin(that.browserPageJoin, 1);
               } else {
                   that.log("Error: returned status code " + status);
                   that.log(JSON.stringify(headers));
                   that.log(body);
               }
		}); 	
	},
	requestAccessToken: function() {
		var that = this;
		this.log('>>> REQUEST ACCES TOKEN ');
		var oauth_callback = encodeURIComponent(this.redirect_uri);
		var oauth_method = 'POST';
		var oauth_url = 'https://api.twitter.com/oauth/access_token';
		var oauth_timestamp = parseInt(timestamp.now()) + this.timestamp_offset;

		var oauth_consumer_key = this.consumer_key;
		var oauth_signature_method = this.signature_method;
		var oauth_consumer_secret = this.consumer_secret;
		var oauth_nonce = randomString(32);
		var oauth_token = this.oauth_token;
		var oauth_verifier = this.oauth_verifier;
		var oauth_version = this.oauth_version;
		var oauth_token_secret = this.oauth_token_secret;
		var sig_headers_string = 'oauth_consumer_key=' + oauth_consumer_key  +
							'&oauth_nonce=' + oauth_nonce +
							'&oauth_signature_method=' + oauth_signature_method +
							'&oauth_timestamp=' + oauth_timestamp +
							'&oauth_token=' + oauth_token +
							'&oauth_verifier=' + oauth_verifier +
							'&oauth_version=' + oauth_version;
		
		this.log('SIG HEADER STRING: ' + sig_headers_string);
		
		var signature_base_string = oauth_method + '&' + encodeURIComponent(oauth_url) + '&' + encodeURIComponent(sig_headers_string) ;
		var signature_key = oauth_consumer_secret + '&' + oauth_token_secret;
		
		this.log('SIG BASE STRING: ' + signature_base_string);
		this.log('SIG KEY: ' + signature_key);
		
		var oauth_signature = encodeURIComponent(b64_hmac_sha1(signature_key, signature_base_string));
		this.log('SIGNATURE: ' + oauth_signature);

		var authorization_header = 'OAuth oauth_consumer_key="' + oauth_consumer_key + '",' +
								'oauth_nonce="' + oauth_nonce  + '",' +
								'oauth_signature="' + oauth_signature + '",' + 
								'oauth_signature_method="' + oauth_signature_method + '",' +
								'oauth_timestamp="' + oauth_timestamp + '",' +
								'oauth_token="' + oauth_token + '",' +

								'oauth_version="' + oauth_version + '"';
		this.log('AUTHORIZATION HEADER: ' + authorization_header);
		var oauth_headers = {
			'User-Agent' : 'iViewer4/cf-twitter',
			'Content-Type' : 'application/x-www-form-urlencoded',
			'Authorization' : 	authorization_header,

		};
		var oauthContent = 'oauth_verifier=' + oauth_verifier;
		CF.request(oauth_url, oauth_method, oauth_headers, oauthContent, function(status, headers, body) {
               if (status == 200) {
               		//that.log(JSON.stringify(headers));
               		//that.log(body);
               		that.parseAccessTokenResponse(body);

               } else {
                   that.log("Error: returned status code " + status);
                   that.log(JSON.stringify(headers));
                   that.log(body);
               }
		}); 			
	},

	requestUpdateStatus: function(newStatus) {
		var that = this;
		this.log('>>> REQUEST UPDATE STATUS ');
		var requestUrl = 'https://api.twitter.com/1.1/statuses/update.json';

		var requestMethod = 'POST';
		var oauth_timestamp = parseInt(timestamp.now()) + this.timestamp_offset;

		var oauth_consumer_key = this.consumer_key;
		var oauth_signature_method = this.signature_method;
		var oauth_consumer_secret = this.consumer_secret;
		var oauth_nonce = randomString(32);
		var access_token = this.access_token;
		var oauth_token = this.oauth_token;
		var oauth_token_secret = this.oauth_token_secret;
		var oauth_version = this.oauth_version;
		var access_token_secret = this.access_token_secret;
		var sig_headers_string = 'oauth_consumer_key=' + oauth_consumer_key  +
							'&oauth_nonce=' + oauth_nonce +
							'&oauth_signature_method=' + oauth_signature_method +
							'&oauth_timestamp=' + oauth_timestamp +
							'&oauth_token=' + access_token +
							'&oauth_version=' + oauth_version + 
							'&status=' + newStatus.to_rfc3986() ;
		
		this.log('SIG HEADER STRING: ' + sig_headers_string);
		
		var signature_base_string = requestMethod + '&' + encodeURIComponent(requestUrl) + '&' + encodeURIComponent(sig_headers_string) ;
		var signature_key = oauth_consumer_secret + '&' + access_token_secret;
		
		this.log('SIG BASE STRING: ' + signature_base_string);
		this.log('SIG KEY: ' + signature_key);
		
		var oauth_signature = encodeURIComponent(b64_hmac_sha1(signature_key, signature_base_string));
		this.log('SIGNATURE: ' + oauth_signature);

		var authorization_header = 'OAuth oauth_consumer_key="' + oauth_consumer_key + '",' +
								'oauth_nonce="' + oauth_nonce  + '",' +
								'oauth_signature="' + oauth_signature + '",' + 
								'oauth_signature_method="' + oauth_signature_method + '",' +
								'oauth_timestamp="' + oauth_timestamp + '",' +
								'oauth_token="' + access_token + '",' +
								'oauth_version="' + oauth_version + '"' ; 
		
		this.log('AUTHORIZATION HEADER: ' + authorization_header);
		var oauth_headers = {
			'User-Agent' : 'iViewer4/cf-twitter',
			'Content-Type' : 'application/x-www-form-urlencoded',
			'Authorization' : 	authorization_header,

		};
		CF.request(requestUrl, requestMethod, oauth_headers, 'status='  + newStatus.to_rfc3986(), function(status, headers, body) {
		               if (status == 200) {
		               		that.log(JSON.stringify(headers));
		               		that.log(body);

		               		CF.setJoin('s7', 'status: ' + status);
               } else {
                   that.log("Error: returned status code " + status);
                   that.log(JSON.stringify(headers));
                   that.log(body);
                   CF.setJoin('s7', 'status: ' + status + ' ' + body);

               }
		}); 	

		//test2(signature_base_string);
	},
	requestVerifyCredentials: function() {
		var that = this;
		this.log('>>> REQUEST VERIFY CREDENTIALS ');
		var requestUrl = 'https://api.twitter.com/1.1/account/verify_credentials.json';

		var requestMethod = 'GET';
		var oauth_timestamp = parseInt(timestamp.now()) + this.timestamp_offset;

		var oauth_consumer_key = this.consumer_key;
		var oauth_signature_method = this.signature_method;
		var oauth_consumer_secret = this.consumer_secret;
		var oauth_nonce = randomString(32);
		var access_token = this.access_token;
		var oauth_token = this.oauth_token;
		var oauth_token_secret = this.oauth_token_secret;
		var oauth_version = this.oauth_version;
		var access_token_secret = this.access_token_secret;
		var sig_headers_string = 'oauth_consumer_key=' + oauth_consumer_key  +
							'&oauth_nonce=' + oauth_nonce +
							'&oauth_signature_method=' + oauth_signature_method +
							'&oauth_timestamp=' + oauth_timestamp +
							'&oauth_token=' + access_token +
							'&oauth_version=' + oauth_version;
							//'&status=' + encodeURIComponent(newStatus) ;
		
		this.log('SIG HEADER STRING: ' + sig_headers_string);
		
		var signature_base_string = requestMethod + '&' + encodeURIComponent(requestUrl) + '&' + encodeURIComponent(sig_headers_string) ;
		var signature_key = oauth_consumer_secret + '&' + access_token_secret;
		
		this.log('SIG BASE STRING: ' + signature_base_string);
		this.log('SIG KEY: ' + signature_key);
		
		var oauth_signature = encodeURIComponent(b64_hmac_sha1(signature_key, signature_base_string));
		this.log('SIGNATURE: ' + oauth_signature);

		var authorization_header = 'OAuth oauth_consumer_key="' + oauth_consumer_key + '",' +
								'oauth_nonce="' + oauth_nonce  + '",' +
								'oauth_signature="' + oauth_signature + '",' + 
								'oauth_signature_method="' + oauth_signature_method + '",' +
								'oauth_timestamp="' + oauth_timestamp + '",' +
								'oauth_token="' + access_token + '",' +
								'oauth_version="' + oauth_version + '"' ; 
		
		this.log('AUTHORIZATION HEADER: ' + authorization_header);
		var oauth_headers = {
			'User-Agent' : 'iViewer4/cf-twitter',
			'Content-Type' : 'application/x-www-form-urlencoded',
			'Authorization' : 	authorization_header,

		};
		CF.request(requestUrl, requestMethod, oauth_headers, function(status, headers, body) {
		               if (status == 200) {
		               		that.log(JSON.stringify(headers));
		               		that.parseCredentialsResponse(body);
               } else {
                   that.log("Error: returned status code " + status);
                   that.log(JSON.stringify(headers));
                   that.log(body);
               }
		}); 	

		//test2(signature_base_string);
	},
	parseRequestTokenResponse: function(body){
		this.log('>>> REQUEST TOKEN RESPONSE');
		var regexToken = /oauth_token=([^&]+)&oauth_token_secret=([^&]+)/;
		var regArr = [];
		if(regexToken.test(body)) {
			regArr = regexToken.exec(body);
			this.oauth_token = regArr[1];
			this.oauth_token_secret = regArr[2];
			CF.setJoin(this.browserJoin, 'https://api.twitter.com/oauth/authorize?oauth_token='+this.oauth_token);
		}
	},
	parseCredentialsResponse: function(body) {
		var that = this;
		var credentials = JSON.parse(body);
		this.username = credentials.name;
		this.screen_name = credentials.screen_name;
		this.profile_image_url = credentials.profile_image_url;

		//set joins - test, will delete it
		CF.setJoin('s3', that.profile_image_url);
		CF.setJoin('s4', that.screen_name);
		CF.setJoin('s5', that.username);
	},
	parseAccessTokenResponse: function(body){
		this.log('>>> REQUEST ACCESS TOKEN RESPONSE'); 
		var regexToken = /oauth_token=([^&]+)&oauth_token_secret=([^&]+)&user_id=([^&]+)&screen_name=([^\s]+)/;
		var regArr = [];
		if(regexToken.test(body)) {
			regArr = regexToken.exec(body);
			this.access_token = regArr[1];
			this.access_token_secret = regArr[2];
			this.user_id = regArr[3];
			this.screen_name = regArr[4];
			//CF.setJoin('s2', this.screen_name);
			this.requestVerifyCredentials();
			this.saveGlobalTokens();
		}
	},

	localhost5000parse: function(feedbackItem, matchedString) {
		twitterClient.log('>>> INCOMING MESSAGE TO LOCALHOST:5000 ');
		twitterClient.log(matchedString);
		var regexToken = /oauth_token=([^&]+)&oauth_verifier=([^ ]+)/;
		var regArr = [];
		if (regexToken.test(matchedString)) {
			regArr = regexToken.exec(matchedString);
			twitterClient.oauth_token = regArr[1];
			twitterClient.oauth_verifier = regArr[2];
			CF.setJoin(twitterClient.browserPageJoin, 0);
			twitterClient.requestAccessToken();
		}
	},
	log: function(text) {
		if (this.debug == 1) {
			CF.log("twitterClient: " + text);
		}
	},
};