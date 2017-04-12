var express = require('express');
var router = express.Router();
var models = require('../modules/models')();
var utils = require('../modules/utils');

const codes = {
  success: 1,
  fail: -1
};

router.route('/words')
  .post(function(req, res){
    var word = new models.word(req.body);
    word.save(function(error, word){
      if (error) {
				res.status('400').send({result : "fail", code : codes.fail, error:error, request:req.body});
			} else {
				res.send({result: "sucess", code : codes.success, word:word});		
			}
    });
  })
  .get(function(req, res){
    models.word.find({word:req.query.word},function(error, words){
			if(error || utils.isEmpty(words)){
				res.status('400').send({result : "fail", code : codes.fail, error:error});
			} else {
        res.send({result: "sucess", code : codes.success, words:words});
			}
    })
  });


router.route('/names')
.post(function(req, res){

})
.get(function(req, res){
    res.render('index', { title: 'names' });
});

module.exports = router;