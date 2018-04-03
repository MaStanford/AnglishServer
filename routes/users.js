var express = require('express');
var router = express.Router();
var models = require('../modules/models')();
var utils = require('../modules/utils');
var templates = require('../modules/templates');

const codes = {
	success: 1,
	fail: -1,
	bad_password: -2,
	no_user_found: -3,
	duplicate_username: -4,
	invalid_permissions: -5
};

router.route('/login')
	.post(function (req, res) {
		models.user.findOne({ email: eq.body.email }).exec()
			.then(function (user) {
				if (user) {
					var hash = utils.createHash(req.body.password);
					if (hash == userFound.password) {
						//Check if we already have a token and update it.
						return models.session.remove({ user: userFound._id }).exec();
					} else {
						throw new {
							code: codes.bad_password,
							data: "Incorrect Password",
							object: 'Password did not match saved password'
						};
					}
				} else {
					throw new {
						code: codes.no_user_found,
						data: "User not found",
						object: 'Error finding user'
					};
				}
			}).then(function (result) {
				//create session token.
				var sesstoken = utils.createToken();
				var sessionModel = models.session({ user: userFound._id, token: sesstoken });
				return sessionModel.save();
			}).then(function (sessionToken) {
				if (sessionToken) {
					res.send(templates.response(codes.success, "success", sessionToken));
				} else {
					throw new {
						code: codes.fail,
						data: "Session fail",
						object: 'Error creating session tokenr'
					};
				}
			}).catch(function (err) {
				res.send(templates.response(err.code || codes.bad_password, err.data || 'Fail', err.object || 'Error logging in!'));
			});
	});

router.route('/logout').post(function (req, res) {
	models.session.remove({ token: req.body.token }, function (error) {
		if (error) {
			//Send Error.
			res.status('400').send(templates.response(codes.fail, "fail", "Error logging out user."));
		} else {
			//Send Success.
			res.send(templates.response(codes.success, "success", {}));
		}
	});
});

router.route('/register').post(function (req, res) {
	var user = models.user(req.body);
	user.password = utils.createHash(user.password);
	user.save(function (error, user) {
		if (error) {
			//send error.
			var message = '';
			var code = codes.fail;
			if (error.code == 11000) {
				message = "Email or Handle already registered";
				code = codes.duplicate_username;
			}
			res.status('400').send(templates.response(code, message, error));
		} else {
			//send success.
			res.send(templates.response(codes.success, "success", user));
		}
	});
});

/**
 * Get a users info.
 * Post to update a user, to update you need mod permissions and greater permissions than the updated user.
 * 
 * Get requires a query param of the email.
 * Post requires a query param of the session token and a query param of the to be updates user's email 
 * and a body of the updated fields.
 */
router.route('/user')
	.get(function (req, res) {
		var user = req.query.user;
		models.user.findOne({ email: user}, function (error, userFound) {
			if (error) {
				//Send error
				res.status('400').send(templates.response(codes.fail, "Error retrieving user", error));
			} else {
				if (userFound) {
					//Make new object without password object
					var user = {
						handle: userFound.handle,
						email: userFound.email,
						permissions: userFound.permissions
					};
					//Send Success.
					res.send(templates.response(codes.success, "success", user));
				} else {
					//Send error
					res.status('400').send(templates.response(codes.no_user_found, "Error retrieving user", {}));
				}
			}
		});
	})
	.post(function (req, res) {
		var user = models.user(req.body);
		var userEmail = req.query.email;
		var updaterSessionToken = req.query.sessionToken;
		//We need to find a session token so we can get a user ID/
		models.session.findOne({token: updaterSessionToken}).exec()
		.then(function(sessionToken){
			if(sessionToken){
				//We have a session token so we look up the user. 
				return models.user.findOne({_id:  sessionToken.user});
			}else{
				throw new templates.error(codes.no_user_found, "Invalid user", "Invalid user attempting to update users.");
			}
		})
		.then(function(foundUser){
			//We check to make sure the user has mod permissions and has higher permissions than the user they are attempting to update
			if(foundUseruser && foundUser.permissions >= 5 && foundUser.permissions > user.permissions){
				//If we have prereqs, then we find the user to update.
				return models.user.findOne({email: userEmail}).exec();
			}else{
				throw new templates.error(codes.invalid_permissions, "Invalid permissions", "Invalid permissions to update users");
			}
		})
		.then(function(foundUser){
			if(foundUser){
				//We found the user to update
				foundUser.email = user.email || foundUser.email;
				foundUser.handle = user.handle || foundUser.handle;
				foundUser.permissions = user.permissions || foundUser.permissions;
				if(user.password){
					foundUser.password = utils.createHash(user.password);
				}
				return foundUser.save();
			}else{
				throw new templates.error(codes.no_user_found, "User not found", "Could not find user to update");
			}
		})
		.then(function(savedUser){
			var user = {
				handle: savedUser.handle,
				email: savedUser.email,
				permissions: savedUser.permissions
			};
			res.send(templates.response(codes.success, "success", user));
		})
		.catch(function (err) {
			res.send(templates.response(err.code || codes.bad_password, err.data || 'Fail', err.object || 'Error logging in!'));
		});
	});

module.exports = router;
