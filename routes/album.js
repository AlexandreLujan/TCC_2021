var express = require('express');
var router = express.Router();
const fs = require('fs');

/* GET album page. */
router.get('/?valid=', global.authenticationMiddleware(), function(req, res) {
    var passedVariable = req.query.valid;
    var albumDir = [(process.env.FILES_DIR), req.user._id, "/", passedVariable, "/"].join('');
    fs.readdir(albumDir, function (err, photos) {
        //handling error
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        }
        //no folder found
        if (!photos || photos.length === 0) {
            res.render('album', { photos: false, title: req.params.folder });
            return
        }
        //listing all photos
        console.log(photos);
        res.render('album', { photos: photos, title: req.params.folder });
    });
});

router.get('/album-name/:folder', global.authenticationMiddleware(), function(req, res) {
    var string = encodeURIComponent(req.params.folder);
    res.redirect('/albuml/?valid=' + string);
});

/* DELETE photo */
router.delete('/images/:title/:photo', global.authenticationMiddleware(), (req, res) => {
    var photoDir = [(process.env.FILES_DIR), req.user._id, "/", req.params.title, "/", req.params.photo].join('');
    fs.unlink(photoDir, (err) => {
        if (err) {
            throw err;
        }
        console.log(`${photoDir} is deleted!`);
    });
    res.redirect('/repository');
});

module.exports = router;