var express = require('express');
var router = express.Router();
const fs = require('fs')

/* GET user page. */
router.get('/', global.authenticationMiddleware(), function(req, res, next) {
  var Dir = (process.env.FILES_DIR).concat(req.user._id);
  console.log(Dir)
  // check if directory exists
  if (!fs.existsSync(Dir)) {
  // if not create directory
    fs.mkdirSync(Dir);
  }
  res.render('account', { title: req.user.username }); 
});

module.exports = router;