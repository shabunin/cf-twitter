CommandFusion module for twitter 
================================

1) Create your own application.
Visit https://apps.twitter.com/, create new app and fill the form. There is "callback url" field. In our case callback url is http://127.0.0.1:5000/ but twitter doesn't accept this. Don't leave it empty otherwise you will get 401 error at authorization. Just write some proper url, doesn't matter.
2) Set up your client.
Open application settings and go to second tab "Settings". Check "Allow this application to be used to Sign in with Twitter" checkbox to on, update settings at tab "Permissions" to "read and write" and go to "Keys and Access Tokens" tab. Paste "Consumer Key (API Key)" and "Consumer Secret (API Secret)" to twitter.js.

================================

This is not full implemetation of twitter REST API only Authorization, getting user info and updating status.
