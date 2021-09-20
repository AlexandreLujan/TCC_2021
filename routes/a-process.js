var express = require('express');
var router = express.Router();
var {PythonShell} =require('python-shell');
const fs = require('fs');
const dcraw = require('dcraw');
var cameraInfo = [];
var argsUsed = [];

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
        cameraInfo.push(req.body.category, metadata[2].substr(8), metadata[3].substr(11),
                    metadata[4].substr(9), metadata[5].substr(10), metadata[6].substr(14));
        //render a-next page
        res.render('a-next', { photos: photos, user: req.user.username});
    });
});  

router.post('/a-exec', global.authenticationMiddleware(), function(req, res, next) {
    //Convert yes to true and no to false
    if(req.body.baseFrame === 'Yes') {argsUsed[0] = 'True'; argsUsed[1] = req.body.baseName} else {argsUsed[0] = 'False'; argsUsed[1] = ''}
    if(req.body.darkFrame === 'Yes') {argsUsed[2] = 'True'; argsUsed[3] = req.body.darkName} else {argsUsed[2] = 'False'; argsUsed[3] = ''}
    if(req.body.flatFrame === 'Yes') {argsUsed[4] = 'True'; argsUsed[5] = req.body.flatName} else {argsUsed[4] = 'False'; argsUsed[5] = ''}
    if(req.body.maskFrame === 'Yes') {argsUsed[6] = 'True'; argsUsed[7] = req.body.maskName} else {argsUsed[6] = 'False'; argsUsed[7] = ''}
    argsUsed[8] = req.body.outputName;
    argsUsed[9] = req.body.imageFormat;
    argsUsed[10] = req.body.colorSpace;

    console.log(argsUsed);

    // //Here are the option object in which arguments can be passed for the python_test.js.
    // let options = {
    //     mode: 'text',
    //     pythonPath: 'python3', 
    //     pythonOptions: ['-u'], // get print results in real-time
    //     scriptPath: '/home/alexandre/TCC_2021/python', //If you are having python_test.py script in same folder, then it's optional.
    //     //An argument which can be accessed in the script using sys.argv[1]
    //     args: [cameraInfo[0], req.body.baseFrame, req.body.darkFrame,
    //            req.body.flatFrame, req.body.maskFrame, cameraInfo[1], 
    //            cameraInfo[2], cameraInfo[3], cameraInfo[4], cameraInfo[5]] 
    // };
      
    // PythonShell.run('recommender_system.py', options, function (err, result){
    //     if (err) throw err;
    //     console.log('result: ', result.toString());
    //     res.redirect("/m-process/preview/");
    // });   
    
});  

module.exports = router;