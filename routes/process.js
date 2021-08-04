//Import express.js module and create its variable.
var express = require('express');
var router = express.Router();
var {PythonShell} =require('python-shell');
var file_path = '/home/alexandre/Pictures/11x_ISO6400_f2.8_15s_5DMkIII_raw/raw/*.CR2'

/* GET process page. */
router.get('/', global.authenticationMiddleware(), function(req, res, next) {
    res.render('process', { title: 'Process' });
});

router.post('/exec', global.authenticationMiddleware(), function(req, res, next) {
    //Here are the option object in which arguments can be passed for the python_test.js.
    let options = {
        mode: 'text',
        pythonPath: 'python3', 
        pythonOptions: ['-u'], // get print results in real-time
        scriptPath: '/home/alexandre/TCC_2021/python', //If you are having python_test.py script in same folder, then it's optional.
        args: ['-o teste /home/alexandre/Pictures/11x_ISO6400_f2.8_15s_5DMkIII_raw/raw/*.CR2'] //An argument which can be accessed in the script using sys.argv[1]
    };
      
    PythonShell.run('astro_stacker.py', options, function (err, result){
        if (err) throw err;
        // result is an array consisting of messages collected 
        //during execution of script.
        console.log('result: ', result.toString());
        //console.log('results: %j', result);
        res.send(result.toString())
    });
});  

module.exports = router;