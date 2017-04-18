var crypto = require('crypto');
const keepAlive = 7 * 24 * 60 * 60 * 1000; //7 days.

module.exports.isEmpty = function(obj) {
    for(var prop in obj) {
        if(obj.hasOwnProperty(prop))
            return false;
    }
    return true && JSON.stringify(obj) === JSON.stringify({});
};

module.exports.createHash = function(password){
    var hash = crypto
        .createHash("md5")
        .update(password)
        .digest('hex');
    return hash;
};

module.exports.createToken = function() {
    var sha = crypto.createHash('sha256');
    sha.update(Math.random().toString());
    return sha.digest('hex');
};

module.exports.isExpiredToken = function(token){
    var date = token.dateCreated;
    var now = Date.now();
    var delta = now - date;
    if(delta > keepAlive){
        return true;
    }else{
        return false;
    }
};
