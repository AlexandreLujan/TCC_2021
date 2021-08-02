var express = require('express');
var router = express.Router();

/* GET user page. */
router.get('/', global.authenticationMiddleware(), function(req, res, next) {
  res.render('account', { title: req.user.username });
});

module.exports = router;