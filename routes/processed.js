var express = require('express');
var router = express.Router();
const fs = require('fs');

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
            res.render('processed', { images: false, user: req.user.username, userId: req.user._id });
            return
        }
        //listing all photos
        res.render('processed', { images: images, user: req.user.username, userId: req.user._id });
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
    var removePreview;
    if((req.params.image).indexOf(".tiff"))
    {
        var ret = (req.params.image).replace(".tiff", '');
        removePreview = ret.concat(".png");
    }
    else 
    {
        if((req.params.image).indexOf(".jpg"))
        {
            var ret = (req.params.image).replace(".jpg", '');
            removePreview = ret.concat(".png");
        }
        else
        {
            removePreview = req.params.image;
        }
    }
    
    var previewPhoto = [(process.env.PREVIEW_DIR), "processed_photos/", req.user._id, "/", removePreview].join('');
    fs.unlink(previewPhoto, (err) => {
        if (err) {
            throw err;
        }
        console.log(`${previewPhoto} preview has been deleted!`);
    });
    res.redirect('/processed');
});

module.exports = router;