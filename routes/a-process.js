const GridFsStream = require('gridfs-stream');
const mongoose = require('mongoose');

var express = require('express');
var router = express.Router();
var {PythonShell} =require('python-shell');

const connect = mongoose.createConnection(process.env.MONGO_URL_1, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
})

let gfs;

/* GET automatic process page. */
router.get('/', global.authenticationMiddleware(), function(req, res, next) {
    gfs.collection(req.user._id)
    res.render('a-process', { title: 'Process' });
});

router.get('/images/', global.authenticationMiddleware(), (req, res) => {
    gfs.collection(req.user._id)
    gfs.files.find().toArray((err, files) => {
        if (!files || files.length === 0) {
            res.send({ files: false });
            return
        }
        files.map(file => {
             const imageType = ["image/CR2", "image/RAW", "image/png"];
            if (imageType.includes(file.contentType)) {
                file.isImage = true
            } else {
                file.isImage = false
            }
        })
        
        res.send({ files: files });
    })
})

router.post('/exec', global.authenticationMiddleware(), function(req, res, next) {
    //Here are the option object in which arguments can be passed for the python_test.js.
    let options = {
        mode: 'text',
        pythonPath: 'python3', 
        pythonOptions: ['-u'], // get print results in real-time
        scriptPath: '/home/alexandre/TCC_2021/python', //If you are having python_test.py script in same folder, then it's optional.
        args: [req.user._id] //An argument which can be accessed in the script using sys.argv[1]
    };
      
    PythonShell.run('test.py', options, function (err, result){
        if (err) throw err;
        // result is an array consisting of messages collected 
        //during execution of script.
        console.log('result: ', result.toString());
        //console.log('results: %j', result);
        //res.send(result.toString())
    });
});  

module.exports = router;