var Connection = require('../../config/database.js'); // included for get database connection
var config = require('../../config/config.js'); // included for get server configuration
var mails = require('../controllers/send_mail.js'); // included controller for sending mails
var bCrypt = require('bcrypt-nodejs'); // used for password bcrypt
var formidable = require('formidable');
var fs = require('fs');
var async = require('async');
var im = require('imagemagick');

/* @function : createHash
 *  @purpose  : This function used for create hash for password
 */
var createHash = function(password) {
    return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
}

/* @function : countUsers
 *  @method  : POST
 *  @purpose  : This function used to get count list of registered users on app
 */
exports.countUsers = function(req, res) {
    async.parallel({
            one: function(callback) {
                Connection.query('SELECT COUNT(id) AS user_count FROM users where role = 2', function(err, user) {
                    if (err) {
                        callback('error in user count');
                    } else {
                        callback(null, user[0]);
                    }
                })
            },
            two: function(callback) {
                Connection.query('SELECT COUNT(id) AS last_week_count FROM users WHERE created < DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND role = 2', function(err, user) {
                    if (err) {
                        callback('error in last week user count');
                    } else {
                        callback(null, user[0]);
                    }
                })
            },
            three: function(callback) {
                Connection.query('SELECT COUNT(id) AS booked_trailer_pending  FROM `booked_trailers` WHERE status = 0', function(err, user) {
                    if (err) {
                        callback('error in booking trailer count which is status is pending');
                    } else {
                        callback(null, user[0]);
                    }
                })
            },
            four: function(callback) {
                Connection.query('SELECT COUNT(id) AS total_booking_list  FROM `booked_trailers`', function(err, user) {
                    if (err) {
                        callback('error in get total booking list');
                    } else {
                        callback(null, user[0]);
                    }
                })
            },
            five: function(callback) {
                Connection.query('SELECT COUNT(id) AS booked_trailer_cancelled  FROM `booked_trailers` WHERE status = 2', function(err, user) {
                    if (err) {
                        callback('error in booking trailer count which is status is cancelled');
                    } else {
                        callback(null, user[0]);
                    }
                })
            },
            six: function(callback) {
                Connection.query('SELECT SUM(amount) AS total_amount, SUM(application_fee) AS total_application_fee FROM `transactions` WHERE status = 1 OR status = 5', function(err, txn) {
                    if (err) {
                        callback('error in fetch transactions list');
                    } else {
                        callback(null, txn[0]);
                    }
                })
            },
            seven: function(callback) {
                Connection.query('SELECT COUNT(id) AS booked_trailer_dropoff  FROM `booked_trailers` WHERE status = 5', function(err, user) {
                    if (err) {
                        callback('error in booking trailer count which is status is drop-off');
                    } else {
                        callback(null, user[0]);
                    }
                })
            },
            eight: function(callback) {
                Connection.query('SELECT SUM(amount) AS transfer_amount FROM `transactions` WHERE status = 2', function(err, user) {
                    if (err) {
                        callback('error in get total booking list which is transfered');
                    } else {
                        callback(null, user[0]);
                    }
                })
            },
            nine: function(callback) {
                Connection.query('SELECT SUM(refunded_amount) AS refunded_amount FROM `transactions` WHERE status = 3 OR status = 6', function(err, user) {
                    if (err) {
                        callback('error in get total booking list which is refund');
                    } else {
                        callback(null, user[0]);
                    }
                })
            }
        },
        function(err, results) {
            if (err) {
                res.status(500).json({ status: 0, error: { error_message: config.MESSAGES.DBErr } });
            } else {
                res.status(200).json({ status: 1, data: results });
            }
        });
}

/* @function : forgotpassword
 *  @method  : POST
 *  @purpose  : This function used for send forgot email as per respective email fot frontend user
 */
exports.forgotpassword = function(req, res) {
    Connection.query('SELECT * from users where email = "' + req.body.email + '"', function(err, user) {
        if (err) {
            res.status(200).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
        } else {
            if (!user || !user[0]) {
                res.status(200).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.forgotpass } });
            } else {
                req.body = user[0];
                mails.reset_passwordEmail(req, res, function(data) {
                    res.status(200).json({ status: config.CODES.statusOk, message: data.message });
                });
            }
        }
    })
}

/* @function : adminForgotPass
 *  @method  : POST
 *  @purpose  : This function used for send forgot email as per respective email for admin
 */
exports.adminForgotPass = function(req, res) {
    Connection.query('SELECT * from users where email= "' + req.body.email + '"and role=' + req.body.role, function(err, user) {
        if (err) {
            res.status(500).json({ 'error': err });
        } else {
            if (!user || !user[0]) {
                res.status(401).json({ error: 'You are not authorised admin' });
            } else {
                mails.reset_passwordEmail(req, res, function(data) {
                    res.json({ 'code': config.CODES.OK, "message": data.message });
                });

            }
        }
    })
}

/* @function : resetPassword
 *  @method  : POST
 *  @purpose  : This function used for reset password for both frontend and admin user
 */
