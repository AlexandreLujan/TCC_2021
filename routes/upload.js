var express = require('express');
var router = express.Router();
const upload = require("../middleware/mw-upload");

/* GET upload page. */
router.get('/', global.authenticationMiddleware(), function(req, res, next) {
  res.render('upload', { user: req.user.username });
});

router.post('/photo', global.authenticationMiddleware(), async (req, res) => {
    try {
    await upload(req, res);
    console.log(req.files);

    if (req.files.length <= 0) {
      return res.send(`You must select at least 1 file.`);
    }

    //return res.send(`Files has been uploaded.`);
    res.redirect('/repository');
  } catch (error) {
    console.log(error);

    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.send("Too many files to upload.");
    }
    return res.send(`Error when trying upload many files: ${error}`);
  }  
});

module.exports = router;