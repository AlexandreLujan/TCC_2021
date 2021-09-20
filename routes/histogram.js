var express = require('express');
var router = express.Router();
var {PythonShell} =require('python-shell');
const fs = require('fs');

/* GET Histogram page. */
router.get('/', global.authenticationMiddleware(), function(req, res, next) {
    var Dir = (process.env.PHOTO_DIR).concat(req.user._id);
    fs.readdir(Dir, function (err, images) {
        //handling error
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        }
        //no image found
        if (!images || images.length === 0) {
            res.render('histogram', { images: false, user: req.user.username });
            return
        }
        //listing all images
        console.log(images);
        res.render('histogram', { images: images, user: req.user.username });
    });
});

/* Histogram */
router.post('/generate', global.authenticationMiddleware(), (req, res) => {
    console.log(req.body.photo);
    console.log(req.body.type);
   //Here are the option object in which arguments can be passed for the python_test.js.
    let options = {
        mode: 'text',
        pythonPath: 'python3', 
        pythonOptions: ['-u'], // get print results in real-time
        scriptPath: '/home/alexandre/TCC_2021/python', //If you are having python_test.py script in same folder, then it's optional.
        //An argument which can be accessed in the script using sys.argv[1]
        args: [req.user._id, req.body.type, req.body.photo] 
    };
  
    PythonShell.run('histogram.py', options, function (err, result){
        if (err) throw err;
        console.log('result: ', result.toString());
        res.redirect("/histogram/get-histogram/");
    });
}); 

/* GET finished histogram. */
router.get('/get-histogram', global.authenticationMiddleware(), function(req, res, next) {
    res.render('get-histogram', { user: req.user.username, userId: req.user._id });
});

module.exports = router;