exports.resetPassword = function(req, res) {
    if (req.body.token && req.body.password) {
        Connection.query('UPDATE users SET is_login=0,is_suspend=0,password_reset_token=NULL, password="' + createHash(req.body.password) + '" WHERE password_reset_token="' + req.body.token + '"', function(err, user) {
            if (err) {
                res.status(500).json({ 'error': err });
            } else {
                if (user.affectedRows == 0) {
                    res.status(401).json({ error: config.MESSAGES.resetInvalidToken });
                } else {
                    res.status(200).json({ message: config.MESSAGES.resetPasswordChanged, error: {} });
                }
            }
        })
    } else {
        res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.InvalidParameter } });
    }
}

/* @function : checkresetPasswordToken
 *  @method  : POST
 *  @purpose  : This function used for reset password for both frontend and admin user
 */
exports.checkresetPasswordToken = function(req, res) {
    if (req.body.token) {
        async.series
        query = 'SELECT id, is_expire FROM `users` WHERE password_reset_token="' + req.body.token + '"'
        Connection.query(query, function(err, userdata) {
            console.log(userdata);
            if (err) {
                res.status(500).json({ 'error': err });
            } else if (userdata && userdata.length > 0) {
                var startDate = new Date(userdata[0].is_expire);
                //var tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
                //var endDate = (new Date(Date.now() - tzoffset)).toISOString().slice(0, -1);
                var endDate = new Date();
                var timeDiff = (endDate.getTime() - startDate.getTime()) / 1000;
                if (timeDiff > 600) {
                    res.status(500).json({ status: 2, error: { error_message: config.MESSAGES.passwordResetTokenExpire } });
                }
            } else {
                res.status(500).json({ status: 3, error: { error_message: config.MESSAGES.resetInvalidToken } });
            }
        });
        // var query = 'SELECT COUNT(id) AS count FROM `users` WHERE password_reset_token="' + req.body.token + '"';
        // console.log(query);
        // Connection.query(query, function(err, user) {
        //     if (err) {
        //         res.status(500).json({ 'error': err });
        //     } else {
        //         if (user[0].count == 0) {
        //             res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.resetInvalidToken } });
        //         } else {
        //             res.status(200).json({ status: config.CODES.statusOk });
        //         }
        //     }
        // })
    } else {
        res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.InvalidParameter } });
    }
}

/* @function : changePassword
 *  @method  : POST
 *  @purpose  : This function used for change password for admin user
 */
exports.changePassword = function(req, res) {
    Connection.query('UPDATE users SET password="' + createHash(req.body.password) + '" WHERE id="' + req.body.id + '"', function(err, user) {
        if (err) {
            res.status(500).json({ 'error': err });
        } else {
            if (user.affectedRows == 0) {
                res.status(401).json({ error: config.MESSAGES.resetInvalidToken });
            } else {
                res.status(200).json({ message: config.MESSAGES.resetPasswordChanged, error: {} });
            }
        }
    })
}

/* @function : loadUsers
 *  @method  : GET
 *  @purpose  : This function used for get all registerd user
 */
exports.loadUsers = function(req, res) {
    Connection.query('SELECT u.id,u.first_name AS fname,u.last_name AS lname,u.email,u.mobile,u.is_suspend,u.status,u.is_notification,u.is_dispute,u.created,u.balance,AVG(ur.rating) as rating, @curRow := @curRow + 1 AS row_number FROM `users` u LEFT JOIN user_ratings as ur ON u.id=ur.rater_id JOIN (SELECT @curRow := 0) r WHERE u.role=2 and u.is_deleted = 0 GROUP BY u.id ORDER BY `u`.`id` DESC', function(err, user) {
        if (err) {
            res.status(500).json({ 'error': err });
        } else {
            res.status(200).json({ message: 'Success', data: user, error: {} });
        }
    })
}

/* @function : getUserDetail
 *  @method  : GET
 *  @purpose  : This function used for get registerd user detail as per userId
 */
exports.getUserDetail = function(req, res) {
    if (req.body.id) {
        query = 'SELECT id,first_name AS fname,otp_verified AS is_mobile_verified,email_verified AS is_email_verified, address,suburb,state,postcode,licence_state,licence_number, is_dispute,is_login,last_name AS lname,image_url,mobile,is_notification, email,address,suburb,state,postcode,licence_state,licence_number,promo_code, is_suspend,status, balance, created FROM users where id="' + req.body.id + '"';
        Connection.query(query, function(err, user) {
            if (err) {
                res.status(500).json({ 'error': err });
            } else {
                res.status(200).json({ status: 1, data: user[0], });
            }
        })
    } else {
        res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.InvalidParameter } });
    }

}

/* @function : deleteUser
 *  @method  : POST
 *  @purpose  : This function used for delete registerd user detail as per userId
 */
exports.deleteUser = function(req, res) {
    var query = 'UPDATE users SET modified = "' + req.body.modified + '", is_deleted= 1 WHERE id="' + req.body.id + '"';
    Connection.query(query, function(err, user) {
        if (err) {
            res.status(500).json({ 'error': err });
        } else {
            res.status(200).json({ message: 'Success', message: 'User has been deleted', error: {} });
        }
    })
}

/* @function : updateUserFile
 *  @method  : POST
 *  @purpose  : This function used for update user data with image as per userId
 */
