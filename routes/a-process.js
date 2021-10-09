var express = require('express');
var router = express.Router();
var {PythonShell} =require('python-shell');
const fs = require('fs');
const dcraw = require('dcraw');
var cameraInfo = [];
var paramsUsed = [];
var params = [];
var albumName;

/* GET Automatic process page. */
router.get('/', global.authenticationMiddleware(), function(req, res, next) {

    var Dir = (process.env.FILES_DIR).concat(req.user._id);
    fs.readdir(Dir, function (err, folders) {
        //handling error
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        }
        //no folder found
        if (!folders || folders.length === 0) {
            res.render('a-process', { folders: false, user: req.user.username });
            return
        }
        //listing all folders
        console.log(folders);
        res.render('a-process', { folders: folders, user: req.user.username });
    });
});

router.post('/a-next', global.authenticationMiddleware(), function(req, res, next) {
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
        cameraInfo = [];
        cameraInfo.push(req.body.category, metadata[3].substr(11),
                    metadata[4].substr(9), metadata[5].substr(10));
        //get the recommendation
        let options = {
            mode: 'text',
            pythonPath: 'python3', 
            pythonOptions: ['-u'], // get print results in real-time
            scriptPath: '/home/alexandre/TCC_2021/python', //If you are having python_test.py script in same folder, then it's optional.
            //An argument which can be accessed in the script using sys.argv[1]
            args: [cameraInfo[0].toString(), cameraInfo[1].toString(), cameraInfo[2].toString(), cameraInfo[3].toString()] 
        };
        PythonShell.run('recommender_system.py', options, function (err, result){
            if (err) throw err;
            console.log(result.toString());        
            params = (result.toString()).split(',');
            for (let i = 0; i < params.length; i++) {
                params[i]=params[i].replace(/[&\/\\#,+()$~%'":*?<>{} ]/g, '')
                if(params[i].includes('[')){ params[i]=params[i].replace('[', '') }
                if(params[i].includes(']')){ params[i]=params[i].replace(']', '') }
            } 
            console.log(params);
            //render a-next page
            res.render('a-next', { photos: photos, user: req.user.username});
        });           
    });
});  

router.post('/a-exec', global.authenticationMiddleware(), function(req, res, next) {
    paramsUsed = [];
    //Convert yes to true and no to false
    if(req.body.baseFrame === 'Yes') {paramsUsed[0] = 'True'; paramsUsed[1] = req.body.baseName} else {paramsUsed[0] = 'False'; paramsUsed[1] = ''}
    paramsUsed[2] = params[0];
    paramsUsed[3] = params[1];
    paramsUsed[4] = params[2];
    paramsUsed[5] = params[3];
    paramsUsed[6] = params[4];
    paramsUsed[7] = params[5];
    if(req.body.darkFrame === 'Yes') {paramsUsed[8] = 'True'; paramsUsed[9] = req.body.darkName} else {paramsUsed[8] = 'False'; paramsUsed[9] = ''}
    if(req.body.flatFrame === 'Yes') {paramsUsed[10] = 'True'; paramsUsed[11] = req.body.flatName} else {paramsUsed[10] = 'False'; paramsUsed[11] = ''}
    if(req.body.maskFrame === 'Yes') {paramsUsed[12] = 'True'; paramsUsed[13] = req.body.maskName} else {paramsUsed[12] = 'False'; paramsUsed[13] = ''}
    paramsUsed[14] = req.body.outputName;
    paramsUsed[15] = req.body.imageFormat;
    paramsUsed[16] = albumName;
    paramsUsed[17] = params[6];
    paramsUsed[18] = params[7];
    paramsUsed[19] = params[8];
    paramsUsed[20] = params[9];
    paramsUsed[21] = params[10];
    paramsUsed[22] = params[11];
    paramsUsed[23] = req.body.colorSpace;
    paramsUsed[24] = params[12];
    paramsUsed[25] = params[13];
    paramsUsed[26] = params[14];
    paramsUsed[27] = params[15];
    paramsUsed[28] = params[16];
    paramsUsed[29] = params[17];
    paramsUsed[30] = params[18];
    paramsUsed[31] = params[19];
    paramsUsed[32] = params[20];
    paramsUsed[33] = params[21];
    
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
        res.redirect('/processed');
    });
});

module.exports = router;