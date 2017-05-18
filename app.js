var express = require('express');
var app = express();
var port = process.env.PORT || 8080;
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var passport = require('passport');
var flash = require('connect-flash');
var config = require('./config/config.js');
var bodyParser = require('body-parser');
app.locals = require('./locals/common');
var connection = require('./config/database.js');
app.locals.base_path = __dirname;
connection.connect();

require('./config/passport')(passport, app);
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'html'); // set up ejs for templating
app.use(logger('dev'));
app.use(bodyParser());
//app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(session({ secret: 'ilovescotchscotchyscotchscotch' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

//app.use('/', routes);
//app.use('/users', users);

/// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//     var err = new Error('Not Found');
//     err.status = 404;
//     next(err);
// });

/// error handlers

// development error handler
// will print stacktrace
// if (app.get('env') === 'development') {
//     app.use(function(err, req, res, next) {
//         res.status(err.status || 500);
//         res.render('error', {
//             message: err.message,
//             error: err
//         });
//     });
// }

// production error handler
// no stacktraces leaked to user
// app.use(function(err, req, res, next) {
//     res.status(err.status || 500);
//     res.render('error', {
//         message: err.message,
//         error: {}
//     });
// });
// routes ======================================================================
require('./server/routes/api_user')(app, passport); // load our routes and pass in our app and fully configured passport
require('./server/routes/routes')(app);
require('./server/routes/api.js')(app);


// launch ======================================================================
app.listen(config.port)
console.log("Initialize server --------------- >>>>>> http://localhost:" + config.port);
