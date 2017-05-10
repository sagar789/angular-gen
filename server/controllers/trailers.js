var Connection = require('../../config/database.js');
var config = require('../../config/config.js');
var mails = require('../controllers/send_mail.js'); // included controller for sending mails
var bCrypt = require('bcrypt-nodejs');
var formidable = require('formidable');
var fs = require('fs');
var async = require('async');
var im = require('imagemagick');

/* @function : createHash
 *  @purpose  : This function used create hash password for given password
 */
var createHash = function(password) {
    return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
}

/* @function : addDTrailer
 *  @method  : POST
 *  @purpose  : This function used for add category trailer in DB
 */
exports.addDTrailer = function(req, res) {
    var form = new formidable.IncomingForm();
    form.parse(req);
    var dataFields;
    var imgName;
    var filePath;
    form.on('fileBegin', function(name, file) {
        var name = file.name.split('.');
        imgName = name[0].replace(" ", "_") + '_' + new Date().getTime() + '.' + name.pop();
        file.path = req.app.locals.base_path + '/public/admin/images/trailers/' + imgName;
        filePath = file.path;

    });
    form.on('field', function(field, value) {
        var obj = JSON.parse(value);
        dataFields = obj;
    });

    form.on('end', function() {
        im.resize({
            srcPath: filePath,
            dstPath: 'public/admin/images/trailers/thumb/' + imgName,
            width: 256,
            height: 228,
            strip: true,
            progressive: false,
            quality: 0.8
        });
        var imgUrl = config.fullhost + '/admin/images/trailers/thumb/' + imgName;
        query = "INSERT INTO default_trailers (title,image,image_url,description,size_id,type_id,status) VALUES ('" +
            dataFields.title + "'" + ',' + "'" +
            imgName + "'" + ',' + "'" +
            imgUrl + "'" + ',' + "'" +
            dataFields.description + "'" + ',' + "'" +
            dataFields.size + "'" + ',' + "'" +
            dataFields.type + "'" + ',' + "'" +
            dataFields.status +
            "')";
        Connection.query(query, function(err, trailer) {
            if (err) {
                res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
            } else {
                res.status(200).json({ status: config.CODES.statusOk, message: 'Trailer successfully added' });
            }
        });
    });
}

/* @function : loadDTrailers
 *  @method  : GET
 *  @purpose  : This function used for get only active category trailer list from DB 
 */
exports.loadDTrailers = function(req, res) {
    var query = 'SELECT dt.id,dt.title,dt.caption,dt.description, dt.image, dt.image_url, dt.size_id, dt.status, dt.created, types.id as type_id, types.name as type_name FROM default_trailers AS dt LEFT JOIN types ON types.id=dt.type_id WHERE dt.status = 1 ORDER BY types.id ASC';
    console.log(query)
    Connection.query(query, function(err, trailer) {
        if (trailer && trailer.length > 0) {
            trailer.forEach(function(key, i) {
                slStr = JSON.parse(key.size_id);
                trailer[i].size_id = slStr;
            });
        }
        if (err) {
            res.status(200).json({ 'error': err });
        } else {
            res.status(200).json({ status: config.CODES.statusOk, data: trailer });
        }
    })
}

/* @function : loadDTrailersFull
 *  @method  : GET
 *  @purpose  : This function used for get all category trailer list from DB
 */
exports.loadDTrailersFull = function(req, res) {
    var query = 'SELECT dt.id,dt.title,dt.description, dt.image, dt.image_url, dt.size_id, dt.status, dt.created, types.id as type_id, types.name as type_name FROM default_trailers AS dt LEFT JOIN types ON types.id=dt.type_id ORDER BY types.id ASC';
    Connection.query(query, function(err, trailer) {
        trailer.forEach(function(key, i) {
            slStr = JSON.parse(key.size_id);
            trailer[i].size_id = slStr;
        });
        if (err) {
            res.status(500).json({ 'error': err });
        } else {
            res.status(200).json({ status: config.CODES.statusOk, data: trailer });
        }
    })
}

/* @function : getDTrailerDetail
 *  @method  : POST
 *  @purpose  : This function used for get category trailer data as per id from DB
 */
exports.getDTrailerDetail = function(req, res) {
    Connection.query('SELECT id, title, image, type_id,description, size_id, status FROM default_trailers where id="' + req.body.id + '"', function(err, trailer) {
        if (err) {
            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
        } else if (trailer.length < 1) {
            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: 'Id does not exist' } });
        } else {
            res.status(200).json({ status: config.CODES.statusOk, data: trailer[0] });
        }
    })
}

/* @function : deleteDTrailer
 *  @method  : POST
 *  @purpose  : This function used for delete category trailer data as per id from DB
 */
