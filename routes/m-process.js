var express = require('express');
var router = express.Router();
var {PythonShell} =require('python-shell');
const fs = require('fs');
const dcraw = require('dcraw');
const ObjectsToCsv = require('objects-to-csv');
var photoFormat;
var paramsUsed = [];

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

    var rawFile, buf, rawFileDir;
    var rawDir = [(process.env.FILES_DIR), req.user._id, "/", req.body.album, "/"].join('');
    fs.readdir(rawDir, function (err, rawFiles) {
        //handling error
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        }
        //no folder found
        if (!rawFiles || rawFiles.length === 0) {
            return
        }
        //get fist file
        rawFile = rawFiles[0];
        rawFileDir = rawDir.concat(rawFile);
        console.log(rawFileDir);
        buf = fs.readFileSync(rawFileDir);
        // Get the RAW metadata
        var metadata = dcraw(buf, { verbose: true, identify: true }).split('\n').filter(String);
        paramsUsed = [];
        paramsUsed.push(req.body.align, req.body.cache, req.body.raw, req.body.crop, 
                    req.body.padd, req.body.thr, req.body.gamma, req.body.noAutoScale, 
                    req.body.noAutoBright, req.body.outputBPS, req.body.cameraWB, 
                    req.body.autoWB, req.body.demosaicAlgorithm, req.body.fbddNoiseReduction, 
                    req.body.dcbEnhance, req.body.dcbIterations, req.body.halfSize, 
                    req.body.medianFilter, req.body.redScale, req.body.blueScale, 
                    req.body.saturation, req.body.highlight, req.body.object,
                    req.body.baseFrame, req.body.darkFrame, req.body.flatFrame,
                    req.body.maskFrame, metadata[2].substr(8), metadata[3].substr(11),
                    metadata[4].substr(9), metadata[5].substr(10), metadata[6].substr(14)
                    );
    });
    
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
            req.body.dcbIterations, req.body.halfSize, req.body.medianFilter,req.body.redScale,
            req.body.blueScale, req.body.saturation, req.body.highlight, req.body.object] 
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

/* SAVE photo and CSV arguments (photo already saved) */
router.get('/save', global.authenticationMiddleware(), async(req, res) => {
    var csvDir = [(process.env.ARGSCSV_DIR), paramsUsed[22].toString(), ".csv"].join('');
    var list = [{
        Object: paramsUsed[22].toString(), Base: paramsUsed[23].toString(), Dark: paramsUsed[24].toString(),
        Flat: paramsUsed[25].toString(), Mask: paramsUsed[26].toString(), 
        Align: paramsUsed[0].toString(), Cache: paramsUsed[1].toString(),
        Raw: paramsUsed[2].toString(), Crop: paramsUsed[3].toString(), Padd: paramsUsed[4].toString(), 
        THR: paramsUsed[5].toString(), Gamma: paramsUsed[6].toString(), noAutoScale: paramsUsed[7].toString(), 
        noAutoBright: paramsUsed[8].toString(), outputBPS: paramsUsed[9].toString(), cameraWB: paramsUsed[10].toString(), 
        autoWB: paramsUsed[11].toString(), demosaicAlgorithm: paramsUsed[12].toString(), 
        fbddNoiseReduction: paramsUsed[13].toString(), dcbEnhance: paramsUsed[14].toString(), 
        dcbIterations: paramsUsed[15].toString(), halfSize: paramsUsed[16].toString(), 
        medianFilter: paramsUsed[17].toString(), redScale: paramsUsed[18].toString(), 
        blueScale: paramsUsed[19].toString(), Saturation: paramsUsed[20].toString(), Highlight: paramsUsed[21].toString()
    }];
    var args_csv = new ObjectsToCsv(list);
    await args_csv.toDisk(csvDir, { append: true });
    
    var rawInfo = [{
      Camera: paramsUsed[27].toString(),
      Speed: paramsUsed[28].toString(),
      Shutter: paramsUsed[29].toString(),
      Aperture: paramsUsed[30].toString(),
      Focal_Length: paramsUsed[31].toString()
    }];
    var raw_csv = new ObjectsToCsv(rawInfo);
    await raw_csv.toDisk((process.env.CAMCSV_DIR), { append: true });

    res.redirect('/processed');
});

module.exports = router;