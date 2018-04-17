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

module.exports.toLowerCase = function(input){
    return input.toLowerCase();
}

module.exports.caseInsensitive = function(search){
    return new RegExp(search, 'i')
}

module.exports.permissions = {
    //higher permissions get all lower priveledges.
    owner:99, //Can upgrade users from 1-2-3-4-5-4-3-2-1.
    admin:5, //Can upgrade users from 1-2-3-4-3-2-1 and delete words
    mod:4, // Can upgrade users from 1-2-3-2-1 and delete comments
    poweruser:3, //Can make words
    basicuser:2, //Can comment
    punisheduser:1 //Cant do anything
}
