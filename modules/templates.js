module.exports.response = function(codeInt, resultString, obj, req=null){
	return {result:resultString, code: codeInt, data: obj, request: req};
};