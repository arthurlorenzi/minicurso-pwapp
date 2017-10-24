const express = require('express');
const router = express.Router();

const options = {
  root: __dirname + '/public/'
};

router.get('/', function(req, res, next) {
  res.sendFile('index.html', options, function(err) {
    if (err)
      next(err);
  });
});

module.exports = router;
