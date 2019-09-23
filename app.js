const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose')
const bodyParser = require('body-parser')

const config = require('./config')

// const indexRouter = require('./routes/index');
// const usersRouter = require('./routes/users');

const threadRouter = require('./routes/threadRouter')

const connect = mongoose.connect(config.mongoUrl)

connect.then(db => {
  console.log('Connected correctly to ' + config.dbName)
})

let app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// app.use('/', indexRouter);
// app.use('/users', usersRouter);

app.use('', threadRouter)

app.get('/', (req, res) => {
  res.redirect('/listThreads')
})

// app.get('/listThreads', (req, res) => {
//   res.render('listThreads')
// })

// app.get('/createThread', (req, res) => {
//   res.render('createThread')
// })

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
  res.render('error.jade');
});

module.exports = app;
