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

/**
 * Post to add word. 
 */
router.route('/words')
  .post(function (req, res) {
    var sesstoken = req.query.token;
    var promise = models.session.findOne({ token: sesstoken }).populate('comments').exec();
    promise.then(function (session) {
      if (!session) {
        throw new Error("Invalid token");
      } else {
        return models.user.findOne({ _id: session.user });
      }
    })
      .then(function (user) {
        if (!user) {
          throw new Error("User not found");
        }
        if (user.permissions >= MIN_WORD_PERMISSION) {
          var word = new models.word(req.body);
          return word.save();
        } else {
          throw new Error("Invalid Permissions");
        }
      })
      .then(function (word) {
        res.send(templates.response(codes.success, "success", word, req.body));
      })
      .catch(function (error) {
        res.status('400').send(templates.response(codes.fail, "fail", error.message, req.body));
      });
  })
  .get(function (req, res) {
    var word_id = req.query.word_id;
    if (word_id) {
      router.getWordbyId(req, res);
    } else {
      router.getWordbyWord(req, res);
    }
  });


//Function that looks up words by ID
//Query Param is word_id
router.getWordbyId = function (req, res) {

  var word_id = req.query.word_id;
  var populateComments = req.query.populate_comments;
  var promise = {};

  //Check to see if we should populate comments.  This is useful
  if (populateComments && populateComments == true) {
    promise = models.word.find({ _id: word_id }).populate('comments').exec();
  } else {
    promise = models.word.find({ _id: word_id }).exec();
  }
  promise.then(function (words) {
    if (utils.isEmpty(words)) {
      res.status('400').send(templates.response(codes.fail, "fail", error, req.body));
    } else {
      res.send(templates.response(codes.success, "success", words, req.body));
    }
  })
    .catch(function (err) {
      console.log('Error: ' + err.message);
      res.status('400').send(templates.response(codes.fail, err.message, err, req.body));
    });
}

//Function that looks up words by search word.
//Query Param is word
router.getWordbyWord = function (req, res) {

  var searchWord = req.query.word;
  var populateComments = req.query.populate_comments;
  var promise = {};

  //Check to see if we should populate comments.  This is useful
  if (populateComments && populateComments == true) {
    promise = models.word.find({ word: searchWord }).populate('comments').exec();
  } else {
    promise = models.word.find({ word: searchWord }).exec();
  }
  promise.then(function (words) {
    if (utils.isEmpty(words)) {
      res.status('400').send(templates.response(codes.fail, "fail", error, req.body));
    } else {
      res.send(templates.response(codes.success, "success", words, req.body));
    }
  })
    .catch(function (err) {
      console.log('Error: ' + err.message);
      res.status('400').send(templates.response(codes.fail, err.message, err, req.body));
    });
}

router.route('/bulkWord')
  .post(function (req, res) {
    var token = req.query.bulk_token;
    if (!token) {
      res.status('400').send(templates.response(codes.fail, "fail", 'Invalid token', req.body));
    }
    if (token == process.env.BULK_TOKEN) {
      var word = new models.word(req.body);
      word.save(function (error, word) {
        if (error) {
          res.status('400').send(templates.response(codes.fail, "fail", error, req.body));
        } else {
          res.send(templates.response(codes.success, "success", word, req.body));
        }
      });
    }
  });

router.route('/comments')
  .post(function (req, res) {
    var newComment = new models.comment(req.body);
    var promise = newComment.save();
    promise.then(function (comment) {
      if (comment) {
        return models.word.find({ _id: comment.word_id }).exec();
      } else {
        throw new Error('Error saving comment to DB');
      }
    })
      .then(function (word) {
        if (word) {
          word.comments.push(newComment);
          return word.save();
        } else {
          throw new Error('Error finding word associated with comment.');
        }
      })
      .then(function (word) {
        if (word) {
          res.send(templates.response(codes.success, "success", comment, req.body));
        } else {
          throw new Error('Error saving comment to word\'s comment list');
        }
      })
      .catch(function (err) {
        console.log('Error: ' + err.message);
        res.status('400').send(templates.response(codes.fail, err.message, err, req.body));
      });
  })
  .put(function (req, res) {
    //Feature not ready yet
    res.status('400').send(templates.response(codes.fail, 'Feature not implemented yet', {}, req.body));
  })
  .get(function (req, res) {
    var user_id = req.query.user_id;
    var word_id = req.query.word_id;
    //Check if we are looking up all comments by user, or all comments by word.
    if (user_id) {
      var promise = models.comment.find({ user: user_id }).populate('user').exec();
      promise.then(function (comments) {
        if (comments) {
          res.send(templates.response(codes.success, "success", comments, req.body));
        } else {
          res.status('400').send(templates.response(codes.fail, "Comments not found", 'Unable to find comments', req.body));
        }
      })
        .catch(function (err) {
          console.log('Error: ' + err.message);
          res.status('400').send(templates.response(codes.fail, err.message, err, req.body));
        });
    } else {
      var promise = models.comment.find({ word: word_id }).populate('user').exec();
      promise.then(function (comments) {
        if (comments) {
          res.send(templates.response(codes.success, "success", comments, req.body));
        } else {
          res.status('400').send(templates.response(codes.fail, "Comments not found", 'Unable to find comments', req.body));
        }
      })
        .catch(function (err) {
          console.log('Error: ' + err.message);
          res.status('400').send(templates.response(codes.fail, err.message, err, req.body));
        });
    }
  });

module.exports = router;