exports.deleteDTrailer = function(req, res) {
    Connection.query('DELETE FROM default_trailers WHERE id="' + req.body.id + '"', function(err, trailer) {
        if (err) {
            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
        } else {
            res.status(200).json({ status: config.CODES.statusOk, data: 'Trailer is successfully deleted' });
        }
    })
}

/* @function : updateDTrailerFile
 *  @method  : POST
 *  @purpose  : This function used for update category trailer with image data as per id from DB
 */
exports.updateDTrailerFile = function(req, res) {
    var form = new formidable.IncomingForm();
    form.parse(req);
    var dataFields;
    var imgName;
    var filePath;
    form.on('fileBegin', function(name, file) {
        var name = file.name.split('.');
        imgName = name[0].replace(" ", "_") + '_' + new Date().getTime() + '.' + name.pop();
        file.path = req.app.locals.base_path + '/public/admin/images/trailers/' + imgName;
        filePath = file.path;
    });
    form.on('field', function(field, value) {
        var obj = JSON.parse(value);
        dataFields = obj;
    });

    form.on('end', function() {
        im.resize({
            srcPath: filePath,
            dstPath: 'public/admin/images/trailers/thumb/' + imgName,
            width: 256,
            height: 228,
            strip: true,
            progressive: false,
            quality: 0.8
        });
        var imgUrl = config.fullhost + '/admin/images/trailers/thumb/' + imgName;
        var query = "UPDATE default_trailers SET title = '" +
            dataFields.title +
            "', image= '" + imgName +
            "', image_url= '" + imgUrl +
            "', size_id= '" + dataFields.size +
            "', type_id= '" + dataFields.type +
            "', description= '" + dataFields.description +
            "', status= '" + dataFields.status +
            "', modified= '" + dataFields.modified +
            "' WHERE id='" + dataFields.dtrailer_id + "'";
        Connection.query(query, function(err, trailer) {
            if (err) {
                res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
            } else {
                res.status(200).json({ status: config.CODES.statusOk, message: 'Trailer successfully updated' });
            }
        });
    });
}

/* @function : updateDTrailerFile
 *  @method  : POST
 *  @purpose  : This function used for update category trailer data as per id from DB
 */
exports.updateDTrailer = function(req, res) {
    var query = "UPDATE default_trailers SET title = '" +
        req.body.title +
        "', size_id= '" + req.body.size +
        "', type_id= '" + req.body.type +
        "', description= '" + req.body.description +
        "', status= '" + req.body.status +
        "', modified= '" + req.body.modified +
        "' WHERE id='" + req.body.dtrailer_id + "'";
    Connection.query(query, function(err, trailer) {
        if (err) {
            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
        } else {
            res.status(200).json({ status: config.CODES.statusOk, message: 'Trailer successfully updated' });
        }
    });
}

/* @function : addTrailer
 *  @method  : POST
 *  @purpose  : This function used for add trailer data in DB
 */