exports.updateUserFile = function(req, res) {
    var form = new formidable.IncomingForm();
    form.parse(req);
    var dataFields;
    var imgName;
    var filePath;
    form.on('fileBegin', function(name, file) {
        var name = file.name.split('.');
        imgName = name[0] + '_' + new Date().getTime() + '.' + name.pop();
        file.path = req.app.locals.base_path + '/public/front/images/userpic/' + imgName;
        filePath = file.path;
    });
    form.on('field', function(field, value) {
        var obj = JSON.parse(value);
        dataFields = obj;
    });

    form.on('end', function() {
        im.resize({
            srcPath: filePath,
            dstPath: 'public/front/images/userpic/thumb/' + imgName,
            width: 256
        });
        var imgUrl = config.fullhost + '/front/images/userpic/thumb/' + imgName;
        var query = "UPDATE users SET modified = '" +
            dataFields.modified +
            "', profile_pic= '" + imgName +
            "', image_url= '" + imgUrl +
            "', email= '" + dataFields.email +
            "', first_name= '" + dataFields.fname +
            "', last_name= '" + dataFields.lname +
            "', mobile= '" + dataFields.mobile +
            '", address= "' + req.body.address +
            '", suburb= "' + req.body.suburb +
            '", state= "' + req.body.state +
            '", postcode= "' + req.body.postcode +
            '", licence_state= "' + req.body.lstate +
            '", licence_number= "' + req.body.lnumber +
            "', promo_code= '" + dataFields.promo_code +
            "', is_suspend= '" + dataFields.issuspend +
            "', is_login= '" + dataFields.is_login +
            "', is_notification= '" + dataFields.is_notification +
            "', status= '" + dataFields.status +
            "' WHERE id='" + dataFields.id + "'";
        Connection.query(query, function(err, user) {
            if (err) {
                res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
            } else {
                res.status(200).json({ status: config.CODES.statusOk, message: 'User successfully updated' });
            }
        });
    });
}

/* @function : updateUser
 *  @method  : POST
 *  @purpose  : This function used for update user data as per userId
 */
exports.updateUser = function(req, res) {
    console.log(req.body);
    var query = 'UPDATE users SET modified = "' + req.body.modified +
        '", email= "' + req.body.email +
        '", first_name= "' + req.body.fname +
        '", last_name= "' + req.body.lname +
        '", mobile= "' + req.body.mobile +
        '", address= "' + req.body.address +
        '", suburb= "' + req.body.suburb +
        '", state= "' + req.body.state +
        '", postcode= "' + req.body.postcode +
        '", licence_state= "' + req.body.lstate +
        '", licence_number= "' + req.body.lnumber +
        '", promo_code= "' + req.body.promo_code +
        '", is_suspend= "' + req.body.issuspend +
        '", is_dispute= "' + req.body.isdispute +
        '", is_login= "' + req.body.is_login +
        '", is_notification= "' + req.body.is_notification +
        '", status= "' + req.body.status +
        '" WHERE id="' + req.body.id + '"'
    console.log(query);
    Connection.query(query, function(err, user) {
        if (err) {
            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
        } else {
            res.status(200).json({ status: config.CODES.statusOk, message: 'User successfully updated' });
        }
    })
}

/* @function : getAccessToken
 *  @method  : POST
 *  @purpose  : This function used for verify email as per access-token id
 */
exports.getAccessToken = function(req, res) {
    Connection.query('SELECT id FROM users where activation_token="' + req.body.token + '"', function(err, user) {
        if (err) {
            res.status(500).json({ status: 0, error: { error_message: config.MESSAGES.DBErr } });
        } else if (user.length > 0) {
            var query = 'UPDATE users SET activation_token = NULL,  email_verified= 1 WHERE id="' + user[0].id + '"'
            Connection.query(query, function(err, user) {
                if (err) {
                    res.status(500).json({ status: 0, error: { error_message: config.MESSAGES.DBErr } });
                } else {
                    res.status(200).json({ status: 1, message: config.MESSAGES.emailVerify });
                }
            })
        } else {
            res.status(500).json({ status: 0, error: { error_message: config.MESSAGES.resetInvalidToken } });
        }
    })
}

/* @function : signIn
 *  @method  : POST
 *  @purpose  : This function used for sign In for mobile user
 */
