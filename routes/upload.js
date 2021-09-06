var express = require('express');
var router = express.Router();
const upload = require("../middleware/mw-upload");
const fs = require('fs');

/* GET upload page. */
router.get('/', global.authenticationMiddleware(), function(req, res, next) {

  var uploadDir = (process.env.FILES_DIR).concat(req.user._id);
    fs.readdir(uploadDir, function (err, folders) {
        //handling error
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        }
        //no folder found
        if (!folders || folders.length === 0) {
            res.render('upload', { folders: false, user: req.user.username });
            return
        }
        //listing all folders
        console.log(folders);
        res.render('upload', { folders: folders, user: req.user.username });
    });

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