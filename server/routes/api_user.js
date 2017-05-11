var Connection = require('../../config/database.js');
var bCrypt = require('bcrypt-nodejs');
var randtoken = require('rand-token');
var config = require('../../config/config.js');
var mails = require('../controllers/send_mail.js'); // included controller for sending mails
var async = require('async');
var fs = require('fs');
var im = require('imagemagick');
var request = require('request');


module.exports = function(app, passport) {

    app.post('/api_user/signin', passport.authenticate('local-login', {
        successRedirect: '/api_user/signinSuccess', // redirect to the secure profile section
        failureRedirect: '/api_user/signinFail', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    app.get('/api_user/signinSuccess', function(req, res) {
        if (req.session.admin) {
            res.status(200).json({ message: 'Success', data: req.session.admin, error: {} });
        } else if (req.session.user) {
            res.status(200).json({ message: 'Success', data: req.session.user, error: {} });
        }
    });

    app.get('/api_user/signinFail', function(req, res) {
        console.log(req.session.flash.error[0]);
        if (req.session.flash) {
            res.status(500).json({ message: req.session.flash.error[0] });
        }
    });

    app.get('/api_user/sessionCheck', function(req, res) {
        console.log('sdsdsd');
        var pdf = require('html-pdf');
        //var ownInData = ownerInv[0];
        // var baseUrl = req.protocol + '://' + config.fullhost;
        // var logo = baseUrl + '/front/images/logo.png';
        // var starPic = baseUrl + '/admin/ckeditor/images/star_1482316628007.png';
        // var personPic = baseUrl + '/admin/ckeditor/images/person_1482316649969.png';
        // var html = '<body width: 100%; margin:0;padding:0;-webkit-font-smoothing: antialiased;  "><table border="0" width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial, Helvetica, sans-serif"> <tr><td height="30"></td></tr><tr><td width="100%" align="center" valign="top"><table width="700" border="0" cellpadding="0" cellspacing="0" align="center" class="container top-header-left" ><tr class="header-bg" bgcolor="178F45" style="float:left; width:100%;"><td><table border="0" width="680" align="center" cellpadding="0" cellspacing="0" class="container-middle" style="margin-left:15px;"> <tr> <td><table border="0" align="left" cellpadding="0" cellspacing="0" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;" class="logo"><tr><td height="15" colspan="3"></td></tr><tr><td colspan="3" align="center"><a href="#" style="text-decoration:none"><img src="' + logo + '" alt=" " width="294" height="61" border="0"></a></td></tr><tr><td height="15" colspan="3"></td></tr></table></td></tr></table></td> </tr> <tr><td style="border-bottom: 1px solid;border-left: 1px solid;border-right: 1px solid; "><table width="90%" border="0" cellspacing="0" align="center" cellpadding="0" style="font-family:Arial, Helvetica, sans-serif; font-size:17px;"><tr><td align="center" valign="middle" style="font-size:18px;" height="60px">Owner Funds Paid</td></tr><tr> <td align="center" valign="middle">&nbsp;</td> </tr> <tr> <td> <table width="100%" border="1" cellspacing="0" cellpadding="0"> <tr><td><table width="100%" border="0" cellspacing="0" cellpadding="20"> <tr><td width="50%">$300</td><td width="50%">Thanks for Choosing HMT, sagar</td></tr></table></td> </tr><tr> <td><table width="100%" border="0" cellspacing="0" cellpadding="10"><tr> <td colspan="2" align="center" valign="middle" height="60px" style="font-size:20px">Funds Paid</td> </tr> <tr>  <td align="left" valign="middle">Box plant<br/> 2017-02-12 to 2017-02-12 </td><td align="right" valign="middle">$300</td>  </tr> <tr> <td align="left" valign="middle">&nbsp;</td>  <td align="right" valign="middle">&nbsp;</td> </tr><tr><td align="left" valign="middle">To</td> <td align="right" valign="middle">&nbsp;</td> </tr> <tr>  <td colspan="2">  <table width="100%" border="0" cellspacing="0" cellpadding="0"> <tr> <td width="4%" align="right">&nbsp;</td> <td width="49%" align="center"><div style="display:inliline-block;  padding:30px; font-size:16px; border:2px #333 solid;"> Personal **** 123</div></td> <td width="13%" align="right">&nbsp;</td> <td width="26%" align="right"><div style="display:inliline-block;  padding:30px; font-size:16px; border:2px #333 solid;">$300</div> </td> </tr></table></td> </tr>  <tr> <td colspan="2"></td> </tr> </table> </td></tr> <tr><td><table width="100%" border="0" cellspacing="0" cellpadding="10"> <tr> <td align="center"><img src="' + personPic + '" alt="" />  <br />Person 2</td><td> Rahul used your Trailer</td> <td align="center">Rate the Owner  <br /> <img src="' + starPic + '" alt="" style="margin:0 10px;" /> <img src="' + starPic + '" alt="" style="margin:0 10px;" /> <img src="' + starPic + '" alt="" style="margin:0 10px;" /> <img src="' + starPic + '" alt="" style="margin:0 10px;" /> <img src="' + starPic + '" alt="" style="margin:0 10px;" /></td> </tr> </table>  </td>  </tr> </table></td> </tr><tr>  <td>&nbsp;</td>  </tr></table></td></tr></table></td></tr><tr><td height="30"></td></tr></table></body> </body>'; //fs.readFileSync('./test/businesscard.html', 'utf8');
        // var options = { format: 'Letter', "timeout": 600000 };
        // var pdfName = new Date().getTime() + '_owner.pdf';
        // //Connection.query('INSERT INTO invoices_logs (role, user_id, booking_id, main_amount, paid_amount, invoice,email) VALUES ("2","' + reqBody.user_id + '", "' + reqBody.booking_id + '", "' + capAmount + '", "' + (trFnAmount / 100) + '", "' + pdfName + '", "' + ownInData.owner_email + '")', function() {});
        // pdf.create(html, options).toFile(req.app.locals.base_path + '/public/front/invoices/' + pdfName, function(err, respdf) {
        //     console.log('%%%%%%%%%%%%%%%%%%%%%%');
        //     if (err) {
        //         console.log(err);
        //         callback('Owner Invoices create error');
        //     } else {
        //         console.log('222222222222222');
        //         var attachment = [{ fileName: pdfName, filePath: respdf.filename }];
        //         console.log(respdf.filename)
        //             // mails.sendEmailWithAttachment(config.ADMINEMAIL, ownInData.owner_email, "HMT- Receipt", html, attachment, function(response) {
        //             //     console.log('333333333333333');
        //             //     if (response.code == config.CODES.notFound) {
        //             //         callback(config.MESSAGES.DBErr);
        //             //     } else if (response.code == config.CODES.OK) {
        //             //         console.log('8888888888888');
        //             //         callback(null, 'Receipt send');
        //             //     }
        //             // });
        //     }
        // });
        Connection.query('SELECT u.id AS renter_id, CONCAT(UCASE(LEFT(u.first_name, 1)),LCASE(SUBSTRING(u.first_name, 2))) AS renter_fname, CONCAT(UCASE(LEFT(u.last_name, 1)),LCASE(SUBSTRING(u.last_name, 2))) AS renter_lname, u.email AS renter_email, u.licence_number AS license_no, u.address AS renter_address, usr.id AS owner_id, CONCAT(UCASE(LEFT(usr.first_name, 1)),LCASE(SUBSTRING(usr.first_name, 2))) AS owner_fname, CONCAT(UCASE(LEFT(usr.last_name, 1)),LCASE(SUBSTRING(usr.last_name, 2))) AS owner_lname, usr.email AS owner_email, usr.address AS owner_address FROM `users` AS u LEFT JOIN users AS usr ON usr.id = 6 WHERE u.id = 1', function(err, result) {
            if (err) {
                return callback({ code: 500, data: config.MESSAGES.DBErr })
            } else {
                var agreeResult = result[0];
                var bodyData = {};
                bodyData.from_date = '2019-02-13';
                bodyData.to_date = '2019-02-13';
                var renterTC = config.fullhost + '/front/agreement/terms_and_conditions_Hirer.pdf';
                var ownerTC = config.fullhost + '/front/agreement/terms_and_conditions_Owner.pdf';
                var pdf = require('html-pdf');
                var baseUrl = req.protocol + '://' + config.fullhost;
                var logo = baseUrl + '/front/images/logo.png';
                var pdfName = '0012_agreement.pdf';
                var options = { format: 'Letter', "timeout": 50000 };
                var html = '<body style="zoom: 1.0;"><div class="container-box" style="width:90%; margin:auto;"><img width="180" src="' + logo + '"><h1 style="text-align:center; font-size:25px; color:#000; font-family:Arial, Helvetica, sans-serif; border-bottom:1px solid #333;padding: 10px 0px 15px;">HIRE AGREEMENT</h1><p class="agreement_details" style="color:#333; font-size:16px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; line-height: 30px; width:100%;">This Hire Agreement is made between <b>' + agreeResult.owner_fname + ' ' + agreeResult.owner_lname + '</b> of <b>' + agreeResult.owner_address + ' </b>hereinafter referred to as &#39;the Owner&#39; and <b>' + agreeResult.renter_fname + ' ' + agreeResult.renter_lname + '</b> of <b>' + agreeResult.renter_address + ' </b> , Licence No. ' + agreeResult.license_no + ', herein after referred to as &#39;the Hirer&#39;.</p><p class="agreement_details" style="color:#333; font-size:16px;font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;">The Hirer, hereby agree to hire the Owner&#39;s trailer from <b>' + bodyData.from_date + '</b> to <b>' + bodyData.to_date + '</b> at the advertised and agreed upon cost.</p><p class="agreement_details" style="color:#333; font-size:16px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;">The Hirer agrees to collect the trailer from <a style="color:#333; text-decoration:underline;" href="javascript:void(0)">(owner’s address)</a> at <a style="color:#333; text-decoration:underline;" href="javascript:void(0)">(time)</a> and return it to the same address by <a style="color:#333; text-decoration:underline;" href="javascript:void(0)">(time)</a> at the end of the last day of hire.</p><p class="agreement_details" style="color:#333; font-size:16px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;">The Hirer and Owner acknowledge and accept that Hire My Trailer Australia Pty. Ltd. (ABN: 19 127 783 037) will be paid commission as part of the hire agreement. This commission is inclusive of insurance that protects and indemnifies Hire My Trailer Australia Pty. Ltd. from any injuries and/or property damage that occurs during the duration of the hire as detailed in the <a style="color:#333; text-decoration:underline;" href="' + ownerTC + '" target="_blank">Owner Terms and Conditions</a> and the<a style="color:#333; text-decoration:underline;" href="' + renterTC + '" target="_blank"> Hirer Terms and Conditions</a>.</p><p class="agreement_details" style="color:#333; font-size:16px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;">The Hirer understands that it is their responsibility to make sure the trailer is properly and safely connected to the towing vehicle. </p>        <p class="agreement_details" style="color:#333; font-size:16px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;">The trailer shall be moved only with fully functioning trailer lights, and the Hirer agrees that it is their responsibility to confirm lights are functioning.</p>        <p class="agreement_details" style="color:#333; font-size:16px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;">Only the person signing this agreement as the Hirer will move the trailer. </p>        <p class="agreement_details" style="color:#333; font-size:16px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;">I, the Hirer, undertake to inspect the trailer before towing it away and report any defects, faults, or flaws to the Owner. </p>        <p class="agreement_details" style="color:#333; font-size:16px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;">I, the Hirer, hereby agree to the terms of this agreement together with the Hirer Terms and Conditions. <div class="left_box" style="float:left; width:100%; margin: 45px 1px 10px 10px;">[!Sign.1, ' + agreeResult.renter_fname + ', ' + agreeResult.renter_lname + ', ' + agreeResult.renter_email + ']</div></p><p class="agreement_details" style="color:#333; font-size:16px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;">I, the Owner, hereby agree to the terms of this agreement together with the Owner Terms and Conditions.<div class="left_box" style="float:left; width:100%; margin: 40px 1px 12px 2px;"> [!Sign.2, ' + agreeResult.owner_fname + ', ' + agreeResult.owner_lname + ', ' + agreeResult.owner_email + '] </div> </p></div></body>'
                    //var html = '<div class="container-box" style="width:90%; margin:auto;"><h1 style="text-align:center; font-size:25px; color:#000; font-family:Arial, Helvetica, sans-serif; border-bottom:1px solid #333;padding: 10px 0px 15px;">HIRE AGREEMENT</h1><p class="agreement_details" style="color:#333; font-size:16px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; line-height: 30px; width:100%;">This Hire Agreement is made between <b>' + agreeResult.owner_fname + ' ' + agreeResult.owner_lname + '</b> hereinafter referred to as ‘the Owner’ and <b>' + agreeResult.renter_fname + ' ' + agreeResult.renter_lname + '</b> herein after referred to as ‘the Hirer’.</p><p class="agreement_details" style="color:#333; font-size:16px;font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;">The Hirer, hereby agree to hire the Owner’s trailer from <b>2017-02-12</b> to <b>2017-02-12</b> at the advertised and agreed upon cost. </p><p class="agreement_details" style="color:#333; font-size:16px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;">The Hirer agrees to collect the trailer from <a style="color:#333; text-decoration:underline;" href="javascript:void(0)">(owner’s address)</a> at <a style="color:#333; text-decoration:underline;" href="javascript:void(0)">(time)</a> and return it to the same address by <a style="color:#333; text-decoration:underline;" href="javascript:void(0)">(time)</a> at the end of the last day of hire.</p><p class="agreement_details" style="color:#333; font-size:16px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;">The Hirer and Owner acknowledge and accept that Hire My Trailer will be paid commission as part of the hire agreement. This commission is inclusive of insurance that protects and indemnifies Hire My Trailer from any injuries and/or property damage that occurs during the duration of the hire as detailed in the <a style="color:#333; text-decoration:underline;" href="#" target="_blank">Owner Terms and Conditions</a> and the<a style="color:#333; text-decoration:underline;" href="#" target="_blank"> Hirer Terms and Conditions</a>.</p><p class="agreement_details" style="color:#333; font-size:16px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;">The Hirer understands that it is their responsibility to make sure the trailer is properly and safely connected to the towing vehicle. </p>        <p class="agreement_details" style="color:#333; font-size:16px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;">The trailer shall be moved only with fully functioning trailer lights, and the Hirer agrees that it is their responsibility to confirm lights are functioning.</p>        <p class="agreement_details" style="color:#333; font-size:16px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;">Only the person signing this agreement as the Hirer will move the trailer. </p>        <p class="agreement_details" style="color:#333; font-size:16px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;">I, the Hirer, undertake to inspect the trailer before towing it away and report any defects, faults, or flaws to the Owner. </p>        <p class="agreement_details" style="color:#333; font-size:16px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;">I, the Hirer, hereby agree to the terms of this agreement together with the Hirer Terms and Conditions. <div class="left_box" style="float:left; width:50%; margin: 57px 1px 10px 10px;">[!Sign.1, ' + agreeResult.renter_fname + ', ' + agreeResult.renter_lname + ', ' + agreeResult.renter_email + ']</div></p><p class="agreement_details" style="color:#333; font-size:16px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;">I, the Owner, hereby agree to the terms of this agreement together with the Owner Terms and Conditions.<div class="left_box" style="float:left; width:70%; margin: 57px 1px 12px 2px;"> [!Sign.2, ' + agreeResult.owner_fname + ', ' + agreeResult.owner_lname + ', ' + agreeResult.owner_email + '] </div> </p> <p style="float:left; width:100%;">&nbsp;</p> </div>';
                pdf.create(html, options).toFile(req.app.locals.base_path + '/public/front/agreement/' + pdfName, function(err, respdf) {
                    var filepath = respdf.filename;
                    if (err) {
                        console.log('7777777777', err);
                        //res.status(200).json({ status: config.CODES.statusFail, error: { error_message: "Agreement create error" } });
                        //return callback({ code: 500, data: 'Agreement create error' })
                    } else {
                        console.log('888888888888');
                        var filepath = respdf.filename;
                        console.log(filepath);
                        // uploadDocument(apiKey, apiSecretKey, filepath, agreeResult, function(response) {
                        //     console.log('10101010100000000');
                        //     console.log(response);
                        //     if (response.code == config.CODES.notFound) {
                        //         // res.status(200).json({ status: config.CODES.statusFail, error: { error_message: response.data } });
                        //         //return callback({ code: 500, data: response.data })
                        //     } else if (response.code == config.CODES.OK) {
                        //         var agreeStatus = response.data[0].Signers;
                        //         var referenceKey = response.data[0].Reference;
                        //         console.log('done');
                        //         if (agreeStatus.length > 0) {
                        //             //agreementAndBookingCode(tr, bodyData, bal, customerKey, disData, is_discount, price, ccard_fee, referenceKey, res)
                        //             // return callback({ code: 200, data: 'Agreement sent successfully' })
                        //         } else {
                        //             //return callback({ code: 500, data: 'Agreement send error' })
                        //             //res.status(200).json({ status: config.CODES.statusFail, error: { error_message: "Agreement send error" } });
                        //         }
                        //     }
                        // });
                    }

                });

            }
        });

        // Connection.query('SELECT u.id AS renter_id, CONCAT(UCASE(LEFT(u.first_name, 1)),LCASE(SUBSTRING(u.first_name, 2))) AS renter_fname, CONCAT(UCASE(LEFT(u.last_name, 1)),LCASE(SUBSTRING(u.last_name, 2))) AS renter_lname, u.email AS renter_email, u.licence_number AS license_no, u.address AS renter_address, usr.id AS owner_id, CONCAT(UCASE(LEFT(usr.first_name, 1)),LCASE(SUBSTRING(usr.first_name, 2))) AS owner_fname, CONCAT(UCASE(LEFT(usr.last_name, 1)),LCASE(SUBSTRING(usr.last_name, 2))) AS owner_lname, usr.email AS owner_email, usr.address AS owner_address FROM `users` AS u LEFT JOIN users AS usr ON usr.id = 6 WHERE u.id = 1', function(err, result) {
        //     if (err) {
        //         return callback({ code: 500, data: config.MESSAGES.DBErr })
        //     } else {
        //         var agreeResult = result[0];
        //         var bodyData = {};
        //         bodyData.from_date = '2019-02-13';
        //         bodyData.to_date = '2019-02-13';
        //         var renterTC = config.fullhost + '/front/agreement/terms_and_conditions_Hirer.pdf';
        //         var ownerTC = config.fullhost + '/front/agreement/terms_and_conditions_Owner.pdf';
        //         var pdf = require('html-pdf');
        //         var baseUrl = req.protocol + '://' + config.fullhost;
        //         var logo = baseUrl + '/front/images/logo.png';
        //         var pdfName = '0012_agreement.pdf';
        //         var options = { format: 'Letter', "timeout": 50000 };
        //         var html = '<body style="background-color: #c6c6c6;width: 100%; margin:0;padding:0;zoom:0.8;  "> <table border="0" width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial, Helvetica, sans-serif"><tr><td height="30"></td></tr><tr><td width="100%" align="center" valign="top"><table width="700" border="0" cellpadding="0" cellspacing="0" align="center" class="container top-header-left" bgcolor="e5eaf7"> <tr class="header-bg" bgcolor="178F45" style="float:left; width:100%;"><td><table border="0" width="680" align="center" cellpadding="0" cellspacing="0" class="container-middle" style="margin-left:15px;"> <tr><td> <table border="0" align="left" cellpadding="0" cellspacing="0" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;" class="logo"> <tr><td height="15" colspan="3"></td> </tr><tr> <td colspan="3" align="center"><a href="#" style="text-decoration:none"><img src="http://111.93.51.244:3000/front/images/logo.png" alt=" " width="294" height="61" border="0"></a></td></tr><tr><td height="15" colspan="3"></td> </tr></table></td></tr></table></td> </tr> <tr><td><table width="90%" border="0" cellspacing="0" align="center" cellpadding="0" style="font-family:Arial, Helvetica, sans-serif; font-size:17px;"><tr><td align="center" valign="middle" style="font-size:18px;" height="60px">Renter Receipt</td></tr><tr><td align="center" valign="middle">&nbsp;</td></tr><tr><td><table width="100%" border="1" cellspacing="0" cellpadding="0"><tr><td><table width="100%" border="0" cellspacing="0" cellpadding="20"><tr><td width="50%">$73.59</td><td width="50%">Thanks for Choosing HMT, Renter Renter</td></tr></table></td></tr><tr><td><table width="100%" border="0" cellspacing="0" cellpadding="10"><tr><td colspan="2" align="center" valign="middle" height="60px" style="font-size:20px">Hire Breakdown</td></tr><tr><td align="left" valign="middle" colspan="2"><table width="100%" border="0" cellspacing="0" cellpadding="10" style="border-bottom:1px #000 solid"><tr><td align="left" valign="middle">Plant Plant and <br/> 10/02/2017 to 11/02/2017</td><td align="right" valign="middle">$65.25</td></tr><tr><td align="left" valign="middle">GST</td><td align="right" valign="middle">$7.25</td></tr><tr><td align="left" valign="middle">Credit Card Fee 1.5%</td><td align="right" valign="middle">$1.09</td></tr><tr><td align="left" valign="middle">SubTotal</td><td align="right" valign="middle">$73.59</td></tr></table></td></tr><tr><td align="left" valign="middle">&nbsp;</td><td align="right" valign="middle">&nbsp;</td></tr><tr><td align="left" valign="middle">Charged</td><td align="right" valign="middle">&nbsp;</td></tr><tr><td colspan="2"><table width="100%" border="0" cellspacing="0" cellpadding="0"><tr><td width="8%" align="right" valign="middle"><img src="http://111.93.51.244:3000/admin/ckeditor/images/visa_1482316610662.png" alt="visa" width="107" height="65" /></td><td width="4%" align="right">&nbsp;</td><td width="49%" align="center"><div style="display:inliline-block;  padding:20px; font-size:16px; border:2px #333 solid;"> Personal **** 123</div></td><td width="13%" align="right">&nbsp;</td><td width="26%" align="right"> <div style="display:inliline-block;  padding:20px; font-size:16px; border:2px #333 solid;">$73.59</div></td> </tr> </table> </td> </tr> <tr> <td colspan="2"></td></tr></table> </td></tr><tr><td><table width="100%" border="0" cellspacing="0" cellpadding="10"><tr><td align="center"><img src="http://111.93.51.244:3000/front/images/userpic/thumb/profile_image_1487250608890.png" alt="" width="100" height="100" /><br /></td><td>You used Owner Owner Trailer</td><td align="center">You Rated Owner Owner<br />3.0 <img src="http://111.93.51.244:3000/admin/ckeditor/images/star_1482316628007.png" width="18" height="18" alt="" style="-3px 3px" /></td></tr></table> </td></tr></table></td></tr><tr> <td>&nbsp;</td></tr><tr><td><p>GST = 10% of Base<br /> PriceCredit Card Fee 1.5% + 10% GST</p></td></tr></table></td></tr></table></td></tr><tr><td height="30"></td></tr> </table></body>'
        //             //var html = '<div class="container-box" style="width:90%; margin:auto;"><h1 style="text-align:center; font-size:25px; color:#000; font-family:Arial, Helvetica, sans-serif; border-bottom:1px solid #333;padding: 10px 0px 15px;">HIRE AGREEMENT</h1><p class="agreement_details" style="color:#333; font-size:16px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; line-height: 30px; width:100%;">This Hire Agreement is made between <b>' + agreeResult.owner_fname + ' ' + agreeResult.owner_lname + '</b> hereinafter referred to as â€˜the Ownerâ€™ and <b>' + agreeResult.renter_fname + ' ' + agreeResult.renter_lname + '</b> herein after referred to as â€˜the Hirerâ€™.</p><p class="agreement_details" style="color:#333; font-size:16px;font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;">The Hirer, hereby agree to hire the Ownerâ€™s trailer from <b>2017-02-12</b> to <b>2017-02-12</b> at the advertised and agreed upon cost. </p><p class="agreement_details" style="color:#333; font-size:16px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;">The Hirer agrees to collect the trailer from <a style="color:#333; text-decoration:underline;" href="javascript:void(0)">(ownerâ€™s address)</a> at <a style="color:#333; text-decoration:underline;" href="javascript:void(0)">(time)</a> and return it to the same address by <a style="color:#333; text-decoration:underline;" href="javascript:void(0)">(time)</a> at the end of the last day of hire.</p><p class="agreement_details" style="color:#333; font-size:16px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;">The Hirer and Owner acknowledge and accept that Hire My Trailer will be paid commission as part of the hire agreement. This commission is inclusive of insurance that protects and indemnifies Hire My Trailer from any injuries and/or property damage that occurs during the duration of the hire as detailed in the <a style="color:#333; text-decoration:underline;" href="#" target="_blank">Owner Terms and Conditions</a> and the<a style="color:#333; text-decoration:underline;" href="#" target="_blank"> Hirer Terms and Conditions</a>.</p><p class="agreement_details" style="color:#333; font-size:16px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;">The Hirer understands that it is their responsibility to make sure the trailer is properly and safely connected to the towing vehicle. </p>        <p class="agreement_details" style="color:#333; font-size:16px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;">The trailer shall be moved only with fully functioning trailer lights, and the Hirer agrees that it is their responsibility to confirm lights are functioning.</p>        <p class="agreement_details" style="color:#333; font-size:16px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;">Only the person signing this agreement as the Hirer will move the trailer. </p>        <p class="agreement_details" style="color:#333; font-size:16px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;">I, the Hirer, undertake to inspect the trailer before towing it away and report any defects, faults, or flaws to the Owner. </p>        <p class="agreement_details" style="color:#333; font-size:16px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;">I, the Hirer, hereby agree to the terms of this agreement together with the Hirer Terms and Conditions. <div class="left_box" style="float:left; width:50%; margin: 57px 1px 10px 10px;">[!Sign.1, ' + agreeResult.renter_fname + ', ' + agreeResult.renter_lname + ', ' + agreeResult.renter_email + ']</div></p><p class="agreement_details" style="color:#333; font-size:16px; font-family:Verdana, Arial, Helvetica, sans-serif;float:left; width:100%;">I, the Owner, hereby agree to the terms of this agreement together with the Owner Terms and Conditions.<div class="left_box" style="float:left; width:70%; margin: 57px 1px 12px 2px;"> [!Sign.2, ' + agreeResult.owner_fname + ', ' + agreeResult.owner_lname + ', ' + agreeResult.owner_email + '] </div> </p> <p style="float:left; width:100%;">&nbsp;</p> </div>';
        //         pdf.create(html, options).toFile(req.app.locals.base_path + '/public/front/agreement/' + pdfName, function(err, respdf) {
        //             var filepath = respdf.filename;
        //             if (err) {
        //                 console.log('7777777777', err);
        //                 //res.status(200).json({ status: config.CODES.statusFail, error: { error_message: "Agreement create error" } });
        //                 //return callback({ code: 500, data: 'Agreement create error' })
        //             } else {
        //                 console.log('888888888888');
        //                 var filepath = respdf.filename;
        //                 console.log(filepath);
        //                 // uploadDocument(apiKey, apiSecretKey, filepath, agreeResult, function(response) {
        //                 //     console.log('10101010100000000');
        //                 //     console.log(response);
        //                 //     if (response.code == config.CODES.notFound) {
        //                 //         // res.status(200).json({ status: config.CODES.statusFail, error: { error_message: response.data } });
        //                 //         //return callback({ code: 500, data: response.data })
        //                 //     } else if (response.code == config.CODES.OK) {
        //                 //         var agreeStatus = response.data[0].Signers;
        //                 //         var referenceKey = response.data[0].Reference;
        //                 //         console.log('done');
        //                 //         if (agreeStatus.length > 0) {
        //                 //             //agreementAndBookingCode(tr, bodyData, bal, customerKey, disData, is_discount, price, ccard_fee, referenceKey, res)
        //                 //             // return callback({ code: 200, data: 'Agreement sent successfully' })
        //                 //         } else {
        //                 //             //return callback({ code: 500, data: 'Agreement send error' })
        //                 //             //res.status(200).json({ status: config.CODES.statusFail, error: { error_message: "Agreement send error" } });
        //                 //         }
        //                 //     }
        //                 // });
        //             }

        //         });

        //     }
        // });

        // var sinchSms = require('sinch-sms')({
        //     key: config.SINCHAPIKEY,
        //     secret: config.SINCHSECRETKEY
        // });
        // sinchSms.reportVerification('+919782135185', '9620').then(function(response) {
        //     console.log("response", response)
        //     res.status(200).json({ code: 200, data: response })
        // }).fail(function(error) {
        //     console.log("error", error)
        //         // Some type of error, see error object
        //     res.status(500).json({ code: 500, data: error })
        // });
        //var otpMob = '+91' + mobile;
        //console.log(otpMob)
        // sinchSms.verification('+919782135185').then(function(response) {
        //     console.log("response",response)
        //     res.status(200).json({ code: 200, data: response })
        // }).fail(function(error) {
        //     console.log("error",error)
        //         // Some type of error, see error object
        //     res.status(500).json({ code: 500, data: error })
        // });
        // var sinchSms = require('sinch-verification')({
        //     key: config.SINCHAPIKEY,
        //     secret: config.SINCHSECRETKEY
        // });
        // var sinchSms = require('sinch-sms')({
        //     key: config.SINCHAPIKEY,
        //     secret: config.SINCHSECRETKEY
        // });

        //var verification = sinchVerification.createVerification('+919782135185');

        // verification.initiate().then(function(result) {
        //         verification.verify('123456').then(function(result) {
        //             console.log('Success', result);
        //         }).fail(function(error) {
        //             console.log('Failure', error);
        //         });
        //     }).fail(function(error) {
        //         console.log('Failure initializing', error);
        //     })
        // var sinchSms = require('sinch-sms')({
        //     key: '4ebacec6-2866-45df-8dc2-304fed93d2f7',
        //     secret: 'gb8dRsrv9ESmumFs+mo/vA=='
        // });
        // //var otpStrr = otpStr.toString();
        // sinchSms.send('+919782135185', 'Hello kishore 001').then(function(response) {
        //     console.log(response)
        //     console.log(sinchSms.getStatus(response));
        //     res.status(200).json({ status: 1, message: "OTP send" });
        // }).fail(function(error) {
        //     // Some type of error, see error object
        //     console.log(error)
        //     res.status(500).json({ status: 0, message: 'OTP send error' });
        // });
        // var apiKey = '00000Q108JW4KY9N9RO0U8DIQYTDGLRQ0URGUFYZQ3M0G00000000009PW'; // API key
        // var apiSecretKey = 'M4eritqzhIt7vT4/5LLCVHg/2MnIrPdrk3c5eDXndNP6/YPhT+nqMr4YzhbJdlQqURJAzXbuh5aUBsbx/vwjfw=='; // API secret key

        // var filepath = req.app.locals.base_path + '/public/front/invoices/Hire_Agreement.pdf';

        // //sendSmartTag(apiKey, apiSecretKey, "072235054210050027177050146135083097198151048191");
        // uploadDocument(apiKey, apiSecretKey, filepath, sendSmartTag);

    });

    app.post('/api_user/signup', function(req, res, next) {
        var dataFields = req.body;
        Connection.query('SELECT * FROM users WHERE email="' + dataFields.email + '" OR mobile_one="' + dataFields.mobile_one + '"', function(err, user) {
            if (req.session.flash) {
                req.session.flash.error = [];
            }
            if (err) {
                res.status(500).json({ status: 0, message: err });
            }
            // check to see if theres already a user with that email
            if ((user.length > 0) && (user[0].email === dataFields.email)) {
                res.status(500).json({ status: 0, error: { error_message: config.MESSAGES.EmailAlreadyExist } });
            } else if ((user.length > 0) && (user[0].mobile_one === dataFields.mobile_one)) {
                res.status(500).json({ status: 0, error: { error_message: config.MESSAGES.mobileExist } });
            } else if ((user.length > 0) && (user[0].mobile_one === dataFields.mobile_one) && (user[0].otp_verified == 0)) {
                res.status(500).json({ status: 0, error: { error_message: 'Your mobile number is not verified' } });
            } else if ((user.length > 0) && (user[0].email === dataFields.email) && (user[0].mobile_one === dataFields.mobile_one)) {
                res.status(500).json({ status: 0, error: { error_message: 'This email id and mobile number is already registered.' } });
            } else {
                console.log('11111111')
                loadCodeForSignUp(dataFields, req, res)
            }
        });
    });

    app.post('/api_user/login', function(req, res, next) {
        var query = 'SELECT * from users where mobile_one= "' + req.body.mobile + '" and role=' + req.body.role;
        Connection.query(query, function(err, user, fields) {
            // if there are any errors, return the error before anything else
            if (err) {
                res.status(500).json({ status: 0, error: { error_message: "Database error" } });
            } else if (!user[0]) {
               res.status(500).json({ status: 0, error: { error_message: "Mobile number does not registered" } });
            } else {
                if (user[0].role == 1) {
                    req.session.admin = user[0]
                    Connection.query('UPDATE users SET is_login= 0,  is_suspend=0 WHERE id="' + user[0].id + '"', function(err, user) {})
                    delete req.session.admin.password;
                    res.status(200).json({ status: 1, message: 'Admin login successfully', data: user[0] });
                } else {
                    req.session.user = user[0]
                    Connection.query('UPDATE users SET is_login= 0,  is_suspend=0 WHERE id="' + user[0].id + '"', function(err, user) {})
                    delete req.session.user.password;
                    res.status(200).json({ status: 1, message: 'User login successfully', data: user[0] });
                }
                // all is well, return successful user
            }
        });
    });

    app.get('/api_user/signupSuccess', function(req, res) {
        var userId = req.session.passport.user;
        req.logout();
        res.status(200).json({ status: 1, user: userId, error: {} });
    });

    app.get('/api_user/signupFail', function(req, res) {
        if (req.session.flash) {
            res.status(500).json({ status: 0, message: req.session.flash.error[0] });
        }
        // res.status(200).json({ message: 'Success', data: req.session.passport, error: {} });
    });

    app.get('/api_user/userlogout', function(req, res) {
        req.logout();
        delete req.session.user;
        res.redirect('/');
    });

    app.get('/api_user/adminlogout', function(req, res) {
        delete req.session.admin;
        res.redirect('/admin');
    });

    /* @function : createHash
     *  @purpose  : This function used for create hash for password
     */
    var createHash = function(password) {
        return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
    }

    function loadCodeForSignUp(dataFields, req, res) {

        var activationToken = randtoken.generate(32);
        var promoCode = randtoken.generate(6).toUpperCase();
        var otpStr = Math.floor(1000 + Math.random() * 9000);
        dataFields.password = 123456;
        console.log('22222222', dataFields)
        data = {
                email: dataFields.email,
                mobile_one: dataFields.mobile_one,
                mobile_two: dataFields.mobile_two,
                first_name: dataFields.fname,
                last_name: dataFields.lname,
                password: createHash(dataFields.password),
                activation_token: activationToken,
                otp: otpStr
            }
            // query = 'INSERT INTO users SET ?', data;
            // return false;
        async.parallel({
                one: function(callback) {
                    var querysql = Connection.query('INSERT INTO users SET ?', data, function(err, row, fields) {
                        if (err) {
                            callback('Database error');
                        } else {
                            console.log("row--------", row);
                            callback(null, row);
                        }
                    });
                    console.log('66666666', querysql.sql);
                },
                two: function(callback) {
                    // var baseUrl = req.protocol + '://' + config.fullhost;
                    // var activationLink = "";
                    // activationLink = baseUrl + "/verify?access_token=" + activationToken;
                    // var logo = baseUrl + '/front/img/logo.png';
                    // var homeLink = baseUrl;
                    // var privacyLink = baseUrl + '/privacy-policy';
                    // var TermsLink = baseUrl + '/terms-and-condition';
                    // var fbImg = baseUrl + '/front/img/square-facebook.png';
                    // var twImg = baseUrl + '/front/img/square-twitter.png';
                    // var to = [dataFields.email];
                    // var subject = 'Geniune Work - Verification Link';
                    // var fullName = dataFields.fname + ' ' + dataFields.lname;
                    // //var message = '<h1><tbody><tr><td><h1>HMT application - Verification Link</h1><hr /><p><big>Hello,</big></p><p><big> Please <a href="' + activationLink + '" title="click here">click here</a> on the link for verify your email id or copy and paste the url : <strong>' + activationLink + '</strong></big></p><h3><code>Thanks,<br />HMT application Team</code></h3></td></tr></tbody></table>';
                    // //var message = '<body style="background-color: #c6c6c6;width: 100%; margin:0;padding:0;-webkit-font-smoothing: antialiased;  "><table border="0" width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial, Helvetica, sans-serif"><tr><td height="30"></td></tr><tr><td width="100%" align="center" valign="top"><table width="700" border="0" cellpadding="0" cellspacing="0" align="center" class="container top-header-left" bgcolor="e5eaf7"><tr class="header-bg" bgcolor="178F45" style="float:left; width:100%;"><td><table border="0" width="680" align="center" cellpadding="0" cellspacing="0" class="container-middle" style="margin-left:15px;"><tr><td><table border="0" align="left" cellpadding="0" cellspacing="0" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;" class="logo"> <tr><td height="15" colspan="3"></td></tr> <tr> <td colspan="3" align="center"> <a href="#" style="text-decoration:none"><img src="' + logo + '" alt=" " width="294" height="61" border="0"></a> </td> </tr> <tr><td height="15" colspan="3"></td> </tr></table></td> </tr> </table> </td></tr><tr><td style="    border-bottom: 1px solid #c6c6c6;    border-left: 1px solid #c6c6c6;    border-right: 1px solid #c6c6c6;"><table width="100%" border="0" align="center" cellpadding="0" cellspacing="0" bgcolor="FFFFFF" style=""><tr><td valign="top" height="20" style="font-family:Arial, Helvetica, sans-serif; font-size:25px; color:#777; padding:25px 25px 15px;">Dear ' + fullName + ',</td></tr><tr><td valign="top" height="20" style="font-family:Arial, Helvetica, sans-serif; font-size:16px; color:#777; padding:0px 25px 25px;">Thanks for signing up with Hire My Trailer! You must <a style="color:#179046;" href="' + activationLink + '">Click here</a> or follow this link to activate your account:</td></tr><tr> <td valign="top" height="20" style="font-family:Arial, Helvetica, sans-serif; font-size:16px; color:#777; padding:0px 25px 25px;">' + activationLink + '</td>  </tr><tr><td valign="top" height="20" style="font-family:Arial, Helvetica, sans-serif; font-size:16px; color:#777; padding:0px 25px 25px;">Regards,<br>HMT Team </td></tr> </table></td></tr> </table> </td> </tr><tr><td height="30"></td> </tr> </table></body>';
                    // var message = '<body style="background-color: #ffffff;width: 100%; margin:0;padding:0;-webkit-font-smoothing: antialiased;  ">    <table border="0" width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial, Helvetica, sans-serif">        <tr>            <td height="50"></td>        </tr>        <tr bgcolor="#9f9fa3">            <td width="100%" align="center" valign="top" bgcolor="ffffff">                <table width="700" border="0" cellpadding="0" cellspacing="0" align="center" class="container top-header-left" bgcolor="e5eaf7">                    <tr class="header-bg" bgcolor="178F45" style="float:left; width:100%;">                        <td>                            <table border="0" width="680" align="center" cellpadding="0" cellspacing="0" class="container-middle" style="margin-left:15px;">                                <tr>                                    <td>                                        <table border="0" align="center" cellpadding="0" cellspacing="0" style="border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;" class="logo">                                            <tr>                                                <td height="15" colspan="3"></td>                                            </tr>                                            <tr>                                                <td colspan="3" align="center">                                                    <a href="#" style="text-decoration:none"><img src="' + logo + '" alt=" " width="294" height="61" border="0"></a>                                                </td>                                            </tr>                                            <tr>                                                <td height="15" colspan="3"></td>                                            </tr>                                        </table>                                    </td>                                </tr>                            </table>                        </td>                    </tr>                    <tr>                        <td>                            <table width="100%" border="0" align="center" cellpadding="0" cellspacing="0" bgcolor="FFFFFF" style="border: 2px solid #178F45;">                                <tr>                                    <td valign="top" height="20" style="font-family:Arial, Helvetica, sans-serif; font-size:25px; color:#178F45; padding:25px 25px 5px;">Dear ' + fullName + ',</td>                                </tr>                                <tr>                                    <td valign="top" height="20" style="font-family:Arial, Helvetica, sans-serif; font-size:16px; color:#178F45; padding:0px 25px 25px;">Thank you for registering with HireMyTrailer.                                        <br/>Please follow this link inorder to validate your account.                                    </td>                                </tr>                                <tr>                                    <td valign="top" height="20" style="padding:0px 25px 25px; text-align:center;"><a style="font-family:Arial, Helvetica, sans-serif; font-size:18px;color:#fff;background: #178F45;text-decoration: none;width: 250px;height: 50px;display: block;margin: auto;line-height: 47px;" href="' + activationLink + '">Validate you account here</a>                                    </td>                                </tr>                                <tr>                                    <td valign="top" height="20" style="padding:0px 25px 25px; text-align:center;color:#178F45;">                                       <a style="font-family:Arial, Helvetica, sans-serif; font-size:18px;color:#178F45;text-decoration: none;padding: 0px 40px;line-height: 40px;" href="' + homeLink + '">Go to hiremytrailer.com.au</a>|                                        <a style="font-family:Arial, Helvetica, sans-serif; font-size:18px;color:#178F45;text-decoration: none;padding: 0px 40px;line-height: 40px;" href="' + privacyLink + '">Privacy</a>|                                        <a style="font-family:Arial, Helvetica, sans-serif; font-size:18px;color:#178F45;text-decoration: none;padding: 0px 40px;line-height: 40px;" href="' + TermsLink + '">Terms</a>|                                        <a style="font-family:Arial, Helvetica, sans-serif; font-size:18px;color:#178F45;text-decoration: none;padding: 0px 40px;line-height: 40px;" href="http://www.facebook.com/hiremytrailer">Find us on Facebook</a>|                                        <a style="font-family:Arial, Helvetica, sans-serif; font-size:18px;color:#178F45;text-decoration: none;padding: 0px 40px;line-height: 40px;" href="http://www.twitter.com/hiremytrailer">Find us on Twitter</a>                                    </td>                                </tr>                            </table>                        </td>                    </tr>                </table>            </td>        </tr>        <tr>            <td height="30"></td>        </tr>    </table></body>';
                    // mails.sendEmail(config.MAILSERVICE.USER, to, subject, message, function(response) {
                    //     if (response.code == config.CODES.OK) {
                    //         callback(null, response.data);
                    //     } else if (response.code == config.CODES.Error) {
                    //         callback('Verification email send error');
                    //     }
                    // });
                    callback(null, "done");
                },
                three: function(callback) {
                    var otpMob = dataFields.mobile_one;
                    // mails.createVerificationMobile(otpMob, function(response) {
                    //     if (response.code == config.CODES.OK) {
                    //         callback(null, 'send otp');
                    //     } else if (response.code == config.CODES.Error) {
                    //         callback('OTP send error');
                    //     }
                    // });
                    callback(null, 'send otp');
                }
            },
            function(err, results) {
                if (err) {
                    res.status(500).json({ status: 0, error: { error_message: err } });
                } else {
                    var inserted = results.one.insertId;
                    res.status(200).json({ status: 1, message: 'Sign Up successfully', user: inserted, otp: otpStr, login_type: dataFields.login_type, email: dataFields.email });
                }
            });
    }

};