exports.signIn = function(req, res) {
    Connection.query('SELECT * from users where email= "' + req.body.email + '"and role= 2', function(err, user, fields) {
        // if there are any errors, return the error before anything else 
        if (err) {
            res.status(200).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
        } else if (!user[0]) {
            res.status(200).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.checkEmailandPass } });
        } else if ((user.length > 0) && (user[0].is_login == 5)) {
            Connection.query('UPDATE users SET is_suspend= 1 WHERE id="' + user[0].id + '"', function(err, user) {})
            res.status(200).json({ status: config.CODES.statusFail, isEmail: user[0].email_verified, isMobile: user[0].otp_verified, error: { error_message: config.MESSAGES.loginAttempt } });
        } else if (!isValidPassword(user[0], req.body.password)) {
            var islogin = (user[0].is_login + 1);
            Connection.query('UPDATE users SET is_login= "' + islogin + '" WHERE id="' + user[0].id + '"', function(err, user) {})
            res.status(200).json({ status: config.CODES.statusFail, isEmail: user[0].email_verified, isMobile: user[0].otp_verified, error: { error_message: config.MESSAGES.checkPass } });
        } else if ((user.length > 0) && (user[0].email_verified == 0)) {
            res.status(200).json({ status: config.CODES.statusFail, isEmail: user[0].email_verified, isMobile: user[0].otp_verified, user: user[0].id, error: { error_message: config.MESSAGES.emailNotVerify } });
        } else {
            if (req.body.device_type) {
                Connection.query('UPDATE users SET is_login=0, is_suspend=0, device_type="' + req.body.device_type + '", login_type="' + req.body.login_type + '", device_token="' + req.body.device_token + '" WHERE id="' + user[0].id + '"', function(err, user) {});
            } else {
                Connection.query('UPDATE users SET is_login=0, is_suspend=0 WHERE id="' + user[0].id + '"', function(err, user) {});
            }
            res.status(200).json({ status: config.CODES.statusOk, message: config.MESSAGES.successLogin, user: user[0].id, fname: user[0].first_name, lname: user[0].last_name, email: user[0].email });
        }
    });
}

/* @function : userProfilePic
 *  @method  : POST
 *  @purpose  : This function used for update user profile pic as per login user id
 */
exports.userProfilePic = function(req, res) {
    var form = new formidable.IncomingForm();
    form.parse(req);
    var dataFields;
    var imgName;
    var filePath;
    form.on('fileBegin', function(name, file) {
        var name = file.name.split('.');
        imgName = name[0] + '_' + new Date().getTime() + '.' + name.pop();
        file.path = req.app.locals.base_path + '/public/front/images/userpic/' + imgName;
        filePath = file.path;

    });
    form.on('field', function(field, value) {
        var obj = JSON.parse(value);
        dataFields = obj;
    });
    form.on('end', function() {
        im.crop({
            srcPath: filePath,
            dstPath: 'public/front/images/userpic/thumb/' + imgName,
            width: 204,
            height: 191,
            quality: 1,
        });
        var imgUrl = config.fullhost + '/front/images/userpic/thumb/' + imgName;
        var query = "UPDATE users SET profile_pic = '" +
            imgName +
            "', image_url= '" + imgUrl +
            "' WHERE id='" + dataFields + "'";
        Connection.query(query, function(err, trailer) {
            if (err) {
                res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
            } else {
                res.status(200).json({ status: config.CODES.statusOk, data: imgName, message: 'Profile pic is updated' });
            }
        });
    });
}

/* @function : profileUpdate
 *  @method  : POST
 *  @purpose  : This function used for update user profile detail as per login user id
 */
exports.profileUpdate = function(req, res) {
    console.log(req.body)
    query = 'UPDATE users SET first_name="' + req.body.fname + '", last_name="' + req.body.lname + '", address="' + req.body.address + '", suburb="' + req.body.suburb + '", state="' + req.body.state + '", postcode="' + req.body.postcode + '", licence_state="' + req.body.lstate + '", licence_number="' + req.body.lnumber + '" WHERE id="' + req.body.id + '"';
    console.log(query);
    Connection.query(query, function(err, user) {
        if (err) {
            res.status(500).json({ 'error': err });
        } else {
            if (user.affectedRows == 0) {
                res.status(401).json({ error: config.MESSAGES.resetInvalidToken });
            } else {
                res.status(200).json({ message: 'Profile is updated' });
            }
        }
    })
}

/* @function : changeProfilePassword
 *  @method  : POST
 *  @purpose  : This function used for update user password as per login user id for frontend user
 */
exports.changeProfilePassword = function(req, res) {
    Connection.query("SELECT * from users where id= '" + req.body.id + "'", function(err, user, fields) {
        // if there are any errors, return the error before anything else              
        if (err) {
            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
        } else if (!user[0]) {
            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.checkEmailandPass } });
        } else if (!isValidPassword(user[0], req.body.oldpassword)) {
            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: 'incorrect old password.' } });
        } else {
            Connection.query('UPDATE users SET password="' + createHash(req.body.password) + '" WHERE id="' + req.body.id + '"', function(err, user) {
                if (err) {
                    res.status(500).json({ 'error': err });
                } else {
                    if (user.affectedRows == 0) {
                        res.status(401).json({ error: config.MESSAGES.resetInvalidToken });
                    } else {
                        res.status(200).json({ message: config.MESSAGES.resetPasswordChanged, error: {} });
                    }
                }
            })
        }
    });
}

/* @function : isValidPassword
 *  @purpose  : This function used for check password
 */
var isValidPassword = function(user, password) {
    if (user) {
        return bCrypt.compareSync(password, user.password);
    } else {
        return false;
    }
}

/* @function : updateProfileMob
 *  @method  : POST
 *  @purpose  : This function used for update user profile as per user id for mobile user
 */
