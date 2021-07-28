var express = require('express');
var router = express.Router();
const upload = require("../config-upload");

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('upload', { title: 'Upload' });
});

router.post('/upload', async (req, res) => {
    console.log('x');
    try {
        await upload(req, res);
        console.log(req.files);
    
        if (req.files.length <= 0) {
          return res.send(`You must select at least 1 file.`);
        }
    
        return res.send(`Files have been uploaded.`);
    } catch (error) {
        console.log(error);
    
        if (error.code === "LIMIT_UNEXPECTED_FILE") {
          return res.send("Too many files to upload.");
        }
        return res.send(`Error when trying upload many files: ${error}`);
    }
  });

module.exports = router;