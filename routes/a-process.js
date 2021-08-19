var express = require('express');
var router = express.Router();
var {PythonShell} =require('python-shell');

/* GET automatic process page. */
router.get('/', global.authenticationMiddleware(), function(req, res, next) {
    res.render('a-process', { title: 'Automatic Process' }); 
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