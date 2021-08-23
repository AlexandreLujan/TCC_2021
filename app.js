const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const methodOverride = require('method-override')

global.authenticationMiddleware = () => {  
  return function (req, res, next) {
    if (req.isAuthenticated()) {
      return next()
    }
    res.redirect('/login?fail=true')
  }
};

var indexRouter = require('./routes/index');
var loginRouter = require('./routes/login');
var usersRouter = require('./routes/users');
var accRouter = require('./routes/account');
var uploadRouter = require('./routes/upload');
var reposRouter = require('./routes/repository');
var aprocRouter = require('./routes/a-process');
var faqRouter = require('./routes/faq');
var feedRouter = require('./routes/feedback');
var mprocRouter = require('./routes/m-process');
var imgRouter = require('./routes/processed')

var app = express();

//authentication
require('./auth')(passport);
app.use(session({  
  store: new MongoStore({
    db: process.env.MONGO_DB,
    url: process.env.MONGO_CONNECTION,
    ttl: 30 * 60 // = 30 minutos de sessão 
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 30 * 60 * 1000 }//30min
}))
app.use(passport.initialize());
app.use(passport.session());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'))

app.use('/', indexRouter);
app.use('/login', loginRouter);
app.use('/users', usersRouter);
app.use('/account', accRouter);
app.use('/upload', uploadRouter);
app.use('/repository', reposRouter);
app.use('/a-process', aprocRouter);
app.use('/m-process', mprocRouter);
app.use('/faq', faqRouter);
app.use('/feedback', feedRouter);
app.use('/processed', imgRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