exports.updateProfileMob = function(req, res) {
    var form = new formidable.IncomingForm();
    form.parse(req);
    var dataFields = {};
    var imgName;
    var filePath = '';
    form.on('fileBegin', function(name, file) {
        if (file.name.length > 0) {
            var name = file.name.split('.');
            imgName = name[0] + '_' + new Date().getTime() + '.' + name.pop();
            file.path = req.app.locals.base_path + '/public/front/images/userpic/' + imgName;
            filePath = file.path;
        }
    });
    form.on('field', function(field, value) {
        dataFields[field] = value;
    });
    form.on('end', function() {
        if (filePath.length > 0) {
            im.crop({
                srcPath: filePath,
                dstPath: 'public/front/images/userpic/thumb/' + imgName,
                width: 204,
                height: 191,
                quality: 1,
            }, function(err, stdout, stderr) {
                if (err) {
                    res.status(500).json({ status: config.CODES.statusFail, error: { error_message: "Image Upload error" } });
                } else {
                    var imgUrl = config.fullhost + '/front/images/userpic/thumb/' + imgName;
                    updateMob(imgName, imgUrl, dataFields, req, res);
                }
            });
        } else {
            var imgUrl = dataFields.old_image;
            imgName = '';
            updateMob(imgName, imgUrl, dataFields, req, res)
        }
    });
}

function updateMob(imgName, imgUrl, dataFields, req, res) {
    var query = "UPDATE users SET profile_pic = '" +
        imgName +
        "', image_url= '" + imgUrl +
        "', first_name= '" + dataFields.fname +
        "', last_name= '" + dataFields.lname +
        "', address= '" + dataFields.address +
        "', postcode= '" + dataFields.postcode +
        "', licence_state= '" + dataFields.licence_state +
        "', licence_number= '" + dataFields.licence_number +
        "' WHERE id='" + dataFields.id + "'";
    Connection.query(query, function(err, trailer) {
        if (err) {
            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
        } else {
            if (dataFields.old_image.length > 0) {
                var om = dataFields.old_image.split('/');
                var filen = om.pop()
                var unlnkPathUser = req.app.locals.base_path + '/public/front/images/userpic/' + filen;
                var unlnkPathThumb = req.app.locals.base_path + '/public/front/images/userpic/thumb/' + filen;
                fs.unlink(unlnkPathUser, function(err) {});
                fs.unlink(unlnkPathThumb, function(err) {});
            }
            res.status(200).json({ status: config.CODES.statusOk, message: 'Profile updated successfully' });
        }
    });
}

/* @function : cmsPageByID
 *  @method  : POST
 *  @purpose  : This function used for get cms page data as per Id
 */
exports.cmsPageByID = function(req, res) {
    Connection.query('SELECT id, title, description, status FROM cms where id="' + req.body.id + '" and status = 1', function(err, cms) {
        if (err) {
            res.status(500).json({ 'error': err });
        } else {
            res.status(200).json({ status: 1, data: cms[0], });
        }
    })
}

/* @function : verifyOtp
 *  @method  : POST
 *  @purpose  : This function used for verify mobile otp as per user_id
 */
exports.verifyOtp = function(req, res) {
    var reqBody = req.body;
    Connection.query('SELECT id,otp,mobile,email_verified FROM users WHERE id="' + reqBody.id + '"', function(err, user) {
        if (err) {
            res.status(200).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
        } else if (user && user.length > 0) {
            console.log(user)
            var otpMob = user[0].mobile;
            var code = reqBody.otp;
            mails.reportVerificationMobile(otpMob, code, function(response) {
                console.log('1212121212', response)
                if (response.code == config.CODES.OK) {
                    var query = 'UPDATE users SET otp = Null, otp_verified = 1 where id ="' + user[0].id + '"';
                    Connection.query(query, function(err, user1) {
                        if (err) {
                            res.status(200).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
                        } else {
                            res.status(200).json({ status: config.CODES.statusOk, isEmail: user[0].email_verified, isMobile: 1, message: 'Your OTP is verified' });
                        }
                    });
                } else if (response.code == config.CODES.Error) {
                    res.status(200).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.OtpNotExist } });
                }
            });
        } else {
            res.status(200).json({ status: config.CODES.statusFail, error: { error_message: 'User does not exist' } });
        }
    });
}


/* @function : regenerateOtp
 *  @method  : POST 
 *  @purpose  : This function used for re-generate and update mobile otp as per user_id
 */
exports.regenerateOtp = function(req, res) {
    console.log(req.body);
    if (req.body.user_id) {
        Connection.query('SELECT users.id,users.mobile FROM users WHERE id="' + req.body.user_id + '"', function(err, user) {
            console.log(user)
            if (err) {
                res.status(200).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
            } else if (user.length == 0) {
                res.status(200).json({ status: config.CODES.statusFail, error: { error_message: 'User does not exist' } });
            } else {
                var otpMob = user[0].mobile;
                mails.createVerificationMobile(otpMob, function(response) {
                    if (response.code == config.CODES.OK) {
                        res.status(200).json({ status: config.CODES.statusOk, message: 'OTP successfully sent' });
                    } else if (response.code == config.CODES.Error) {
                        res.status(200).json({ status: config.CODES.statusFail, error: { error_message: 'OTP resend error. Please try again.' } });
                    }
                });
            }
        });
    } else {
        res.status(200).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.InvalidParameter } });
    }
}

