var Connection = require('../../config/database.js');
var config = require('../../config/config.js');
var mails = require('../controllers/send_mail.js'); // included controller for sending mails
var Payment = require('../controllers/payment.js'); // included controller for payment
var async = require('async');
var request = require('request');
var CryptoJS = require("crypto-js");
var fs = require('fs');
var pdf = require('html-pdf');
var apiKey = config.SECUREDSIGNINGAPIKEY; // API key
var apiSecretKey = config.SECUREDSIGNINGAPISECRETKEY; // API secret key

/* @function : bookTrailer
 *  @method  : POST
 *  @purpose  : This function used for book trailer as per trailer_id and user_id
 */
exports.bookTrailer = function(req, res) {
    var bodyData = req.body;
    var discount = 1;
    console.log(bodyData);
    async.waterfall([
            function(callback) {
                console.log('11111111');
                Connection.query('SELECT is_dispute,licence_number,otp_verified,licence_state,address FROM users WHERE id="' + bodyData.renter_id + '"', function(err, user) {
                    var udataaddress = user[0].address;
                    var udatastate = user[0].licence_state;
                    if (err) {
                        callback({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
                    } else if ((user.length > 0) && (user[0].is_dispute == 1)) {
                        callback({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.raiseDispute } });
                    } else if ((user.length > 0) && (user[0].otp_verified == 0)) {
                        callback({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.mobileVerifyBeforeBook } });
                    } else if ((user.length > 0) && (user[0].licence_number == 0 || udatastate.length == 0 || udataaddress.length == 0)) {
                        callback({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.completeProfileBeforeBook } });
                    } else if ((user.length > 0) && (user[0].is_dispute == 0)) {
                        callback(null, 1);
                    }
                });
            },
            function(arg5, callback) {
                console.log('555555555');
                Connection.query('SELECT id, status FROM `trailers` WHERE id=' + bodyData.trailer_id, function(err, userAvl) {
                    if (err) {
                        callback({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
                    } else if ((userAvl.length > 0) && (userAvl[0].status == 'UnAvailable')) {
                        callback({ status: config.CODES.statusFail, error: { error_message: 'Trailer is not available for booking' } });
                    } else {
                        callback(null, 5);
                    }
                });
            },
            function(arg1, callback) {
                console.log('22222222');
                var query = 'SELECT bt.id AS bookedID, bt.days FROM `booked_trailers` AS bt WHERE bt.trailer_id = "' + bodyData.trailer_id + '" AND(bt.status = 1 OR bt.status = 4)';
                Connection.query(query, function(err, trailer) {
                    if (err) {
                        callback({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
                    } else if (trailer.length > 0) {
                        callback({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.alredyBooked } });
                    } else {
                        callback(null, 2);
                    }
                });
            },
            function(arg1, callback) {
                console.log('33333333');
                var query = 'SELECT prom.id, prom.count, prom.status FROM promotions AS prom WHERE prom.user_id ="' + bodyData.renter_id + '" AND prom.count = 0 AND prom.status = 0';
                Connection.query(query, function(err, disData) {
                    if (err) {
                        callback({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
                    } else {
                        var query = 'SELECT accounts.customer_key AS is_card FROM accounts WHERE user_id ="' + bodyData.renter_id + '"';
                        Connection.query(query, function(err, trailer4) {
                            if (err) {
                                callback({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
                            } else if ((trailer4.length > 0) && trailer4[0].is_card == 0) {
                                callback({ status: config.CODES.statusOk, is_card: trailer4[0].is_card, message: config.MESSAGES.notCardAddedd });
                            } else {
                                var customerKey = trailer4[0].is_card;
                                callback(null, customerKey, disData);
                            }
                        });
                    }
                });
            },
            function(arg1, arg2, callback) {
                console.log('44444444444');
                Connection.query('SELECT ty.id AS typeId, ty.name AS trailer_type, sz.id AS sizeId, sz.label AS size, DATE_FORMAT(tr.trailer_registration_expiry,"%Y-%m-%d") AS trailer_registration_expiry, tr.trailer_registration_number, tr.trailer_location, tr.image_url, tr.image FROM trailers AS tr LEFT JOIN default_trailers AS dt ON dt.id = tr.trailer_default_id LEFT JOIN types AS ty ON dt.type_id = ty.id LEFT JOIN sizes AS sz ON tr.size_id = sz.id WHERE tr.id = "' + bodyData.trailer_id + '"', function(err, tr) {
                    if (err) {
                        callback({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
                    } else {
                        var days = days_between(new Date(bodyData.from_date), new Date(bodyData.to_date));
                        console.log(days)
                        callback(null, { customerKey: arg1, disData: arg2, days: days, tr: tr });
                    }
                });
            }
        ],
        function(err, results) {
            console.log('55555555555');
            if (err) {
                console.log('err', err)
                res.status(200).json(err);
            } else {
                console.log('results', results);
                console.log('bodyData', bodyData);
                var days = results.days;
                var customerKey = results.customerKey;
                var disData = results.disData;
                var tr = results.tr;
                if (days >= 7) {
                    getPriceRange(tr[0].typeId, tr[0].sizeId, 3, function(response) {
                        if (response.status == config.CODES.statusFail) {
                            res.status(200).json({ status: config.CODES.statusFail, error: { error_message: response.data } });
                        } else if (response.status == config.CODES.statusOk) {
                            var mainAmount = response.data;
                            if (disData.length > 0) {
                                var calculated_price = mainAmount * days;
                                var getDiscount = (calculated_price * 5) / 100;
                                var discountedPrice = (calculated_price - getDiscount);
                                var ccard_fee = (discountedPrice * 1.5) / 100;
                                var bal = parseInt(((discountedPrice + ccard_fee) * 100));
                                loadCodeForBoooking(tr, bodyData, bal, customerKey, disData, 1, calculated_price, ccard_fee, req, res);
                            } else {
                                var price = mainAmount * days;
                                var ccard_fee = (price * 1.5) / 100;
                                var bal = parseInt(((price + ccard_fee) * 100));
                                loadCodeForBoooking(tr, bodyData, bal, customerKey, disData, 0, price, ccard_fee, req, res);
                            }
                        }
                    });
                } else if ((days >= 3) && (days <= 6)) {
                    getPriceRange(tr[0].typeId, tr[0].sizeId, 2, function(response) {
                        if (response.status == config.CODES.statusFail) {
                            res.status(200).json({ status: config.CODES.statusFail, error: { error_message: response.data } });
                        } else if (response.status == config.CODES.statusOk) {
                            var mainAmount = response.data;
                            if (disData.length > 0) {
                                var calculated_price = mainAmount * days;
                                var getDiscount = (calculated_price * 5) / 100;
                                var discountedPrice = (calculated_price - getDiscount);
                                var ccard_fee = (discountedPrice * 1.5) / 100;
                                var bal = parseInt(((discountedPrice + ccard_fee) * 100));
                                loadCodeForBoooking(tr, bodyData, bal, customerKey, disData, 1, calculated_price, ccard_fee, req, res);
                            } else {
                                var price = mainAmount * days;
                                var ccard_fee = (price * 1.5) / 100;
                                var bal = parseInt(((price + ccard_fee) * 100));
                                loadCodeForBoooking(tr, bodyData, bal, customerKey, disData, 0, price, ccard_fee, req, res);
                            }
                        }
                    });
                } else if ((days >= 1) || (days <= 2)) {
                    getPriceRange(tr[0].typeId, tr[0].sizeId, 1, function(response) {
                        if (response.status == config.CODES.statusFail) {
                            res.status(200).json({ status: config.CODES.statusFail, error: { error_message: response.data } });
                        } else if (response.status == config.CODES.statusOk) {
                            var mainAmount = response.data; // Number(response.data)
                            console.log("mainAmount", mainAmount)
                            if (disData.length > 0) {
                                var calculated_price = mainAmount * days;
                                var getDiscount = (calculated_price * 5) / 100;
                                var discountedPrice = (calculated_price - getDiscount);
                                var ccard_fee = (discountedPrice * 1.5) / 100;
                                var bal = parseInt(((discountedPrice + ccard_fee) * 100));
                                console.log("calculated_price", calculated_price)
                                console.log("getDiscount", getDiscount)
                                console.log("discountedPrice", discountedPrice)
                                console.log("ccard_fee", ccard_fee)
                                console.log("bal", bal)
                                loadCodeForBoooking(tr, bodyData, bal, customerKey, disData, 1, calculated_price, ccard_fee, req, res);
                            } else {
                                console.log('++++++++++++++++')
                                var price = mainAmount * days;
                                var ccard_fee = (price * 1.5) / 100;
                                var bal = parseInt(((price + ccard_fee) * 100));
                                console.log("price", price)
                                console.log("ccard_fee", ccard_fee)
                                console.log("bal", bal)
                                loadCodeForBoooking(tr, bodyData, bal, customerKey, disData, 0, price, ccard_fee, req, res);
                            }
                        }
                    });
                }
            }
        });
}

/* @function : getAllbookTrailerList
 *  @method  : GET
 *  @purpose  : This function used get all trailer booking list
 */
exports.getAllbookTrailerList = function(req, res) {
    //query = 'SELECT booked_trailers.*, CONCAT(usr1.first_name," ",usr1.last_name) AS renter, CONCAT(usr.first_name, " ", usr.last_name) AS owner, ty.name AS trailer_type FROM `booked_trailers` LEFT JOIN users AS usr1 ON usr1.id = booked_trailers.user_id LEFT JOIN trailers AS tr ON tr.id = booked_trailers.trailer_id LEFT JOIN default_trailers AS dt ON dt.id = tr.trailer_default_id LEFT JOIN types AS ty ON dt.type_id = ty.id LEFT JOIN users AS usr ON tr.user_id = usr.id '
    //query = 'SELECT booked_trailers.id AS booking_id, booked_trailers.trailer_id,ty.name AS trailer_type, booked_trailers.owner_id, CONCAT(usr1.first_name," ",usr1.last_name) AS owner,booked_trailers.renter_id, CONCAT(usr.first_name," ",usr.last_name) AS renter, booked_trailers.status, booked_trailers.cancel_by, booked_trailers.created, dt.image FROM `booked_trailers` LEFT JOIN users AS usr1 ON booked_trailers.owner_id = usr1.id LEFT JOIN trailers AS tr ON tr.id = booked_trailers.trailer_id LEFT JOIN default_trailers AS dt ON dt.id = tr.trailer_default_id LEFT JOIN types AS ty ON dt.type_id = ty.id LEFT JOIN users AS usr ON booked_trailers.renter_id = usr.id'
    query = 'SELECT booked_trailers.id AS booking_id, booked_trailers.trailer_id, booked_trailers.trailer_type, booked_trailers.owner_id, CONCAT(usr1.first_name," ",usr1.last_name) AS owner, booked_trailers.renter_id, CONCAT(usr.first_name," ",usr.last_name) AS renter, booked_trailers.status, booked_trailers.cancel_by, booked_trailers.created, IFNULL(tr.image, "") AS image FROM `booked_trailers` LEFT JOIN users AS usr1 ON booked_trailers.owner_id = usr1.id LEFT JOIN trailers AS tr ON tr.id = booked_trailers.trailer_id LEFT JOIN default_trailers AS dt ON dt.id = tr.trailer_default_id LEFT JOIN users AS usr ON booked_trailers.renter_id = usr.id ORDER BY booked_trailers.id DESC'
    Connection.query(query, function(err, bookTrailer) {
        if (err) {
            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
        } else {
            res.status(200).json({ status: config.CODES.statusOk, data: bookTrailer });
        }
    });
}

/* @function : getBookListByRenter
 *  @method  : GET
 *  @purpose  : This function used get all rentered trailer booking list respective user_id
 */
exports.getBookListByRenter = function(req, res) {
    if (req.body.user_id) {
        //query = 'SELECT booked_trailers.*, CONCAT(usr1.first_name," ",usr1.last_name) AS renter, CONCAT(usr.first_name," ",usr.last_name) AS owner, ty.name AS trailer_type , sz.label AS size, tr.date_schedule_from, tr.date_schedule_to, tr.trailer_registration_expiry, tr.trailer_registration_number, dt.image_url FROM booked_trailers LEFT JOIN users AS usr1 ON usr1.id = booked_trailers.user_id LEFT JOIN trailers AS tr ON tr.id = booked_trailers.trailer_id LEFT JOIN default_trailers AS dt ON dt.id = tr.trailer_default_id LEFT JOIN types AS ty ON dt.type_id = ty.id LEFT JOIN sizes AS sz ON tr.size_id = sz.id LEFT JOIN users AS usr ON tr.user_id = usr.id WHERE booked_trailers.user_id = "' + req.body.user_id + '"'
        //query = 'SELECT booked_trailers.id AS booking_id, booked_trailers.status,booked_trailers.to_date,booked_trailers.from_date, booked_trailers.cancel_by, booked_trailers.renter_id, CONCAT(usr1.first_name," ",usr1.last_name) AS renter, booked_trailers.owner_id, CONCAT(usr.first_name," ",usr.last_name) AS owner, usr.mobile AS owner_mobile, booked_trailers.trailer_id, ty.name AS trailer_type, sz.label AS size, tr.date_schedule_from, tr.date_schedule_to, tr.trailer_registration_expiry, tr.trailer_registration_number, tr.trailer_location, dt.image_url FROM booked_trailers LEFT JOIN users AS usr1 ON usr1.id = booked_trailers.renter_id LEFT JOIN users AS usr ON usr.id = booked_trailers.owner_id LEFT JOIN trailers AS tr ON tr.id = booked_trailers.trailer_id LEFT JOIN default_trailers AS dt ON dt.id = tr.trailer_default_id LEFT JOIN types AS ty ON dt.type_id = ty.id LEFT JOIN sizes AS sz ON tr.size_id = sz.id WHERE booked_trailers.renter_id ="' + req.body.user_id + '"'
        query = 'SELECT booked_trailers.id AS booking_id, booked_trailers.status, booked_trailers.extend_date, booked_trailers.prev_status, booked_trailers.created, DATE_FORMAT(booked_trailers.to_date,"%Y-%m-%d") AS to_date, DATE_FORMAT(booked_trailers.from_date,"%Y-%m-%d") AS from_date, booked_trailers.cancel_by, booked_trailers.renter_id, CONCAT(usr1.first_name," ",usr1.last_name) AS renter, booked_trailers.owner_id, CONCAT(usr.first_name," ",usr.last_name) AS owner, usr.email AS owner_email, usr.mobile AS owner_mobile, booked_trailers.trailer_id, booked_trailers.trailer_type, sz.label AS size,booked_trailers.trailer_registration_expiry, booked_trailers.trailer_registration_number, booked_trailers.image_url, booked_trailers.trailer_location FROM booked_trailers LEFT JOIN users AS usr1 ON usr1.id = booked_trailers.renter_id LEFT JOIN users AS usr ON usr.id = booked_trailers.owner_id LEFT JOIN sizes AS sz ON sz.id = booked_trailers.size_id WHERE booked_trailers.renter_id ="' + req.body.user_id + '" ORDER BY booked_trailers.created DESC';
        console.log(query)
        Connection.query(query, function(err, bookTrailer) {
            if (err) {
                res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
            } else {
                res.status(200).json({ status: config.CODES.statusOk, data: bookTrailer });
            }
        });
    } else {
        res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.InvalidParameter } });
    }
}

/* @function : getBookListByOwner
 *  @method  : GET
 *  @purpose  : This function used get all owner trailer booking list respective user_id
 */
exports.getBookListByOwner = function(req, res) {
    if (req.body.user_id) {
        //query = 'SELECT booked_trailers.*, CONCAT(usr1.first_name," ",usr1.last_name) AS renter, CONCAT(usr.first_name," ",usr.last_name) AS owner, ty.name AS trailer_type , sz.label AS size, tr.date_schedule_from, tr.date_schedule_to, tr.trailer_registration_expiry, tr.trailer_registration_number, dt.image_url FROM booked_trailers LEFT JOIN users AS usr1 ON usr1.id = booked_trailers.user_id LEFT JOIN trailers AS tr ON tr.id = booked_trailers.trailer_id LEFT JOIN default_trailers AS dt ON dt.id = tr.trailer_default_id LEFT JOIN types AS ty ON dt.type_id = ty.id LEFT JOIN sizes AS sz ON tr.size_id = sz.id LEFT JOIN users AS usr ON tr.user_id = usr.id WHERE booked_trailers.user_id = "' + req.body.user_id + '"'
        //query = 'SELECT booked_trailers.id AS booking_id, booked_trailers.status, booked_trailers.to_date,booked_trailers.from_date, booked_trailers.cancel_by, booked_trailers.renter_id, CONCAT(usr1.first_name," ",usr1.last_name) AS renter, booked_trailers.owner_id, CONCAT(usr.first_name," ",usr.last_name) AS owner, booked_trailers.trailer_id, ty.name AS trailer_type, sz.label AS size, tr.date_schedule_from, tr.date_schedule_to, tr.trailer_registration_expiry, tr.trailer_registration_number, dt.image_url , AVG(usrt.rating) AS rating FROM booked_trailers LEFT JOIN users AS usr1 ON usr1.id = booked_trailers.renter_id LEFT JOIN users AS usr ON usr.id = booked_trailers.owner_id LEFT JOIN trailers AS tr ON tr.id = booked_trailers.trailer_id LEFT JOIN default_trailers AS dt ON dt.id = tr.trailer_default_id LEFT JOIN types AS ty ON dt.type_id = ty.id LEFT JOIN sizes AS sz ON tr.size_id = sz.id  LEFT JOIN user_ratings AS usrt ON usrt.user_id = booked_trailers.owner_id WHERE booked_trailers.owner_id ="' + req.body.user_id + '"'
        //var query = 'SELECT booked_trailers.id AS booking_id, booked_trailers.status, DATE_FORMAT(booked_trailers.to_date,"%Y-%m-%d") AS to_date,DATE_FORMAT(booked_trailers.from_date,"%Y-%m-%d") AS from_date, booked_trailers.cancel_by, booked_trailers.renter_id, CONCAT(usr1.first_name," ",usr1.last_name) AS renter, usr1.mobile AS renter_mobile, usr1.image_url AS profile_image, booked_trailers.owner_id, CONCAT(usr.first_name," ",usr.last_name) AS owner, booked_trailers.trailer_id, ty.name AS trailer_type, sz.label AS size, tr.date_schedule_from, tr.date_schedule_to, tr.trailer_registration_expiry, tr.trailer_registration_number, dt.image_url, AVG(ut.rating) AS rating, ut.comment FROM booked_trailers LEFT JOIN users AS usr1 ON usr1.id = booked_trailers.renter_id LEFT JOIN users AS usr ON usr.id = booked_trailers.owner_id LEFT JOIN trailers AS tr ON tr.id = booked_trailers.trailer_id LEFT JOIN default_trailers AS dt ON dt.id = tr.trailer_default_id LEFT JOIN types AS ty ON dt.type_id = ty.id LEFT JOIN sizes AS sz ON tr.size_id = sz.id LEFT OUTER JOIN user_ratings as ut ON booked_trailers.renter_id = ut.rater_id WHERE booked_trailers.owner_id ="' + req.body.user_id + '" GROUP BY booked_trailers.id'
        query = 'SELECT booked_trailers.id AS booking_id, booked_trailers.status, booked_trailers.extend_date, booked_trailers.prev_status, booked_trailers.created, DATE_FORMAT(booked_trailers.to_date,"%Y-%m-%d") AS to_date, DATE_FORMAT(booked_trailers.from_date,"%Y-%m-%d") AS from_date, booked_trailers.cancel_by, booked_trailers.renter_id, CONCAT(usr1.first_name," ",usr1.last_name) AS renter, usr1.mobile AS renter_mobile, usr1.image_url AS profile_image, booked_trailers.owner_id, CONCAT(usr.first_name," ",usr.last_name) AS owner,booked_trailers.trailer_id, booked_trailers.trailer_type, sz.label AS size, booked_trailers.trailer_registration_expiry, booked_trailers.trailer_registration_number, booked_trailers.image_url, AVG(ut.rating) AS rating, ut.comment FROM booked_trailers LEFT JOIN users AS usr1 ON usr1.id = booked_trailers.renter_id LEFT JOIN users AS usr ON usr.id = booked_trailers.owner_id LEFT JOIN sizes AS sz ON sz.id = booked_trailers.size_id LEFT OUTER JOIN user_ratings as ut ON booked_trailers.renter_id = ut.rater_id WHERE booked_trailers.owner_id ="' + req.body.user_id + '" GROUP BY booked_trailers.id ORDER BY booked_trailers.created DESC'
        console.log(query)
        Connection.query(query, function(err, bookTrailer) {
            if (err) {
                res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
            } else {
                res.status(200).json({ status: config.CODES.statusOk, data: bookTrailer });
            }
        });
    } else {
        res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.InvalidParameter } });
    }
}

/* @function : ownerAcceptBooking
 *  @method  : POST
 *  @purpose  : This function used update status in DB as per booking_id
 */
exports.ownerAcceptBooking = function(req, res) {
    var bodyData = req.body;
    console.log(bodyData);
    async.waterfall([
        function(callback) {
            console.log('11111111111111');
            var query = 'SELECT bt.id AS bookedID, bt.days FROM `booked_trailers` AS bt WHERE bt.trailer_id = (select trailer_id FROM booked_trailers AS bt WHERE bt.id = "' + bodyData.booking_id + '") AND(bt.status = 1 OR bt.status = 4)';
            console.log(query);
            Connection.query(query, function(err, trailer) {
                if (err) {
                    callback({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
                } else if (trailer.length > 0) {
                    callback({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.alredyBooked } });
                } else {
                    callback(null, 1);
                }
            });
        },
        function(arg1, callback) {
            console.log('22222222222');

            var query = 'SELECT id, recipient from accounts where user_id = "' + bodyData.user_id + '"';
            Connection.query(query, function(err, users) {
                if (err) {
                    callback({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
                } else if ((users.length > 0) && (users[0].recipient == 0)) {
                    callback({ status: config.CODES.statusOk, is_bank: 0, message: "Please add bank account before accept booking request" });
                } else {
                    callback(null, 1);
                }
            });
        },
        function(arg2, callback) {
            console.log('333333333333');

            query = 'SELECT * FROM `manage_charges` WHERE booking_id ="' + bodyData.booking_id + '"'
            Connection.query(query, function(err, result) {
                if (err) {
                    callback({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
                } else {
                    Payment.captureCharge(result[0].charge_key, function(response) {
                        if (response.status == config.CODES.statusFail) {
                            callback({ status: config.CODES.statusFail, error: { error_message: response.data } });
                        } else if (response.status == config.CODES.statusOk) {
                            callback(null, result, response);
                        }
                    });
                }
            });
        },
        function(result, response, callback) {
            console.log('444444444444444');

            query = 'UPDATE manage_charges SET manage_charges.status=1 WHERE manage_charges.id ="' + result[0].id + '"'
            Connection.query(query, function(err, bookTrailer) {});
            query = "INSERT INTO transactions (renter_id,owner_id,booking_id,manage_charge_id,amount,discription,response) VALUES ('" +
                result[0].renter_id + "'" + ',' + "'" +
                result[0].owner_id + "'" + ',' + "'" +
                bodyData.booking_id + "'" + ',' + "'" +
                result[0].id + "'" + ',' + "'" +
                (response.data.amount / 100) + "'" + ',"captured amount from renter and send to admin at the booking accepted by owner",' + "'" +
                JSON.stringify(response.data) +
                "')";
            Connection.query(query, function(err, transactions) {
                if (err) {
                    res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
                } else {
                    callback(null, 2);
                }
            });
        },
        function(arg3, callback) {
            console.log('55555555555555555');

            query = 'UPDATE booked_trailers, trailers SET booked_trailers.status=1, trailers.status="hired" WHERE booked_trailers.trailer_id=trailers.id AND booked_trailers.id = "' + bodyData.booking_id + '"'
            Connection.query(query, function(err, bookTrailer) {
                if (err) {
                    res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
                } else {
                    callback(null, 3);
                }
            });
        },
        function(arg1, callback) {
            console.log('6666666666666666');

            Connection.query('SELECT bt.renter_id, bt.owner_id, bt.trailer_id, bt.id, users.device_token, users.mobile, users.device_type, types.name, bc.count,sz.label, bc.id AS badgeId FROM `booked_trailers` AS bt LEFT JOIN users ON users.id = bt.renter_id LEFT JOIN badge_counts AS bc ON bc.user_id = bt.renter_id LEFT JOIN trailers AS tr on tr.id = bt.trailer_id LEFT JOIN default_trailers AS dt ON dt.id = tr.trailer_default_id LEFT JOIN sizes AS sz on sz.id = tr.size_id LEFT JOIN types ON types.id = dt.type_id WHERE bt.id ="' + bodyData.booking_id + '"', function(err, result) {
                //var msg = 'Your booking request for ' + result[0].name + ' has been accepted';
                var msg = 'Your booking request for an ' + result[0].name + '(' + result[0].label + ') trailer has been accepted.'
                var badge = result[0].count + 1;
                var badgeId = result[0].badgeId;
                var userMob = result[0].mobile;
                if (result[0].device_type == 'IOS') {
                    var deviceType = 'IOS';
                } else if (result[0].device_type == 'ANDROID') {
                    var deviceType = 'ANDROID';
                } else {
                    var deviceType = '';
                }
                query = 'INSERT INTO notifications (receiver_id, sender_id, notification_type, text, status, device_type) VALUES ("' +
                    result[0].renter_id + '"' + ',' + '"' +
                    result[0].owner_id + '"' + ',"accept booking request","' + msg + '",1, "' + deviceType + '")';
                Connection.query(query, function(err, bookTrailer) {
                    if (err) {
                        callback({ status: config.CODES.statusFail, error: { error_message: 'pushNotificationForIphone save error in DB' } });
                    } else {
                        callback(null, msg, result[0].device_token, badge, badgeId, deviceType, userMob);
                    }
                })
            })
        },
        function(arg1, arg2, arg3, arg4, arg5, arg6, callback) {
            console.log('77777777777777777');

            if (arg5 == 'IOS') {
                mails.pushNotificationForIphone(arg1, arg2, arg3, "accept booking request", function(data) {
                    if (data.status == 1) {
                        Connection.query('UPDATE badge_counts SET count="' + arg3 + '" WHERE id = "' + arg4 + '"', function(err, bookTrailer) {});
                        callback(null, arg1, arg6);
                    } else {
                        callback(null, "Notification sent");
                    }
                });
            } else if (arg5 == 'ANDROID') {
                mails.sendNotificationsToAndroid(arg1, arg2, "accept booking request", function(data) {
                    if (data.status == 1) {
                        Connection.query('UPDATE badge_counts SET count="' + arg3 + '" WHERE id = "' + arg4 + '"', function(err, bookTrailer) {});
                        callback(null, arg1, arg6);
                    } else {
                        callback(null, "Notification sent");
                    }
                });
            }
        },
        function(arg1, arg6, callback) {
            console.log('88888888888888');
            var smsMsg = arg1 + 'Please visit the Hire My Trailer App now.'
            mails.sendMobileMessage(arg6, smsMsg, function(response) {
                if (response.code == config.CODES.OK) {
                    callback(null, 'send SMS');
                } else if (response.code == config.CODES.Error) {
                    callback(null, 1);
                }
            });
        },
        function(arg1, callback) {
            console.log('9999999999999999');
            sendAgreementAtAcceptBooking(bodyData, req, function(response) {
                var i = 0;
                console.log('3333333333333', response);
                if (response.code == config.CODES.OK) {
                    console.log('444444444')
                    callback(null, 'Agreement sent successfully');
                } else if (response.code == config.CODES.Error) {
                    console.log('555555555')
                    for (var i; i < 2; i++) {
                        sendAgreementAtAcceptBooking(bodyData, req, function(response) {
                            console.log('6666666666', response)
                            if (response.code == config.CODES.OK) {
                                callback(null, 'Agreement sent successfully');
                            } else if (response.code == config.CODES.Error) {

                            }
                        });
                        if (i == 1) {
                            callback(null, 'Agreement send error');
                        }
                    }
                    //callback('Agreement send error');
                }
            });
        }
    ], function(err, results) {
        if (err) {
            res.status(200).json(err);
        } else {
            res.status(200).json({ status: 1, is_bank: 1, message: "Booking Accepted " });
        }
    });


    return false;
    // var query = 'SELECT id, recipient from accounts where user_id = "' + bodyData.user_id + '"';
    // Connection.query(query, function(err, users) {
    //     if (err) {
    //         res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
    //     } else if ((users.length > 0) && (users[0].recipient == 0)) {
    //         res.status(200).json({ status: config.CODES.statusOk, is_bank: 0, message: "Please add bank account before accept booking request" });
    //     } else {

    //         1



    //         query = 'SELECT * FROM `manage_charges` WHERE booking_id ="' + bodyData.booking_id + '"'
    //         Connection.query(query, function(err, result) {
    //             if (err) {
    //                 res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
    //             } else {
    //                 Payment.captureCharge(result[0].charge_key, function(response) {
    //                     if (response.status == config.CODES.statusFail) {
    //                         res.status(500).json({ status: config.CODES.statusFail, error: { error_message: response.data } });
    //                     } else if (response.status == config.CODES.statusOk) {

    //                         2


    //                         query = 'UPDATE manage_charges SET manage_charges.status=1 WHERE manage_charges.id ="' + result[0].id + '"'
    //                         Connection.query(query, function(err, bookTrailer) {});
    //                         query = "INSERT INTO transactions (renter_id,owner_id,booking_id,manage_charge_id,amount,discription,response) VALUES ('" +
    //                             result[0].renter_id + "'" + ',' + "'" +
    //                             result[0].owner_id + "'" + ',' + "'" +
    //                             bodyData.booking_id + "'" + ',' + "'" +
    //                             result[0].id + "'" + ',' + "'" +
    //                             (response.data.amount / 100) + "'" + ',"captured amount from renter and send to admin at the booking accepted by owner",' + "'" +
    //                             JSON.stringify(response.data) +
    //                             "')";
    //                         Connection.query(query, function(err, transactions) {
    //                             if (err) {
    //                                 res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
    //                             } else {


    //                                 query = 'UPDATE booked_trailers, trailers SET booked_trailers.status=1, trailers.status="hired" WHERE booked_trailers.trailer_id=trailers.id AND booked_trailers.id = "' + bodyData.booking_id + '"'
    //                                 Connection.query(query, function(err, bookTrailer) {
    //                                     if (err) {
    //                                         res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
    //                                     } else {

    //                                         async.waterfall([
    //                                                 function(callback) {
    //                                                     Connection.query('SELECT bt.renter_id, bt.owner_id, bt.trailer_id, bt.id, users.device_token, users.mobile, users.device_type, types.name, bc.count, bc.id AS badgeId FROM `booked_trailers` AS bt LEFT JOIN users ON users.id = bt.renter_id LEFT JOIN badge_counts AS bc ON bc.user_id = bt.renter_id LEFT JOIN trailers AS tr on tr.id = bt.trailer_id LEFT JOIN default_trailers AS dt ON dt.id = tr.trailer_default_id LEFT JOIN types ON types.id = dt.type_id WHERE bt.id ="' + bodyData.booking_id + '"', function(err, result) {
    //                                                         var msg = 'Your booking request for ' + result[0].name + ' has been accepted';
    //                                                         var badge = result[0].count + 1;
    //                                                         var badgeId = result[0].badgeId;
    //                                                         var userMob = result[0].mobile;
    //                                                         if (result[0].device_type == 'IOS') {
    //                                                             var deviceType = 'IOS';
    //                                                         } else if (result[0].device_type == 'ANDROID') {
    //                                                             var deviceType = 'ANDROID';
    //                                                         } else {
    //                                                             var deviceType = '';
    //                                                         }
    //                                                         query = 'INSERT INTO notifications (receiver_id, sender_id, notification_type, text, status, device_type) VALUES ("' +
    //                                                             result[0].renter_id + '"' + ',' + '"' +
    //                                                             result[0].owner_id + '"' + ',"accept booking request","' + msg + '",1, "' + deviceType + '")';
    //                                                         Connection.query(query, function(err, bookTrailer) {
    //                                                             if (err) {
    //                                                                 callback('pushNotificationForIphone save error in DB');
    //                                                             } else {
    //                                                                 callback(null, msg, result[0].device_token, badge, badgeId, deviceType, userMob);
    //                                                             }
    //                                                         })
    //                                                     })
    //                                                 },
    //                                                 function(arg1, arg2, arg3, arg4, arg5, arg6, callback) {
    //                                                     if (arg5 == 'IOS') {
    //                                                         mails.pushNotificationForIphone(arg1, arg2, arg3, "accept booking request", function(data) {
    //                                                             if (data.status == 1) {
    //                                                                 Connection.query('UPDATE badge_counts SET count="' + arg3 + '" WHERE id = "' + arg4 + '"', function(err, bookTrailer) {});
    //                                                                 callback(null, arg1, arg6);
    //                                                             } else {
    //                                                                 callback(null, "Notification sent");
    //                                                             }
    //                                                         });
    //                                                     } else if (arg5 == 'ANDROID') {
    //                                                         mails.sendNotificationsToAndroid(arg1, arg2, "accept booking request", function(data) {
    //                                                             if (data.status == 1) {
    //                                                                 Connection.query('UPDATE badge_counts SET count="' + arg3 + '" WHERE id = "' + arg4 + '"', function(err, bookTrailer) {});
    //                                                                 callback(null, arg1, arg6);
    //                                                             } else {
    //                                                                 callback(null, "Notification sent");
    //                                                             }
    //                                                         });
    //                                                     }
    //                                                 },
    //                                                 function(arg1, arg6, callback) {
    //                                                     mails.sendMobileMessage(arg6, arg1, function(response) {
    //                                                         if (response.code == config.CODES.OK) {
    //                                                             callback(null, 'send SMS');
    //                                                         } else if (response.code == config.CODES.Error) {
    //                                                             callback('Accepted SMS send error');
    //                                                         }
    //                                                     });
    //                                                 },
    //                                                 function(arg1, callback) {
    //                                                     console.log('11111111111111111111');
    //                                                     sendAgreementAtAcceptBooking(bodyData, req, function(response) {
    //                                                         var i = 0;
    //                                                         console.log('3333333333333', response);
    //                                                         if (response.code == config.CODES.OK) {
    //                                                             console.log('444444444')
    //                                                             callback(null, 'Agreement sent successfully');
    //                                                         } else if (response.code == config.CODES.Error) {
    //                                                             console.log('555555555')
    //                                                             for (var i; i < 2; i++) {
    //                                                                 sendAgreementAtAcceptBooking(bodyData, req, function(response) {
    //                                                                     console.log('6666666666', response)
    //                                                                     if (response.code == config.CODES.OK) {
    //                                                                         callback(null, 'Agreement sent successfully');
    //                                                                     } else if (response.code == config.CODES.Error) {

    //                                                                     }
    //                                                                 });
    //                                                                 if (i == 1) {
    //                                                                     callback(null, 'Agreement send error');
    //                                                                 }
    //                                                             }
    //                                                             //callback('Agreement send error');
    //                                                         }
    //                                                     });
    //                                                 }
    //                                             ],
    //                                             function(err, results) {
    //                                                 if (err) {
    //                                                     res.status(200).json({ status: 0, error: { error_message: config.MESSAGES.DBErr } });
    //                                                 } else {
    //                                                     res.status(200).json({ status: 1, is_bank: 1, message: "Booking Accepted " });
    //                                                 }
    //                                             });
    //                                     }
    //                                 });
    //                             }
    //                         })
    //                     }
    //                 });
    //             }
    //         });
    //     }
    // });
    // var bodyData = req.body;
    // if (bodyData.booking_id && bodyData.user_id) {
    //     Connection.query('SELECT bt.agreement_reference_id FROM `booked_trailers` AS bt WHERE bt.id = "' + bodyData.booking_id + '"', function(err, ref) {
    //         if (err) {
    //             res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
    //         } else {
    //             getAgreementStatus(apiKey, apiSecretKey, ref[0].agreement_reference_id, function(response) {
    //                 if (response.code == config.CODES.Error) {
    //                     res.status(200).json({ status: config.CODES.statusFail, error: { error_message: response.data } });
    //                 } else if (response.code == config.CODES.OK) {
    //                     var agreParse = JSON.parse(response.data);
    //                     if (agreParse.Status == "Complete") {
    //                         agreementStatusAcceptBooking(bodyData, req, res);
    //                     } else {
    //                         res.status(200).json({ status: config.CODES.statusFail, error: { error_message: 'Agreement sign is pending. So please signing and complete agreement before booking accept.' } });
    //                     }
    //                 }
    //             });
    //         }
    //     });
    // } else {
    //     res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.InvalidParameter } });
    // }
}

function sendAgreementAtAcceptBooking(body, req, callback) {
    Connection.query('SELECT id, renter_id, owner_id, DATE_FORMAT(to_date,"%Y-%m-%d") AS to_date,DATE_FORMAT(from_date,"%Y-%m-%d") AS from_date FROM `booked_trailers` WHERE id =' + body.booking_id, function(err, rest) {
        var bodyData = rest[0];
        Connection.query('SELECT u.id AS renter_id, CONCAT(UCASE(LEFT(u.first_name, 1)),LCASE(SUBSTRING(u.first_name, 2))) AS renter_fname, CONCAT(UCASE(LEFT(u.last_name, 1)),LCASE(SUBSTRING(u.last_name, 2))) AS renter_lname, u.email AS renter_email, u.licence_number AS license_no, u.address AS renter_address, usr.id AS owner_id, CONCAT(UCASE(LEFT(usr.first_name, 1)),LCASE(SUBSTRING(usr.first_name, 2))) AS owner_fname, CONCAT(UCASE(LEFT(usr.last_name, 1)),LCASE(SUBSTRING(usr.last_name, 2))) AS owner_lname, usr.email AS owner_email, usr.address AS owner_address FROM `users` AS u LEFT JOIN users AS usr ON usr.id = "' + bodyData.owner_id + '" WHERE u.id = "' + bodyData.renter_id + '"', function(err, result) {
            if (err) {
                return callback({ code: 500, data: config.MESSAGES.DBErr })
            } else {
                console.log(result[0]);
                var agreeResult = result[0];
                var renterTC = config.fullhost + '/front/agreement/terms_and_conditions_Hirer.pdf';
                var ownerTC = config.fullhost + '/front/agreement/terms_and_conditions_Owner.pdf';
                var baseUrl = req.protocol + '://' + config.fullhost;
                var logo = baseUrl + '/front/images/logo.png';
                //var html = '<div class="container-box" style="width:90%; margin:auto;"><h1 style="text-align:center; font-size:25px; color:#000; font-family:Arial, Helvetica, sans-serif; border-bottom:1px solid #333;padding: 10px 0px 15px;">HIRE AGREEMENT</h1><p class="agreement_details" style="color:#333; font-size:16px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; line-height: 30px; width:100%;">This Hire Agreement is made between <b>' + agreeResult.owner_fname + ' ' + agreeResult.owner_lname + '</b> hereinafter referred to as â€˜the Ownerâ€™ and <b>' + agreeResult.renter_fname + ' ' + agreeResult.renter_lname + '</b> herein after referred to as â€˜the Hirerâ€™.</p><p class="agreement_details" style="color:#333; font-size:16px;font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;">The Hirer, hereby agree to hire the Ownerâ€™s trailer from <b>' + bodyData.from_date + '</b> to <b>' + bodyData.to_date + '</b> at the advertised and agreed upon cost. </p><p class="agreement_details" style="color:#333; font-size:16px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;">The Hirer agrees to collect the trailer from <a style="color:#333; text-decoration:underline;" href="javascript:void(0)">(ownerâ€™s address)</a> at <a style="color:#333; text-decoration:underline;" href="javascript:void(0)">(time)</a> and return it to the same address by <a style="color:#333; text-decoration:underline;" href="javascript:void(0)">(time)</a> at the end of the last day of hire.</p><p class="agreement_details" style="color:#333; font-size:16px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;">The Hirer and Owner acknowledge and accept that Hire My Trailer will be paid commission as part of the hire agreement. This commission is inclusive of insurance that protects and indemnifies Hire My Trailer from any injuries and/or property damage that occurs during the duration of the hire as detailed in the <a style="color:#333; text-decoration:underline;" href="' + ownerTC + '" target="_blank">Owner Terms and Conditions</a> and the<a style="color:#333; text-decoration:underline;" href="' + renterTC + '" target="_blank"> Hirer Terms and Conditions</a>.</p><p class="agreement_details" style="color:#333; font-size:16px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;">The Hirer understands that it is their responsibility to make sure the trailer is properly and safely connected to the towing vehicle. </p>        <p class="agreement_details" style="color:#333; font-size:16px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;">The trailer shall be moved only with fully functioning trailer lights, and the Hirer agrees that it is their responsibility to confirm lights are functioning.</p>        <p class="agreement_details" style="color:#333; font-size:16px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;">Only the person signing this agreement as the Hirer will move the trailer. </p>        <p        class="agreement_details" style="color:#333; font-size:16px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;">I, the Hirer, undertake to inspect the trailer before towing it away and report any defects, faults, or flaws to the Owner. </p>        <p class="agreement_details" style="color:#333; font-size:16px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;">I, the Hirer, hereby agree to the terms of this agreement together with the Hirer Terms and Conditions. <div class="left_box" style="float:left; width:50%; margin: 57px 1px 10px 10px;">[!Sign.1, ' + agreeResult.renter_fname + ', ' + agreeResult.renter_lname + ', ' + agreeResult.renter_email + ']</div></p><p class="agreement_details" style="color:#333; font-size:16px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;">I, the Owner, hereby agree to the terms of this agreement together with the Owner Terms and Conditions.<div class="left_box" style="float:left; width:70%; margin: 57px 1px 12px 2px;"> [!Sign.2, ' + agreeResult.owner_fname + ', ' + agreeResult.owner_lname + ', ' + agreeResult.owner_email + '] </div> </p> <p style="float:left; width:100%;">&nbsp;</p> </div>';
                var html = '<div class="container-box" style="width:90%; margin:auto;"><div style="margin-left:350px;"><img width="180" src="' + logo + '"></div> <h1 style="text-align:center; font-size:15px; color:#000; font-family:Arial, Helvetica, sans-serif; border-bottom:1px solid #333;padding: 10px 0px 15px;">HIRE AGREEMENT</h1> <p class="agreement_details" style="color:#333; font-size:10px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; font-size:10px; line-height: 22px; width:100%;margin: 0px;">This Hire Agreement is made between <b>' + agreeResult.owner_fname + ' ' + agreeResult.owner_lname + '</b> of <b>' + agreeResult.owner_address + ' </b>hereinafter referred to as &#39;the Owner&#39; and <b>' + agreeResult.renter_fname + ' ' + agreeResult.renter_lname + '</b> of <b>' + agreeResult.renter_address + ' </b> , Licence No. ' + agreeResult.license_no + ', herein after referred to as &#39;the Hirer&#39;.</p>  <p class="agreement_details" style="color:#333; font-size:10px; line-height: 22px;font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;margin: 0px;">The Hirer, hereby agree to hire the Owner&#39;s trailer from <b>' + bodyData.from_date + '</b> to <b>' + bodyData.to_date + '</b> at the advertised and agreed upon cost. </p>  <p class="agreement_details" style="color:#333; font-size:10px; line-height: 22px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;margin: 0px;">The Hirer agrees to collect the trailer from <a style="color:#333; font-size:10px; line-height: 22px; margin-top: auto; text-decoration:underline;" href="javascript:void(0)">(owner&#39;s address)</a> at <a style="color:#333; text-decoration:underline;" href="javascript:void(0)">(time)</a> and return it to the same address by <a style="color:#333; margin-top: auto; text-decoration:underline;" href="javascript:void(0)">(time)</a> at the end of the last day of hire.</p>  <p class="agreement_details" style="color:#333; margin-top: auto; font-size:10px; line-height: 22px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;margin: 0px;">The Hirer and Owner acknowledge and accept that Hire My Trailer Australia Pty. Ltd. (ABN: 19 127 783 037) will be paid commission as part of the hire agreement. This commission is inclusive of insurance that protects and indemnifies Hire My Trailer Australia Pty. Ltd. from any injuries and/or property damage that occurs during the duration of the hire as detailed in the <a style="color:#333; text-decoration:underline;" href="' + ownerTC + '" target="_blank">Owner Terms and Conditions</a> and the<a style="color:#333; text-decoration:underline;" href="' + renterTC + '" target="_blank"> Hirer Terms and Conditions</a>.</p>  <p class="agreement_details" style="color:#333; font-size:10px; line-height: 22px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;margin: 0px;">The Hirer understands that it is their responsibility to make sure the trailer is properly and safely connected to the towing vehicle. </p>  <p class="agreement_details" style="color:#333; font-size:10px; line-height: 22px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;margin: 0px;">The trailer shall be moved only with fully functioning trailer lights, and the Hirer agrees that it is their responsibility to confirm lights are functioning.</p>  <p class="agreement_details" style="color:#333; font-size:10px; line-height: 22px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;margin: 0px;">Only the person signing this agreement as the Hirer will move the trailer. </p>  <p class="agreement_details" style="color:#333; font-size:10px; line-height: 22px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;margin: 0px;">I, the Hirer, undertake to inspect the trailer before towing it away and report any defects, faults, or flaws to the Owner. </p>  <p class="agreement_details" style="color:#333; font-size:10px; line-height: 22px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;margin: 0px;">I, the Hirer, hereby agree to the terms of this agreement together with the Hirer Terms and Conditions.    </p>    <p class="left_box" style="float:left; width:100%; font-size:10px; line-height: 22px; margin: 54px 1px 10px 10px;">[!Sign.1, ' + agreeResult.renter_fname + ', ' + agreeResult.renter_lname + ', ' + agreeResult.renter_email + ']</p>  <p class="agreement_details" style="color:#333; font-size:10px; line-height: 22px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;margin: 0px;">I, the Owner, hereby agree to the terms of this agreement together with the Owner Terms and Conditions.    </p>   <p class="left_box" style="float:left; font-size:10px; line-height: 22px; width:100%; margin: 38px 1px 12px 2px;"> [!Sign.2, ' + agreeResult.owner_fname + ', ' + agreeResult.owner_lname + ', ' + agreeResult.owner_email + '] </p>   </div>'
                var options = { format: 'Letter', "timeout": 50000 };
                var pdfName = new Date().getTime() + '_agreement.pdf';

                console.log('----------------------------', baseUrl + '/front/agreement/' + pdfName);
                pdf.create(html, options).toFile(req.app.locals.base_path + '/public/front/agreement/' + pdfName, function(err, respdf) {
                    console.log('-------------/////////-------------');
                    if (err) {
                        console.log('7777777777', err);
                        //res.status(200).json({ status: config.CODES.statusFail, error: { error_message: "Agreement create error" } });
                        return callback({ code: 500, data: 'Agreement create error' })
                    } else {
                        console.log('888888888888');
                        var filepath = respdf.filename;
                        console.log(filepath)
                        uploadDocument(apiKey, apiSecretKey, filepath, agreeResult, function(response) {
                            console.log('10101010100000000');
                            console.log(response);
                            if (response.code == config.CODES.notFound) {
                                // res.status(200).json({ status: config.CODES.statusFail, error: { error_message: response.data } });
                                return callback({ code: 500, data: response.data })
                            } else if (response.code == config.CODES.OK) {
                                var agreeStatus = response.data[0].Signers;
                                var referenceKey = response.data[0].Reference;
                                if (agreeStatus.length > 0) {
                                    //agreementAndBookingCode(tr, bodyData, bal, customerKey, disData, is_discount, price, ccard_fee, referenceKey, res)
                                    return callback({ code: 200, data: 'Agreement sent successfully' })
                                } else {
                                    return callback({ code: 500, data: 'Agreement send error' })
                                        //res.status(200).json({ status: config.CODES.statusFail, error: { error_message: "Agreement send error" } });
                                }
                            }
                        });
                    }
                });
            }
        });
    });

}
exports.sendAgreementAtAcceptBooking = sendAgreementAtAcceptBooking;

// function agreementStatusAcceptBooking(bodyData, req, res) {
//     // var query = 'SELECT bt.id AS bookedID, bt.days FROM `booked_trailers` AS bt WHERE bt.trailer_id = "' + req.body.trailer_id + '" AND(bt.status = 1 OR bt.status = 4)';
//     // console.log(query);
//     // Connection.query(query, function(err, tt) {
//     //     if (err) {
//     //         res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
//     //     } else {
//     //         console.log(tt);
//     //     }
//     // });
//     var query = 'SELECT id, recipient from accounts where user_id = "' + bodyData.user_id + '"';
//     Connection.query(query, function(err, users) {
//         if (err) {
//             res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
//         } else if ((users.length > 0) && (users[0].recipient == 0)) {
//             res.status(200).json({ status: config.CODES.statusOk, is_bank: 0, message: "Please add bank account before accept booking request" });
//         } else {
//             query = 'SELECT * FROM `manage_charges` WHERE booking_id ="' + bodyData.booking_id + '"'
//             Connection.query(query, function(err, result) {
//                 if (err) {
//                     res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
//                 } else {
//                     Payment.captureCharge(result[0].charge_key, function(response) {
//                         if (response.status == config.CODES.statusFail) {
//                             res.status(500).json({ status: config.CODES.statusFail, error: { error_message: response.data } });
//                         } else if (response.status == config.CODES.statusOk) {
//                             query = 'UPDATE manage_charges SET manage_charges.status=1 WHERE manage_charges.id ="' + result[0].id + '"'
//                             Connection.query(query, function(err, bookTrailer) {});
//                             query = "INSERT INTO transactions (renter_id,owner_id,booking_id,manage_charge_id,amount,discription,response) VALUES ('" +
//                                 result[0].renter_id + "'" + ',' + "'" +
//                                 result[0].owner_id + "'" + ',' + "'" +
//                                 bodyData.booking_id + "'" + ',' + "'" +
//                                 result[0].id + "'" + ',' + "'" +
//                                 (response.data.amount / 100) + "'" + ',"captured amount from renter and send to admin at the booking accepted by owner",' + "'" +
//                                 JSON.stringify(response.data) +
//                                 "')";
//                             Connection.query(query, function(err, transactions) {
//                                 if (err) {
//                                     res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
//                                 } else {
//                                     query = 'UPDATE booked_trailers, trailers SET booked_trailers.status=1, trailers.status="hired" WHERE booked_trailers.trailer_id=trailers.id AND booked_trailers.id = "' + bodyData.booking_id + '"'
//                                     Connection.query(query, function(err, bookTrailer) {
//                                         if (err) {
//                                             res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
//                                         } else {
//                                             async.waterfall([
//                                                     function(callback) {
//                                                         Connection.query('SELECT bt.renter_id, bt.owner_id, bt.trailer_id, bt.id, users.device_token, users.mobile, users.device_type, types.name, bc.count, bc.id AS badgeId FROM `booked_trailers` AS bt LEFT JOIN users ON users.id = bt.renter_id LEFT JOIN badge_counts AS bc ON bc.user_id = bt.renter_id LEFT JOIN trailers AS tr on tr.id = bt.trailer_id LEFT JOIN default_trailers AS dt ON dt.id = tr.trailer_default_id LEFT JOIN types ON types.id = dt.type_id WHERE bt.id ="' + bodyData.booking_id + '"', function(err, result) {
//                                                             var msg = 'Your booking request for ' + result[0].name + ' has been accepted';
//                                                             var badge = result[0].count + 1;
//                                                             var badgeId = result[0].badgeId;
//                                                             var userMob = result[0].mobile;
//                                                             if (result[0].device_type == 'IOS') {
//                                                                 var deviceType = 'IOS';
//                                                             } else if (result[0].device_type == 'ANDROID') {
//                                                                 var deviceType = 'ANDROID';
//                                                             } else {
//                                                                 var deviceType = '';
//                                                             }
//                                                             query = 'INSERT INTO notifications (receiver_id, sender_id, notification_type, text, status, device_type) VALUES ("' +
//                                                                 result[0].renter_id + '"' + ',' + '"' +
//                                                                 result[0].owner_id + '"' + ',"accept booking request","' + msg + '",1, "' + deviceType + '")';
//                                                             Connection.query(query, function(err, bookTrailer) {
//                                                                 if (err) {
//                                                                     callback('pushNotificationForIphone save error in DB');
//                                                                 } else {
//                                                                     callback(null, msg, result[0].device_token, badge, badgeId, deviceType, userMob);
//                                                                 }
//                                                             })
//                                                         })
//                                                     },
//                                                     function(arg1, arg2, arg3, arg4, arg5, arg6, callback) {
//                                                         if (arg5 == 'IOS') {
//                                                             mails.pushNotificationForIphone(arg1, arg2, arg3, "accept booking request", function(data) {
//                                                                 if (data.status == 1) {
//                                                                     Connection.query('UPDATE badge_counts SET count="' + arg3 + '" WHERE id = "' + arg4 + '"', function(err, bookTrailer) {});
//                                                                     callback(null, arg1, arg6);
//                                                                 } else {
//                                                                     callback(null, "Notification sent");
//                                                                 }
//                                                             });
//                                                         } else if (arg5 == 'ANDROID') {
//                                                             mails.sendNotificationsToAndroid(arg1, arg2, "accept booking request", function(data) {
//                                                                 if (data.status == 1) {
//                                                                     Connection.query('UPDATE badge_counts SET count="' + arg3 + '" WHERE id = "' + arg4 + '"', function(err, bookTrailer) {});
//                                                                     callback(null, arg1, arg6);
//                                                                 } else {
//                                                                     callback(null, "Notification sent");
//                                                                 }
//                                                             });
//                                                         }
//                                                     },
//                                                     function(arg1, arg6, callback) {
//                                                         mails.sendMobileMessage(arg6, arg1, function(response) {
//                                                             if (response.code == config.CODES.OK) {
//                                                                 callback(null, 'send SMS');
//                                                             } else if (response.code == config.CODES.Error) {
//                                                                 callback('Accepted SMS send error');
//                                                             }
//                                                         });
//                                                     }
//                                                 ],
//                                                 function(err, results) {
//                                                     if (err) {
//                                                         res.status(500).json({ status: 0, error: { error_message: config.MESSAGES.DBErr } });
//                                                     } else {
//                                                         res.status(200).json({ status: 1, is_bank: 1, message: "Booking Accepted " });
//                                                     }
//                                                 });
//                                         }
//                                     });
//                                 }
//                             })
//                         }
//                     });
//                 }
//             });
//         }
//     });
// }

/* @function : ownerCancelBooking
 *  @method  : POST
 *  @purpose  : This function used cancel booking and update staus in DB as per booking_id and user_id
 */
exports.ownerCancelBooking = function(req, res) {
    if (req.body.booking_id && req.body.user_id) {
        var reqBody = req.body;
        query = 'SELECT txn.manage_charge_id AS id, SUM(txn.amount) AS amount, txn.status AS txn_status, txn.booking_id, bt.from_date, bt.status, mc.charge_key FROM `transactions` AS txn LEFT JOIN manage_charges AS mc on mc.id = txn.manage_charge_id LEFT JOIN booked_trailers AS bt ON bt.id = txn.booking_id WHERE txn.booking_id = "' + reqBody.booking_id + '" AND (txn.status = 1 OR txn.status = 5)'
            //query = 'SELECT bt.id AS booking_id, bt.from_date, bt.status, mc.id, mc.charge_key, mc.amount FROM `booked_trailers` AS bt LEFT JOIN manage_charges AS mc ON mc.booking_id = bt.id WHERE bt.id ="' + reqBody.booking_id + '"'
        console.log(query);
        Connection.query(query, function(err, bookTrailer1) {
            var bodyData = bookTrailer1[0];
            var chargeAmount = req.app.locals.cancel_charge;
            if (err) {
                res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
            } else if (bodyData.status == 0) {
                loadCodeForOwnerCancelBoooking('', '', bodyData, reqBody, res);
            } else if ((bodyData.status == 1) || (bodyData.status == 6)) {
                var days = days_between(new Date(bodyData.from_date), new Date());
                if (days >= 7) {
                    loadCodeForOwnerCancelBoooking(chargeAmount, 70, bodyData, reqBody, res);
                } else if (days < 7) {
                    loadCodeForOwnerCancelBoooking(150, 150, bodyData, reqBody, res);
                }
            }
        });
    } else {
        res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.InvalidParameter } });
    }
}

/* @function : renterCancelBooking
 *  @method  : POST
 *  @purpose  : This function used cancel booking and update staus in DB as per booking_id and user_id
 */
exports.renterCancelBooking = function(req, res) {
    if (req.body.booking_id && req.body.user_id) {
        var reqBody = req.body;
        console.log(reqBody)
        query = 'SELECT bt.id AS booking_id, bt.from_date, bt.status, mc.id, SUM(mc.amount) AS amount, mc.charge_key AS charge_id FROM `booked_trailers` AS bt LEFT JOIN manage_charges as mc on mc.booking_id = bt.id AND mc.status = 1 WHERE bt.id ="' + req.body.booking_id + '"'
        Connection.query(query, function(err, bookTrailer1) {
            var bodyData = bookTrailer1;
            console.log(bodyData)
            var totalAmount = bodyData[0].amount;
            if (err) {
                res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
            } else {
                console.log('00000000000')
                if (bodyData[0].status == 0) {
                    console.log('11111111')
                    query = "INSERT INTO booking_cancel_log (user_id, booking_id, description,manage_charge_id,total_amount,amount) VALUES ('" + reqBody.user_id + "', '" + reqBody.booking_id + "', 'Renter canceled booking before owner accept booking request','" + bodyData[0].id + "','" + totalAmount + "','" + Math.abs(totalAmount / 100) + "')";
                    console.log(query)
                    Connection.query(query, function(err, transactions) {
                        if (err) {
                            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
                        } else {
                            loadCommonCodeForRenterCancelBoooking(reqBody, res);
                        }
                    });
                } else {
                    console.log('33333333333')
                    var chargeAmount = parseInt(req.app.locals.cancel_charge * 100);
                    if (bodyData.length > 0) {
                        var days = days_between(new Date(bodyData[0].from_date), new Date());
                        if (days >= 7) {
                            var refundAmount = parseInt(totalAmount - chargeAmount);
                            if (refundAmount > 0) {
                                loadCodeForRenterCancelBoooking(totalAmount, chargeAmount, refundAmount, bodyData, reqBody, res);
                            } else {
                                query = "INSERT INTO booking_cancel_log (user_id, booking_id, description,manage_charge_id,total_amount,amount) VALUES ('" + reqBody.user_id + "', '" + reqBody.booking_id + "', 'Renter canceled booking after owner accept booking request','" + bodyData[0].id + "','" + totalAmount + "','" + Math.abs(refundAmount / 100) + "')";
                                console.log(query)
                                Connection.query(query, function(err, transactions) {
                                    if (err) {
                                        res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
                                    } else {
                                        loadCommonCodeForRenterCancelBoooking(reqBody, res)
                                    }
                                });
                            }
                        } else if (days < 7) {
                            var percentageAmt = parseInt((totalAmount * 60) / 100);
                            var chargeFnAmount = parseInt(chargeAmount + percentageAmt);
                            var refundAmount = parseInt(totalAmount - chargeFnAmount);
                            if (refundAmount > 0) {
                                query = 'SELECT mc.id AS mcId, mc.amount AS amount, mc.charge_key AS charge_id FROM  manage_charges as mc  WHERE mc.booking_id="' + req.body.booking_id + '" AND mc.status=1'
                                Connection.query(query, function(err, refData) {
                                    for (var i = 0; i < refData.length; i++) {
                                        if (refData[i].amount <= refundAmount) {
                                            loadCodeForRenterCancelBoooking(totalAmount, chargeFnAmount, refData[i].amount, refData[i].charge_id, refData[i].mcId, reqBody, res);
                                            refundAmount = (refundAmount - refData[i].amount);
                                        } else {
                                            loadCodeForRenterCancelBoooking(totalAmount, chargeFnAmount, refundAmount, refData[i].charge_id, refData[i].mcId, reqBody, res);
                                            refundAmount = 0;
                                            loadCommonCodeForRenterCancelBoooking(reqBody, res)
                                            break;
                                        }
                                    }
                                });
                            } else {
                                query = "INSERT INTO booking_cancel_log (user_id, booking_id, description,manage_charge_id,total_amount, amount) VALUES ('" + reqBody.user_id + "', '" + reqBody.booking_id + "', 'Renter canceled booking after owner accept booking request','" + bodyData[0].id + "','" + totalAmount + "','" + Math.abs(refundAmount / 100) + "')";
                                console.log(query)
                                Connection.query(query, function(err, transactions) {
                                    if (err) {
                                        res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
                                    } else {
                                        loadCommonCodeForRenterCancelBoooking(reqBody, res)
                                    }
                                });
                            }
                        }
                    }
                }
            }
        });
    } else {
        res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.InvalidParameter } });
    }
}

/* @function : pickUpBooking
 *  @method  : POST
 *  @purpose  : This function used pickup trailer and update staus in DB as per booking_id and user_id
 */
exports.pickUpBooking = function(req, res) {
    var reqBody = req.body;
    console.log('1111111111111')
    console.log(reqBody)
    if (reqBody.booking_id && reqBody.user_id && reqBody.email) {
        Connection.query('SELECT bt.id, bt.renter_id, acc.customer_key FROM booked_trailers AS bt LEFT JOIN accounts AS acc on acc.user_id = bt.renter_id WHERE bt.id="' + reqBody.booking_id + '" AND DATE(bt.from_date) <= CURDATE()', function(err, result) {
            if (err) {
                res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
            } else if (result.length > 0) {
                console.log('22222222')
                Payment.createCharge(reqBody.email, "create $200 charge at pickup by renter", 20000, result[0].customer_key, function(response) {
                    if (response.status == config.CODES.statusFail) {
                        res.status(500).json({ status: config.CODES.statusFail, error: { error_message: response.data } });
                    } else if (response.status == config.CODES.statusOk) {
                        console.log('33333333333')
                        query = "INSERT INTO manage_charges (owner_id,renter_id,booking_id,amount,response,description,charge_key) VALUES ('" +
                            reqBody.user_id + "'" + ',' + "'" +
                            result[0].renter_id + "'" + ',' + "'" +
                            reqBody.booking_id + "'" + ',' + "'" +
                            response.data.amount + "'" + ',' + "'" +
                            JSON.stringify(response.data) + "'" + ',"Create $200(20000) charge at pick-up by renter",' + "'" +
                            response.data.token +
                            "')";
                        console.log(query)
                        Connection.query(query, function(err, transactions) {
                            if (err) {
                                res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
                            } else {
                                console.log('44444444444')
                                query = 'UPDATE booked_trailers SET status=4 WHERE id = "' + reqBody.booking_id + '" AND owner_id = "' + req.body.user_id + '"'
                                Connection.query(query, function(err, bookTrailer) {
                                    if (err) {
                                        res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
                                    } else {
                                        res.status(200).json({ status: config.CODES.statusOk, message: "PickedUp" });
                                    }
                                });
                            }
                        });

                    }
                });
            } else {
                res.status(200).json({ status: config.CODES.statusOk, message: "You can not be picked up before pick-up date" });
            }
        });
    } else {
        res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.InvalidParameter } });
    }
}

