// config/passport.js
var LocalStrategy = require('passport-local').Strategy;
var Connection = require('./database.js');
var bCrypt = require('bcrypt-nodejs');
var randtoken = require('rand-token');
var nodemailer = require('nodemailer');
var config = require('./config.js');
var async = require('async');

var jwt = require('jwt-simple');
var moment = require('moment');

// expose this function to our app using module.exports
module.exports = function(passport, app) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        console.log('111111');
        if (user.insertId) {
            done(null, user.insertId);
        } else {
            done(null, user.id);
        }
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        console.log('22222222');
        Connection.query('SELECT * from users where id = "' + id + '"', function(err, user, fields) {
            done(err, user[0]);
        });
    });

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-signup', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true // allows us to pass back the entire request to the callback
        },
        function(req, email, password, done) {
            console.log('121212121212121');
            console.log(req.body);
            Connection.query('SELECT * FROM users WHERE email="' + req.body.email + '" OR mobile="' + req.body.mobile + '"', function(err, user, fields) {

                if (req.session.flash) {
                    req.session.flash.error = [];
                }
                if (err) {
                    console.log("System Error (register) : " + err);
                    return done(err, false, 'Error');
                }
                // check to see if theres already a user with that email
                if ((user.length > 0) && (user[0].mobile === req.body.mobile) && (user[0].otp_verified == 0)) {
                    return done(err, false, 'Your mobile number is not verified');
                } else if ((user.length > 0) && (user[0].email === req.body.email) && (user[0].email_verified == 0)) {
                    return done(err, false, 'Your email id is not verified');
                } else if ((user.length > 0) && (user[0].email === req.body.email) && (user[0].mobile === req.body.mobile)) {
                    return done(err, false, 'This email id and mobile number is already registered.');
                } else if ((user.length > 0) && (user[0].email === req.body.email)) {
                    return done(err, false, 'Email id is already registered.');
                } else if ((user.length > 0) && (user[0].mobile === req.body.mobile)) {
                    return done(err, false, 'Mobile number is already exist');
                } else {

                    var activationToken = randtoken.generate(32);
                    var promoCode = randtoken.generate(6).toUpperCase();
                    var otpStr = Math.floor(100000 + Math.random() * 900000);

                    query = 'INSERT INTO users (email,password,activation_token,profile_pic,mobile,fname,lname,promo_code,otp,device_type,device_token,login_type) VALUES ("' +
                        req.body.email + '"' + ',' + '"' +
                        createHash(req.body.password) + '"' + ',' + '"' +
                        activationToken + '"' + ',' + '"' +
                        'profile_pic' + '"' + ',' + '"' +
                        req.body.mobile + '"' + ',' + '"' +
                        'fname' + '"' + ',' + '"' +
                        'lname' + '"' + ',' + '"' +
                        promoCode + '"' + ',' + '"' +
                        otpStr + '"' + ',' + '"' +
                        'device_type' + '"' + ',' + '"' +
                        'device_token' + '"' + ',' + '"' +
                        'login_type' +
                        '")';

                    //console.log(query);

                    // return false;
                    async.parallel({
                            one: function(callback) {
                                Connection.query(query, function(err, row, fields) {
                                    if (err) {
                                        return done(err, false, 'database error');
                                    } else {
                                        callback(null, row);
                                    }
                                });
                            },
                            two: function(callback) {
                                var baseUrl = req.protocol + '://' + config.fullhost;
                                var activationLink = "";
                                activationLink = baseUrl + "/verify?access_token=" + activationToken;
                                var to = [req.body.email];
                                var subject = 'HMT - Verification Link';
                                var message = '<h1><tbody><tr><td><h1>HMT application - Verification Link</h1><hr /><p><big>Hello,</big></p><p><big> Please <a href="' + activationLink + '" title="click here">click here</a> on the link for verify your email id or copy and paste the url : <strong>' + activationLink + '</strong></big></p><h3><code>Thanks,<br />HMT application Team</code></h3></td></tr></tbody></table>';

                                var mailOptions = {
                                    from: config.MAILSERVICE.USER, // sender address 
                                    to: to, // list of receivers 
                                    subject: subject, // Subject line 
                                    // text: 'Hello world ', // plaintext body 
                                    html: message // html body 
                                };
                                transporter.sendMail(mailOptions, function(error, info) {
                                    if (error) {
                                        return done(error, false, 'Verification email send error');
                                    } else {
                                        //console.log('Message sent: ' + info.response);
                                        callback(null, info);
                                    }
                                });
                            }
                        },
                        function(err, results) {
                            return done(null, results.one);
                        });
                }
            });

        }));

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-login', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true // allows us to pass back the entire request to the callback
        },
        function(req, email, password, done) { // callback with email and password from our form
            console.log(req.body);
            // find a user whose email is the same as the forms email
            // we are checking to see if the user trying to login already exists
            var query = 'SELECT * from users where email= "' + req.body.email + '" and role=' + req.body.role;
            Connection.query(query, function(err, user, fields) {
                // if there are any errors, return the error before anything else 

                if (req.session.flash) {
                    req.session.flash.error = [];
                }

                if (err) {
                    return done(err);
                } else if (!user[0]) {
                    return done(null, false, config.MESSAGES.checkEmailandPass);
                } else if ((user.length > 0) && (user[0].is_login == 5)) {
                    Connection.query('UPDATE users SET is_suspend= 1 WHERE id="' + user[0].id + '"', function(err, user) {})
                    return done(null, false, config.MESSAGES.loginAttempt);
                } else if (!isValidPassword(user[0], req.body.password)) {
                    var islogin = (user[0].is_login + 1);
                    console.log("islogin", islogin)
                    Connection.query('UPDATE users SET is_login= "' + islogin + '" WHERE id="' + user[0].id + '"', function(err, user) {})
                    return done(null, false, config.MESSAGES.checkPass);
                } else if ((user.length > 0) && (user[0].email_verified == 0)) {
                    return done(null, false, config.MESSAGES.emailNotVerify);
                } else {
                    var expires = moment().add('days', 7).valueOf();
                    var token = jwt.encode({
                        iss: user[0].id,
                        exp: expires
                    }, app.get('jwtTokenSecret'));
                    user[0].server_token = token;
                    if (user[0].role == 1) {
                        req.session.admin = user[0]
                        Connection.query('UPDATE users SET is_login= 0, server_token="' + token + '", is_suspend=0 WHERE id="' + user[0].id + '"', function(err, user) {})
                        delete req.session.admin.password;
                        return done(null, user[0]);
                    } else {
                        req.session.user = user[0]
                        Connection.query('UPDATE users SET is_login= 0, server_token="' + token + '", is_suspend=0 WHERE id="' + user[0].id + '"', function(err, user) {})
                        delete req.session.user.password;
                        return done(null, user[0]);
                    }
                    // all is well, return successful user
                }
            });
        }));

    // Generates hashed value using bCrypt
    var createHash = function(password) {
        return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
    }

    // compare the crypt value
    var isValidPassword = function(user, password) {
        if (user) {
            return bCrypt.compareSync(password, user.password);
        } else {
            return false;
        }
    }

};
