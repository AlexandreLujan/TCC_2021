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
    var albumDir = [(process.env.FILES_DIR), req.user._id, "/", req.params.folder].join('');
    // delete directory recursively
    fs.rmdir(albumDir, { recursive: true }, (err) => {
        if (err) {
            throw err;
        }
        console.log(`${albumDir} is deleted!`);
    });
    res.redirect('/repository');
});

module.exports = router;