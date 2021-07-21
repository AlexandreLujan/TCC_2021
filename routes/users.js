var express = require('express');
var router = express.Router();
const db = require('../db')

router.get('/signup', function(req, res, next) {
  if(req.query.fail)
    res.render('signup', { message: 'Falha no cadastro do usuário!' });
  else
    res.render('signup', { message: null });
})

router.post('/signup', function(req, res, next){
  db.createUser(req.body.username, req.body.password, req.body.email, (err, result) => {
    if(err) res.redirect('/signup?fail=true')
    res.redirect('/')
  })
})

module.exports = router;
