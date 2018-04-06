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
		models.user.findOne({ email: req.body.email }).exec()
			.then(function (userFound) {
				if (userFound) {
					var hash = utils.createHash(req.body.password);
					if (hash == userFound.password) {
						//It's easier to just remove the previous token and make a new one, than to find and update or find and create
						models.session.remove({ user: userFound._id }, function () { });
						var sesstoken = utils.createToken();
						var sessionModel = models.session({ user: userFound._id, token: sesstoken });
						return sessionModel.save();
					} else {
						throw new Error('Invalid password');
					}
				} else {
					throw new Error('User not found');
				}
			}).then(function (sessionToken) {
				if (sessionToken) {
					console.log(templates.response(codes.success, "success", sessionToken));
					res.send(templates.response(codes.success, "success", sessionToken));
				} else {
					throw new Error('Error creating session token');
				}
			}).catch(function (err) {
				console.log(templates.response(codes.bad_password, err.message || 'Failed to login', err.message));
				res.send(templates.response(codes.bad_password, err.message || 'Failed to login', err.message));
			});
	});

router.route('/logout').post(function (req, res) {
	models.session.remove({ token: req.header('sessionToken')}, function (error) {
		if (error) {
			//Send Error.
			console.log(templates.response(codes.fail, "fail", "Error logging out user."));
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
			console.log(templates.response(code, message, error));
			res.status('400').send(templates.response(code, message, error));
		} else {
			//send success.
			console.log(templates.response(codes.fail, "fail", "Error logging out user."));
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
		var user_email = req.query.email;
		var user_id
		//Check if we have the email or id
		if(user_email){
			models.user.findOne({ email: user_email }, function (error, userFound) {
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
						console.log(templates.response(codes.success, "success", user));
						res.send(templates.response(codes.success, "success", user));
					} else {
						//Send error
						console.log(templates.response(codes.no_user_found, "Error retrieving user", {}));
						res.status('400').send(templates.response(codes.no_user_found, "Error retrieving user", 'User not found'));
					}
				}
			});
		}else{
			models.user.findOne({_id: user_id}, function (error, userFound) {
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
						console.log(templates.response(codes.success, "success", user));
						res.send(templates.response(codes.success, "success", user));
					} else {
						//Send error
						console.log(templates.response(codes.no_user_found, "Error retrieving user", {}));
						res.status('400').send(templates.response(codes.no_user_found, "Error retrieving user", 'User not found'));
					}
				}
			});
		}
	})
	.post(function (req, res) {
		var user = models.user(req.body);
		var userEmail = req.query.email;
		var updaterSessionToken = req.header('sessionToken');
		//We need to find a session token so we can get a user ID/
		models.session.findOne({ token: updaterSessionToken }).exec()
			.then(function (sessionToken) {
				if (sessionToken) {
					//We have a session token so we look up the user. 
					return models.user.findOne({ _id: sessionToken.user });
				} else {
					throw new templates.error(codes.no_user_found, "Invalid user", "Invalid user attempting to update users.");
				}
			})
			.then(function (foundUser) {
				//We check to make sure the user has mod permissions and has higher permissions than the user they are attempting to update
				if (foundUseruser && foundUser.permissions >= 5 && foundUser.permissions > user.permissions) {
					//If we have prereqs, then we find the user to update.
					return models.user.findOne({ email: userEmail }).exec();
				} else {
					throw new templates.error(codes.invalid_permissions, "Invalid permissions", "Invalid permissions to update users");
				}
			})
			.then(function (foundUser) {
				if (foundUser) {
					//We found the user to update
					foundUser.email = user.email || foundUser.email;
					foundUser.handle = user.handle || foundUser.handle;
					foundUser.permissions = user.permissions || foundUser.permissions;
					if (user.password) {
						foundUser.password = utils.createHash(user.password);
					}
					return foundUser.save();
				} else {
					throw new templates.error(codes.no_user_found, "User not found", "Could not find user to update");
				}
			})
			.then(function (savedUser) {
				var user = {
					handle: savedUser.handle,
					email: savedUser.email,
					permissions: savedUser.permissions
				};
				console.log(templates.response(codes.success, "success", user));
				res.send(templates.response(codes.success, "success", user));
			})
			.catch(function (err) {
				console.log(templates.response(err.code || codes.bad_password, err.data || 'Fail', err.object || 'Error logging in!'));
				res.send(templates.response(err.code || codes.bad_password, err.data || 'Fail', err.object || 'Error logging in!'));
			});
	});

module.exports = router;
