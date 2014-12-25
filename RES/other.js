String.prototype.to_rfc3986 = function() {
        var tmp = encodeURIComponent(this);
        tmp = tmp.replace('!', '%21');
        tmp = tmp.replace('*', '%2A');
        tmp = tmp.replace('(', '%28');
        tmp = tmp.replace(')', '%29');
        tmp = tmp.replace("'", '%27');
        return tmp;
    };

function randomString(len, charSet) {
    charSet = charSet || 'abcdefghijklmnopqrstuvwxyz0123456789';
    var rString = '';
    for (var i = 0; i < len; i++) {
    	var randomPoz = Math.floor(Math.random() * charSet.length);
    	rString += charSet.substring(randomPoz,randomPoz+1);
    }
    return rString;
}