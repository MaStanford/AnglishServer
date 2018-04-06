module.exports.response = function(codeInt, resultString, obj, req=null){
	return {result:resultString, code: codeInt, data: obj, request: req};
};
module.exports.error = function(codeInt, resultString, obj){
	var error = new Error(resultString);
	error.error_code = codeInt;
	error.error = obj;
	return error;
}

module.exports.codes = {
	success: 1,
	fail: -1,
	bad_password: -2,
	no_user_found: -3,
	duplicate_username: -4,
	invalid_permissions: -5,
	bad_session_token: -6
}