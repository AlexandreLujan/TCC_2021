var express = require('express');
var router = express.Router();
var {PythonShell} =require('python-shell');
const fs = require('fs');

/* GET Manual process page. */
router.get('/', global.authenticationMiddleware(), function(req, res, next) {

    var Dir = (process.env.FILES_DIR).concat(req.user._id);
    fs.readdir(Dir, function (err, folders) {
        //handling error
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        }
        //no folder found
        if (!folders || folders.length === 0) {
            res.render('m-process', { folders: false, user: req.user.username });
            return
        }
        //listing all folders
        console.log(folders);
        res.render('m-process', { folders: folders, user: req.user.username });
    });
});

router.post('/m-exec', global.authenticationMiddleware(), function(req, res, next) {
    console.log(req.user._id, req.body.baseFrame, req.body.baseName, req.body.align, req.body.cache,
                req.body.raw, req.body.crop, req.body.padd, req.body.thr, req.body.darkFrame, req.body.darkName,
                req.body.flatFrame, req.body.flatName, req.body.maskFrame, req.body.maskName, req.body.outputName, 
                req.body.imageFormat, req.body.album, req.body.gamma, req.body.noAutoScale, req.body.noAutoBright,
                req.body.outputBPS, req.body.cameraWB, req.body.autoWB, req.body.colorSpace,
                req.body.demosaicAlgorithm, req.body.fbddNoiseReduction, req.body.dcbEnhance,
                req.body.dcbIterations, req.body.halfSize, req.body.medianFilter);

    // //Here are the option object in which arguments can be passed for the python_test.js.
    let options = {
        mode: 'text',
        pythonPath: 'python3', 
        pythonOptions: ['-u'], // get print results in real-time
        scriptPath: '/home/alexandre/TCC_2021/python', //If you are having python_test.py script in same folder, then it's optional.
         //An argument which can be accessed in the script using sys.argv[1]
        args: [req.user._id, req.body.baseFrame, req.body.baseName, req.body.align, req.body.cache,
            req.body.raw, req.body.crop, req.body.padd, req.body.thr, req.body.darkFrame, req.body.darkName,
            req.body.flatFrame, req.body.flatName, req.body.maskFrame, req.body.maskName, req.body.outputName, 
            req.body.imageFormat, req.body.album, req.body.gamma, req.body.noAutoScale, req.body.noAutoBright,
            req.body.outputBPS, req.body.cameraWB, req.body.autoWB, req.body.colorSpace,
            req.body.demosaicAlgorithm, req.body.fbddNoiseReduction, req.body.dcbEnhance,
            req.body.dcbIterations, req.body.halfSize, req.body.medianFilter] 
    };
      
    PythonShell.run('astro_stacker.py', options, function (err, result){
        if (err) throw err;
        // result is an array consisting of messages collected 
        //during execution of script.
        console.log('result: ', result.toString());
        //console.log('results: %j', result);
        //res.send(result.toString())
    }); 
}); 

module.exports = router;