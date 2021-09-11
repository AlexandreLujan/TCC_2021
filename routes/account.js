var express = require('express');
var router = express.Router();
const fs = require('fs');

/* GET user page. */
router.get('/', global.authenticationMiddleware(), function(req, res, next) {
  var Dir = (process.env.FILES_DIR).concat(req.user._id);
  console.log(Dir)
  // check if directory exists
  if (!fs.existsSync(Dir)) {
  // if not create directory
    fs.mkdirSync(Dir);
  }
  var pDir = (process.env.PHOTO_DIR).concat(req.user._id);
  console.log(pDir)
  // check if directory exists
  if (!fs.existsSync(pDir)) {
  // if not create directory
    fs.mkdirSync(pDir);
  }
  var previewProcess = [(process.env.PREVIEW_DIR), "processed_photos/", req.user._id].join('');
  console.log(previewProcess)
  // check if directory exists
  if (!fs.existsSync(previewProcess)) {
  // if not create directory
    fs.mkdirSync(previewProcess);
  }
  var previewUnprocess = [(process.env.PREVIEW_DIR), "unprocessed_photos/", req.user._id].join('');
  console.log(previewUnprocess)
  // check if directory exists
  if (!fs.existsSync(previewUnprocess)) {
  // if not create directory
    fs.mkdirSync(previewUnprocess);
  }
  res.render('account', { user: req.user.username }); 
});

module.exports = router;