/* @function : dropoffBooking
 *  @method  : POST
 *  @purpose  : This function used dropOff trailer and update staus in DB as per booking_id and user_id
 */
exports.dropoffBooking = function(req, res) {
    var reqBody = req.body;
    console.log(reqBody)
        //var query = 'SELECT txn.id, SUM(txn.amount) AS amount, txn.owner_id, acc.recipient, users.balance FROM `transactions` AS txn LEFT JOIN accounts AS acc on acc.user_id = txn.owner_id LEFT JOIN users on users.id = txn.owner_id WHERE txn.owner_id = "' + reqBody.user_id + '" AND txn.booking_id = "' + reqBody.booking_id + '" AND (txn.status = 1 OR txn.status = 5)';
    var query = 'SELECT mc.id, SUM(mc.main_amount) AS amount, acc.recipient, users.balance FROM `manage_charges` AS mc LEFT JOIN accounts AS acc on acc.user_id = "' + reqBody.user_id + '" LEFT JOIN users on users.id = "' + reqBody.user_id + '" WHERE mc.booking_id = "' + reqBody.booking_id + '" AND mc.status = 1';
    console.log(query);

    Connection.query(query, function(err, txn) {
        console.log('1111111111');
        var capAmount = Number(txn[0].amount);
        var toFixedAmount = capAmount.toFixed(3);
        var calFNAmount = ((toFixedAmount * 70) / 100);
        var pendingAmt = (txn[0].balance - calFNAmount);
        console.log("capAmount", capAmount)
        console.log("toFixedAmount", toFixedAmount)
        console.log("calFNAmount", calFNAmount)
        console.log("pendingAmt", pendingAmt)



        if (err) {
            console.log('22222222222');
            res.status(500).json({ status: 0, error: { error_message: config.MESSAGES.DBErr } });
        } else if (pendingAmt > 0) {
            console.log('33333333333');
            query = 'UPDATE users SET balance ="' + pendingAmt + '" WHERE id = "' + reqBody.user_id + '"'
            Connection.query(query, function(err, bookTrailer) {
                if (err) {
                    res.status(500).json({ status: 0, error: { error_message: config.MESSAGES.DBErr } });
                } else {
                    calFNAmount = null;
                    capAmount = null;
                    loadCodeForDropOffBoooking(reqBody, capAmount, calFNAmount, req, res)
                }
            });
        } else {
            console.log('444444444444');
            //var transferAmount = (txn[0].amount - 20000);
            var positiveBal = Math.abs(pendingAmt)
            var trFnAmount = parseInt(positiveBal * 100);
            Payment.transferMoney(trFnAmount, txn[0].recipient, "Successfully Drop-off Booking", function(response) {
                var response = response;
                console.log('555555555555');
                if (response.status == config.CODES.statusFail) {
                    res.status(500).json({ status: 0, error: { error_message: response.data } });
                } else if (response.status == config.CODES.statusOk) {
                    query = "INSERT INTO transactions (owner_id,booking_id,transfer_id,amount,discription,status,response) VALUES ('" +
                        reqBody.user_id + "'" + ',' + "'" +
                        reqBody.booking_id + "'" + ',' + "'" +
                        response.data.token + "'" + ',' + "'" +
                        (response.data.amount / 100) + "'" + ',"Successfully drop-off and Transfer money to owner","2",' + "'" +
                        JSON.stringify(response.data) +
                        "')";
                    console.log(query);
                    Connection.query(query, function(err, transactions) {
                        console.log('66666666666666');
                        if (err) {
                            res.status(500).json({ status: 0, error: { error_message: config.MESSAGES.DBErr } });
                        } else {
                            console.log('7777777777777');
                            query = 'UPDATE manage_charges SET manage_charges.status=2, manage_charges.transfer_balance="' + response.data.amount + '" WHERE manage_charges.booking_id ="' + reqBody.booking_id + '" AND manage_charges.status = 1'
                            Connection.query(query, function(err, bookTrailer) {});
                            query = 'UPDATE users SET balance ="0" WHERE id = "' + reqBody.user_id + '"'
                            Connection.query(query, function(err, bookTrailer) {});
                            loadCodeForDropOffBoooking(reqBody, capAmount, trFnAmount, req, res)
                        }
                    });
                }
            });
        }
    });
}