exports.addTrailer = function(req, res) {
    var form = new formidable.IncomingForm();
    form.parse(req);
    var dataFields = {};
    var imgName;
    var filePath = '';
    form.on('fileBegin', function(name, file) {
        if (file.name.length > 0) {
            var name = file.name.split('.');
            imgName = name[0].replace(" ", "_") + '_' + new Date().getTime() + '.' + name.pop();
            file.path = req.app.locals.base_path + '/public/admin/images/trailers/' + imgName;
            filePath = file.path;
        }
    });

    form.on('field', function(field, value) {
        dataFields[field] = value;
    });

    form.on('end', function() {

        async.series({
            one: function(callback) {
                Connection.query('SELECT otp_verified FROM users WHERE id="' + dataFields.user_id + '"', function(err, user) {
                    if (err) {
                        if (filePath.length > 0) {
                            var unlnkPathThumb = req.app.locals.base_path + '/public/admin/images/trailers/' + imgName;
                            fs.unlink(unlnkPathThumb, function(err) {});
                        }

                        callback({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
                    } else if ((user.length > 0) && (user[0].otp_verified == 0)) {
                        if (filePath.length > 0) {
                            var unlnkPathThumb = req.app.locals.base_path + '/public/admin/images/trailers/' + imgName;
                            fs.unlink(unlnkPathThumb, function(err) {});
                        }
                        callback({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.mobileVerifyBeforeAddTrailer } });
                    } else {
                        callback(null, 1);
                    }
                });
            },
            two: function(callback) {
                console.log('1212121212');
                if (filePath.length > 0) {
                    im.resize({
                        srcPath: filePath,
                        dstPath: 'public/admin/images/trailers/thumb/' + imgName,
                        width: 256,
                        height: 228,
                        strip: true,
                        progressive: false,
                        quality: 0.8
                    });
                }
                if (filePath.length > 0) {
                    var imgUrl = config.fullhost + '/admin/images/trailers/thumb/' + (imgName || null);
                } else {
                    imgUrl = '';
                    imgName = '';
                }

                query = 'INSERT INTO trailers (trailer_default_id,user_id,size_id,status,trailer_registration_number,trailer_registration_expiry,trailer_location,state,latitude,longitude,color,insured_value,image,image_url,trailer_desc) VALUES ("' +
                    dataFields.trailer_default_id + '"' + ',' + '"' +
                    dataFields.user_id + '"' + ',' + '"' +
                    dataFields.size_id + '"' + ',' + '"' +
                    dataFields.status + '"' + ',' + '"' +
                    dataFields.trailer_registration_number + '"' + ',' + '"' +
                    dataFields.trailer_registration_expiry + '"' + ',' + '"' +
                    dataFields.trailer_location + '"' + ',' + '"' +
                    dataFields.state + '"' + ',' + '"' +
                    dataFields.lat + '"' + ',' + '"' +
                    dataFields.lng + '"' + ',' + '"' +
                    dataFields.color + '"' + ',' + '"' +
                    dataFields.insured_value + '"' + ',' + '"' +
                    imgName + '"' + ',' + '"' +
                    imgUrl + '"' + ',' + '"' +
                    dataFields.trailer_desc + '")';
                console.log(query);
                Connection.query(query, function(err, trailer) {
                    if (err) {
                        callback({ status: config.CODES.statusFail, error: { error_message: "Trailer registration number is already exists." } });
                    } else {
                        callback(null, 1);
                    }
                });
            }
        }, function(err, results) {
            if (err) {
                console.log('err', err)
                res.status(200).json(err);
            } else {
                res.status(200).json({ status: config.CODES.statusOk, message: 'Trailer successfully added' });
            }
        });
    });
}

/* @function : editTrailerDetail
 *  @method  : POST
 *  @purpose  : This function used for get trailer data as per id from DB
 */
exports.editTrailerDetail = function(req, res) {
    if (req.query.trailer_id) {
        query = 'SELECT trailers.id AS trailer_id,trailers.trailer_default_id AS trailer_type_id,trailers.image_url AS trailer_type_image,ty.name AS trailer_type,trailers.status,trailers.trailer_registration_number,trailers.state, trailers.trailer_registration_expiry, trailers.trailer_location, trailers.trailer_desc,trailers.user_id AS owner_id, CONCAT(users.first_name," ",users.last_name) AS owner, users.mobile AS owner_mobile,users.profile_pic AS owner_image,users.image_url AS owner_image_url, sizes.id AS size_id, sizes.label AS size ,trailers.created, AVG(user_ratings.rating) AS rating FROM trailers LEFT JOIN users ON trailers.user_id = users.id LEFT JOIN default_trailers AS dt ON trailers.trailer_default_id = dt.id LEFT JOIN types AS ty ON dt.type_id = ty.id LEFT JOIN sizes ON trailers.size_id = sizes.id LEFT JOIN user_ratings ON user_ratings.rater_id = trailers.user_id where trailers.id="' + req.query.trailer_id + '"'
        console.log(query)
        Connection.query(query, function(err, trailer) {
            if (err) {
                res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
            } else if (trailer.length < 1) {
                res.status(500).json({ status: config.CODES.statusFail, error: { error_message: 'Trailer id does not exist' } });
            } else {
                res.status(200).json({ status: config.CODES.statusOk, data: trailer });
            }
        })
    } else {
        res.status(500).json({ status: config.CODES.statusFail, error: { error_message: 'Query id is missing' } });
    }
}

/* @function : getTrailerDetail
 *  @method  : POST
 *  @purpose  : This function used for get trailer data as per id and from date and to date from DB
 */
exports.getTrailerDetail = function(req, res) {
    var reqBody = req.body;
    if (reqBody.trailer_id && reqBody.from_date && reqBody.to_date) {
        query = 'SELECT trailers.id AS trailer_id,trailers.trailer_default_id AS trailer_type_id,trailers.image_url AS trailer_type_image,ty.name AS trailer_type,trailers.status,trailers.trailer_registration_number,trailers.state, trailers.trailer_registration_expiry, trailers.trailer_location, trailers.trailer_desc,trailers.user_id AS owner_id, CONCAT(users.first_name," ",users.last_name) AS owner, users.mobile AS owner_mobile,users.profile_pic AS owner_image,users.image_url AS owner_image_url, sizes.id AS size_id, sizes.label AS size ,trailers.created, AVG(user_ratings.rating) AS rating, ty.id AS type_id FROM trailers LEFT JOIN users ON trailers.user_id = users.id LEFT JOIN default_trailers AS dt ON trailers.trailer_default_id = dt.id LEFT JOIN types AS ty ON dt.type_id = ty.id LEFT JOIN sizes ON trailers.size_id = sizes.id LEFT JOIN user_ratings ON user_ratings.rater_id = trailers.user_id where trailers.id="' + reqBody.trailer_id + '"';
        console.log(query)
        Connection.query(query, function(err, trailer) {
            if (err) {
                res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
            } else if (trailer.length < 1) {
                res.status(500).json({ status: config.CODES.statusFail, error: { error_message: 'Trailer id does not exist' } });
            } else {
                var days = checkUniqueTrailer(new Date(reqBody.from_date), new Date(reqBody.to_date));
                if (days >= 7) {
                    getPriceRange(trailer[0].type_id, trailer[0].size_id, 3, function(response) {
                        if (response.status == config.CODES.statusFail) {
                            res.status(200).json({ status: config.CODES.statusFail, error: { error_message: response.data } });
                        } else if (response.status == config.CODES.statusOk) {
                            var mainAmount = response.data;
                            trailer[0].price = (mainAmount * days).toFixed(2);
                            res.status(200).json({ status: config.CODES.statusOk, data: trailer });
                        }
                    });
                } else if ((days >= 3) && (days <= 6)) {
                    getPriceRange(trailer[0].type_id, trailer[0].size_id, 2, function(response) {
                        if (response.status == config.CODES.statusFail) {
                            res.status(200).json({ status: config.CODES.statusFail, error: { error_message: response.data } });
                        } else if (response.status == config.CODES.statusOk) {
                            var mainAmount = response.data;
                            console.log(mainAmount)
                            trailer[0].price = (mainAmount * days).toFixed(2);
                            res.status(200).json({ status: config.CODES.statusOk, data: trailer });
                        }
                    });
                } else if ((days >= 1) || (days <= 2)) {
                    getPriceRange(trailer[0].type_id, trailer[0].size_id, 1, function(response) {
                        if (response.status == config.CODES.statusFail) {
                            res.status(200).json({ status: config.CODES.statusFail, error: { error_message: response.data } });
                        } else if (response.status == config.CODES.statusOk) {
                            var mainAmount = response.data;
                            trailer[0].price = (mainAmount * days).toFixed(2);
                            res.status(200).json({ status: config.CODES.statusOk, data: trailer });
                        }
                    });
                }
            }
        })
    } else {
        res.status(500).json({ status: config.CODES.statusFail, error: { error_message: 'Query id is missing' } });
    }
}

/* @function : updateTrailer
 *  @method  : POST
 *  @purpose  : This function used for update trailer data as per id from DB
 */
exports.updateTrailer = function(req, res) {
    var form = new formidable.IncomingForm();
    form.parse(req);
    var dataFields = {};
    var imgName;
    var filePath = '';
    form.on('fileBegin', function(name, file) {
        if (file.name.length > 0) {
            var name = file.name.split('.');
            imgName = name[0].replace(" ", "_") + '_' + new Date().getTime() + '.' + name.pop();
            file.path = req.app.locals.base_path + '/public/admin/images/trailers/' + imgName;
            filePath = file.path;
        }
    });
    form.on('field', function(field, value) {
        dataFields[field] = value;
    });
    form.on('end', function() {
        var query = 'SELECT tr.id, tr.status AS trailer_status, bt.status AS booked_status FROM trailers AS tr LEFT JOIN booked_trailers AS bt ON bt.trailer_id = tr.id WHERE tr.id="' + dataFields.trailer_id + '" AND (bt.status=0 OR bt.status=1 OR bt.status=4 OR bt.status=6)';
        Connection.query(query, function(err, trailer) {
            if (err) {
                if (filePath.length > 0) {
                    var unlnkPathThumb = req.app.locals.base_path + '/public/admin/images/trailers/' + imgName;
                    fs.unlink(unlnkPathThumb, function(err) {});
                }
                res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
            } else if (trailer.length > 0) {
                if (filePath.length > 0) {
                    var unlnkPathThumb = req.app.locals.base_path + '/public/admin/images/trailers/' + imgName;
                    fs.unlink(unlnkPathThumb, function(err) {});
                }
                res.status(200).json({ status: config.CODES.statusOk, message: config.MESSAGES.alredyBookedAndUpdate });
            } else {
                async.waterfall([
                        function(callback) {
                            Connection.query('SELECT tr.id, tr.image FROM `trailers` AS tr WHERE tr.id = "' + dataFields.trailer_id + '"', function(err, result) {
                                if (err) {
                                    callback(config.MESSAGES.DBErr);
                                } else {
                                    callback(null, result[0]);
                                }
                            })
                        },
                        function(arg1, callback) {
                            if (filePath.length > 0) {
                                im.resize({
                                    srcPath: filePath,
                                    dstPath: 'public/admin/images/trailers/thumb/' + imgName,
                                    width: 256,
                                    height: 228,
                                    strip: true,
                                    progressive: false,
                                    quality: 0.8
                                }, function(err, stdout, stderr) {
                                    if (err) {
                                        res.status(500).json({ status: config.CODES.statusFail, error: { error_message: "Image Upload error" } });
                                    } else {
                                        var imgUrl = config.fullhost + '/admin/images/trailers/thumb/' + imgName;
                                        localCodeUpdateTrailer(imgName, imgUrl, dataFields, filePath, arg1, req, function(response) {
                                            if (response.code == config.CODES.OK) {
                                                callback(null, response.data);
                                            } else if (response.code == config.CODES.Error) {
                                                callback('Verification email send error');
                                            }
                                        });
                                    }
                                });
                            } else {
                                imgName = arg1.image;
                                imgUrl = config.fullhost + '/admin/images/trailers/thumb/' + arg1.image;
                                localCodeUpdateTrailer(imgName, imgUrl, dataFields, filePath, null, req, function(response) {
                                    if (response.code == config.CODES.OK) {
                                        callback(null, response.data);
                                    } else if (response.code == config.CODES.Error) {
                                        callback('Verification email send error');
                                    }
                                });
                            }
                        }
                    ],
                    function(err, results) {
                        if (err) {
                            res.status(500).json({ status: 0, error: { error_message: config.MESSAGES.DBErr } });
                        } else {
                            res.status(200).json({ status: 1, is_bank: 1, message: "Trailer successfully updated" });
                        }
                    });
            }
        });
    });
}

function localCodeUpdateTrailer(imgName, imgUrl, dataFields, filePath, arg1, req, callback) {
    var query = 'UPDATE trailers SET trailer_default_id = "' +
        dataFields.trailer_default_id +
        '", user_id= "' + dataFields.user_id +
        '", size_id= "' + dataFields.size_id +
        '", status= "' + dataFields.status +
        '", trailer_registration_number= "' + dataFields.trailer_registration_number +
        '", trailer_registration_expiry= "' + dataFields.trailer_registration_expiry +
        '", trailer_location= "' + dataFields.trailer_location +
        '", state= "' + dataFields.state +
        '", latitude= "' + dataFields.lat +
        '", longitude= "' + dataFields.lng +
        '", trailer_desc= "' + dataFields.trailer_desc +
        '", color= "' + dataFields.color +
        '", insured_value= "' + dataFields.insured_value +
        '", image = "' + imgName +
        '", image_url= "' + imgUrl +
        '", modified= "' + dataFields.modified +
        '" WHERE id="' + dataFields.trailer_id + '"';
    Connection.query(query, function(err, trailer) {
        if (err) {
            return callback({ code: 500, data: config.MESSAGES.DBErr })
        } else if (trailer.affectedRows == 0) {
            return callback({ code: 500, data: 'Trailer id does not exists' })
        } else {
            if (filePath.length > 0) {
                var unlnkPathUser = req.app.locals.base_path + '/public/admin/images/trailers/' + arg1.image;
                var unlnkPathThumb = req.app.locals.base_path + '/public/admin/images/trailers/thumb/' + arg1.image;
                fs.unlink(unlnkPathUser, function(err) {});
                fs.unlink(unlnkPathThumb, function(err) {});
            }
            callback({ code: 200, data: 'Trailer successfully updated' });
        }
    })
}

/* @function : selectedTrailer
 *  @method  : POST
 *  @purpose  : This function used for get all trailer list as per given data
 */
exports.selectedTrailer = function(req, res) {
    var reqBody = req.body;
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth() + 1; //January is 0!
    var yyyy = today.getFullYear();
    if (dd < 10) {
        dd = '0' + dd
    }
    if (mm < 10) {
        mm = '0' + mm
    }
    today = yyyy + '-' + mm + '-' + dd;
    if ((reqBody.from_date >= today) && (reqBody.to_date >= today)) {
        if (reqBody.size_id == 1) {
            //query = "SELECT DISTINCT trailers.id AS trailer_id, trailers.is_delete, trailers.status, trailers.latitude, trailers.longitude ,trailers.trailer_default_id, trailers.size_id, trailers.date_schedule_from, trailers.date_schedule_to, (3959 * acos (cos ( radians(" + req.body.lat + ") )* cos( radians( trailers.lat ) )* cos( radians( trailers.longitude ) - radians(" + req.body.lng + ") ) + sin ( radians(" + req.body.lat + ") )* sin( radians( trailers.lat ) ))) AS distance, btr.trailer_id as btr_trailer_id FROM trailers LEFT JOIN booked_trailers btr ON btr.trailer_id = trailers.id WHERE (btr.trailer_id IS NULL OR btr.status=2 OR btr.status=3 OR btr.status=5) HAVING distance < 10 AND trailers.trailer_default_id = " + req.body.trailer_default_id + " AND trailers.status='available' AND trailers.is_delete=0 AND (Date(trailers.date_schedule_from) <= '" + req.body.from_date + "' AND Date(trailers.date_schedule_to) >= '" + req.body.to_date + "') ORDER BY distance"
            //query = "SELECT DISTINCT trailers.id AS trailer_id, trailers.is_delete, trailers.status, trailers.latitude AS lat, trailers.longitude AS lng,trailers.trailer_default_id, trailers.size_id, (3959 * acos (cos ( radians(" + req.body.lat + ") )* cos( radians( trailers.latitude ) )* cos( radians( trailers.longitude ) - radians(" + req.body.lng + ") ) + sin ( radians(" + req.body.lat + ") )* sin( radians( trailers.latitude ) ))) AS distance, btr.trailer_id as btr_trailer_id FROM trailers LEFT JOIN booked_trailers btr ON btr.trailer_id = trailers.id WHERE (btr.trailer_id IS NULL OR btr.status=0 OR btr.status=2 OR btr.status=3 OR btr.status=5) HAVING distance < 10 AND trailers.trailer_default_id = " + req.body.trailer_default_id + " AND trailers.status='available' AND trailers.is_delete=0 ORDER BY distance"
            query = "SELECT DISTINCT trailers.id AS trailer_id, trailers.user_id,trailers.is_delete, trailers.status, trailers.latitude AS lat, trailers.longitude AS lng,trailers.trailer_default_id, trailers.size_id, (3959 * acos (cos ( radians(" + reqBody.lat + ") )* cos( radians( trailers.latitude ) )* cos( radians( trailers.longitude ) - radians(" + reqBody.lng + ") ) + sin ( radians(" + reqBody.lat + ") )* sin( radians( trailers.latitude ) ))) AS distance FROM trailers LEFT OUTER JOIN users AS usr ON usr.id = trailers.user_id WHERE usr.balance = 0 AND trailers.id NOT IN(SELECT trailer_id from booked_trailers where (from_date BETWEEN '" + reqBody.from_date + "' and '" + reqBody.to_date + "' OR to_date BETWEEN '" + reqBody.from_date + "' and '" + reqBody.to_date + "') and status = 1) HAVING distance < 10 AND trailers.trailer_default_id = " + reqBody.trailer_default_id + " AND trailers.status='available' AND trailers.is_delete=0 AND trailers.user_id !=" + reqBody.user_id + " ORDER BY distance"
        } else {
            query = "SELECT DISTINCT trailers.id AS trailer_id, trailers.user_id,trailers.is_delete, trailers.status, trailers.latitude AS lat, trailers.longitude AS lng,trailers.trailer_default_id, trailers.size_id, (3959 * acos (cos ( radians(" + reqBody.lat + ") )* cos( radians( trailers.latitude ) )* cos( radians( trailers.longitude ) - radians(" + reqBody.lng + ") ) + sin ( radians(" + reqBody.lat + ") )* sin( radians( trailers.latitude ) ))) AS distance FROM trailers LEFT OUTER JOIN users AS usr ON usr.id = trailers.user_id WHERE usr.balance = 0 AND trailers.id NOT IN(SELECT trailer_id from booked_trailers where (from_date BETWEEN '" + reqBody.from_date + "' and '" + reqBody.to_date + "' OR to_date BETWEEN '" + reqBody.from_date + "' and '" + reqBody.to_date + "') and status = 1) HAVING distance < 10 AND trailers.trailer_default_id = " + reqBody.trailer_default_id + " AND trailers.status='available' AND trailers.size_id = " + reqBody.size_id + " AND  trailers.is_delete=0 AND trailers.user_id !=" + reqBody.user_id + " ORDER BY distance"
            //query = "SELECT DISTINCT trailers.id AS trailer_id, trailers.is_delete, trailers.status, trailers.lat, trailers.longitude ,trailers.trailer_default_id, trailers.size_id, trailers.date_schedule_from, trailers.date_schedule_to, (3959 * acos (cos ( radians(" + req.body.lat + ") )* cos( radians( trailers.lat ) )* cos( radians( trailers.longitude ) - radians(" + req.body.lng + ") ) + sin ( radians(" + req.body.lat + ") )* sin( radians( trailers.lat ) ))) AS distance, btr.trailer_id as btr_trailer_id FROM trailers LEFT JOIN booked_trailers btr ON btr.trailer_id = trailers.id WHERE (btr.trailer_id IS NULL OR btr.status=2 OR btr.status=3 OR btr.status=5) HAVING distance < 10 AND trailers.trailer_default_id = " + req.body.trailer_default_id + " AND trailers.size_id = " + req.body.size_id + " AND trailers.status='available' AND trailers.is_delete=0 AND (Date(trailers.date_schedule_from) <= '" + req.body.from_date + "' AND Date(trailers.date_schedule_to) >= '" + req.body.to_date + "') ORDER BY distance"
            //query = "SELECT DISTINCT trailers.id AS trailer_id, trailers.is_delete, trailers.status, trailers.latitude AS lat, trailers.longitude AS lng,trailers.trailer_default_id, trailers.size_id, (3959 * acos (cos ( radians(" + req.body.lat + ") )* cos( radians( trailers.latitude ) )* cos( radians( trailers.longitude ) - radians(" + req.body.lng + ") ) + sin ( radians(" + req.body.lat + ") )* sin( radians( trailers.latitude ) ))) AS distance, btr.trailer_id as btr_trailer_id FROM trailers LEFT JOIN booked_trailers btr ON btr.trailer_id = trailers.id WHERE (btr.trailer_id IS NULL OR btr.status=0 OR btr.status=2 OR btr.status=3 OR btr.status=5) HAVING distance < 10 AND trailers.trailer_default_id = " + req.body.trailer_default_id + " AND trailers.size_id = " + req.body.size_id + " AND trailers.status='available' AND trailers.is_delete=0 ORDER BY distance"
        }
            
            //query = "SELECT id AS trailer_id, status, lat, lng ,trailer_default_id, size_id, date_schedule_from, date_schedule_to, (3959 * acos (cos ( radians(" + req.body.lat + ") )* cos( radians( lat ) )* cos( radians( lng ) - radians(" + req.body.lng + ") ) + sin ( radians(" + req.body.lat + ") )* sin( radians( lat ) ))) AS distance FROM trailers HAVING distance < 10 AND trailer_default_id = " + req.body.trailer_default_id + " AND size_id = " + req.body.size_id + " AND status='available' AND date_schedule_from >= '" + req.body.from_date + "' AND date_schedule_to >= '" + req.body.to_date + "' ORDER BY distance"
            //query = "SELECT id AS trailer_id, lat, l ng ,trailer_default_id, size_id, date_schedule_from, date_schedule_to, (3959 * acos (cos ( radians(" + req.body.lat + ") )* cos( radians( lat ) )* cos( radians( lng ) - radians(" + req.body.lng + ") ) + sin ( radians(" + req.body.lat + ") )* sin( radians( lat ) )))   AS distance FROM trailers HAVING distance < 10 AND trailer_default_id = " + req.body.trailer_default_id + " AND size_id = " + req.body.size_id + " AND date_schedule_from >= '" + req.body.from_date + "' AND date_schedule_to >= '" + req.body.to_date + "' ORDER BY distance";
            //query = "SELECT id AS trailer_id, lat, lng ,trailer_default_id, size_id, date_schedule_from, date_schedule_to, (3959 * acos (cos ( radians(" + req.body.lat + ") )* cos( radians( lat ) )* cos( radians( lng ) - radians(" + req.body.lng + ") ) + sin ( radians(" + req.body.lat + ") )* sin( radians( lat ) )))   AS distance FROM trailers HAVING distance < 10 AND trailer_default_id = " + req.body.trailer_default_id + " AND size_id = " + req.body.size_id + " AND date_schedule_from <= '" + req.body.from_date + "' OR date_schedule_to >= '" + req.body.to_date + "' ORDER BY distance";

        console.log(query);
        Connection.query(query, function(err, trailer) {
            if (err) {
                res.status(200).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
            } else {
                res.status(200).json({ status: config.CODES.statusOk, data: trailer });
            }
        })
    } else {
        res.status(200).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.InvalidDate } });
    }
}