/* @function : logoutMob
 *  @method  : POST
 *  @purpose  : This function used for logout user for mobile
 */
exports.logoutMob = function(req, res) {
    if (req.body.user_id) {
        query = 'UPDATE users SET device_token= Null WHERE id="' + req.body.user_id + '"';
        Connection.query(query, function(err, user) {
            if (err) {
                res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
            } else {
                if (user.affectedRows == 0) {
                    res.status(500).json({ status: config.CODES.statusFail, error: { error_message: "User does not exist" } });
                } else {
                    res.status(200).json({ status: config.CODES.statusOk, message: 'log out sucessfully' });
                }
            }
        })
    } else {
        res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.InvalidParameter } });
    }
}

/* @function : contactUs
 *  @method  : POST
 *  @purpose  : This function used for save contact us data in DB and send contact email to admin
 */
exports.contactUs = function(req, res) {
    var form = new formidable.IncomingForm();
    form.parse(req);
    var dataFields;
    var imgName = '';
    var filePath;
    form.on('fileBegin', function(name, file) {
        console.log(file.name);
        var name = file.name.split('.');
        imgName = name[0].replace("%", "_") + '_' + new Date().getTime() + '.' + name.pop();
        file.path = req.app.locals.base_path + '/public/front/attachment/' + imgName;
        filePath = file.path;
    });
    form.on('field', function(field, value) {
        var obj = JSON.parse(value);
        dataFields = obj;
    });

    form.on('end', function() {
        query = 'INSERT INTO contacts (email,attachment,message,name,phone,subject,user_type) VALUES ("' +
            dataFields.email + '"' + ',' + '"' +
            imgName + '"' + ',' + '"' +
            dataFields.message + '"' + ',' + '"' +
            dataFields.name + '"' + ',' + '"' +
            dataFields.phone + '"' + ',' + '"' +
            dataFields.subject + '"' + ',' + '"' +
            dataFields.user_type +
            '")';
        console.log(query)
        Connection.query(query, function(err, contact) {
            if (err) {
                res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
            } else {
                var messageHtml = '<p>Hello Admin,</p><p>&nbsp;</p><p>You have got a new contact email from HMT website.</p><p>The detail of the user are as follow:</p><p>Name : "' + dataFields.name + '"</p><p><span style="font-family: LatoWeb, sans-serif; font-size: 14px;">Email : "' + dataFields.email + '"</span></p><span style="font-family: LatoWeb, sans-serif; font-size: 14px;">Subject : "' + dataFields.subject + '"</span></p><p><span style="font-family: LatoWeb, sans-serif; font-size: 14px;">Phone :"' + dataFields.phone + '"</span></p><p>I am a : "' + dataFields.user_type + '"</p><p><span style="font-family: LatoWeb, sans-serif; font-size: 14px;">Message :"' + dataFields.message + '"</span></p><p>&nbsp;</p><p><span style="font-family: LatoWeb, sans-serif; font-size: 14px;">Thanks</span></p><p><span style="font-family: LatoWeb, sans-serif; font-size: 14px;">HMT TEAM</span></p>';
                if (imgName) {
                    console.log('sdsdsdsd');
                    var attachment = [{ fileName: imgName, filePath: config.fullhost + '/front/attachment/' + imgName }];
                    mails.sendEmailWithAttachment(dataFields.email, config.ADMINEMAIL, dataFields.subject, messageHtml, attachment, function(response) {
                        if (response.code == config.CODES.notFound) {
                            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
                        } else if (response.code == config.CODES.OK) {
                            res.status(200).json({ status: config.CODES.statusOk, message: config.MESSAGES.ContactEmialMessage });
                        }
                    });
                } else {
                    var attachment = null;
                    mails.sendEmailWithAttachment(dataFields.email, config.ADMINEMAIL, dataFields.subject, messageHtml, attachment, function(response) {
                        if (response.code == config.CODES.notFound) {
                            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
                        } else if (response.code == config.CODES.OK) {
                            res.status(200).json({ status: config.CODES.statusOk, message: config.MESSAGES.ContactEmialMessage });
                        }
                    });
                }
            }
        });
    });
}

/* @function : userRating
 *  @method  : POST
 *  @purpose  : This function used for update user rating and save data in DB 
 */
exports.userRating = function(req, res) {
    if (req.body.user_id) {
        query = 'SELECT ur.rater_id AS owner_id,ur.rating, CONCAT(users.first_name," ",users.last_name) AS fullname, users.image_url AS owner_image_url FROM `user_ratings` AS ur LEFT JOIN users ON users.id = ur.rater_id WHERE ur.user_id = ' + req.body.user_id + ' AND ur.status = 0';
        Connection.query(query, function(err, user1) {
            if (err) {
                res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
            } else {
                res.status(200).json({ status: config.CODES.statusOk, data: user1 });
            }
        })
    } else {
        res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.InvalidParameter } });
    }


}

/* @function : rateOwnerByRenter
 *  @method  : POST
 *  @purpose  : This function used for rate owner by the renter
 */