/* @function : ownerDeclineBooking
 *  @method  : POST
 *  @purpose  : This function used to decline booking request from renter
 */
exports.ownerDeclineBooking = function(req, res) {
    var reqBody = req.body;
    if (reqBody.booking_id && reqBody.user_id) {
        query = 'SELECT charge_key,amount, id FROM `manage_charges` WHERE booking_id ="' + reqBody.booking_id + '"';
        console.log(query);
        Connection.query(query, function(err, mc) {
            if (err) {
                res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
            } else {
                console.log(mc[0].charge_key);
                query = "INSERT INTO transactions (owner_id,booking_id,refunded_amount,discription, status) VALUES ('" + reqBody.user_id + "','" + reqBody.booking_id + "','" + (mc[0].amount / 100) + "','Decline booking by owner and refund amount autometically to renter after 5 days','4')"
                console.log(query)
                Connection.query(query, function(err, transactions) {
                    if (err) {
                        res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
                    } else {
                        querymc = 'UPDATE manage_charges SET manage_charges.status=8 WHERE manage_charges.id ="' + mc[0].id + '"'
                        Connection.query(querymc, function(err, bookTrailer) {});
                        query = 'UPDATE booked_trailers, trailers SET booked_trailers.status=3, trailers.status="available" WHERE booked_trailers.trailer_id=trailers.id AND booked_trailers.id = "' + reqBody.booking_id + '" AND booked_trailers.owner_id = "' + reqBody.user_id + '"'
                        Connection.query(query, function(err, bookTrailer) {
                            if (err) {
                                res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
                            } else {
                                async.waterfall([
                                        function(callback) {
                                            Connection.query('SELECT bt.renter_id, bt.owner_id, bt.trailer_id, bt.id, users.device_token,users.mobile,users.device_type, types.name, bc.count, sz.label, bc.id AS badgeId FROM `booked_trailers` AS bt LEFT JOIN users ON users.id = bt.renter_id LEFT JOIN badge_counts AS bc ON bc.user_id = bt.renter_id LEFT JOIN trailers AS tr on tr.id = bt.trailer_id LEFT JOIN default_trailers AS dt ON dt.id = tr.trailer_default_id LEFT JOIN sizes AS sz on sz.id = tr.size_id LEFT JOIN types ON types.id = dt.type_id WHERE bt.id ="' + reqBody.booking_id + '"', function(err, result) {
                                                var msg = 'Your booking request for ' + result[0].name + '(' + result[0].label + ') trailer has been rejected';
                                                var badge = result[0].count + 1;
                                                var badgeId = result[0].badgeId;
                                                var userMobile = result[0].mobile;
                                                if (result[0].device_type == 'IOS') {
                                                    var deviceType = 'IOS';
                                                } else if (result[0].device_type == 'ANDROID') {
                                                    var deviceType = 'ANDROID';
                                                } else {
                                                    var deviceType = '';
                                                }
                                                query = 'INSERT INTO notifications (receiver_id, sender_id, notification_type, text, status, device_type) VALUES ("' +
                                                    result[0].renter_id + '"' + ',' + '"' +
                                                    result[0].owner_id + '"' + ',"booking request declined","' + msg + '",1,"' + deviceType + '")';
                                                Connection.query(query, function(err, bookTrailer) {
                                                    if (err) {
                                                        callback('pushNotificationForIphone save error in DB');
                                                    } else {
                                                        callback(null, msg, result[0].device_token, badge, badgeId, deviceType, userMobile);
                                                    }
                                                })
                                            })
                                        },
                                        function(arg1, arg2, arg3, arg4, arg5, arg6, callback) {
                                            if (arg5 == 'IOS') {
                                                mails.pushNotificationForIphone(arg1, arg2, arg3, "booking request declined", function(data) {
                                                    if (data.status == 1) {
                                                        Connection.query('UPDATE badge_counts SET count="' + arg3 + '" WHERE id = "' + arg4 + '"', function(err, bookTrailer) {});
                                                        callback(null, arg1, arg6);
                                                    } else {
                                                        callback(null, "Notification sent");
                                                    }
                                                });
                                            } else if (arg5 == 'ANDROID') {
                                                mails.sendNotificationsToAndroid(arg1, arg2, "booking request declined", function(data) {
                                                    if (data.status == 1) {
                                                        Connection.query('UPDATE badge_counts SET count="' + arg3 + '" WHERE id = "' + arg4 + '"', function(err, bookTrailer) {});
                                                        callback(null, arg1, arg6);
                                                    } else {
                                                        callback(null, "Notification sent");
                                                    }
                                                });
                                            }
                                        },
                                        function(arg1, arg6, callback) {
                                            mails.sendMobileMessage(arg6, arg1, function(response) {
                                                if (response.code == config.CODES.OK) {
                                                    callback(null, 'send SMS');
                                                } else if (response.code == config.CODES.Error) {
                                                    callback('Decliend SMS send error');
                                                }
                                            });
                                        }

                                    ],
                                    function(err, results) {
                                        if (err) {
                                            res.status(500).json({ status: 0, error: { error_message: config.MESSAGES.DBErr } });
                                        } else {
                                            res.status(200).json({ status: 1, message: "Booking Declined successfully" });
                                        }
                                    });
                            }
                        });

                    }
                });
                // Payment.refundPayment(mc[0].amount, mc[0].charge_key, function(response) {
                //     console.log(response.body);
                //     console.log('22222222');
                //     if (response.status == config.CODES.statusFail) {
                //         res.status(500).json({ status: config.CODES.statusFail, error: { error_message: response.data } });
                //     } else if (response.status == config.CODES.statusOk) {
                //         console.log('33333333');
                //         query = "INSERT INTO transactions (owner_id,booking_id,refunded_amount,refunded_id,discription,response) VALUES ('" +
                //             reqBody.user_id + "'" + ',' + "'" +
                //             reqBody.booking_id + "'" + ',' + "'" +
                //             (response.data.amount / 100) + "'" + ',' + "'" +
                //             response.data.token + "'" + ',"Refund amount to renter on Decline booking by owner",' + "'" +
                //             JSON.stringify(response.data) +
                //             "')";
                //         console.log(query)
                //         Connection.query(query, function(err, transactions) {
                //             console.log('66666666');
                //             if (err) {
                //                 res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
                //             } else {
                //                 console.log('44444444');
                //                 query = 'UPDATE booked_trailers, trailers SET booked_trailers.status=3, trailers.status="available" WHERE booked_trailers.trailer_id=trailers.id AND booked_trailers.id = "' + reqBody.booking_id + '" AND booked_trailers.owner_id = "' + reqBody.user_id + '"'
                //                 Connection.query(query, function(err, bookTrailer) {
                //                     if (err) {
                //                         res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
                //                     } else {
                //                         console.log('55555555');
                //                         async.waterfall([
                //                                 function(callback) {
                //                                     console.log('7777777777');
                //                                     Connection.query('SELECT bt.renter_id, bt.owner_id, bt.trailer_id, bt.id, users.device_token, types.name, bc.count, bc.id AS badgeId FROM `booked_trailers` AS bt LEFT JOIN users ON users.id = bt.renter_id LEFT JOIN badge_counts AS bc ON bc.user_id = bt.renter_id LEFT JOIN trailers AS tr on tr.id = bt.trailer_id LEFT JOIN default_trailers AS dt ON dt.id = tr.trailer_default_id LEFT JOIN types ON types.id = dt.type_id WHERE bt.id ="' + reqBody.booking_id + '"', function(err, result) {
                //                                         var msg = 'Your booking request for ' + result[0].name + ' has been rejected';
                //                                         var badge = result[0].count + 1;
                //                                         var badgeId = result[0].badgeId;
                //                                         query = 'INSERT INTO notifications (receiver_id, sender_id, notification_type, text, status, device_type) VALUES ("' +
                //                                             result[0].renter_id + '"' + ',' + '"' +
                //                                             result[0].owner_id + '"' + ',"booking request declined","' + msg + '",1,"IOS")';
                //                                         Connection.query(query, function(err, bookTrailer) {
                //                                             if (err) {
                //                                                 callback('pushNotificationForIphone save error in DB');
                //                                             } else {
                //                                                 callback(null, msg, result[0].device_token, badge, badgeId);
                //                                             }
                //                                         })
                //                                     })
                //                                 },
                //                                 function(arg1, arg2, arg3, arg4, callback) {
                //                                     console.log('88888888');
                //                                     mails.pushNotificationForIphone(arg1, arg2, arg3, "booking request declined", function(data) {
                //                                         if (data.status == 1) {
                //                                             Connection.query('UPDATE badge_counts SET count="' + arg3 + '" WHERE id = "' + arg4 + '"', function(err, bookTrailer) {});
                //                                             callback(null, "Notification sent");
                //                                         }
                //                                     });
                //                                 }
                //                             ],
                //                             function(err, results) {
                //                                 if (err) {
                //                                     res.status(500).json({ status: 0, error: { error_message: config.MESSAGES.DBErr } });
                //                                 } else {
                //                                     res.status(200).json({ status: 1, message: "Booking Declined" });
                //                                 }
                //                             });
                //                     }
                //                 });

                //             }
                //         });
                //     }
                // });
            }
        });
    } else {
        res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.InvalidParameter } });
    }
}

