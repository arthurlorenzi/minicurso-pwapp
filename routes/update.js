const express = require('express');
const db = require('../db/docs');
const router = express.Router();

router.post('/', function(req, res, next) {
  let body = req.body,
    doc = body.document,
    base = body.base,
    author = body.author,
    content = body.content;

  if (doc == null || base == null || author == null || content == null) {
    res.send({ "status": "error", "message": "Faltam parâmetros na requisição." });
  } else {
    try {
      if (base == -1)
        base = null;

      res.send( db.update(doc, base, author, content) );
    } catch (e) {
      res.send({ "status": "error", "message": e.message });
    }
  }
});

module.exports = router;
