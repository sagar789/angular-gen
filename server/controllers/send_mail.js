var nodemailer = require('nodemailer');
//var apn = require("apn");
var config = require('../../config/config.js');
var randtoken = require('rand-token');
var Connection = require('../../config/database.js');
//var FCM = require('fcm-node');
//var serverKey = 'AAAAT4r4ChQ:APA91bGYZKHWUr4HePUikrzKQvtmY7UcfqYpasB7HqxLH0jXLNHnrkiW_JQkDCVUDldrmSDb-ledSFiYRpG-660MNVNTMljSSPimUI2cSznrZ0RZGwfDyr5e2beN9r5NwPjCbY8LjAl63pNZ4GNaRhkKJTuMAJuJow';
//var fcm = new FCM(serverKey);
// create reusable transporter object using the default SMTP transport 
// var transporter = nodemailer.createTransport("SMTP", {
//     service: "Gmail",
//     host: config.MAILSERVICE.HOST,
//     port: config.MAILSERVICE.PORT,
//     auth: {
//         user: config.MAILSERVICE.USER,
//         pass: config.MAILSERVICE.PASSWORD
//     }
// });


var apnError = function(err) {
    console.log("APN Error:", err);
}

var options = {
    "key": "config/pem/key.pem",
    "cert": "config/pem/cert.pem",
    "passphrase": null,
    "gateway": "gateway.sandbox.push.apple.com"
};
options.errorCallback = apnError;

/* @function : sendEmail
 *  @method  : POST
 *  @purpose  : This function used send email
 */
function sendEmail(from, to, subject, message, callback) {
    // setup e-mail data with unicode symbols 
    var mailOptions = {
        from: from, // sender address 
        to: to, // list of receivers 
        subject: subject, // Subject line 
        // text: 'Hello world ', // plaintext body 
        html: message // html body 
    };
    console.log("mailOptions : ", mailOptions)
        // send mail with defined transport object 
    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            return callback({ code: 500, data: "error" })
        } else {
            return callback({ code: 200, data: "send" })
        }
    });
}
exports.sendEmail = sendEmail;

/* @function : sendEmailWithAttachment
 *  @method  : POST
 *  @purpose  : This function used send email with attachment
 */
function sendEmailWithAttachment(from, to, subject, message, attachment, callback) {
    // setup e-mail data with unicode symbols 
    var mailOptions = {
        from: from, // sender address 
        to: to, // list of receivers 
        subject: subject, // Subject line 
        html: message, // html body,
        attachments: attachment //attachment data
    };
    // send mail with defined transport object 
    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            return callback({ code: 500, data: "error" })
        } else {
            return callback({ code: 200, data: "send" })
        }
    });
}
exports.sendEmailWithAttachment = sendEmailWithAttachment;

/* @function : pushNotificationForIphone
 *  @method  : POST
 *  @purpose  : This function used send push notification to iphone
 */
function pushNotificationForIphone(message, deviceToken, badge, type, callback) {
    apnConnection = new apn.Provider(options);
    var note = new apn.Notification();
    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    note.badge = badge;
    note.sound = "ping.aiff";
    note.type = type;
    myDevice = deviceToken;
    note.alert = message;
    // apnConnection.pushNotification(note, myDevice);
    apnConnection.send(note, myDevice).then(function(result) {
        callback({ status: config.CODES.statusOk, data: 'Iphone notification sent successfully' });
    });
}
exports.pushNotificationForIphone = pushNotificationForIphone;

/* @function : sendNotificationsToAndroid
 *  @method  : POST
 *  @purpose  : This function used send push notification to Android
 */
function sendNotificationsToAndroid(message, deviceToken, type, callback) {
    console.log("message", message)
    console.log("deviceToken", deviceToken)
    console.log("type", type)
    var message = {
        to: deviceToken, // required fill with device token or topics
        notification: {
            title: 'HMT',
            body: message
        },
        data: { type: type }
    };
    //callback style
    fcm.send(message, function(err, response) {
        if (err) {
            console.log("err", err)
            callback({ status: config.CODES.notFound, data: 'Android notification send error' })
        } else {
            console.log("response", response)
            callback({ status: config.CODES.statusOk, data: 'Android notification sent successfully' });
        }
    });
}
exports.sendNotificationsToAndroid = sendNotificationsToAndroid;