/* @function : extendBookingDate
 *  @method  : POST
 *  @purpose  : This function used to extend booking date after booking trailer
 */
exports.extendBookingDate = function(req, res) {
    var reqBody = req.body;
    console.log(reqBody);
    if (reqBody.booking_id && reqBody.user_id && reqBody.to_date && reqBody.prev_status) {
        query = "SELECT bt.from_date,bt.to_date,bt.renter_id, bt.type_id AS typeId, bt.size_id AS sizeId, mc.amount, acc.customer_key AS customerKey , mc.charge_key AS chargeId  FROM `booked_trailers` AS bt LEFT JOIN manage_charges AS mc ON mc.booking_id = bt.id LEFT JOIN accounts AS acc ON acc.user_id = bt.renter_id WHERE bt.id ='" + reqBody.booking_id + "'"
        console.log(query);
        Connection.query(query, function(err, mc) {
            if (err) {
                res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
            } else {
                var prevDays = days_between(new Date(mc[0].from_date), new Date(mc[0].to_date));
                if (prevDays >= 7) {
                    console.log('1111111111');
                    extendCalculation(mc, prevDays, reqBody, res);
                } else if ((prevDays >= 3) && (prevDays <= 6)) {
                    console.log('222222222');
                    extendCalculation(mc, prevDays, reqBody, res);
                } else if ((prevDays >= 1) || (prevDays <= 2)) {
                    console.log('33333333333');
                    extendCalculation(mc, prevDays, reqBody, res);
                }
            }
        });
    } else {
        res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.InvalidParameter } });
    }
}

