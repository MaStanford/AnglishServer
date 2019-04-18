var models = require('../modules/models')();
var templates = require('../modules/templates');

module.exports.getSessionToken = function(req, res, next){
	var sessionToken = req.header('sessionToken');
	models.session.findOne({token: sessionToken}).populate('user').exec()
	.then(function(session){
		req.session = session;
		next();
	})
	.catch(function(err){
		next();
	});
};