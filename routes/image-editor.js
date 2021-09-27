var express = require('express');
var router = express.Router();
const fs = require('fs');

/* GET Imgae-Editor page. */
router.get('/', global.authenticationMiddleware(), function(req, res, next) {
    var Dir = (process.env.PHOTO_DIR).concat(req.user._id);
    fs.readdir(Dir, function (err, images) {
        //handling error
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        }
        //no image found
        if (!images || images.length === 0) {
            res.render('image-editor', { images: false, user: req.user.username });
            return
        }
        //listing all images
        console.log(images);
        res.render('image-editor', { images: images, user: req.user.username });
    });
});

/* GET TUI image editor. */
router.post('/get-tui', global.authenticationMiddleware(), function(req, res, next) {
    console.log(req.body.photo);
    res.render('tui', { image: req.body.photo, userId: req.user._id });
});

module.exports = router;