/* @function : loadTrailers
 *  @method  : GET
 *  @purpose  : This function used for get all trailer list
 */
exports.loadTrailers = function(req, res) {
    var query = 'SELECT trailers.id AS trailer_id,trailers.trailer_default_id,CONCAT(UCASE(LEFT(trailers.status, 1)),LCASE(SUBSTRING(trailers.status, 2))) AS status,trailers.trailer_registration_number, trailers.state,trailers.latitude AS lat,trailers.longitude AS lng, trailers.trailer_registration_expiry, trailers.trailer_location, trailers.trailer_desc,trailers.color,trailers.insured_value, trailers.created, CONCAT(users.first_name," ",users.last_name) AS owner, sizes.label AS size, ty.name AS type, dt.image_url AS image, @curRow := @curRow + 1 AS row_number FROM trailers LEFT JOIN users ON trailers.user_id = users.id LEFT JOIN default_trailers AS dt ON trailers.trailer_default_id = dt.id LEFT JOIN types AS ty ON dt.type_id = ty.id LEFT JOIN sizes ON trailers.size_id = sizes.id JOIN (SELECT @curRow := 0) r WHERE trailers.is_delete = 0';
    Connection.query(query, function(err, trailer) {
        if (err) {
            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
        } else {
            res.status(200).json({ status: config.CODES.statusOk, data: trailer });
        }
    })
}

