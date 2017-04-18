var express = require('express');
var router = express.Router();
var models = require('../modules/models')();
var templates = require('../modules/templates');
var utils = require('../modules/utils');

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

router.route('/bulkWord')
  .post(function(req, res){
    var token = req.query.bulk_token;
    if(!token){
        res.status('400').send(templates.response(codes.fail, "fail", 'Invalid token', req.body));
    }
    if(token == process.env.BULK_TOKEN){
        var word = new models.word(req.body);
        word.save(function(error, word){
          if(error){
            res.status('400').send(templates.response(codes.fail, "fail", error, req.body));
          }else{
            res.send(templates.response(codes.success, "success", word, req.body));		
          }
        }); 
    }
  });

module.exports = router;