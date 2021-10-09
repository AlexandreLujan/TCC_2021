var express = require('express');
var router = express.Router();
var {PythonShell} =require('python-shell');
const fs = require('fs');
const dcraw = require('dcraw');
const ObjectsToCsv = require('objects-to-csv');
var paramsUsed = [];
var cameraInfo = [];
var albumName;

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

router.post('/m-next', global.authenticationMiddleware(), function(req, res, next) {
    console.log(req.body.category ,req.body.chooseAlbum);
    albumName = req.body.chooseAlbum;
    var buf, rawFileDir;  
    var selectDir = [(process.env.FILES_DIR), req.user._id, "/", req.body.chooseAlbum].join('');
    fs.readdir(selectDir, function (err, photos) {
        //handling error
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        }
        //no folder found
        if (!photos || photos.length === 0) {
            return console.log('The chosen album is empty!');
        }
        //listing all photos
        console.log(photos);
        //get fist file
        rawFileDir = [selectDir, "/", photos[0]].join('');
        console.log(rawFileDir);
        buf = fs.readFileSync(rawFileDir);
        // Get the RAW metadata
        var metadata = dcraw(buf, { verbose: true, identify: true }).split('\n').filter(String);
        console.log(metadata);
        cameraInfo = [];
        cameraInfo.push(req.body.category, metadata[3].substr(11),
                    metadata[4].substr(9), metadata[5].substr(10));
        //render a-next page
        res.render('m-next', { photos: photos, user: req.user.username});
    });
});

