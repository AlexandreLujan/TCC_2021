const GridFsStream = require('gridfs-stream');
const mongoose = require('mongoose');
const dcraw = require('dcraw');

var express = require('express');
var router = express.Router();

const connect = mongoose.createConnection(process.env.MONGO_CONNECTION, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

let gfs;
connect.once('open', () => {
 // The monitoring database is turned on, and the file access control is carried out through gridfs-stream middleware and the database
    gfs = GridFsStream(connect.db, mongoose.mongo)
    gfs.collection('fs')
 //It will create upload.files (record file information) in our database upload.chunks (storage file chunks)
})

router.get('/', (req, res) => {
    gfs.files.find().toArray((err, files) => {
        if (!files || files.length === 0) {
            res.render('repository', { files: false })
            return
        }
        files.map(file => {
 //If it is the following picture types, we will display them on the front end, and the rest will be processed as attachments, and pictures and non-pictures will be distinguished through isImage
            //const imageType = ['image/png', 'image/jpg', 'image/gif', 'image/jpeg']
            const match = ["image/CR2", "image/RAW"];
            if (match.includes(file.contentType)) {
                file.isImage = true
            } else {
                file.isImage = false
            }
        })
        
        //dcraw(files, { verbose: true, identify: true });
        res.render('repository', { files: files })
        //res.render('repository', dcraw(files, { verbose: true, identify: true }))
    })
})

router.get('/download/:filename', (req, res) => {
    gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
        if (!file) {
            return res.status(404).json({
 Err:'The file does not exist! '
            })
        }
        const readstream = gfs.createReadStream(file.filename)
        readstream.pipe(res)
    })
})

router.delete('/files/:id', (req, res) => {
    gfs.remove({ _id: req.params.id, root: 'upload' }, (err) => {
        if (err) {
            return res.status(404).json({
 Err:'The deleted file does not exist! '
            })
        }
        res.redirect('/')
    })
})

module.exports = router;