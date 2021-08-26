var express = require('express');
var router = express.Router();
const fs = require('fs');
const https = require('https');

/* GET processed page. */
router.get('/', global.authenticationMiddleware(), function(req, res) {
    var pDir = (process.env.PHOTO_DIR).concat(req.user._id);
    fs.readdir(pDir, function (err, images) {
        //handling error
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        }
        //no folder found
        if (!images || images.length === 0) {
            res.render('processed', { images: false, user: req.user.username });
            return
        }
        //listing all photos
        res.render('processed', { images: images, user: req.user.username });
    });
});

/* DOWLOAD image */
router.get('/download/:image', global.authenticationMiddleware(), (req, res) => {
    var filePath = [(process.env.PHOTO_DIR), req.user._id, "/", req.params.image].join('');
    fs.access(filePath, fs.F_OK, (err) => {
        if (err) {
          console.error(err)
          return
        }
        //file exists
        res.download(filePath, req.params.image); 
    })
})

/* DELETE photo */
router.delete('/del-img/:image', global.authenticationMiddleware(), (req, res) => {
    var imgDir = [(process.env.PHOTO_DIR), req.user._id, "/", req.params.image].join('');
    fs.unlink(imgDir, (err) => {
        if (err) {
            throw err;
        }
        console.log(`${imgDir} is deleted!`);
    });
    res.redirect('/processed');
});

module.exports = router;