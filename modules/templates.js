module.exports.response = function(codeInt, resultString, obj, req=null){
	return {result:resultString, code: codeInt, data: obj, request: req};
};
module.exports.error = function(codeInt, resultString, obj){
	return {
		code: codeInt,
		data: resultString,
		object: obj
	};
}