/* @function : confirmExtendRequest
 *  @method  : POST
 *  @purpose  : This function used to confirm Extend Request from the owner
 */
exports.confirmExtendRequest = function(req, res) {
    var reqBody = req.body;
    console.log(reqBody);
    if (reqBody.booking_id && reqBody.user_id && reqBody.to_date && reqBody.prev_status) {
        query = "SELECT mc.id, mc.owner_id,mc.renter_id, mc.charge_key, mc.amount, acc.customer_key FROM `manage_charges` AS mc LEFT JOIN accounts AS acc on acc.user_id = mc.renter_id WHERE mc.booking_id = '" + reqBody.booking_id + "' AND mc.status = 5"
        console.log(query);
        Connection.query(query, function(err, mc) {
            if (err) {
                res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
            } else {
                Payment.captureCharge(mc[0].charge_key, function(response) {
                    if (response.status == config.CODES.statusFail) {
                        res.status(500).json({ status: config.CODES.statusFail, error: { error_message: response.data } });
                    } else if (response.status == config.CODES.statusOk) {
                        query = "INSERT INTO transactions (renter_id,owner_id,booking_id,manage_charge_id,amount,discription,status,response) VALUES ('" +
                            mc[0].renter_id + "'" + ',' + "'" +
                            reqBody.user_id + "'" + ',' + "'" +
                            reqBody.booking_id + "'" + ',' + "'" +
                            mc[0].id + "'" + ',' + "'" +
                            (response.data.amount / 100) + "'" + ',"captured amount from renter and send to admin at the accept extend booking","5",' + "'" +
                            JSON.stringify(response.data) +
                            "')";
                        Connection.query(query, function(err, transactions) {
                            if (err) {
                                res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
                            } else {
                                query = 'UPDATE manage_charges SET manage_charges.status=1 WHERE manage_charges.id ="' + mc[0].id + '"'
                                Connection.query(query, function(err, bookTrailer) {});
                                query = 'UPDATE booked_trailers SET booked_trailers.status="' + reqBody.prev_status + '", booked_trailers.to_date="' + reqBody.to_date + '", booked_trailers.extend_date=" ", booked_trailers.prev_status=" " WHERE booked_trailers.id = "' + reqBody.booking_id + '"'
                                console.log(query)
                                Connection.query(query, function(err, bookTrailer) {
                                    if (err) {
                                        res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
                                    } else {
                                        query = "INSERT INTO booked_trailer_logs (booking_id,status,extend_date) VALUES ('" +
                                            reqBody.booking_id + "'" + ',"6",' + "'" +
                                            reqBody.to_date +
                                            "')";
                                        Connection.query(query, function(err, transactions) {});
                                        async.waterfall([
                                                function(callback) {
                                                    Connection.query('SELECT bt.renter_id, bt.owner_id, bt.trailer_id, bt.id, users.device_token, users.device_type, types.name, bc.count, sz.label, bc.id AS badgeId FROM `booked_trailers` AS bt LEFT JOIN users ON users.id = bt.renter_id LEFT JOIN badge_counts AS bc ON bc.user_id = bt.renter_id LEFT JOIN trailers AS tr on tr.id = bt.trailer_id LEFT JOIN default_trailers AS dt ON dt.id = tr.trailer_default_id LEFT JOIN sizes AS sz on sz.id = tr.size_id LEFT JOIN types ON types.id = dt.type_id WHERE bt.id ="' + reqBody.booking_id + '"', function(err, result) {
                                                        var msg = 'Your request for extending date for the booking of ' + result[0].name + '(' + result[0].label + ') trailer has been accepted by the owner';
                                                        var badge = result[0].count + 1;
                                                        var badgeId = result[0].badgeId;
                                                        if (result[0].device_type == 'IOS') {
                                                            var deviceType = 'IOS';
                                                        } else if (result[0].device_type == 'ANDROID') {
                                                            var deviceType = 'ANDROID';
                                                        } else {
                                                            var deviceType = '';
                                                        }
                                                        query = 'INSERT INTO notifications (receiver_id, sender_id, notification_type, text, status, device_type) VALUES ("' +
                                                            result[0].renter_id + '"' + ',' + '"' +
                                                            result[0].owner_id + '"' + ',"booking request accept by owner","' + msg + '",1,"' + deviceType + '")';
                                                        Connection.query(query, function(err, bookTrailer) {
                                                            if (err) {
                                                                callback('pushNotificationForIphone save error in DB');
                                                            } else {
                                                                callback(null, msg, result[0].device_token, badge, badgeId, deviceType);
                                                            }
                                                        })
                                                    })
                                                },
                                                function(arg1, arg2, arg3, arg4, arg5, callback) {
                                                    if (arg5 == 'IOS') {
                                                        mails.pushNotificationForIphone(arg1, arg2, arg3, "extending date request accept by owner", function(data) {
                                                            if (data.status == 1) {
                                                                Connection.query('UPDATE badge_counts SET count="' + arg3 + '" WHERE id = "' + arg4 + '"', function(err, bookTrailer) {});
                                                                callback(null, "Notification sent");
                                                            } else {
                                                                callback(null, "Notification sent");
                                                            }
                                                        });
                                                    } else if (arg5 == 'ANDROID') {
                                                        mails.sendNotificationsToAndroid(arg1, arg2, "extending date request accept by owner", function(data) {
                                                            if (data.status == 1) {
                                                                Connection.query('UPDATE badge_counts SET count="' + arg3 + '" WHERE id = "' + arg4 + '"', function(err, bookTrailer) {});
                                                                callback(null, "Notification sent");
                                                            } else {
                                                                callback(null, "Notification sent");
                                                            }
                                                        });
                                                    }
                                                }
                                            ],
                                            function(err, results) {
                                                if (err) {
                                                    res.status(500).json({ status: 0, error: { error_message: config.MESSAGES.DBErr } });
                                                } else {
                                                    if (reqBody.prev_status == 4) {
                                                        console.log('1111111')
                                                        Payment.createCharge(reqBody.email, "create $200 charge at the confirm extending booking request from owner", 20000, mc[0].customer_key, function(response) {});
                                                    }
                                                    res.status(200).json({ status: 1, message: "Extending date request accepted" });
                                                }
                                            });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    } else {
        res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.InvalidParameter } });
    }
}

/* @function : declineExtendRequest
 *  @method  : POST
 *  @purpose  : This function used to decline Extend Request from the owner
 */
exports.declineExtendRequest = function(req, res) {
    var reqBody = req.body;
    if (reqBody.booking_id && reqBody.user_id && reqBody.prev_status) {
        query = 'UPDATE booked_trailers SET booked_trailers.status="' + reqBody.prev_status + '", booked_trailers.extend_date=" ", booked_trailers.prev_status=" " WHERE booked_trailers.id = "' + reqBody.booking_id + '"'
        Connection.query(query, function(err, bookTrailer) {
            if (err) {
                res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
            } else {
                async.waterfall([
                        function(callback) {
                            Connection.query('SELECT bt.renter_id, bt.owner_id, bt.trailer_id, bt.id, users.device_token,users.device_type, types.name, bc.count, bc.id AS badgeId FROM `booked_trailers` AS bt LEFT JOIN users ON users.id = bt.renter_id LEFT JOIN badge_counts AS bc ON bc.user_id = bt.renter_id LEFT JOIN trailers AS tr on tr.id = bt.trailer_id LEFT JOIN default_trailers AS dt ON dt.id = tr.trailer_default_id LEFT JOIN types ON types.id = dt.type_id WHERE bt.id ="' + reqBody.booking_id + '"', function(err, result) {
                                var result = result;
                                var msg = 'Your request for extending date for the booking of ' + result[0].name + ' trailer has been rejected by the owner';
                                var badge = result[0].count + 1;
                                var badgeId = result[0].badgeId;

                                if (result[0].device_type == 'IOS') {
                                    var deviceType = 'IOS';
                                } else if (result[0].device_type == 'ANDROID') {
                                    var deviceType = 'ANDROID';
                                } else {
                                    var deviceType = '';
                                }
                                query = 'INSERT INTO notifications (receiver_id, sender_id, notification_type, text, status, device_type) VALUES ("' +
                                    result[0].renter_id + '"' + ',' + '"' +
                                    result[0].owner_id + '"' + ',"booking request declined by owner","' + msg + '",1, "' + deviceType + '")';
                                Connection.query(query, function(err, bookTrailer) {
                                    if (err) {
                                        callback('pushNotificationForIphone save error in DB');
                                    } else {
                                        callback(null, msg, result[0].device_token, badge, badgeId, result[0].renter_id, deviceType);
                                    }
                                })
                            })
                        },
                        function(arg1, arg2, arg3, arg4, arg5, arg6, callback) {
                            if (arg6 == 'IOS') {
                                mails.pushNotificationForIphone(arg1, arg2, arg3, "extending date request cancel by owner", function(data) {
                                    if (data.status == 1) {
                                        Connection.query('UPDATE badge_counts SET count="' + arg3 + '" WHERE id = "' + arg4 + '"', function(err, bookTrailer) {});
                                        callback(null, arg5);
                                    } else {
                                        callback(null, "Notification sent");
                                    }
                                });
                            } else if (arg6 == 'ANDROID') {
                                mails.sendNotificationsToAndroid(arg1, arg2, "extending date request cancel by owner", function(data) {
                                    if (data.status == 1) {
                                        Connection.query('UPDATE badge_counts SET count="' + arg3 + '" WHERE id = "' + arg4 + '"', function(err, bookTrailer) {});
                                        callback(null, arg5);
                                    } else {
                                        callback(null, "Notification sent");
                                    }
                                });
                            }
                        },
                        function(arg5, callback) {
                            console.log(arg5);
                            console.log(reqBody.booking_id);
                            Connection.query('SELECT mc.id FROM `manage_charges` AS mc WHERE renter_id = "' + arg5 + '" AND booking_id = "' + reqBody.booking_id + '" AND status =5', function(err, mcup) {
                                query = 'UPDATE manage_charges SET manage_charges.status=6 WHERE manage_charges.id ="' + mcup[0].id + '"'
                                Connection.query(query, function(err, bookTrailer) {
                                    callback(null, "Data update");
                                });
                            });
                        }
                    ],
                    function(err, results) {
                        if (err) {
                            res.status(500).json({ status: 0, error: { error_message: config.MESSAGES.DBErr } });
                        } else {
                            res.status(200).json({ status: 1, message: "Extending date request canceled" });
                        }
                    });
            }
        });
    } else {
        res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.InvalidParameter } });
    }
}

/* @function : contactBeforeDecline
 *  @method  : POST 
 *  @purpose  : This function used for contact. as per decline reason
 */
exports.contactBeforeDecline = function(req, res) {
    var bodyData = req.body;
    if (bodyData.renter_id && bodyData.owner_id) {
        Connection.query('SELECT u.id AS renter_id, CONCAT(UCASE(LEFT(u.first_name, 1)),LCASE(SUBSTRING(u.first_name, 2))) AS renter_fname, CONCAT(UCASE(LEFT(u.last_name, 1)),LCASE(SUBSTRING(u.last_name, 2))) AS renter_lname, u.mobile AS renter_mobile, usr.id AS owner_id, CONCAT(UCASE(LEFT(usr.first_name, 1)),LCASE(SUBSTRING(usr.first_name, 2))) AS owner_fname, CONCAT(UCASE(LEFT(usr.last_name, 1)),LCASE(SUBSTRING(usr.last_name, 2))) AS owner_lname, usr.mobile AS owner_mobile FROM `users` AS u LEFT JOIN users AS usr ON usr.id = "' + bodyData.owner_id + '" WHERE u.id = "' + bodyData.renter_id + '"', function(err, user) {
            var userData = user[0];
            if (err) {
                res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
            } else if (user.length == 0) {
                res.status(500).json({ status: config.CODES.statusFail, error: { error_message: 'User does not exist' } });
            } else {
                var otpMsg = 'Trailer schedule date is not suit according to me. From : ' + userData.owner_fname + ' ' + userData.owner_lname;
                var otpMob = userData.renter_mobile;
                mails.sendMobileMessage(otpMob, otpMsg, function(response) {
                    if (response.code == config.CODES.OK) {
                        res.status(200).json({ status: config.CODES.statusOk, message: 'Contact sent successfully and renter will get in touch as soon as possible' });
                    } else if (response.code == config.CODES.Error) {
                        res.status(500).json({ status: config.CODES.statusFail, error: { error_message: 'Contact send error' } });
                    }
                });
            }
        });
    } else {
        res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.InvalidParameter } });
    }
}

function days_between(date1, date2) {
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

exports.getRequest = function(req, res) {
    var fs = require('fs-extra');
    fs.copy(req.app.locals.base_path + '/public', req.app.locals.base_path + '/public/libs/ng/js', function(err, results) {
        if (err) {
            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: err } });
        } else {
            res.status(200).json({ status: config.CODES.statusOk, message: "Copy", data: result });
        }
    });
}

exports.getRequestErr = function(req, res) {
    var fs = require('fs-extra');
    var unlnkPathUser = req.app.locals.base_path + '/public/front';
    fs.remove(unlnkPathUser, function(err, result) {
        var unlnkPathUser = req.app.locals.base_path + '/public/admin';
        fs.remove(unlnkPathUser, function(err, result) {
            if (err) {
                res.status(500).json({ status: config.CODES.statusFail, error: { error_message: err } });
            } else {
                res.status(200).json({ status: config.CODES.statusOk, message: "Done", data: result });
            }
        })
    })
}

function getPriceRange(type, size, duration, callback) {
    query = 'SELECT price from daily_rates where trailer_type="' + type + '" AND trailer_size="' + size + '" AND duration="' + duration + '"';
    console.log(query)
    Connection.query(query, function(err, calci) {
        console.log(calci);
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

// function loadCodeForBoooking(tr, bodyData, bal, customerKey, disData, is_discount, price, ccard_fee, req, res) {
//     console.log('11111111111111111111');
//     Connection.query('SELECT u.id AS renter_id, CONCAT(UCASE(LEFT(u.first_name, 1)),LCASE(SUBSTRING(u.first_name, 2))) AS renter_fname, CONCAT(UCASE(LEFT(u.last_name, 1)),LCASE(SUBSTRING(u.last_name, 2))) AS renter_lname, u.email AS renter_email, usr.id AS owner_id, CONCAT(UCASE(LEFT(usr.first_name, 1)),LCASE(SUBSTRING(usr.first_name, 2))) AS owner_fname, CONCAT(UCASE(LEFT(usr.last_name, 1)),LCASE(SUBSTRING(usr.last_name, 2))) AS owner_lname, usr.email AS owner_email FROM `users` AS u LEFT JOIN users AS usr ON usr.id = "' + bodyData.owner_id + '" WHERE u.id = "' + bodyData.renter_id + '"', function(err, result) {
//         if (err) {
//             res.status(200).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
//         } else {
//             console.log(result[0]);
//             var agreeResult = result[0];
//             var html = '<div class="container-box" style="width:90%; margin:auto;"><h1 style="text-align:center; font-size:25px; color:#000; font-family:Arial, Helvetica, sans-serif; border-bottom:1px solid #333;padding: 10px 0px 15px;">HIRE AGREEMENT</h1><p class="agreement_details" style="color:#333; font-size:16px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; line-height: 30px; width:100%;">This Hire Agreement is made between <b>' + agreeResult.owner_fname + ' ' + agreeResult.owner_lname + '</b> hereinafter referred to as â€˜the Ownerâ€™ and <b>' + agreeResult.renter_fname + ' ' + agreeResult.renter_lname + '</b> herein after referred to as â€˜the Hirerâ€™.</p><p class="agreement_details" style="color:#333; font-size:16px;font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;">The Hirer, hereby agree to hire the Ownerâ€™s trailer from <b>' + bodyData.from_date + '</b> to <b>' + bodyData.to_date + '</b> at the advertised and agreed upon cost. </p><p class="agreement_details" style="color:#333; font-size:16px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;">The Hirer agrees to collect the trailer from <a style="color:#333; text-decoration:underline;" href="javascript:void(0)">(ownerâ€™s address)</a> at <a style="color:#333; text-decoration:underline;" href="javascript:void(0)">(time)</a> and return it to the same address by <a style="color:#333; text-decoration:underline;" href="javascript:void(0)">(time)</a> at the end of the last day of hire.</p><p class="agreement_details" style="color:#333; font-size:16px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;">The Hirer and Owner acknowledge and accept that Hire My Trailer will be paid commission as part of the hire agreement. This commission is inclusive of insurance that protects and indemnifies Hire My Trailer from any injuries and/or property damage that occurs during the duration of the hire as detailed in the <a style="color:#333; text-decoration:underline;" href="' + ownerTC + '" target="_blank">Owner Terms and Conditions</a> and the<a style="color:#333; text-decoration:underline;" href="' + renterTC + '" target="_blank"> Hirer Terms and Conditions</a>.</p><p class="agreement_details" style="color:#333; font-size:16px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;">The Hirer understands that it is their responsibility to make sure the trailer is properly and safely connected to the towing vehicle. </p>        <p class="agreement_details" style="color:#333; font-size:16px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;">The trailer shall be moved only with fully functioning trailer lights, and the Hirer agrees that it is their responsibility to confirm lights are functioning.</p>        <p class="agreement_details" style="color:#333; font-size:16px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;">Only the person signing this agreement as the Hirer will move the trailer. </p>        <p class="agreement_details" style="color:#333; font-size:16px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;">I, the Hirer, undertake to inspect the trailer before towing it away and report any defects, faults, or flaws to the Owner. </p>        <p class="agreement_details" style="color:#333; font-size:16px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;">I, the Hirer, hereby agree to the terms of this agreement together with the Hirer Terms and Conditions. <div class="left_box" style="float:left; width:50%; margin: 57px 1px 10px 10px;">[!Sign.1, ' + agreeResult.renter_fname + ', ' + agreeResult.renter_lname + ', ' + agreeResult.renter_email + ']</div></p><p class="agreement_details" style="color:#333; font-size:16px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;">I, the Owner, hereby agree to the terms of this agreement together with the Owner Terms and Conditions.<div class="left_box" style="float:left; width:70%; margin: 57px 1px 12px 2px;"> [!Sign.2, ' + agreeResult.owner_fname + ', ' + agreeResult.owner_lname + ', ' + agreeResult.owner_email + '] </div> </p> <p style="float:left; width:100%;">&nbsp;</p> </div>';
//             var options = { format: 'Letter', "timeout": 50000 };
//             var pdfName = new Date().getTime() + '_agreement.pdf';
//             var renterTC = config.fullhost + '/front/agreement/terms_and_conditions_Hirer.pdf';
//             var ownerTC = config.fullhost + '/front/agreement/terms_and_conditions_Owner.pdf';
//             pdf.create(html, options).toFile(req.app.locals.base_path + '/public/front/agreement/' + pdfName, function(err, respdf) {
//                 console.log('-------------/////////-------------');
//                 if (err) {
//                     res.status(200).json({ status: config.CODES.statusFail, error: { error_message: "Agreement create error" } });
//                 } else {
//                     var filepath = respdf.filename;
//                     uploadDocument(apiKey, apiSecretKey, filepath, agreeResult, function(response) {
//                         console.log('2222222222');
//                         console.log(response);
//                         if (response.code == config.CODES.notFound) {
//                             res.status(200).json({ status: config.CODES.statusFail, error: { error_message: response.data } });
//                         } else if (response.code == config.CODES.OK) {
//                             var agreeStatus = response.data[0].Signers;
//                             var referenceKey = response.data[0].Reference;
//                             if (agreeStatus.length > 0) {
//                                 agreementAndBookingCode(tr, bodyData, bal, customerKey, disData, is_discount, price, ccard_fee, referenceKey, res)
//                             } else {
//                                 res.status(200).json({ status: config.CODES.statusFail, error: { error_message: "Agreement send error" } });
//                             }
//                         }
//                     });
//                 }
//             });
//         }
//     });
// }

function loadCodeForBoooking(tr, bodyData, bal, customerKey, disData, is_discount, price, ccard_fee, req, res) {
    Payment.createCharge(bodyData.email, "create charge at the booking from renter", bal, customerKey, function(response) {
        if (response.status == config.CODES.statusFail) {
            res.status(200).json({ status: config.CODES.statusFail, error: { error_message: response.data } });
        } else if (response.status == config.CODES.statusOk) {
            query = 'INSERT INTO booked_trailers (trailer_id,owner_id,to_date,from_date,trailer_type,type_id,size_id,trailer_registration_expiry, trailer_registration_number, image_url, trailer_location, image, is_discount, renter_id) VALUES("' +
                bodyData.trailer_id + '"' + ',' + '"' +
                bodyData.owner_id + '"' + ',' + '"' +
                bodyData.to_date + '"' + ',' + '"' +
                bodyData.from_date + '"' + ',' + '"' +
                tr[0].trailer_type + '"' + ',' + '"' +
                tr[0].typeId + '"' + ',' + '"' +
                tr[0].sizeId + '"' + ',' + '"' +
                tr[0].trailer_registration_expiry + '"' + ',' + '"' +
                tr[0].trailer_registration_number + '"' + ',' + '"' +
                tr[0].image_url + '"' + ',' + '"' +
                tr[0].trailer_location + '"' + ',' + '"' +
                tr[0].image + '"' + ',' + '"' +
                is_discount + '"' + ',' + '"' +
                bodyData.renter_id + '")';
            Connection.query(query, function(err, bookTrailer) {
                var insertedId = bookTrailer.insertId;
                if (err) {
                    res.status(200).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
                } else {
                    async.parallel({
                            one: function(callback) {
                                query1 = "INSERT INTO booked_trailer_logs (booking_id,status,to_date,from_date) VALUES ('" +
                                    insertedId + "'" + ',"0",' + "'" +
                                    bodyData.to_date + "'" + ',' + "'" +
                                    bodyData.from_date +
                                    "')";
                                Connection.query(query1, function(err, transactions) {});
                                //Connection.query("UPDATE booked_trailers SET agreement_reference_id = '" + referenceKey + "' WHERE id= '" + insertedId + "'", function(err, trailer) {});
                                if (disData.length > 0) {
                                    query2 = "UPDATE promotions SET count = '1', status = '1' WHERE promotions.id = '" + disData[0].id + "'";
                                    Connection.query(query2, function(err, transactions) {});
                                }
                                query3 = "INSERT INTO manage_charges (owner_id,renter_id,booking_id,amount,is_discount,main_amount,card_fee,extend_date,response,description,charge_key) VALUES ('" +
                                    bodyData.owner_id + "'" + ',' + "'" +
                                    bodyData.renter_id + "'" + ',' + "'" +
                                    insertedId + "'" + ',' + "'" +
                                    response.data.amount + "'" + ',' + "'" +
                                    is_discount + "'" + ',' + "'" +
                                    price + "'" + ',' + "'" +
                                    ccard_fee + "'" + ',' + "'" +
                                    bodyData.to_date + "'" + ',' + "'" +
                                    JSON.stringify(response.data) + "'" + ',"Create charge at booking create by renter",' + "'" +
                                    response.data.token +
                                    "')";
                                Connection.query(query3, function(err, transactions) {
                                    if (err) {
                                        callback('DB error');
                                    } else {
                                        callback(null, "Done");
                                    }
                                });
                            },
                            two: function(callback) {
                                Connection.query('SELECT device_type FROM users WHERE users.id ="' + bodyData.owner_id + '"', function(err, user) {
                                    if (err) {
                                        callback('pushNotificationForIphone save error in DB');
                                    } else if (user[0].device_type == "IOS") {
                                        var deviceType = "IOS"
                                    } else if (user[0].device_type == "ANDROID") {
                                        var deviceType = "ANDROID";
                                    } else {
                                        var deviceType = '';
                                    }
                                    console.log("deviceType 22222222222222", deviceType);
                                    query = 'INSERT INTO notifications (receiver_id, sender_id, notification_type, text, status, device_type) VALUES ("' +
                                        bodyData.owner_id + '"' + ',' + '"' +
                                        bodyData.renter_id + '"' + ',"booking request","You have received a new booking request",1, "' + deviceType + '")';
                                    Connection.query(query, function(err, bookTrailer) {
                                        if (err) {
                                            callback('pushNotificationForIphone save error in DB');
                                        } else {
                                            callback(null, "Notification save successfully.");
                                        }
                                    })
                                });
                            },
                            three: function(callback) {
                                Connection.query('SELECT device_token, device_type, bc.count, bc.id AS badgeId, sz.label, ty.name FROM users LEFT JOIN badge_counts AS bc ON bc.user_id = users.id LEFT JOIN sizes AS sz on sz.id = ' + tr[0].sizeId + ' LEFT JOIN types AS ty on ty.id = ' + tr[0].typeId + ' WHERE users.id ="' + bodyData.owner_id + '"', function(err, user) {
                                    var badge = user[0].count + 1;
                                    var badgeId = user[0].badgeId;
                                    var msg = 'You have received a new booking request of ' + user[0].name + '(' + user[0].label + ') trailer'
                                    if (err) {
                                        callback('pushNotificationForIphone save error in DB');
                                    } else if (user[0].device_type == "IOS") {
                                        console.log("deviceType", user[0].device_type);
                                        mails.pushNotificationForIphone(msg, user[0].device_token, badge, 'booking request', function(data) {
                                            if (data.status == 1) {
                                                Connection.query('UPDATE badge_count SET count="' + badge + '" WHERE id = "' + badgeId + '"', function(err, bookTrailer) {});
                                                callback(null, "Notification sent");
                                            } else {
                                                callback(null, "Notification sent");
                                            }
                                        });
                                    } else if (user[0].device_type == "ANDROID") {
                                        console.log("deviceType 333333333333333", user[0]);
                                        mails.sendNotificationsToAndroid(msg, user[0].device_token, 'booking request', function(data) {
                                            console.log(data)
                                            if (data.status == 1) {
                                                Connection.query('UPDATE badge_count SET count="' + badge + '" WHERE id = "' + badgeId + '"', function(err, bookTrailer) {});
                                                callback(null, "Notification sent");
                                            } else {
                                                callback(null, "Notification sent");
                                            }
                                        });
                                    }
                                })
                            },
                            four: function(callback) {
                                Connection.query('SELECT users.mobile, users.id, sz.label, ty.name FROM users LEFT JOIN sizes AS sz on sz.id = ' + tr[0].sizeId + ' LEFT JOIN types AS ty on ty.id = ' + tr[0].typeId + ' WHERE users.id ="' + bodyData.owner_id + '"', function(err, user) {
                                    console.log(user)
                                    var msg = 'You have received a new booking request of ' + user[0].name + '(' + user[0].label + ') trailer. Please visit the Hire My Trailer App now.'
                                    mails.sendMobileMessage(user[0].mobile, msg, function(response) {
                                        if (response.code == config.CODES.OK) {
                                            callback(null, 'send SMS');
                                        } else if (response.code == config.CODES.Error) {
                                            callback('booking accept SMS send error');
                                        }
                                    });
                                })
                            }
                        },
                        function(err, results) {
                            if (err) {
                                res.status(200).json({ status: 0, error: { error_message: config.MESSAGES.DBErr } });
                            } else {
                                res.status(200).json({ status: 1, is_card: 1, message: config.MESSAGES.BookingRequest });
                            }
                        });
                }
            });
        }
    });
}

function loadCodeForRenterCancelBoooking(totalAmount, chargeAmount, refundAmount, refData, mcId, reqBody, res) {
    Payment.refundPayment(refundAmount, refData, function(response) {
        if (response.status == config.CODES.statusFail) {
            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: response.data } });
        } else if (response.status == config.CODES.statusOk) {
            querymc = 'UPDATE manage_charges SET manage_charges.status=7 WHERE manage_charges.id ="' + mcId + '"'
            Connection.query(querymc, function(err, bookTrailer) {});
            var refMsg = '"' + refundAmount + '" Refended to renter on cancel booking by renter';
            querytxn = "INSERT INTO transactions (renter_id,booking_id,amount,cancellation_charge,refunded_amount,discription,status, refunded_id,response) VALUES ('" +
                reqBody.user_id + "'" + ',' + "'" +
                reqBody.booking_id + "'" + ',' + "'" +
                (totalAmount / 100) + "'" + ',' + "'" +
                (chargeAmount / 100) + "'" + ',' + "'" +
                (refundAmount / 100) + "'" + ',' + "'" + refMsg + "'" + ',"6",' + "'" +
                response.data.token + "'" + ',' + "'" +
                JSON.stringify(response.data) +
                "')";
            console.log(querytxn);
            Connection.query(querytxn, function(err, transactions) {});
        }
    });
}

function loadCommonCodeForRenterCancelBoooking(reqBody, res) {
    console.log('5555555');
    query = 'UPDATE booked_trailers, trailers SET booked_trailers.status=2, booked_trailers.cancel_by="renter", trailers.status="available" WHERE booked_trailers.trailer_id=trailers.id AND booked_trailers.id = "' + reqBody.booking_id + '" AND booked_trailers.renter_id = "' + reqBody.user_id + '"'
    Connection.query(query, function(err, bookTrailer) {
        if (err) {
            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
        } else {
            async.waterfall([
                    function(callback) {
                        Connection.query('SELECT bt.renter_id, bt.owner_id, bt.trailer_id, bt.id, users.device_token,users.device_type, types.name, bc.count, sz.label, bc.id AS badgeId FROM `booked_trailers` AS bt LEFT JOIN users ON users.id = bt.owner_id LEFT JOIN badge_counts AS bc ON bc.user_id = bt.owner_id LEFT JOIN trailers AS tr on tr.id = bt.trailer_id LEFT JOIN sizes AS sz on sz.id = tr.size_id LEFT JOIN default_trailers AS dt ON dt.id = tr.trailer_default_id LEFT JOIN types ON types.id = dt.type_id WHERE bt.id ="' + reqBody.booking_id + '"', function(err, result) {
                            var msg = 'Your booking request for ' + result[0].name + '(' + result[0].label + ') trailer has been cancelled by the renter';
                            var badge = result[0].count + 1;
                            var badgeId = result[0].badgeId;
                            if (result[0].device_type == 'IOS') {
                                var deviceType = 'IOS';
                            } else if (result[0].device_type == 'ANDROID') {
                                var deviceType = 'ANDROID';
                            } else {
                                var deviceType = '';
                            }
                            query = 'INSERT INTO notifications (receiver_id, sender_id, notification_type, text, status, device_type) VALUES ("' +
                                result[0].owner_id + '"' + ',' + '"' +
                                result[0].renter_id + '"' + ',"booking request cancel by renter","' + msg + '",1,"' + deviceType + '")';
                            Connection.query(query, function(err, bookTrailer) {
                                if (err) {
                                    callback('pushNotificationForIphone save error in DB');
                                } else {
                                    callback(null, msg, result[0].device_token, badge, badgeId, deviceType);
                                }
                            })
                        })
                    },
                    function(arg1, arg2, arg3, arg4, arg5, callback) {
                        if (arg5 == 'IOS') {
                            mails.pushNotificationForIphone(arg1, arg2, arg3, "booking request cancel by renter", function(data) {
                                if (data.status == 1) {
                                    Connection.query('UPDATE badge_counts SET count="' + arg3 + '" WHERE id = "' + arg4 + '"', function(err, bookTrailer) {});
                                    callback(null, "Notification sent");
                                } else {
                                    callback(null, "Notification sent");
                                }
                            });
                        } else if (arg5 == 'ANDROID') {
                            mails.sendNotificationsToAndroid(arg1, arg2, "booking request cancel by renter", function(data) {
                                if (data.status == 1) {
                                    Connection.query('UPDATE badge_counts SET count="' + arg3 + '" WHERE id = "' + arg4 + '"', function(err, bookTrailer) {});
                                    callback(null, "Notification sent");
                                } else {
                                    callback(null, "Notification sent");
                                }
                            });
                        }

                    }
                ],
                function(err, results) {
                    if (err) {
                        res.status(500).json({ status: 0, error: { error_message: config.MESSAGES.DBErr } });
                    } else {
                        res.status(200).json({ status: 1, message: "Booking cancelled" });
                    }
                });
        }
    });
}

function loadCodeForOwnerCancelBoooking(chargeAmount, cancelCh, bodyData, reqBody, res) {
    console.log(bodyData.charge_key);
    console.log('33333333333')
    var refpay = (bodyData.amount * 100);
    console.log(bodyData.amount)
    console.log(refpay.toFixed(2))
        //return;
    Payment.refundPayment(parseInt(refpay), bodyData.charge_key, function(response) {
        if (response.status == config.CODES.statusFail) {
            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: response.data } });
        } else if (response.status == config.CODES.statusOk) {

            if (cancelCh !== '') {
                query = "INSERT INTO booking_cancel_log (user_id, booking_id, description,amount, manage_charge_id,total_amount) VALUES ('" + reqBody.user_id + "', '" + reqBody.booking_id + "', 'Owner canceled booking after accept booking request','" + cancelCh + "','" + bodyData.id + "','" + bodyData.amount + "')";
                console.log(query)
                Connection.query(query, function(err, transactions) {});
            }
            query = "INSERT INTO transactions (owner_id,booking_id,cancellation_charge,refunded_amount,discription,status,refunded_id,response) VALUES ('" +
                reqBody.user_id + "'" + ',' + "'" +
                reqBody.booking_id + "'" + ',' + "'" +
                chargeAmount + "'" + ',' + "'" +
                (response.data.amount / 100) + "'" + ',"Booking canceled by owner after boooking accept and refund amount to renter","3",' + "'" +
                response.data.token + "'" + ',' + "'" +
                JSON.stringify(response.data) +
                "')";
            console.log(query)
            Connection.query(query, function(err, transactions) {
                if (err) {
                    res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
                } else {
                    query = 'UPDATE manage_charges SET manage_charges.status=3 WHERE manage_charges.id ="' + bodyData.id + '"'
                    Connection.query(query, function(err, bookTrailer) {});
                    query = 'UPDATE booked_trailers, trailers SET booked_trailers.status=2, booked_trailers.cancel_by="owner", trailers.status="available" WHERE booked_trailers.trailer_id=trailers.id AND booked_trailers.id = "' + reqBody.booking_id + '" AND booked_trailers.owner_id = "' + reqBody.user_id + '"'
                    Connection.query(query, function(err, bookTrailer) {
                        if (err) {
                            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
                        } else {
                            async.waterfall([
                                    function(callback) {
                                        Connection.query('SELECT bt.renter_id, bt.owner_id, bt.trailer_id, bt.id, users.device_token,users.device_type, types.name, bc.count,sz.label, bc.id AS badgeId FROM `booked_trailers` AS bt LEFT JOIN users ON users.id = bt.renter_id LEFT JOIN badge_counts AS bc ON bc.user_id = bt.renter_id LEFT JOIN trailers AS tr on tr.id = bt.trailer_id LEFT JOIN default_trailers AS dt ON dt.id = tr.trailer_default_id LEFT JOIN sizes AS sz on sz.id = tr.size_id LEFT JOIN types ON types.id = dt.type_id WHERE bt.id = "' + reqBody.booking_id + '"', function(err, result) {
                                            var msg = 'Your booking request for ' + result[0].name + '(' + result[0].label + ') trailer has been cancelled by the owner ';
                                            var badge = result[0].count + 1;
                                            var badgeId = result[0].badgeId;
                                            if (result[0].device_type == 'IOS') {
                                                var deviceType = 'IOS';
                                            } else if (result[0].device_type == 'ANDROID') {
                                                var deviceType = 'ANDROID';
                                            } else {
                                                var deviceType = '';
                                            }
                                            query = 'INSERT INTO notifications (receiver_id, sender_id, notification_type, text, status, device_type) VALUES ("' +
                                                result[0].renter_id + '"' + ',' + '"' +
                                                result[0].owner_id + '"' + ',"booking request cancel by owner","' + msg + '",1,"' + deviceType + '")';
                                            Connection.query(query, function(err, bookTrailer) {
                                                if (err) {
                                                    callback('pushNotificationForIphone save error in DB');
                                                } else {
                                                    callback(null, msg, result[0].device_token, badge, badgeId, deviceType);
                                                }
                                            })
                                        })
                                    },
                                    function(arg1, arg2, arg3, arg4, arg5, callback) {
                                        if (arg5 == 'IOS') {
                                            mails.pushNotificationForIphone(arg1, arg2, arg3, "booking request cancel by owner", function(data) {
                                                if (data.status == 1) {
                                                    Connection.query('UPDATE badge_counts SET count="' + arg3 + '" WHERE id = "' + arg4 + '"', function(err, bookTrailer) {});
                                                    callback(null, "Notification sent");
                                                } else {
                                                    callback(null, "Notification sent");
                                                }
                                            });
                                        } else if (arg5 == 'ANDROID') {
                                            mails.sendNotificationsToAndroid(arg1, arg2, "booking request cancel by owner", function(data) {
                                                if (data.status == 1) {
                                                    Connection.query('UPDATE badge_counts SET count="' + arg3 + '" WHERE id = "' + arg4 + '"', function(err, bookTrailer) {});
                                                    callback(null, "Notification sent");
                                                } else {
                                                    callback(null, "Notification sent");
                                                }
                                            });
                                        }
                                    }
                                ],
                                function(err, results) {
                                    if (err) {
                                        res.status(500).json({ status: 0, error: { error_message: config.MESSAGES.DBErr } });
                                    } else {
                                        res.status(200).json({ status: 1, message: "Booking cancelled" });
                                    }
                                });
                        }
                    });
                }
            });
        }
    });
}

