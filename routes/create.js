const express = require('express');
const db = require('../db/docs');
const router = express.Router();

router.post('/', function(req, res, next) {
  let body = req.body;

  if (body.author && body.name) {
    try {
      res.send(db.insert(body.author, body.name));
    } catch (e) {
      res.send({ "status": "error", "message": e.message });
    }
  } else {
    res.send({ "status": "error", "message": "Faltam parâmetros na requisição." });
  }
});

module.exports = router;
