'use strict';

const express = require('express');
const db = require('../db/docs');
const router = express.Router();

router.get('/', function(req, res, next) {
  res.send({ "list": db.list() });
});

module.exports = router;
