var crypto = require('crypto');
let keepAlive = 7 * 24 * 60 * 60 * 1000; //7 days.


module.exports = function(){
    var isEmpty = function(obj) {
        for(var prop in obj) {
            if(obj.hasOwnProperty(prop))
                return false;
        }
        return true && JSON.stringify(obj) === JSON.stringify({});
    };

    var createHash = function(password){
        var hash = crypto
            .createHash("md5")
            .update(password)
            .digest('hex');
        return hash;
    };

    var createToken = function() {
        var sha = crypto.createHash('sha256');
        sha.update(Math.random().toString());
        return sha.digest('hex');
    };

    var isExpiredToken = function(token){
        var date = token.dateCreated;
        var now = Date.now();
        var delta = now - date;
        if(delta > keepAlive){
            return true;
        }else{
            return false;
        }
    };
}