/* @function : loadTrailersByUser
 *  @method  : GET
 *  @purpose  : This function used for get all trailer list as per userID
 */
exports.loadTrailersByUser = function(req, res) {
    if (req.body.user_id) {
        var query = 'SELECT DISTINCT trailers.id AS trailer_id, trailers.created,trailers.trailer_default_id,trailers.status,trailers.trailer_registration_number,trailers.state, trailers.latitude AS lat,trailers.longitude AS lng, trailers.trailer_registration_expiry, trailers.trailer_location, trailers.trailer_desc, trailers.color,trailers.insured_value, trailers.created, CONCAT(users.first_name," ",users.last_name) AS owner, CONCAT(usr.first_name," ",usr.last_name) AS renter,usr.mobile AS renter_mob, sizes.id AS size_id, sizes.label AS size, ty.name AS type, trailers.image_url AS image, bt.to_date, bt.status AS booking_status FROM trailers LEFT JOIN users ON trailers.user_id = users.id LEFT JOIN default_trailers AS dt ON trailers.trailer_default_id = dt.id LEFT JOIN types AS ty ON dt.type_id = ty.id LEFT JOIN sizes ON trailers.size_id = sizes.id LEFT JOIN booked_trailers AS bt ON bt.trailer_id = trailers.id AND (bt.status=0 OR bt.status=1 OR bt.status=4 OR bt.status=6) LEFT JOIN users AS usr ON bt.renter_id = usr.id where is_delete = 0 AND user_id="' + req.body.user_id + '" ORDER BY created DESC';
        console.log(query);
        Connection.query(query, function(err, trailer) {
            // console.log(trailer);
            if (err) {
                res.status(200).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
            } else {
                res.status(200).json({ status: config.CODES.statusOk, data: trailer });
            }
        })
    } else {
        res.status(200).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.InvalidParameter } });
    }
}