/* @function : reset_passwordEmail
 *  @method  : POST
 *  @purpose  : This function used send reset password email
 */
var reset_passwordEmail = function(req, res, callback) {
    var token = randtoken.generate(32);
    var baseUrl = req.protocol + '://' + config.fullhost;
    var logo = baseUrl + '/front/images/logo.png';
    var homeLink = baseUrl;
    var privacyLink = baseUrl + '/privacy-policy';
    var TermsLink = baseUrl + '/terms-and-condition';
    var fbImg = baseUrl + '/front/images/square-facebook.png';
    var twImg = baseUrl + '/front/images/square-twitter.png';
    var activationLink = "";
    if (req.body.role == 1) {
        activationLink = baseUrl + "/admin/reset_password?token=" + token;
    } else {
        activationLink = baseUrl + "/reset_password?token=" + token;
    }

    var to = [req.body.email];
    var subject = 'Hire My Trailer - Reset password link';
    var message = '<body style="background-color: #ffffff;width: 100%; margin:0;padding:0;-webkit-font-smoothing: antialiased;  ">    <table border="0" width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial, Helvetica, sans-serif">        <tr>            <td height="50"></td>        </tr>        <tr bgcolor="#9f9fa3">            <td width="100%" align="center" valign="top" bgcolor="ffffff">                <table width="700" border="0" cellpadding="0" cellspacing="0" align="center" class="container top-header-left" bgcolor="e5eaf7">                    <tr class="header-bg" bgcolor="178F45" style="float:left; width:100%;">                        <td>                            <table border="0" width="680" align="center" cellpadding="0" cellspacing="0" class="container-middle" style="margin-left:15px;">                                <tr>                                    <td>                                        <table border="0" align="center" cellpadding="0" cellspacing="0" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;" class="logo">                                            <tr>                                                <td height="15" colspan="3"></td>                                            </tr>                                            <tr>                                                <td colspan="3" align="center">                                                    <a href="#" style="text-decoration:none"><img src="' + logo + '" alt=" " width="294" height="61" border="0"></a>                                                </td>                                            </tr>                                            <tr>                                                <td height="15" colspan="3"></td>                                            </tr>                                        </table>                                    </td>                                </tr>                            </table>                        </td>                    </tr>                    <tr>                        <td>                            <table width="100%" border="0" align="center" cellpadding="0" cellspacing="0" bgcolor="FFFFFF" style="border: 2px solid #178F45;">                                <tr>                                    <td valign="top" height="20" style="font-family:Arial, Helvetica, sans-serif; font-size:25px; color:#178F45; padding:25px 25px 5px;">Hi,</td>                                </tr>                                <tr>                                    <td valign="top" height="20" style="font-family:Arial, Helvetica, sans-serif; font-size:16px; color:#178F45; padding:0px 25px 25px;">You have requested a password reset.                                        <br/>Please follow this link to reset your password for your account.                                        <br/>This link will expire in 1 hour.                                    </td>                                </tr>                                <tr>                                    <td valign="top" height="20" style="padding:0px 25px 25px; text-align:center;"><a style="font-family:Arial, Helvetica, sans-serif; font-size:18px;color:#fff;background: #178F45;text-decoration: none;width: 250px;height: 50px;display: block;margin: auto;line-height: 47px; display: block;" href="' + activationLink + '">Reset your password </a>                                    </td>                                </tr>                                <tr>                                    <td valign="top" height="20" style="padding:0px 25px 25px; text-align:center;color:#178F45;">                                        <a style="font-family:Arial, Helvetica, sans-serif; font-size:18px;color:#178F45;text-decoration: none;padding: 0px 40px;line-height: 40px;" href="' + homeLink + '">Go to hiremytrailer.com.au</a>|                                        <a style="font-family:Arial, Helvetica, sans-serif; font-size:18px;color:#178F45;text-decoration: none;padding: 0px 40px;line-height: 40px;" href="' + privacyLink + '">Privacy</a>|                                        <a style="font-family:Arial, Helvetica, sans-serif; font-size:18px;color:#178F45;text-decoration: none;padding: 0px 40px;line-height: 40px;" href="' + TermsLink + '">Terms</a>|                                        <a style="font-family:Arial, Helvetica, sans-serif; font-size:18px;color:#178F45;text-decoration: none;padding: 0px 40px;line-height: 40px;" href="http://www.facebook.com/hiremytrailer">Find us on Facebook</a>|                                        <a style="font-family:Arial, Helvetica, sans-serif; font-size:18px;color:#178F45;text-decoration: none;padding: 0px 40px;line-height: 40px;" href="http://www.twitter.com/hiremytrailer">Find us on Twitter</a>                                    </td>                                </tr>                                                            </table>                        </td>                    </tr>                </table>            </td>        </tr>        <tr>            <td height="30"></td>        </tr>    </table></body>';

    sendEmail(config.ADMINEMAIL, to, subject, message, function(response) {
        if (response.code == config.CODES.notFound) {
            return console.error(err);
        } else if (response.code == config.CODES.OK) {
            var isExpire = (new Date()).toISOString().substring(0, 19).replace('T', ' ');
            //var tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
            //var isExpire = (new Date(Date.now() - tzoffset)).toISOString().slice(0, -1);
            console.log(isExpire);
            var query = 'UPDATE users SET is_expire="' + isExpire + '",password_reset_token="' + token + '" WHERE email="' + req.body.email + '"';
            console.log(query);
            Connection.query(query, function(err, user) {
                if (err) {
                    console.log("err while sending reset_passwordEmail", err);
                    callback({ 'code': config.CODES.notFound, "message": config.MESSAGES.Error })
                } else {
                    console.log("success while sending reset_passwordEmail");
                    callback({ 'code': config.CODES.OK, "message": config.MESSAGES.passwordReset });
                }
            });

        }
    });
}
exports.reset_passwordEmail = reset_passwordEmail;

