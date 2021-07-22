var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', global.authenticationMiddleware(), function(req, res, next) {
  res.render('index', { title: req.user.username });
});

module.exports = router;