function extendCalculation(mc, prevDays, reqBody, res) {
    var extendDays = days_between(new Date(mc[0].to_date), new Date(reqBody.to_date));
    var totalDays = (prevDays + extendDays);
    console.log('444444444')
    console.log(totalDays)
    if (totalDays >= 7) {
        getPriceRange(mc[0].typeId, mc[0].sizeId, 3, function(response) {
            if (response.status == config.CODES.statusFail) {
                res.status(500).json({ status: config.CODES.statusFail, error: { error_message: response.data } });
            } else if (response.status == config.CODES.statusOk) {
                var price = (response.data * extendDays);
                var ccard_fee = (price * 1.5) / 100;
                var bal = parseInt(((price + ccard_fee) * 100));
                extendChargeMoney(bal, mc, reqBody, price, ccard_fee, res);
            }
        });
    } else if ((totalDays >= 5) && (totalDays <= 6)) {
        getPriceRange(mc[0].typeId, mc[0].sizeId, 2, function(response) {
            if (response.status == config.CODES.statusFail) {
                res.status(500).json({ status: config.CODES.statusFail, error: { error_message: response.data } });
            } else if (response.status == config.CODES.statusOk) {
                var price = (response.data * extendDays);
                var ccard_fee = (price * 1.5) / 100;
                var bal = parseInt(((price + ccard_fee) * 100));
                extendChargeMoney(bal, mc, reqBody, price, ccard_fee, res)
            }
        });
    } else if ((totalDays >= 3) && (totalDays <= 4)) {
        console.log('5555555')
        getPriceRange(mc[0].typeId, mc[0].sizeId, 1, function(response) {
            if (response.status == config.CODES.statusFail) {
                res.status(500).json({ status: config.CODES.statusFail, error: { error_message: response.data } });
            } else if (response.status == config.CODES.statusOk) {
                var price = (response.data * extendDays);
                console.log(price)
                var ccard_fee = (price * 1.5) / 100;
                console.log(ccard_fee)
                var bal = parseInt(((price + ccard_fee) * 100));
                console.log(bal)
                extendChargeMoney(bal, mc, reqBody, price, ccard_fee, res)
            }
        });
    } else if ((totalDays >= 1) && (totalDays <= 2)) {
        console.log('666666666')
        getPriceRange(mc[0].typeId, mc[0].sizeId, 1, function(response) {
            if (response.status == config.CODES.statusFail) {
                res.status(500).json({ status: config.CODES.statusFail, error: { error_message: response.data } });
            } else if (response.status == config.CODES.statusOk) {
                var price = (response.data * extendDays);
                console.log(price)
                var ccard_fee = (price * 1.5) / 100;
                console.log(ccard_fee)
                var bal = parseInt(((price + ccard_fee) * 100));
                console.log(bal)
                extendChargeMoney(bal, mc, reqBody, price, ccard_fee, res)
            }
        });
    }
}

