var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
const http = require("http");
const https = require("https");
const wss = require ('./webcomm');
const fs = require("fs");

// // This line is from the Node.js HTTPS documentation.
const options = {
    key: fs.readFileSync('SSL/localhost-key.pem'),
    cert: fs.readFileSync('SSL/localhost.pem')
};

const app = express();

// view engine setup
app.use(express.static(path.join(__dirname, '..', 'CrossBattles', 'build')));// Start the server

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

const WSSPORT = 8080;

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

// port set by project settings otherwise it's 3000
app.set('port', process.env.PORT || 3001);

// const server = https.createServer(options, app).listen(4000, function () {
//     console.log('Express server listening on port ' + server.address().port);
// });

const server = http.createServer(app).listen(4000, function () {
    console.log('Express server listening on port ' + server.address().port);
});

// init the websocket server on 8090
wss.init(server, WSSPORT)