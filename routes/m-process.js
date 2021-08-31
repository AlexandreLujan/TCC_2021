var express = require('express');
var router = express.Router();
var {PythonShell} =require('python-shell');
const fs = require('fs');
var photoFormat;

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
                req.body.dcbIterations, req.body.halfSize, req.body.medianFilter,
                req.body.redScale, req.body.blueScale, req.body.saturation, req.body.highlight);
    
    photoFormat = req.body.imageFormat;

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
            req.body.dcbIterations, req.body.halfSize, req.body.medianFilter,
            req.body.redScale, req.body.blueScale, req.body.saturation, req.body.highlight] 
    };
      
    PythonShell.run('astro_stacker.py', options, function (err, result){
        if (err) throw err;
        console.log('result: ', result.toString());
        res.redirect("/m-process/preview/" + req.body.outputName);
    });
});

/* GET preview page. */
router.get('/preview/:photoName', global.authenticationMiddleware(), function(req, res, next) {
    var imagePreview = (req.params.photoName).concat(".png");
    var previewDir = [(process.env.PREVIEW_DIR), "processed_photos/", req.user._id, "/", imagePreview].join('');
    fs.access(previewDir, fs.F_OK, (err) => {
        if (err) {
            return console.log('Unable to get the preview image: ' + imagePreview + err);
        }
        res.render('preview', { user: req.user.username, image: req.params.photoName, userId: req.user._id }); 
    });
});

/* DELETE processed photo and preview */
router.delete('/discard/:image', global.authenticationMiddleware(), (req, res) => {
    var discardPreview = (req.params.image).concat(".png");
    var previewImg = [(process.env.PREVIEW_DIR), "processed_photos/", req.user._id, "/", discardPreview].join('');
    fs.unlink(previewImg, (err) => {
        if (err) {
            throw err;
        }
        console.log(`${previewImg} preview has been deleted!`);
    });
    var processedDir = [(process.env.PHOTO_DIR), req.user._id, "/", req.params.image, photoFormat].join('');
    fs.unlink(processedDir, (err) => {
        if (err) {
            throw err;
        }
        console.log(`${processedDir} processed photo has been deleted!`);
    });
    res.redirect('/m-process');
});

/* SAVE photo (already saved, just redirect to processed) */
router.get('/save', global.authenticationMiddleware(), (req, res) => {
    res.redirect('/processed');
});

module.exports = router;