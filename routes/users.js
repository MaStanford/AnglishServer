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

router.route('/login').post(function(req, res){
	models.user.findOne({email: req.body.email}, function(error, userFound){
		if(error){
			//Send error
			res.status('400').send(templates.response(codes.fail, "fail", "Error retrieving user", req.body));
		}else{
			if(userFound){
				var hash = utils.createHash(req.body.password);
				if(hash == userFound.password){
					//Check if we already have a token and update it.
					models.session.remove({user: userFound._id}, function(error, sessionToken){
						//Don't really care.
					});

					//create session token.
					var sesstoken = utils.createToken();
					var sessionModel = models.session({user:userFound._id, token:sesstoken});
					sessionModel.save(function(error, session){
						if(error){
							res.status('400').send(templates.response(codes.fail, "fail", "Error creating session token", req.body));
						}else{
							res.send(templates.response(codes.success, "success", session, req.body));		
						}
					});
				}else{
					//Bad password
					res.status('400').send(templates.response(codes.bad_password, "fail", "Password incorrect.", req.body));
				}
			}else{
				//No User found
				res.status('400').send(templates.response(codes.no_user_found, "fail", "User not found.", req.body));
			}
		}
	});
});

router.route('/logout').post(function(req, res){
	models.session.remove({token: req.body.token}, function(error){
		if(error){
			//Send Error.
			res.status('400').send(templates.response(codes.fail, "fail", "Error logging out user.", req.body));
		}else{
			//Send Success.
			res.send(templates.response(codes.success, "success", words, req.body));		
		}
	});
});

router.route('/register').post(function(req, res){
	var user = models.user(req.body);
	user.password = utils.createHash(user.password);
	user.save(function(error, user){
		if(error){
			//send error.
			var message = "";
			var code = codes.fail;
			if(error.code == 11000){
				message = "Email already registered";
				code = codes.duplicate_username;
			}
			res.status('400').send(templates.response(code, "fail", message, req.body));
		}else{
			//send success.
			res.send(templates.response(codes.success, "success", user, req.body));		
		}
	});
});

module.exports = router;