/* @function : checkTypeExists
 *  @method  : GET
 *  @purpose  : This function used for check trailer type is already exists or not
 */
exports.checkTypeExists = function(req, res) {
    var query = 'SELECT id FROM default_trailers where type_id="' + req.body.type_id + '"';
    Connection.query(query, function(err, trailer) {
        if (err) {
            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
        } else if (trailer.length > 0) {
            res.status(200).json({ status: config.CODES.statusFail, data: trailer, message: 'Already Taken' });
        } else {
            res.status(200).json({ status: config.CODES.statusOk, message: 'Not available' });
        }
    })
}

exports.DeleteTrailer = function(req, res) {
    var query = 'SELECT * FROM booked_trailers WHERE trailer_id="' + req.body.trailer_id + '" AND status =0';
    Connection.query(query, function(err, trailer) {
        if (err) {
            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
        } else if (trailer.length > 0) {
            res.status(200).json({ status: config.CODES.statusOk, message: config.MESSAGES.alredyBookedAndDelete });
        } else {
            Connection.query('UPDATE trailers SET is_delete=1 WHERE id="' + req.body.trailer_id + '"', function(err, trailer) {
                if (err) {
                    res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
                } else if (trailer.affectedRows == 1) {
                    res.status(200).json({ status: config.CODES.statusOk, message: 'Trailer deleted successfully' });
                } else {
                    res.status(200).json({ status: config.CODES.statusFail, message: config.MESSAGES.InvalidParameter });
                }
            })
        }
    })
}

