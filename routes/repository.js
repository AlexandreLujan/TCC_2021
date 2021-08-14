const GridFsStream = require('gridfs-stream');
const mongoose = require('mongoose');

var express = require('express');
var router = express.Router();

const connect = mongoose.createConnection(process.env.MONGO_URL_1, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
})

let gfs;
connect.once('open', () => {
     gfs = GridFsStream(connect.db, mongoose.mongo)
})

router.get('/', global.authenticationMiddleware(), (req, res) => {
    gfs.collection(req.user._id)
    gfs.files.find().toArray((err, files) => {
        if (!files || files.length === 0) {
            res.render('repository', { files: false, title: req.user.username });
            return
        }
        files.map(file => {
             const imageType = ["image/CR2", "image/RAW", "image/png", "image/jpg"];
            if (imageType.includes(file.contentType)) {
                file.isImage = true
            } else {
                file.isImage = false
            }
        })
        console.log(files)
        res.render('repository', { files: files, title: req.user.username });
    })
})

router.get('/images/:filename', (req, res) => {
    gfs.files.findOne({ filename: req.params.filename}, (err, file) => {
        if (!file) {
            return res.status(404).json({
                Err:'The file does not exist!'
            })
        }
        const readstream = gfs.createReadStream(file.filename)
        readstream.pipe(res)
    })
})

router.get('/download/:filename', global.authenticationMiddleware(), (req, res) => {
    gfs.files.findOne({ filename: req.params.filename}, (err, file) => {
        if (!file) {
            return res.status(404).json({
                Err:'The file does not exist!'
            })
        }
        const readstream = gfs.createReadStream(file.filename)
        readstream.pipe(res)
    })
})

router.delete('/files/:id', global.authenticationMiddleware(), (req, res) => {
    gfs.remove({_id: req.params.id, root: req.user._id}, function (err) {
        if (err) {
            return res.status(404).json({
                Err:'The deleted file does not exist! '
            })
        }
        res.redirect('/repository');
    });

})

module.exports = router;