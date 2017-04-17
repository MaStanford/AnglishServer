var express = require('express');
var router = express.Router();
var models = require('../modules/models')();
var utils = require('../modules/utils');
var templates = require('../modules/templates');

const codes = {
  success: 1,
  fail: -1,
  invalid_permissions: -2
};

let MIN_WORD_PERMISSION = 2;

router.route('/words')
  .post(function(req, res){
    var sesstoken = req.query.token;
    var promise = models.session.findOne({token:sesstoken}).exec();
    promise.then(function(session){
      if(!session){
        throw new Error("Invalid token");
      }else{
        return models.user.findOne({_id:session.user});
      }
    })
    .then(function(user){
      if(!user){
        throw new Error("User not found");
      }
      if(user.permissions >= MIN_WORD_PERMISSION){
        var word = new models.word(req.body);
        return word.save(); 
      }else{
        throw new Error("Invalid Permissions");
      }
    })
    .then(function(word){
        res.send(templates.response(codes.success, "success", word, req.body));		
    })
    .catch(function(error){
        res.status('400').send(templates.response(codes.fail, "fail", error.message, req.body));
    });
  })


  .get(function(req, res){
    models.word.find({word:req.query.word},function(error, words){
      if(error || utils.isEmpty(words)){
        res.status('400').send(templates.response(codes.fail, "fail", error, req.body));
      } else {
        res.send(templates.response(codes.success, "success", words, req.body));		
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