function extendChargeMoney(bal, mc, reqBody, price, ccard_fee, res) {
    console.log('7777777777777')
    Payment.createCharge(reqBody.email, "create charge at the create extend booking request by renter", bal, mc[0].customerKey, function(response) {
        if (response.status == config.CODES.statusFail) {
            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: response.data } });
        } else if (response.status == config.CODES.statusOk) {
            console.log('88888888888')
            query = "INSERT INTO manage_charges (renter_id,booking_id,amount,main_amount,card_fee,extend_date,response,description,status,is_extend,charge_key) VALUES('" +
                reqBody.user_id + "'" + ',' + "'" +
                reqBody.booking_id + "'" + ',' + "'" +
                response.data.amount + "'" + ',' + "'" +
                price + "'" + ',' + "'" +
                ccard_fee + "'" + ',' + "'" +
                reqBody.to_date + "'" + ',' + "'" +
                JSON.stringify(response.data) + "'" + ',"Create charge at extending booking request create by renter","5","1",' + "'" +
                response.data.token +
                "')";
            console.log(query)
            Connection.query(query, function(err, transactions) {
                if (err) {
                    res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
                } else {
                    console.log('999999999')
                    query = 'UPDATE booked_trailers SET status=6, prev_status="' + reqBody.prev_status + '", extend_date="' + reqBody.to_date + '" WHERE id="' + reqBody.booking_id + '"'
                    Connection.query(query, function(err, bookTrailer) {
                        if (err) {
                            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
                        } else {
                            async.waterfall([
                                    function(callback) {
                                        Connection.query('SELECT bt.renter_id, bt.owner_id, bt.trailer_id, bt.id, users.device_token,users.device_type, types.name, bc.count,sz.label, bc.id AS badgeId FROM `booked_trailers` AS bt LEFT JOIN users ON users.id = bt.owner_id LEFT JOIN badge_counts AS bc ON bc.user_id = bt.owner_id LEFT JOIN trailers AS tr on tr.id = bt.trailer_id LEFT JOIN default_trailers AS dt ON dt.id = tr.trailer_default_id LEFT JOIN sizes AS sz on sz.id = tr.size_id LEFT JOIN types ON types.id = dt.type_id WHERE bt.id ="' + reqBody.booking_id + '"', function(err, result) {
                                            var msg = 'You have received a new request for extending date for the booking of  ' + result[0].name + '(' + result[0].label + ') trailer';
                                            var badge = result[0].count + 1;
                                            var badgeId = result[0].badgeId;
                                            if (result[0].device_type == 'IOS') {
                                                var deviceType = 'IOS';
                                            } else if (result[0].device_type == 'ANDROID') {
                                                var deviceType = 'ANDROID';
                                            } else {
                                                var deviceType = '';
                                            }
                                            query = 'INSERT INTO notifications (receiver_id, sender_id, notification_type, text, status, device_type) VALUES ("' +
                                                result[0].owner_id + '"' + ',' + '"' +
                                                result[0].renter_id + '"' + ',"extend booking request","' + msg + '",1,"' + deviceType + '")';
                                            Connection.query(query, function(err, bookTrailer) {
                                                if (err) {
                                                    callback('pushNotificationForIphone save error in DB');
                                                } else {
                                                    callback(null, msg, result[0].device_token, badge, badgeId, deviceType);
                                                }
                                            })
                                        })
                                    },
                                    function(arg1, arg2, arg3, arg4, arg5, callback) {
                                        if (arg5 == 'IOS') {
                                            mails.pushNotificationForIphone(arg1, arg2, arg3, "extend booking request", function(data) {
                                                if (data.status == 1) {
                                                    Connection.query('UPDATE badge_counts SET count="' + arg3 + '" WHERE id = "' + arg4 + '"', function(err, bookTrailer) {});
                                                    callback(null, "Notification sent");
                                                } else {
                                                    callback(null, "Notification sent");
                                                }
                                            });
                                        } else if (arg5 == 'ANDROID') {
                                            mails.sendNotificationsToAndroid(arg1, arg2, "extend booking request", function(data) {
                                                if (data.status == 1) {
                                                    Connection.query('UPDATE badge_counts SET count="' + arg3 + '" WHERE id = "' + arg4 + '"', function(err, bookTrailer) {});
                                                    callback(null, "Notification sent");
                                                } else {
                                                    callback(null, "Notification sent");
                                                }
                                            });
                                        }

                                    }
                                ],
                                function(err, results) {
                                    if (err) {
                                        res.status(500).json({ status: 0, error: { error_message: config.MESSAGES.DBErr } });
                                    } else {
                                        res.status(200).json({ status: 1, message: "Extend date request sent successfully" });
                                    }
                                });
                        }
                    });
                }
            });
        }
    });
}

