var express = require('express');
var router = express.Router();
var models = require('../modules/models')();
var templates = require('../modules/templates');
var codes = templates.codes;
var utils = require('../modules/utils');

/**
 * Post to add word. 
 * Query param token is session token from /users/login
 * 
 * Get to search for word. 
 * Query param word is search term.  
 * Query param populate_comments is boolean if you want a populated list of comments, otherwise a list of comment_ids
 */
router.route('/words')
  .post(function (req, res) {
    var session = req.session;
    if (!session || session.user.permissions < utils.permissions.poweruser) {
      res.status('400').send(templates.response(codes.fail, "Invalid session or permissions", "Session was either not in the request header or the user does not have permission to add words", req.body));
      return;
    }
    var word = new models.word(req.body);
    word.createdBy = session.user._id;
    word.save()
      .then(function (word) {
        res.send(templates.response(codes.success, "success", word, req.body));
      })
      .catch(function (error) {
        res.status('400').send(templates.response(codes.fail, "fail", error.message, req.body));
      });
  })
  .get(function (req, res) {
    router.getWordbyWord(req, res);
  });


/**
 * Update a word. 
 * Query param is the word id
 * Query Body is the new word.
 * Does not update comments, only word, type, attested and unattested
 */
router.post('/words/:word_id', function (req, res) {
  var session = req.session;
  var word_id = req.params.word_id;
  var updateWord = new models.word(req.body);

  if (!session || session.user.permissions < utils.permissions.poweruser) {
    res.status('400').send(templates.response(codes.invalid_permissions, 'No session found', 'An invalid session token or no session token was in header.', req.body));
  }

  var promise = models.word.findOne({ _id: word_id }).exec();

  promise.then(function (word) {
    word.word = updateWord.word || word.word;
    word.type = updateWord.type || word.type;
    word.attested = updateWord.attested || word.attested;
    word.unattested = updateWord.unattested || word.unattested;
    return word.save();
  })
    .then(function (word) {
      res.send(templates.response(codes.success, "success", word, req.body));
    })
    .catch(function (err) {
      res.status('400').send(templates.response(err.error_code, err.message, error.error, req.body));
    });
});

router.get('/words/:word_id', function (req, res) {
  router.getWordbyId(req, res);
});

router.get('/words/user/:user_id', function (req, res) {
  router.getWordsByUserId(req, res);
});

router.delete('/words/:word_id', function (req, res) {
  router.deleteWordByID(req, res);
});

