var express = require('express');
var router = express.Router();
const fs = require('fs');

/* GET repository page. */
router.get('/', global.authenticationMiddleware(), function(req, res, next) {
    
    var Dir = (process.env.FILES_DIR).concat(req.user._id);
    fs.readdir(Dir, function (err, folders) {
        //handling error
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        }
        //no folder found
        if (!folders || folders.length === 0) {
            res.render('repository', { folders: false, title: req.user.username });
            return
        }
        //listing all folders
        console.log(folders);
        res.render('repository', { folders: folders, title: req.user.username });
    });
});

/* DELETE folder */
router.delete('/folders/:folder', global.authenticationMiddleware(), (req, res) => {
    var folderDir = [(process.env.FILES_DIR), req.user._id, "/", req.params.folder].join('');
    // delete directory recursively
    fs.rmdir(folderDir, { recursive: true }, (err) => {
        if (err) {
            throw err;
        }
        console.log(`${folderDir} is deleted!`);
    });
    res.redirect('/repository');
});

/* GET album page. */
router.get('/album/:folder', global.authenticationMiddleware(), function(req, res) {
    var albumDir = [(process.env.FILES_DIR), req.user._id, "/", req.params.folder].join('');
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

/* DOWLOAD image */
router.get('/download-photo/:title/:photo', global.authenticationMiddleware(), (req, res) => {
    var photoPath = [(process.env.FILES_DIR), req.user._id, "/", req.params.title, "/", req.params.photo].join('');
    fs.access(photoPath, fs.F_OK, (err) => {
        if (err) {
          console.error(err)
          return
        }
        //file exists
        res.download(photoPath, req.params.image); 
    })
})


/* DELETE photo */
router.delete('/images/:title/:photo', global.authenticationMiddleware(), (req, res) => {
    var photoDir = [(process.env.FILES_DIR), req.user._id, "/", req.params.title, "/", req.params.photo].join('');
    fs.unlink(photoDir, (err) => {
        if (err) {
            throw err;
        }
        console.log(`${photoDir} is deleted!`);
    });
    res.redirect('/repository/album/' + req.params.title);
});

module.exports = router;