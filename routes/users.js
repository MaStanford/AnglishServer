var express = require('express');
var router = express.Router();
var models = require('../modules/models')();
var utils = require('../modules/utils');
var templates = require('../modules/templates');

const codes = {
  success: 1,
  fail: -1,
  bad_password : -2,
  no_user_found : -3,
  duplicate_username : -4
};

router.route('/login')
.post(function(req, res){
	models.user.findOne({email: req.body.email}, function(error, userFound){
		if(error){
			//Send error
			res.send(templates.response(codes.fail, "fail", "Error retrieving user", {}));
		}else{
			if(userFound){
				var hash = utils.createHash(req.body.password);
				if(hash == userFound.password){
					//Check if we already have a token and update it.
					models.session.remove({user: userFound._id}, function(error, sessionToken){});

					//create session token.
					var sesstoken = utils.createToken();
					var sessionModel = models.session({user:userFound._id, token:sesstoken});
					sessionModel.save(function(error, session){
						if(error){
							res.status('500').send(templates.response(codes.fail, "fail", "Error creating session token"));
						}else{
							res.send(templates.response(codes.success, "success", session));		
						}
					});
				}else{
					//Bad password
					res.send(templates.response(codes.bad_password, "fail", "Password incorrect."));
				}
			}else{
				//No User found
				res.send(templates.response(codes.no_user_found, "fail", "User not found."));
			}
		}
	});
});

router.route('/logout').post(function(req, res){
	models.session.remove({token: req.body.token}, function(error){
		if(error){
			//Send Error.
			res.status('400').send(templates.response(codes.fail, "fail", "Error logging out user."));
		}else{
			//Send Success.
			res.send(templates.response(codes.success, "success", {}));		
		}
	});
});

router.route('/register').post(function(req, res){
	var user = models.user(req.body);
	user.password = utils.createHash(user.password);
	user.save(function(error, user){
		if(error){
			//send error.
			var message = '';
			var code = codes.fail;
			if(error.code == 11000){
				message = "Email or Handle already registered";
				code = codes.duplicate_username;
			}
			res.status('400').send(templates.response(code, message, error));
		}else{
			//send success.
			res.send(templates.response(codes.success, "success", user));		
		}
	});
});

router.route('/user').get(function (req, res){
	var username = req.query.user;
	models.user.findOne({email: username}, function (error, userFound){
		if(error){
			//Send error
			res.status('400').send(templates.response(codes.fail, "Error retrieving user", error));
		} else {
			if(userFound){
				//Make new object without password object
				var user = {
					handle: userFound.handle,
					email:userFound.email,
					permissions:userFound.permissions
				};
				//Send Success.
				res.send(templates.response(codes.success, "success", user));	
			}else{
				//Send error
				res.status('400').send(templates.response(codes.no_user_found, "Error retrieving user", {}));
			}	
		}
	});
});

module.exports = router;