//Function that looks up words by ID
//Query Param is word_id
router.getWordbyId = function (req, res) {

  var word_id = req.params.word_id;
  var populateComments = req.query.populate_comments;
  var promise = {};

  //Check to see if we should populate comments.  This is useful
  if (populateComments && populateComments == 1) {
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
  if (populateComments && populateComments == 1) {
    promise = models.word.find({ word: utils.caseInsensitive(searchWord) }).populate('comments').exec();
  } else {
    promise = models.word.find({ word: utils.caseInsensitive(searchWord) }).exec();
  }
  promise.then(function (words) {
    if (utils.isEmpty(words)) {
      res.status('400').send(templates.response(codes.fail, "fail", error, req.body));
    } else {
      res.send(templates.response(codes.success, "success", words, req.body));
    }
  })
    .catch(function (err) {
      res.status('400').send(templates.response(codes.fail, err.message, err, req.body));
    });
}

router.getWordsByUserId = function (req, res) {
  var user_id = req.params.user_id;
  var populateComments = req.query.populate_comments;
  var promise = {};

  //Check to see if we should populate comments.  This is useful
  if (populateComments && populateComments == 1) {
    promise = models.word.find({ createdBy: user_id }).populate('comments').exec();
  } else {
    promise = models.word.find({ createdBy: user_id }).exec();
  }
  promise.then(function (words) {
    if (utils.isEmpty(words)) {
      res.status('400').send(templates.response(codes.fail, "fail", error, req.body));
    } else {
      res.send(templates.response(codes.success, "success", words, req.body));
    }
  })
}

router.deleteWordByID = function (req, res) {
  var word_id = req.params.word_id;
  var session = req.session;
  if (!session) {
    res.status('400').send(templates.response(codes.fail, 'Invalid session', {}, req.body));
  }
  models.word.findOne({ _id: word_id }).exec()
    .then((word) => {
      if (word) {
        if ((word.createdBy && word.createdBy.equals(session.user._id)) || session.user.permissions >= utils.permissions.admin) {
          return models.word.findOneAndRemove({ _id: word_id }).exec();
        } else {
          throw templates.error(codes.invalid_permissions, 'Invalid permissions to delete this word', word);
        }
      } else {
        throw templates.error(codes.document_not_found, 'Word not found', word);
      }
    })
    .then((word) => {
      if(word){
        res.send(templates.response(codes.success, "success", word, req.body));
      }else{
        throw templates.error(codes.fail, 'Failed to delete word for some reason that is not known.', word);
      }
    })
    .catch((error) => {
      res.status('400').send(templates.response(error.error_code, error.message, error.error, req.body));
    });
}

/**
 * Bulk word insert
 * Query Param bulk_token is bulk insert key
 */
router.route('/bulkWord')
  .post(function (req, res) {
    var token = req.query.bulk_token;
    if (!token) {
      res.status('400').send(templates.response(codes.fail, "fail", 'Invalid token', req.body));
    }
    if (token === process.env.BULK_TOKEN) {
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

/**
 * Post to create comment. 
 * Body is comment object
 * 
 * Get to retrieve list of comments by user or word.
 * Word can be used to return a populated list of comments.
 * Either param is ok:
 * Query param user_id is user id to get all comments from.
 * Query param word_id is word id to get all comments from.
 */
router.route('/comments')
  .post(function (req, res) {
    var session = req.session;
    if (!session || session.user.permissions < utils.permissions.basicuser) {
      res.status('400').send(templates.response(codes.fail, 'Invalid permissions', {}, req.body));
    }
    var newComment = new models.comment(req.body);
    var promise = newComment.save()
      .then(function (comment) {
        if (comment) {
          return models.word.findOne({ _id: comment.word }).exec();
        } else {
          throw new Error('Error saving comment to DB');
        }
      })
      .then(function (word) {
        if (word) {
          word.comments.push(newComment._id);
          return word.save();
        } else {
          throw new Error('Error finding word associated with comment.');
        }
      })
      .then(function (word) {
        if (word) {
          res.send(templates.response(codes.success, "success", newComment, req.body));
        } else {
          throw new Error('Error saving comment to word\'s comment list');
        }
      })
      .catch(function (err) {
        res.status('400').send(templates.response(codes.fail, err.message, err, req.body));
      });
  });

router.get('/comments/user/:user_id', function (req, res) {
  router.getCommentsbyUser(req, res);
});

router.get('/comments/word/:word_id', function (req, res) {
  router.getCommentsbyWord(req, res);
});

router.get('/comments/comment/:comment_id', function (req, res) {
  router.getCommentById(req, res);
});

router.delete('/comments/comment/:comment_id', function (req, res) {
  router.deleteCommentById(req, res);
});

router.post('/comments/comment/:comment_id', function (req, res) {
  router.updateCommentById(req, res);
});

//Get comment by comment_id
router.getCommentById = function (req, res) {
  var comment_id = req.params.comment_id;
  models.comment.findOne({ _id: comment_id }, function (error, comment) {
    if (error) {
      res.status('400').send(templates.response(codes.fail, "Comment", error, req.body));
    } else {
      res.send(templates.response(codes.success, "success", comment, req.body));
    }
  });
};

//Delete comment by comment_id
router.deleteCommentById = function (req, res) {
  var comment_id = req.params.comment_id;
  var session = req.session;
  if (!session) {
    res.status('400').send(templates.response(codes.fail, 'Invalid session token', req.body));
    return;
  }
  models.comment.findOne({ _id: comment_id }).populate('user', '_id handle email permissions').exec()
    .then(function (comment) {
      if (comment) {
        if (comment.user._id.equals(session.user._id) || session.user.permissions >= utils.permissions.mod) {
          return models.comment.findOneAndRemove({ _id: comment_id }).populate('word').exec();
        } else {
          throw templates.error(codes.invalid_permissions, 'Invalid permissions', comment);
        }
      } else {
        throw templates.error(codes.fail, 'Comment not found', comment);
      }
    })
    .then(function (comment) {
      if (comment) {
        return models.word.findOne({ _id: comment.word }).populate('comments').exec();
      } else {
        throw templates.error(codes.fail, 'Comment not found', comment);
      }
    })
    .then(function (word) {
      if (word) {
        word.comments.pull(comment_id);
        return word.save();
      } else {
        throw templates.error(codes.fail, 'Comment not found', comment);
      }
    })
    .then(function (word) {
      res.send(templates.response(codes.success, "success", word));
    }).catch(function (err) {
      res.status('400').send(templates.response(err.error_code, err.message, err.error));
    });
};

router.updateCommentById = function (req, res) {
  var session = req.session;
  if (!session) {
    res.status('400').send(templates.response(codes.fail, 'Invalid session token', req.body));
    return;
  }

  var comment_id = req.params.comment_id;
  var newComment = new models.comment(req.body);
  var session = req.session;
  models.comment.findOne({ _id: comment_id }).populate('user', '_id handle email permissions').exec()
    .then((comment) => {
      if (comment) {
        if (comment.user._id.equals(session.user._id)) {
          comment.comment = newComment.comment;
          return comment.save();
        } else {
          throw templates.error(codes.invalid_permissions, 'Only comment creator can edit comments.', comment);
        }
      } else {
        throw templates.error(codes.document_not_found, 'Comment not found', comment);
      }
    })
    .then((comment) => {
      res.send(templates.response(codes.success, "success", comment));
    })
    .catch((err) => {
      res.status('400').send(templates.response(err.error_code, err.message, err.error, req.body));
    });
}

//Get comments by a user_id
router.getCommentsbyUser = function (req, res) {
  var user_id = req.params.user_id;
  var promise = models.comment.find({ user: user_id }).populate('user', '_id handle email permissions').exec();
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
};

//Get comments by a word_id
router.getCommentsbyWord = function (req, res) {
  var word_id = req.params.word_id;
  var promise = models.comment.find({ word: word_id }).populate('user', '_id handle email permissions').exec();
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
};

module.exports = router;