exports.getTrailerByLatlng = function(req, res) {
    if (req.body.lat && req.body.lng) {
        query = "SELECT id, latitude AS lat, longitude AS lng, is_delete, (3959 * acos (cos ( radians(" + req.body.lat + ") )* cos( radians( latitude ) )* cos( radians( longitude ) - radians(" + req.body.lng + ") ) + sin ( radians(" + req.body.lat + ") )* sin( radians( latitude ) )))   AS distance FROM trailers HAVING distance < 10 AND is_delete = 0 ORDER BY distance";
        console.log(query);
        Connection.query(query, function(err, trailer) {
            if (err) {
                res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
            } else {
                res.status(200).json({ status: config.CODES.statusOk, data: trailer });
            }
        })
    } else {
        res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.InvalidParameter } });
    }
}

function checkUniqueTrailer(date1, date2) {
    // The number of milliseconds in one day
    var ONE_DAY = 1000 * 60 * 60 * 24;
    // Convert both dates to milliseconds
    var date1_ms = date1.getTime();
    var date2_ms = date2.getTime();
    // Calculate the difference in milliseconds
    var difference_ms = Math.abs(date1_ms - date2_ms);
    // Convert back to days and return
    return Math.round(difference_ms / ONE_DAY)
}

function getPriceRange(type, size, duration, callback) {
    query = 'SELECT price from daily_rates where trailer_type="' + type + '" AND trailer_size="' + size + '" AND duration="' + duration + '"';
    console.log(query)
    Connection.query(query, function(err, calci) {
        if (err) {
            return callback({ status: config.CODES.statusFail, data: err })
        } else if (calci.length > 0) {
            return callback({ status: config.CODES.statusOk, data: calci[0].price })
        } else {
            return callback({ status: config.CODES.statusFail, data: "No Price found as per trailer type and trailer size" })
        }
    });
}
exports.getPriceRange = getPriceRange;