exports.rateOwnerByRenter = function(req, res) {
    if (req.body.user_id) {
        query = 'UPDATE user_ratings SET rating = "' + req.body.rating + '", user_id = "' + req.body.user_id + '",rater_id="' + req.body.rater_id + '",status=1,comment="' + req.body.comment + '" WHERE user_ratings.user_id =' + req.body.user_id
        Connection.query(query, function(err, user) {
            if (err) {
                res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
            } else {
                res.status(200).json({ status: config.CODES.statusOk, message: "Rating successfully added" });
            }
        })
    } else {
        res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.InvalidParameter } });
    }
}

/* @function : loadContactList
 *  @method  : GET
 *  @purpose  : This function used for get all Contact-us list which is submitted by user from contact-us form
 */
exports.loadContactList = function(req, res) {
    Connection.query('SELECT *, @curRow := @curRow + 1 AS row_number FROM contacts JOIN (SELECT @curRow := 0) r ORDER BY id DESC', function(err, contact) {
        if (err) {
            res.status(500).json({ 'error': err });
        } else {
            res.status(200).json({ message: 'Success', data: contact, error: {} });
        }
    })
}

/* @function : getContactById
 *  @method  : POST
 *  @purpose  : This function used get contact data as per id
 */
exports.getContactById = function(req, res) {
    Connection.query('SELECT * from contacts where id="' + req.body.id + '"', function(err, contact) {
        if (err) {
            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
        } else if (contact.length < 1) {
            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: 'Id does not exist' } });
        } else {
            res.status(200).json({ status: config.CODES.statusOk, data: contact[0] });
        }
    })
}

/* @function : deleteContactList
 *  @method  : POST
 *  @purpose  : This function used delete contact data as per id
 */
exports.deleteContactList = function(req, res) {
    Connection.query('DELETE FROM contacts WHERE id="' + req.body.id + '"', function(err, contact) {
        if (err) {
            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
        } else {
            var unlnkPathThumb = req.app.locals.base_path + '/public/front/attachment/' + req.body.file;
            fs.unlink(unlnkPathThumb, function(err) {});
            res.status(200).json({ status: config.CODES.statusOk, message: 'Contact is successfully deleted' });
        }
    })
}

/* @function : getDisputeIdList
 *  @method  : POST
 *  @purpose  : This function used for get all Dispute user List
 */
exports.getDisputeIdList = function(req, res) {
    Connection.query('SELECT ds.id,ds.user_id,CONCAT(users.first_name," ",users.last_name) AS fullname, users.email FROM `disputes` AS ds LEFT JOIN users ON users.id = ds.dispute_id WHERE ds.user_id =' + req.body.user_id, function(err, user) {
        if (err) {
            res.status(500).json({ 'error': err });
        } else {
            res.status(200).json({ message: 'Success', data: user });
        }
    })
}

/* @function : saveDisputeData
 *  @method  : POST
 *  @purpose  : This function used for save Dispute data in DB
 */
exports.saveDisputeData = function(req, res) {
    var bodyData = req.body;
    var referenceNo = Math.floor((Math.random() * 100000) + 1)
    query = "INSERT INTO dispute_logs (user_id,renter_name,renter_email,trailer_condition,reference_id,discription) VALUES('" +
        bodyData.user_id + "'" + ',' + "'" +
        bodyData.renter_name + "'" + ',' + "'" +
        bodyData.renter_email + "'" + ',' + "'" +
        bodyData.trailer_condition + "'" + ',' + "'" +
        referenceNo + "'" + ',' + "'" +
        bodyData.discription +
        "')";
    Connection.query(query, function(err, user) {
        if (err) {
            res.status(500).json({ 'error': err });
        } else {
            var to = [bodyData.renter_email, config.ADMINEMAIL];
            var subject = 'HMT - Dispute Email';
            var message = '<h1><tbody><tr><td><h1>HMT Dispute Email</h1><hr /><p><big>Hello "' + bodyData.renter_name + '",</big></p><p><big>Your dispute has been assigned for action, your reference number is #"' + referenceNo + '"’  (This information will need to be elaborated on once legal documents are received from my solicitor)</big></p><h3><code>Thanks,<br />HMT Application Team</code></h3></td></tr></tbody></table>';
            mails.sendEmail(config.ADMINEMAIL, to, subject, message, function(response) {
                if (response.code == config.CODES.OK) {
                    res.status(200).json({ message: 'Success', data: user });
                } else {
                    res.status(500).json({ 'error': "Error in send email" });
                }
            });
        }
    });
}

/* @function : saveDisputeData
 *  @method  : POST
 *  @purpose  : This function used for save Dispute data in DB
 */
exports.getDisputeList = function(req, res) {
    query = 'SELECT dl.*, CONCAT(users.first_name," ",users.last_name) AS owner_name, @curRow := @curRow + 1 AS row_number FROM `dispute_logs` AS dl LEFT JOIN users on users.id = dl.user_id JOIN (SELECT @curRow := 0) r WHERE dl.is_delete = 0 ORDER BY id DESC';
    Connection.query(query, function(err, dispute) {
        if (err) {
            res.status(500).json({ 'error': err });
        } else {
            res.status(200).json({ message: 'Success', data: dispute });
        }
    })
}