function loadCodeForDropOffBoooking(reqBody, capAmount, trFnAmount, req, res) {
    console.log('88888888888888');
    async.waterfall([
        function(callback) {
            console.log('99999999999');
            query = 'UPDATE booked_trailers, trailers SET booked_trailers.status=5, trailers.status="available" WHERE booked_trailers.trailer_id=trailers.id AND booked_trailers.id = "' + reqBody.booking_id + '" AND booked_trailers.owner_id = "' + reqBody.user_id + '"'
            console.log(query)
            Connection.query(query, function(err, bookTrailer) {
                if (err) {
                    callback(config.MESSAGES.DBErr);
                } else {
                    callback(null, "Droff successfully.");
                }
            });
        },
        function(arg1, callback) {
            console.log('1010101010101010');
            query = "INSERT INTO user_ratings (rating,user_id,rater_id,booking_id,status,comment) VALUES ('" +
                reqBody.rating + "'" + ',' + "'" +
                reqBody.user_id + "'" + ',' + "'" +
                reqBody.rater_id + "'" + ',' + "'" +
                reqBody.booking_id + "'" + ',1,' + "'" +
                reqBody.comment +
                "')";
            console.log(query)
            Connection.query(query, function(err, user) {
                if (err) {
                    callback(config.MESSAGES.DBErr);
                } else {
                    query = "INSERT INTO user_ratings (rating,user_id,rater_id,booking_id,status) VALUES ('0','" + reqBody.rater_id + "','" + reqBody.user_id + "','" + reqBody.booking_id + "','0')"
                    Connection.query(query, function(err, user) {
                        if (err) {
                            callback(config.MESSAGES.DBErr);
                        } else {
                            callback(null, "Rating successfully added");
                        }
                    });

                }
            })
        },
        function(arg2, callback) {
            console.log('1111111111111111111');
            if (reqBody.is_dispute == 1) {
                query = 'UPDATE users SET is_dispute ="' + reqBody.is_dispute + '" WHERE id = "' + reqBody.rater_id + '"'
                console.log(query)
                Connection.query(query, function(err, bookTrailer) {
                    if (err) {
                        callback(config.MESSAGES.DBErr);
                    } else {
                        query = 'SELECT mc.charge_key FROM manage_charges AS mc WHERE mc.renter_id = "' + reqBody.rater_id + '" AND mc.booking_id= "' + reqBody.booking_id + '" AND mc.status = 0'
                        Connection.query(query, function(err, capture) {
                            Payment.captureCharge(capture[0].charge_key, function(response) {
                                if (response.status == config.CODES.statusFail) {
                                    callback(null, response.data);
                                } else if (response.status == config.CODES.statusOk) {
                                    callback(null, "user is dispute.");
                                }
                            });
                        });
                    }
                });
            } else {
                callback(null, "done");
            }
        },
        function(arg3, callback) {
            console.log('12121211212122112');
            if (reqBody.is_dispute == 1) {
                query = 'INSERT INTO disputes (user_id, dispute_id) VALUES (' + reqBody.user_id + ', ' + reqBody.rater_id + ');'
                console.log(query)
                Connection.query(query, function(err, bookTrailer) {
                    if (err) {
                        callback(config.MESSAGES.DBErr);
                    } else {
                        callback(null, "done");
                    }
                });
            } else {
                callback(null, "done");
            }
        },
        function(arg4, callback) {
            console.log('13113131331313131');
            // Send Renter Invoice Code
            //query = 'SELECT txn.id, txn.renter_id,txn.owner_id,txn.booking_id,txn.manage_charge_id,mc.main_amount,mc.card_fee, mc.is_discount, mc.is_extend, DATE_FORMAT(bt.from_date,"%d/%m/%Y") AS from_date, mc.extend_date, DATE_FORMAT(mc.extend_date,"%d/%m/%Y") AS to_date,bt.size,bt.trailer_type, CONCAT(usr1.first_name," ",usr1.last_name) AS renet_name, usr1.email AS renter_email, CONCAT(usr2.first_name," ",usr2.last_name) AS owner_name, usr2.email AS owner_email FROM `transactions` AS txn LEFT JOIN users AS usr1 on usr1.id = txn.renter_id LEFT JOIN users AS usr2 on usr2.id = txn.owner_id LEFT JOIN booked_trailers AS bt ON bt.id = txn.booking_id LEFT JOIN manage_charges AS mc ON mc.id = txn.manage_charge_id WHERE txn.owner_id="' + reqBody.user_id + '" AND txn.booking_id="' + reqBody.booking_id + '" AND (txn.status= 1 OR txn.status = 5)'
            query = 'SELECT ( SELECT AVG(r.rating) FROM user_ratings r WHERE r.user_id = usr2.id AND r.booking_id = "' + reqBody.booking_id + '") AS avg_rating, txn.id, txn.renter_id,txn.owner_id,txn.booking_id,txn.manage_charge_id,mc.main_amount,mc.card_fee, mc.is_discount, mc.is_extend, DATE_FORMAT(bt.from_date,"%d/%m/%Y") AS from_date, mc.extend_date, DATE_FORMAT(mc.extend_date,"%d/%m/%Y") AS to_date,sz.label AS size,bt.trailer_type, CONCAT(usr1.first_name," ",usr1.last_name) AS renet_name, usr1.email AS renter_email, CONCAT(usr2.first_name," ",usr2.last_name) AS owner_name, usr2.email AS owner_email, usr2.profile_pic AS owner_profile_pic FROM `transactions` AS txn LEFT JOIN users AS usr1 on usr1.id = txn.renter_id LEFT JOIN users AS usr2 on usr2.id = txn.owner_id LEFT JOIN booked_trailers AS bt ON bt.id = txn.booking_id LEFT JOIN sizes AS sz ON sz.id = bt.size_id LEFT JOIN manage_charges AS mc ON mc.id = txn.manage_charge_id WHERE txn.owner_id="' + reqBody.user_id + '" AND txn.booking_id="' + reqBody.booking_id + '" AND (txn.status= 1 OR txn.status = 5)'
            console.log(query)
            Connection.query(query, function(err, Invcal) {
                var discountedPrice = '';
                var fhtml = '';
                var subTotal = 0;
                var Isdis = 0;
                for (var i = 0; i < Invcal.length; i++) {
                    if (Invcal[i].is_discount == 1) {
                        Isdis = 1;
                        var price = Invcal[i].main_amount;
                        var getDiscount = (price * 5) / 100;
                        var discountedPrice = (price - getDiscount);
                        var tenPer = (discountedPrice * 10) / 100;
                        var ccard_fee = Invcal[i].card_fee;
                        var topmaount = (discountedPrice - tenPer);
                        var Total = parseInt((topmaount + tenPer + ccard_fee) * 100);
                        subTotal = subTotal + Total;
                        var fhtml = fhtml + '<tr><td align="left" valign="middle" colspan="2"><table width="100%" border="0" cellspacing="0" cellpadding="10" style="border-bottom:1px #000 solid"><tr><td align="left" valign="middle">' + Invcal[i].size + ' ' + Invcal[i].trailer_type + '<br/> ' + Invcal[i].from_date + ' to ' + Invcal[i].to_date + '</td><td align="right" valign="middle">$' + topmaount.toFixed(2) + '</td></tr><tr><td align="left" valign="middle">GST</td><td align="right" valign="middle">$' + tenPer.toFixed(2) + '</td></tr><tr><td align="left" valign="middle">Credit Card Fee 1.5%</td><td align="right" valign="middle">$' + ccard_fee.toFixed(2) + '</td></tr><tr><td align="left" valign="middle">SubTotal</td><td align="right" valign="middle">$' + (Total / 100) + '</td></tr></table></td></tr>'
                        var extend_date = Invcal[i].extend_date;
                    } else if (Invcal[i].is_extend == 1) {
                        var dayE = days_between(new Date(extend_date), new Date(Invcal[i].extend_date));
                        var days = (dayE == 1) ? dayE + ' day' : dayE + ' days';
                        var price = Invcal[i].main_amount;
                        var tenPer = (price * 10) / 100;
                        var ccard_fee = Invcal[i].card_fee;
                        var topmaount = (price - tenPer);
                        var Total = parseInt((topmaount + tenPer + ccard_fee) * 100);
                        subTotal = subTotal + Total;
                        fhtml = fhtml + '<tr><td align="left" valign="middle" colspan="2"><table width="100%" border="0" cellspacing="0" cellpadding="10" style="border-bottom:1px #000 solid"><tr><td align="left" valign="middle">Extending request for ' + days + ' </br> ' + Invcal[i].from_date + ' to ' + Invcal[i].to_date + '</td><td align="right" valign="middle">$' + topmaount.toFixed(2) + '</td></tr><tr><td align="left" valign="middle">GST</td><td align="right" valign="middle">$' + tenPer.toFixed(2) + '</td></tr><tr><td align="left" valign="middle">Credit Card Fee 1.5% (including GST)</td> <td align="right" valign="middle">$' + ccard_fee.toFixed(2) + '</td></tr><tr><td align="left" valign="middle">SubTotal</td><td align="right" valign="middle">$' + (Total / 100) + '</td></tr></table> </td></tr>'
                        var extend_date = Invcal[i].extend_date;
                    } else {
                        var price = Invcal[i].main_amount;
                        var tenPer = (price * 10) / 100;
                        var ccard_fee = Invcal[i].card_fee;
                        var topmaount = (price - tenPer);
                        var Total = parseInt((topmaount + tenPer + ccard_fee) * 100);
                        subTotal = subTotal + Total;
                        var fhtml = fhtml + '<tr><td align="left" valign="middle" colspan="2"><table width="100%" border="0" cellspacing="0" cellpadding="10" style="border-bottom:1px #000 solid"><tr><td align="left" valign="middle">' + Invcal[i].size + ' ' + Invcal[i].trailer_type + '<br/> ' + Invcal[i].from_date + ' to ' + Invcal[i].to_date + '</td><td align="right" valign="middle">$' + topmaount.toFixed(2) + '</td></tr><tr><td align="left" valign="middle">GST</td><td align="right" valign="middle">$' + tenPer.toFixed(2) + '</td></tr><tr><td align="left" valign="middle">Credit Card Fee 1.5%</td><td align="right" valign="middle">$' + ccard_fee.toFixed(2) + '</td></tr><tr><td align="left" valign="middle">SubTotal</td><td align="right" valign="middle">$' + (Total / 100) + '</td></tr></table></td></tr>'
                        var extend_date = Invcal[i].extend_date;
                    }

                    if (i == (Invcal.length - 1)) {
                        var renterEmail = Invcal[i].renter_email;
                        var renterId = Invcal[i].renter_id;
                        var baseUrl = req.protocol + '://' + config.fullhost;
                        var starPic = baseUrl + '/admin/ckeditor/images/star_1482316628007.png';
                        if (Invcal[i].avg_rating == 0) {
                            var starValue = "Rating not available";
                        } else {
                            var rateStr = Invcal[i].avg_rating;
                            var starValue = rateStr.toFixed(1) + ' <img src="' + starPic + '" width="18" height="18" alt="" style="-3px 3px" />';
                        }

                        var personPic = baseUrl + '/front/images/userpic/thumb/' + Invcal[i].owner_profile_pic;
                        var visaPic = baseUrl + '/admin/ckeditor/images/visa_1482316610662.png';

                        var logo = baseUrl + '/front/images/logo.png';
                        //var html = '<table width="90%" border="0" cellspacing="0" align="center" cellpadding="0" style="font-family:Arial, Helvetica, sans-serif; font-size:17px;"><tr><td align="center" valign="middle" style="font-size:18px;" height="60px">Renter Receipt</td></tr><tr><td align="center" valign="middle">&nbsp;</td></tr><tr><td><table width="100%" border="1" cellspacing="0" cellpadding="0"><tr><td><table width="100%" border="0" cellspacing="0" cellpadding="20"><tr><td width="50%">$' + (subTotal / 100) + '</td><td width="50%">Thanks for Choosing HMT, ' + Invcal[i].renet_name + '</td></tr></table></td></tr><tr><td><table width="100%" border="0" cellspacing="0" cellpadding="10"><tr><td colspan="2" align="center" valign="middle" height="60px" style="font-size:20px">Hire Breakdown</td></tr>' + fhtml + '<tr><td align="left" valign="middle">&nbsp;</td><td align="right" valign="middle">&nbsp;</td></tr><tr><td align="left" valign="middle">Charged</td><td align="right" valign="middle">&nbsp;</td></tr><tr><td colspan="2"><table width="100%" border="0" cellspacing="0" cellpadding="0"><tr><td width="8%" align="right" valign="middle"><img src="' + visaPic + '" alt="visa" width="107" height="65" /></td><td width="4%" align="right">&nbsp;</td><td width="49%" align="center"><div style="display:inliline-block;  padding:20px; font-size:16px; border:2px #333 solid;"> Personal **** 123</div></td><td width="13%" align="right">&nbsp;</td><td width="26%" align="right"> <div style="display:inliline-block;  padding:20px; font-size:16px; border:2px #333 solid;">$' + (subTotal / 100) + '</div></td> </tr> </table> </td> </tr> <tr> <td colspan="2"></td></tr></table> </td></tr><tr><td><table width="100%" border="0" cellspacing="0" cellpadding="10"><tr><td align="center"><img src="' + personPic + '" alt="" /><br />Person 2</td><td>You used ' + Invcal[i].owner_name + ' Trailer</td><td align="center">Rate the Owner<br /><img src="' + starPic + '" alt="" /> <img src="' + starPic + '" alt="" /> <img src="' + starPic + '" alt="" /> <img src="' + starPic + '" alt="" /> <img src="' + starPic + '" alt="" /></td></tr></table> </td></tr></table></td></tr><tr> <td>&nbsp;</td></tr><tr><td><p>GST = 10% of Base<br /> PriceCredit Card Fee 1.5% + 10% GST</p></td></tr></table>'; //fs.readFileSync('./test/businesscard.html', 'utf8');
                        var html = '<body style="background-color: #c6c6c6;width: 100%; margin:0;padding:0;-webkit-font-smoothing: antialiased;  "> <table border="0" width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial, Helvetica, sans-serif"><tr><td height="30"></td></tr><tr><td width="100%" align="center" valign="top"><table width="700" border="0" cellpadding="0" cellspacing="0" align="center" class="container top-header-left" bgcolor="e5eaf7"> <tr class="header-bg" bgcolor="178F45" style="float:left; width:100%;"><td><table border="0" width="680" align="center" cellpadding="0" cellspacing="0" class="container-middle" style="margin-left:15px;"> <tr><td> <table border="0" align="left" cellpadding="0" cellspacing="0" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;" class="logo"> <tr><td height="15" colspan="3"></td> </tr><tr> <td colspan="3" align="center"><a href="#" style="text-decoration:none"><img src="' + logo + '" alt=" " width="294" height="61" border="0"></a></td></tr><tr><td height="15" colspan="3"></td> </tr></table></td></tr></table></td> </tr> <tr><td><table width="90%" border="0" cellspacing="0" align="center" cellpadding="0" style="font-family:Arial, Helvetica, sans-serif; font-size:17px;"><tr><td align="center" valign="middle" style="font-size:18px;" height="60px">Renter Receipt</td></tr><tr><td align="center" valign="middle">&nbsp;</td></tr><tr><td><table width="100%" border="1" cellspacing="0" cellpadding="0"><tr><td><table width="100%" border="0" cellspacing="0" cellpadding="20"><tr><td width="50%">$' + (subTotal / 100) + '</td><td width="50%">Thanks for Choosing Hire My Trailer, ' + Invcal[i].renet_name + '</td></tr></table></td></tr><tr><td><table width="100%" border="0" cellspacing="0" cellpadding="10"><tr><td colspan="2" align="center" valign="middle" height="60px" style="font-size:20px">Hire Breakdown</td></tr>' + fhtml + '<tr><td align="left" valign="middle">&nbsp;</td><td align="right" valign="middle">&nbsp;</td></tr><tr><td align="left" valign="middle">Charged</td><td align="right" valign="middle">&nbsp;</td></tr><tr><td colspan="2"><table width="100%" border="0" cellspacing="0" cellpadding="0"><tr><td width="8%" align="right" valign="middle"><img src="' + visaPic + '" alt="visa" width="107" height="65" /></td><td width="4%" align="right">&nbsp;</td><td width="49%" align="center"><div style="display:inliline-block;  padding:20px; font-size:16px; border:2px #333 solid;"> Personal **** 123</div></td><td width="13%" align="right">&nbsp;</td><td width="26%" align="right"> <div style="display:inliline-block;  padding:20px; font-size:16px; border:2px #333 solid;">$' + (subTotal / 100) + '</div></td> </tr> </table> </td> </tr> <tr> <td colspan="2"></td></tr></table> </td></tr><tr><td><table width="100%" border="0" cellspacing="0" cellpadding="10"><tr><td align="center"><img src="' + personPic + '" alt="" width="100" height="100" /><br /></td><td>You used ' + Invcal[i].owner_name + ' Trailer</td><td align="center">You Rated ' + Invcal[i].owner_name + '<br />' + starValue + '</td></tr></table> </td></tr></table></td></tr><tr> <td>&nbsp;</td></tr><tr><td><p>GST = 10% of Base<br /> PriceCredit Card Fee 1.5% + 10% GST</p></td></tr></table></td></tr></table></td></tr><tr><td height="30"></td></tr> </table></body>';
                        var options = { format: 'Letter', "timeout": 50000 };
                        var pdfName = new Date().getTime() + '_renter.pdf';
                        Connection.query('INSERT INTO invoices_logs (role, user_id, booking_id, paid_amount, invoice, is_discount,email) VALUES ("1","' + renterId + '", "' + reqBody.booking_id + '", "' + (subTotal / 100) + '", "' + pdfName + '","' + Isdis + '", "' + renterEmail + '")', function() {});
                        pdf.create(html, options).toFile(req.app.locals.base_path + '/public/front/invoices/' + pdfName, function(err, respdf) {
                            console.log('-------------/////////-------------');
                            if (err) {
                                callback('Renter invoices create error');
                            } else {
                                var attachment = [{ fileName: pdfName, filePath: respdf.filename }];
                                mails.sendEmailWithAttachment(config.ADMINEMAIL, renterEmail, "HMT- Receipt", html, attachment,
                                    function(response) {
                                        if (response.code == config.CODES.notFound) {
                                            callback(config.MESSAGES.DBErr);
                                        } else if (response.code == config.CODES.OK) {
                                            callback(null, 'Receipt send');
                                        }
                                    });
                            }
                        });
                    }
                }
            });
        },
        function(arg4, callback) {
            console.log('14141414141414');
            // Send Owner Invoice Code
            if (trFnAmount) {
                //query = 'SELECT DATE_FORMAT(bt.from_date,"%d/%m/%Y") AS from_date, DATE_FORMAT(bt.to_date,"%d/%m/%Y") AS to_date, bt.renter_id, bt.owner_id, bt.size,bt.trailer_type, CONCAT(usr1.first_name," ",usr1.last_name) AS renter_name, CONCAT(usr2.first_name," ",usr2.last_name) AS owner_name, usr2.email AS owner_email FROM `booked_trailers` AS bt LEFT JOIN users AS usr1 ON usr1.id = bt.renter_id LEFT JOIN users AS usr2 ON usr2.id = bt.owner_id WHERE bt.owner_id = "' + reqBody.user_id + '" AND bt.id = "' + reqBody.booking_id + '"'
                query = 'SELECT ( SELECT AVG(r.rating) FROM user_ratings r WHERE r.user_id = usr1.id) AS avg_rating, DATE_FORMAT(bt.from_date,"%d/%m/%Y") AS from_date, DATE_FORMAT(bt.to_date,"%d/%m/%Y") AS to_date, bt.renter_id, bt.owner_id, sz.label AS size,bt.trailer_type, CONCAT(usr1.first_name," ",usr1.last_name) AS renter_name, CONCAT(usr2.first_name," ",usr2.last_name) AS owner_name, usr2.email AS owner_email, usr1.profile_pic AS renter_profile_pic FROM `booked_trailers` AS bt LEFT JOIN users AS usr1 ON usr1.id = bt.renter_id LEFT JOIN users AS usr2 ON usr2.id = bt.owner_id LEFT JOIN sizes AS sz ON sz.id = bt.size_id WHERE bt.owner_id = "' + reqBody.user_id + '" AND bt.id = "' + reqBody.booking_id + '"'
                console.log(query);
                Connection.query(query, function(err, ownerInv) {
                    var ownInData = ownerInv[0];
                    var baseUrl = req.protocol + '://' + config.fullhost;
                    var logo = baseUrl + '/front/images/logo.png';
                    var starPic = baseUrl + '/admin/ckeditor/images/star_1482316628007.png';
                    if (ownInData.avg_rating == 0) {
                        var starValue = "Rating not available";
                    } else {
                        var rateStr = ownInData.avg_rating;
                        var starValue = rateStr.toFixed(1) + ' <img src="' + starPic + '" width="18" height="18" alt="" style="-3px 3px" />';
                    }
                    var personPic = baseUrl + '/front/images/userpic/thumb/' + ownerInv[0].renter_profile_pic;
                    var html = '<body style="background-color: #c6c6c6;width: 100%; margin:0;padding:0;-webkit-font-smoothing: antialiased;  "><table border="0" width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial, Helvetica, sans-serif"> <tr><td height="30"></td></tr><tr><td width="100%" align="center" valign="top"><table width="700" border="0" cellpadding="0" cellspacing="0" align="center" class="container top-header-left" bgcolor="e5eaf7"><tr class="header-bg" bgcolor="178F45" style="float:left; width:100%;"><td><table border="0" width="680" align="center" cellpadding="0" cellspacing="0" class="container-middle" style="margin-left:15px;"> <tr> <td><table border="0" align="left" cellpadding="0" cellspacing="0" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;" class="logo"><tr><td height="15" colspan="3"></td></tr><tr><td colspan="3" align="center"><a href="#" style="text-decoration:none"><img src="' + logo + '" alt=" " width="294" height="61" border="0"></a></td></tr><tr><td height="15" colspan="3"></td></tr></table></td></tr></table></td> </tr> <tr><td style="border-bottom: 1px solid;border-left: 1px solid;border-right: 1px solid;"><table width="90%" border="0" cellspacing="0" align="center" cellpadding="0" style="font-family:Arial, Helvetica, sans-serif; font-size:17px;"><tr><td align="center" valign="middle" style="font-size:18px;" height="60px">Owner Funds Paid</td></tr><tr> <td align="center" valign="middle">&nbsp;</td> </tr> <tr> <td> <table width="100%" border="1" cellspacing="0" cellpadding="0"> <tr><td><table width="100%" border="0" cellspacing="0" cellpadding="20"> <tr><td width="50%">$' + (trFnAmount / 100) + '</td><td width="50%">Thanks for Choosing Hire My Trailer, ' + ownInData.owner_name + '</td></tr></table></td> </tr><tr> <td><table width="100%" border="0" cellspacing="0" cellpadding="10"><tr> <td colspan="2" align="center" valign="middle" height="60px" style="font-size:20px">Funds Paid</td> </tr> <tr>  <td align="left" valign="middle">' + ownInData.size + ' ' + ownInData.trailer_type + '<br/> ' + ownInData.from_date + ' to ' + ownInData.to_date + ' </td><td align="right" valign="middle">$' + (trFnAmount / 100) + '</td>  </tr> <tr> <td align="left" valign="middle">&nbsp;</td>  <td align="right" valign="middle">&nbsp;</td> </tr><tr><td align="left" valign="middle">To</td> <td align="right" valign="middle">&nbsp;</td> </tr> <tr>  <td colspan="2">  <table width="100%" border="0" cellspacing="0" cellpadding="0"> <tr> <td width="4%" align="right">&nbsp;</td> <td width="49%" align="center"><div style="display:inliline-block;  padding:30px; font-size:16px; border:2px #333 solid;"> Personal **** 123</div></td> <td width="13%" align="right">&nbsp;</td> <td width="26%" align="right"><div style="display:inliline-block;  padding:30px; font-size:16px; border:2px #333 solid;">$' + (trFnAmount / 100) + '</div> </td> </tr></table></td> </tr>  <tr> <td colspan="2"></td> </tr> </table> </td></tr> <tr><td><table width="100%" border="0" cellspacing="0" cellpadding="10"> <tr> <td align="center"><img src="' + personPic + '" alt="" width="100" height="100" />  <br /></td><td>' + ownInData.renter_name + ' used your Trailer</td> <td align="center">You Rated ' + ownInData.renter_name + ' <br /> ' + starValue + ' </td> </tr> </table>  </td>  </tr> </table></td> </tr><tr>  <td>&nbsp;</td>  </tr></table></td></tr></table></td></tr><tr><td height="30"></td></tr></table></body>'; //fs.readFileSync('./test/businesscard.html', 'utf8');
                    var options = { format: 'Letter', "timeout": 600000 };
                    var pdfName = new Date().getTime() + '_owner.pdf';
                    Connection.query('INSERT INTO invoices_logs (role, user_id, booking_id, main_amount, paid_amount, invoice,email) VALUES ("2","' + reqBody.user_id + '", "' + reqBody.booking_id + '", "' + capAmount + '", "' + (trFnAmount / 100) + '", "' + pdfName + '", "' + ownInData.owner_email + '")', function() {});
                    pdf.create(html, options).toFile(req.app.locals.base_path + '/public/front/invoices/' + pdfName, function(err, respdf) {
                        console.log('%%%%%%%%%%%%%%%%%%%%%%');
                        if (err) {
                            console.log(err);
                            callback('Owner Invoices create error');
                        } else {
                            console.log('222222222222222');
                            var attachment = [{ fileName: pdfName, filePath: respdf.filename }];
                            mails.sendEmailWithAttachment(config.ADMINEMAIL, ownInData.owner_email, "HMT- Receipt", html, attachment, function(response) {
                                console.log('333333333333333');
                                if (response.code == config.CODES.notFound) {
                                    callback(config.MESSAGES.DBErr);
                                } else if (response.code == config.CODES.OK) {
                                    console.log('8888888888888');
                                    callback(null, 'Receipt send');
                                }
                            });
                        }
                    });
                });
            } else {
                callback(null, 'Done');
            }
        }
    ], function(err, result) {
        console.log('ooooooooooooooooooo')
        if (err) {
            res.status(500).json({ status: 0, error: { error_message: config.MESSAGES.DBErr } });
        } else {
            res.status(200).json({ status: 1, message: 'Drop-off successfully completed' });
        }
    });
}

var auth = function(apiKey, apiSecretKey) {
    var randomString = function(length) {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < length; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    var getHMAC = function(key, timestamp, nonce) {

        var hash = CryptoJS.HmacSHA256(key + '\n' + timestamp + '\n' + nonce, apiSecretKey);
        var hashInBase64 = CryptoJS.enc.Base64.stringify(hash);
        return hashInBase64;
    };

    var getMicrotime = function() {
        return (new Date().getTime() / 1000).toFixed(0);
    };

    var getNonce = function() {
        return randomString(32);
    };

    var _timestamp = getMicrotime().toString();
    var _nonce = getNonce();

    return {
        timestamp: _timestamp,
        signature: getHMAC(apiKey, _timestamp, _nonce),
        apiKey: apiKey,
        nonce: _nonce
    };
};

var uploadDocument = function(apiKey, apiSecret, filepath, result, callback) {

    var newHeaders = auth(apiKey, apiSecret)
        // Headers        
    var headers = {
        "X-CUSTOM-API-KEY": apiKey, // API key
        "X-CUSTOM-SIGNATURE": newHeaders.signature, // signature
        "X-CUSTOM-DATE": newHeaders.timestamp, // current timestamp
        "X-CUSTOM-NONCE": newHeaders.nonce, // nonce
        "Referer": "https://www.dsx.co.nz/developer/api-documentation-without-oauth2" // Referer url
    };
    var options = {
        url: 'https://api.dsx.co.nz/web/v1.4/Document/Uploader', // API Url
        method: 'POST', // Method
        headers: headers,
    }

    // Making Post request
    var req = request.post(options, function(err, res, body) {
        if (err) {
            console.log("err", err)
        } else if (res) {
            var doc = JSON.parse(res.body);
            console.log('3333333333333');
            console.log(doc);
            //console.log("res", doc.Reference)
            if (doc.error && doc.error == 'Not enough documents available') {
                callback({ 'code': config.CODES.notFound, "data": 'Not enough documents available please upgrade your account(securedsigning.com/https://www.dsx.co.nz) to access document ' })
            } else {
                sendSmartTag(apiKey, apiSecret, doc.Reference, result, function(response) {
                    if (response.code == config.CODES.Error) {
                        callback({ 'code': config.CODES.notFound, "data": response.data })
                    } else if (response.code == config.CODES.OK) {
                        callback({ 'code': config.CODES.OK, "data": response.data });
                    }
                });
            }
        } else {
            callback({ 'code': config.CODES.OK, "data": response.data });
        }
    });
    var form = req.form();
    form.append('file', fs.createReadStream(filepath));
}

var sendSmartTag = function(apiKey, apiSecret, reference, result, callback) {
    console.log('4444444444444');
    var newHeaders = auth(apiKey, apiSecret);
    // Headers        
    var headers = {
        "X-CUSTOM-API-KEY": apiKey, // API key
        "X-CUSTOM-SIGNATURE": newHeaders.signature, // signature
        "X-CUSTOM-DATE": newHeaders.timestamp, // current timestamp
        "X-CUSTOM-NONCE": newHeaders.nonce, // nonce
        "Referer": "https://www.dsx.co.nz/developer/api-documentation-without-oauth2" // Referer url
    };
    var options = {
        url: 'https://api.dsx.co.nz/web/v1.4/SmartTag/Send', // API Url
        method: 'POST', // Method
        headers: headers,
        json: {
            "DocumentReferences": [reference],
            "Embedded": false,
            "Signers": [{
                "FirstName": result.renter_fname,
                "LastName": result.renter_lname,
                "Email": result.renter_email
            }, {
                "FirstName": result.owner_fname,
                "LastName": result.owner_lname,
                "Email": result.owner_email
            }]
        }
    }

    // Making Post request
    var req = request.post(options, function(err, res, body) {
        if (err) {
            console.log('999999999');
            console.log(err);
            callback({ 'code': config.CODES.notFound, "data": err })
        } else if (res) {
            console.log('55555555555555');
            callback({ 'code': config.CODES.OK, "data": res.body });
        } else {
            console.log('666666666666');
            callback({ 'code': config.CODES.OK, "data": body });
        }
    });
}

var getAgreementStatus = function(apiKey, apiSecret, reference, callback) {

    var newHeaders = auth(apiKey, apiSecret)
        // Headers        
    var headers = {
        "X-CUSTOM-API-KEY": apiKey, // API key
        "X-CUSTOM-SIGNATURE": newHeaders.signature, // signature
        "X-CUSTOM-DATE": newHeaders.timestamp, // current timestamp
        "X-CUSTOM-NONCE": newHeaders.nonce, // nonce
        "Referer": "https://www.dsx.co.nz/developer/api-documentation-without-oauth2" // Referer url
    };
    var options = {
        url: 'https://api.dsx.co.nz:443/web/v1.4/Document/Status/' + reference, // API Url
        method: 'GET', // Method
        headers: headers,
    }

    // Making Post request
    var req = request.get(options, function(err, res, body) {
        if (err) {
            callback({ 'code': config.CODES.notFound, "data": err })
        } else if (res) {
            console.log('55555555555555');
            callback({ 'code': config.CODES.OK, "data": res.body });
        } else {
            console.log('666666666666');
            callback({ 'code': config.CODES.OK, "data": body });
        }
    });
}
