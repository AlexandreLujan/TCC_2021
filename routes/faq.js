var express = require('express');
var router = express.Router();

/* GET FAQ page. */
router.get('/', function(req, res, next) {
  res.render('faq', { title: "FAQ" });
});

module.exports = router;