router.post('/m-exec', global.authenticationMiddleware(), function(req, res, next) {
    paramsUsed = [];
    //Convert yes to true and no to false
    if(req.body.baseFrame === 'Yes') {paramsUsed[0] = 'True'; paramsUsed[1] = req.body.baseName} else {paramsUsed[0] = 'False'; paramsUsed[1] = ''}
    if(req.body.align === 'Yes') {paramsUsed[2] = 'True'} else {paramsUsed[2] = 'False'}
    if(req.body.cache === 'Yes') {paramsUsed[3] = 'True'} else {paramsUsed[3] = 'False'}
    if(req.body.raw === 'Yes') {paramsUsed[4] = 'True'} else {paramsUsed[4] = 'False'}
    if(req.body.crop === 'Yes') {paramsUsed[5] = 'True'} else {paramsUsed[5] = 'False'}
    paramsUsed[6] = req.body.padd;
    paramsUsed[7] = req.body.thr;
    if(req.body.darkFrame === 'Yes') {paramsUsed[8] = 'True'; paramsUsed[9] = req.body.darkName} else {paramsUsed[8] = 'False'; paramsUsed[9] = ''}
    if(req.body.flatFrame === 'Yes') {paramsUsed[10] = 'True'; paramsUsed[11] = req.body.flatName} else {paramsUsed[10] = 'False'; paramsUsed[11] = ''}
    if(req.body.maskFrame === 'Yes') {paramsUsed[12] = 'True'; paramsUsed[13] = req.body.maskName} else {paramsUsed[12] = 'False'; paramsUsed[13] = ''}
    paramsUsed[14] = req.body.outputName;
    paramsUsed[15] = req.body.imageFormat;
    paramsUsed[16] = albumName;
    paramsUsed[17] = req.body.gamma;
    if(req.body.noAutoScale === 'Yes') {paramsUsed[18] = 'True'} else {paramsUsed[18] = 'False'}
    if(req.body.noAutoBright === 'Yes') {paramsUsed[19] = 'True'} else {paramsUsed[19] = 'False'}
    paramsUsed[20] = req.body.outputBPS;
    if(req.body.cameraWB === 'Yes') {paramsUsed[21] = 'True'} else {paramsUsed[21] = 'False'}
    if(req.body.autoWB === 'Yes') {paramsUsed[22] = 'True'} else {paramsUsed[22] = 'False'}
    paramsUsed[23] = req.body.colorSpace;
    paramsUsed[24] = req.body.demosaicAlgorithm;
    paramsUsed[25] = req.body.fbddNoiseReduction;
    if(req.body.dcbEnhance === 'Yes') {paramsUsed[26] = 'True'} else {paramsUsed[26] = 'False'}
    paramsUsed[27] = req.body.dcbIterations;
    if(req.body.halfSize === 'Yes') {paramsUsed[28] = 'True'} else {paramsUsed[28] = 'False'}
    paramsUsed[29] = req.body.medianFilter;
    paramsUsed[30] = req.body.redScale;
    paramsUsed[31] = req.body.blueScale;
    paramsUsed[32] = req.body.saturation;
    paramsUsed[33] = req.body.highlight;

    //Here are the option object in which arguments can be passed for the python_test.js.
    let options = {
        mode: 'text',
        pythonPath: 'python3', 
        pythonOptions: ['-u'], // get print results in real-time
        scriptPath: '/home/alexandre/TCC_2021/python', //If you are having python_test.py script in same folder, then it's optional.
        //An argument which can be accessed in the script using sys.argv[1]
        args: [req.user._id, paramsUsed[0], paramsUsed[1], paramsUsed[2], paramsUsed[3], paramsUsed[4],
            paramsUsed[5], paramsUsed[6], paramsUsed[7], paramsUsed[8], paramsUsed[9], paramsUsed[10], 
            paramsUsed[11], paramsUsed[12], paramsUsed[13], paramsUsed[14], paramsUsed[15], paramsUsed[16],
            paramsUsed[17], paramsUsed[18], paramsUsed[19], paramsUsed[20], paramsUsed[21], paramsUsed[22], 
            paramsUsed[23], paramsUsed[24], paramsUsed[25], paramsUsed[26], paramsUsed[27], paramsUsed[28], 
            paramsUsed[29], paramsUsed[30], paramsUsed[31], paramsUsed[32], paramsUsed[33]
        ] 
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
    var processedDir = [(process.env.PHOTO_DIR), req.user._id, "/", req.params.image,  paramsUsed[15]].join('');
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
    var list = [{
        Align: paramsUsed[2].toString(), 
        Cache: paramsUsed[3].toString(),
        Raw: paramsUsed[4].toString(), 
        Crop: paramsUsed[5].toString(), 
        Padd: paramsUsed[6].toString(), 
        THR: paramsUsed[7].toString(), 
        Gamma: paramsUsed[17].toString(), 
        noAutoScale: paramsUsed[18].toString(), 
        noAutoBright: paramsUsed[19].toString(), 
        outputBPS: paramsUsed[20].toString(), 
        cameraWB: paramsUsed[21].toString(), 
        autoWB: paramsUsed[22].toString(), 
        demosaicAlgorithm: paramsUsed[24].toString(), 
        fbddNoiseReduction: paramsUsed[25].toString(), 
        dcbEnhance: paramsUsed[26].toString(), 
        dcbIterations: paramsUsed[27].toString(), 
        halfSize: paramsUsed[28].toString(), 
        medianFilter: paramsUsed[29].toString(), 
        redScale: paramsUsed[30].toString(), 
        blueScale: paramsUsed[31].toString(), 
        Saturation: paramsUsed[32].toString(), 
        Highlight: paramsUsed[33].toString()
    }];

    var args_csv = new ObjectsToCsv(list);
    await args_csv.toDisk((process.env.ARGSCSV_DIR), { append: true });
    
    var rawInfo = [{
        Object: cameraInfo[0].toString(),
        ISO_Speed: cameraInfo[1].toString(),
        Shutter: cameraInfo[2].toString(),
        Aperture: cameraInfo[3].toString()
    }];
    var raw_csv = new ObjectsToCsv(rawInfo);
    await raw_csv.toDisk((process.env.CAMCSV_DIR), { append: true });

    res.redirect('/processed');
});

module.exports = router;