/* @function : verificationEmail
 *  @method  : POST
 *  @purpose  : This function used for send verification email
 */
var verificationEmail = function(req, res, callback) {
    var token = randtoken.generate(32);
    var baseUrl = req.protocol + '://' + config.fullhost;
    var activationLink = "";
    activationLink = baseUrl + "//verify?access_token'" + token;
    var to = [req.body.email];
    var subject = 'HMT - Reset password link';
    var message = '<h1><tbody><tr><td><h1>HMT application - Reset Password Link</h1><hr /><p><big>Hello,</big></p><p><big>Someone tried to reset your password. Please <a href="' + activationLink + '" title="click here">click here</a> on the link for reset your password or copy and paste the url : <strong>' + activationLink + '</strong></big></p><h3><code>Thanks,<br />HMT application Team</code></h3></td></tr></tbody></table>';
    //var message = '<body style="background-color: #9f9fa3;width: 100%; margin:0;padding:0;-webkit-font-smoothing: antialiased;  "><table border="0" width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial, Helvetica, sans-serif"><tr><td height="30"></td></tr><tr bgcolor="#9f9fa3"><td width="100%" align="center" valign="top" bgcolor="#9f9fa3"><table width="700" border="0" cellpadding="0" cellspacing="0" align="center" class="container top-header-left" bgcolor="e5eaf7"> <tr class="header-bg" bgcolor="178F45" style="float:left; width:100%;"><td><table border="0" width="680" align="center" cellpadding="0" cellspacing="0" class="container-middle" style="margin-left:15px;"><tr><td><table border="0" align="left" cellpadding="0" cellspacing="0" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;" class="logo"><tr><td height="15" colspan="3"></td></tr><tr><td colspan="3" align="center"><a href="#" style="text-decoration:none"><img src="images/logo.png" alt=" " width="294" height="61" border="0"></a></td></tr><tr><td height="15" colspan="3"></td></tr></table></td></tr> </table></td></tr><tr> <td><table width="100%" border="0" align="center" cellpadding="0" cellspacing="0" bgcolor="FFFFFF" style=""><tr><td valign="top" height="20" style="font-family:Arial, Helvetica, sans-serif; font-size:25px; color:#777; padding:25px 25px 15px;">Dear sagar,</td></tr> <tr><td valign="top" height="20" style="font-family:Arial, Helvetica, sans-serif; font-size:16px; color:#777; padding:0px 25px 25px;">This is a notification from Hire My Trailer confirming a request to reset your password.</td></tr><tr>                                    <td valign="top" height="20" style="font-family:Arial, Helvetica, sans-serif; font-size:16px; color:#777; padding:0px 25px 25px;">Please <a style="color:#179046;" href="#">Click here</a> to complete the process.                                    </td>                                </tr>                                <tr>                                    <td valign="top" height="20" style="font-family:Arial, Helvetica, sans-serif; font-size:16px; color:#777; padding:0px 25px 25px;">Regards,                                        <br>HMT Team                                    </td>                                </tr>                            </table>                        </td>                    </tr>                </table>            </td>        </tr>        <tr>            <td height="30"></td>        </tr>    </table></body>';
    sendEmail(config.ADMINEMAIL, to, subject, message, function(response) {
        if (response.code == config.CODES.notFound) {
            return console.error(err);
        } else if (response.code == config.CODES.OK) {
            Connection.query('UPDATE users SET password_reset_token="' + token + '" WHERE email="' + req.body.email + '"', function(err, user) {
                if (err) {
                    console.log("err while sending reset_passwordEmail", err);
                    callback({ 'code': config.CODES.notFound, "message": config.MESSAGES.Error })
                } else {
                    console.log("success while sending reset_passwordEmail");
                    callback({ 'code': config.CODES.OK, "message": config.MESSAGES.passwordReset });
                }
            });

        }
    });
}
exports.verificationEmail = verificationEmail;

