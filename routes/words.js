var express = require('express');
var router = express.Router();
var models = require('../modules/models')();

const codes = {
  success: 1,
  fail: -1
};

router.route('/words')
  .post(function(req, res){

  })
  .get(function(req, res){
    res.render('index', { title: 'Words' });
  });

router.route('/names')
.post(function(req, res){

})
.get(function(req, res){
    res.render('index', { title: 'names' });
});

module.exports = router;