/* @function : deleteDispute
 *  @method  : POST
 *  @purpose  : This function used for delete dispute detail as per Id
 */
exports.deleteDispute = function(req, res) {
    if (req.body.id) {
        var query = 'UPDATE dispute_logs SET is_delete= 1 WHERE id="' + req.body.id + '"';
        Connection.query(query, function(err, user) {
            if (err) {
                res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
            } else {
                res.status(200).json({ message: 'Success', message: 'Dispute list been deleted successfully' });
            }
        })
    } else {
        res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.InvalidParameter } });
    }
}

/* @function : getInvoicesByUser
 *  @method  : POST
 *  @purpose  : This function used for get invoices list as per given user Id
 */
exports.getInvoicesByUser = function(req, res) {
    if (req.body.user_id && req.body.role) {
        var query = 'SELECT il.*, CONCAT(u.first_name," ",u.last_name) AS user_name, bt.id AS booking_id, s.label AS size, bt.trailer_type FROM `invoices_logs` AS il LEFT JOIN users AS u ON u.id = il.user_id LEFT JOIN booked_trailers AS bt ON bt.id = il.booking_id LEFT JOIN sizes AS s ON s.id = bt.size_id WHERE il.user_id = "' + req.body.user_id + '" AND il.role = "' + req.body.role + '"';
        console.log(query);
        Connection.query(query, function(err, invoices) {
            if (err) {
                res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
            } else {
                res.status(200).json({ status: config.CODES.statusOk, data: invoices });
            }
        })
    } else {
        res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.InvalidParameter } });
    }
}

/* @function : askQuestion
 *  @method  : POST 
 *  @purpose  : This function used for send ask question message to owner.
 */
exports.askQuestion = function(req, res) {
    var bodyData = req.body;
    if (bodyData.renter_id && bodyData.owner_id && bodyData.message) {
        Connection.query('SELECT u.id AS renter_id, CONCAT(UCASE(LEFT(u.first_name, 1)),LCASE(SUBSTRING(u.first_name, 2))) AS renter_fname, CONCAT(UCASE(LEFT(u.last_name, 1)),LCASE(SUBSTRING(u.last_name, 2))) AS renter_lname, u.mobile AS renter_mobile, usr.id AS owner_id, CONCAT(UCASE(LEFT(usr.first_name, 1)),LCASE(SUBSTRING(usr.first_name, 2))) AS owner_fname, CONCAT(UCASE(LEFT(usr.last_name, 1)),LCASE(SUBSTRING(usr.last_name, 2))) AS owner_lname, usr.mobile AS owner_mobile FROM `users` AS u LEFT JOIN users AS usr ON usr.id = "' + bodyData.owner_id + '" WHERE u.id = "' + bodyData.renter_id + '"', function(err, user) {
            var userData = user[0];
            if (err) {
                res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
            } else if (user.length == 0) {
                res.status(500).json({ status: config.CODES.statusFail, error: { error_message: 'User does not exist' } });
            } else {
                var otpMsg = userData.renter_fname + ' ' + userData.renter_lname + '(' + userData.renter_mobile + ') Ask a question : ' + bodyData.message
                var otpMob = userData.owner_mobile;
                mails.sendMobileMessage(otpMob, otpMsg, function(response) {
                    if (response.code == config.CODES.OK) {
                        res.status(200).json({ status: config.CODES.statusOk, message: 'Question successfully sent to owner. He will get in touch as soon as possible.' });
                    } else if (response.code == config.CODES.Error) {
                        res.status(500).json({ status: config.CODES.statusFail, error: { error_message: 'Ask question send error' } });
                    }
                });
            }
        });
    } else {
        res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.InvalidParameter } });
    }
}

/* @function : checkMobileExist
 *  @method  : POST
 *  @purpose  : This function used for check mobile number exist in DB
 */
exports.checkMobileExist = function(req, res) {
    var mobile = req.body.mobile;
    if (mobile.length > 0) {
        query = 'SELECT id FROM `users` where mobile = "' + req.body.mobile + '"';
        Connection.query(query, function(err, user) {
            console.log(user)
            if (err) {
                res.status(200).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
            } else if (user && user.length > 0) {
                res.status(200).json({ status: config.CODES.statusFail, error: { message: config.MESSAGES.mobileExist } });
            } else {
                res.status(200).json({ status: config.CODES.statusOk, message: 'This mobile is not exist' });
            }
        })
    } else {
        res.status(200).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.InvalidParameter } });
    }

}

/* @function : checkEmailExist
 *  @method  : POST
 *  @purpose  : This function used for check email exist in DB
 */
exports.checkEmailExist = function(req, res) {
    var mail = req.body.email;
    if (mail.length > 0) {
        query = 'SELECT id FROM `users` where email = "' + mail + '"';
        Connection.query(query, function(err, dispute) {
            if (err) {
                res.status(200).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
            } else if (user && user.length > 0) {
                res.status(200).json({ status: config.CODES.statusFail, error: { message: config.MESSAGES.EmailAlreadyExist } });
            } else {
                res.status(200).json({ status: config.CODES.statusOk, message: 'This email is not exist' });
            }
        })
    } else {
        res.status(200).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.InvalidParameter } });
    }

}