/* @function : sendMobileMessage
 *  @method  : POST
 *  @purpose  : This function used for send mobile message like OTP or other message
 */
function sendMobileMessage(mobile, message, callback) {
    var sinchSms = require('sinch-sms')({
        key: config.SINCHAPIKEY,
        secret: config.SINCHSECRETKEY
    });
    var otpMob = '+91' + mobile;
    console.log(otpMob)
    sinchSms.send(otpMob, message).then(function(response) {
        console.log(response)
        return callback({ code: 200, data: response })
    }).fail(function(error) {
        console.log(error)
            // Some type of error, see error object
        return callback({ code: 500, data: error })
    });
}
exports.sendMobileMessage = sendMobileMessage;

/* @function : createVerificationMobile
 *  @method  : POST
 *  @purpose  : This function used for send mobile message like OTP or other message
 */
function createVerificationMobile(mobile, callback) {
    var sinchSms = require('sinch-sms')({
        key: config.SINCHAPIKEY,
        secret: config.SINCHSECRETKEY
    });
    var otpMob = '+91' + mobile;
    console.log(otpMob)
    sinchSms.verification(otpMob).then(function(response) {
        console.log("response", response)
        if (response.status == 'FAIL') {
            return callback({ code: 500, data: response })
        } else {
            return callback({ code: 200, data: response })
        }
    }).fail(function(error) {
        console.log("error", error)
            // Some type of error, see error object
        return callback({ code: 500, data: error })
    });
}
exports.createVerificationMobile = createVerificationMobile;

/* @function : reportVerificationMobile
 *  @method  : POST
 *  @purpose  : This function used for send mobile message like OTP or other message
 */
function reportVerificationMobile(mobile, code, callback) {
    var sinchSms = require('sinch-sms')({
        key: config.SINCHAPIKEY,
        secret: config.SINCHSECRETKEY
    });
    var otpMob = '+91' + mobile;
    console.log(otpMob)
    sinchSms.reportVerification(otpMob, code).then(function(response) {
        if (response.status == 'FAIL') {
            return callback({ code: 500, data: response })
        } else {
            return callback({ code: 200, data: response })
        }
    }).fail(function(error) {
        console.log("error121212", error)
        return callback({ code: 500, data: error })
    });
}
exports.reportVerificationMobile = reportVerificationMobile;
