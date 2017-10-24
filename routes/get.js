const express = require('express');
const db = require('../db/docs');
const router = express.Router();

router.get('/', function(req, res, next) {
  let query = req.query;

  if (query.document) {
    try {
      res.send( db.get(Number(query.document)) );
    } catch (e) {
      res.send({ "status": "error", "message": e.message });
    }
  } else {
    res.send({ "status": "error", "message": "Faltam parâmetros na requisição." });
  }
});

module.exports = router;
