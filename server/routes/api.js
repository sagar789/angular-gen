var User = require('../controllers/users.js'); // included controller for user operations
//var Trailer = require('../controllers/trailers.js'); // included controller for trailer operations
//var Size = require('../controllers/sizes.js'); // included controller for size operations
//var Type = require('../controllers/types.js'); // included controller for type operations
//var bookedTrailer = require('../controllers/booked_trailer.js'); // included controller for booked_trailer operations
var Cms = require('../controllers/cms.js'); // included controller for cms operations
//var dailyRate = require('../controllers/daily_rate.js'); // included controller for rate operations
//var Payment = require('../controllers/payment.js'); // included controller for payment operations
//var Notification = require('../controllers/notification.js'); // included controller for notification operations
var Faq = require('../controllers/faq.js'); // included controller for faq operations
var Help = require('../controllers/help.js'); // included controller for faq operations
var Setting = require('../controllers/settings.js'); // included controller for setting operations
var formidable = require('formidable');
var fs = require('fs');
var async = require('async');
var im = require('imagemagick');
var Connection = require('../../config/database.js');
var config = require('../../config/config.js');
var express = require('express');
var app = express();
var jwt = require('jwt-simple');
app.set('jwtTokenSecret', config.secret);
// route middleware to make sure a user is logged in (shivansh)
function isSuspendRequest(req, res, next) {
    if (req.body.user_id) {
        Connection.query('SELECT u.id, u.balance FROM users AS u WHERE u.id = "' + req.body.user_id + '"', function(err, result) {
            console.log(result[0]);
            if (result[0].balance > 0) {
                res.status(200).json({ status: 1, is_susped: 0, message: "Your account has been suspended duo to negative balance. You will be logout automatically" });
            } else {
                return next();
            }
        });
    } else {
        res.status(200).json({ status: 1, is_susped: 0, message: "Invalid parameter" });
    }

}



var myLogger = function(req, res, next) {
    // check header or url parameters or post parameters for token
    console.log("apiii")
    var token = req.body.token || req.param('token') || req.headers['x-access-token'];

    // decode tokens
    if (token) {

        // verifies secret and checks exp
        try {
            var decoded = jwt.decode(token, app.get('jwtTokenSecret'), false);
            console.log("decoded", decoded)
            if (decoded && (decoded.exp <= Date.now())) {
                return res.json({ success: false, message: 'Access token has expired' });
            } else if (decoded == null || decoded == '') {
                return res.json({ success: false, message: 'Failed to authenticate token.' });
            } else {
                next();
            }

            // handle token here

        } catch (err) {
            return next();
        }

    } else {

        // if there is no token
        // return an error
        return res.status(403).send({
            success: false,
            message: 'No token provided.'
        });

    }
}

module.exports = function(app) {
    app.use(myLogger)
        /**
         * This API use for get all gallery image for CKEDITOR
         */
    app.get('/api/v1/ckeditor/gallery', function(req, res) {
        fs.readdir(req.app.locals.base_path + '/public/admin/ckeditor/images/', function(err, items) {
            //console.log(items)
            var fileCount = items.length;
            var fileArray = [];
            for (var i = 0; i < fileCount; i++) {
                var img = "/admin/ckeditor/images/" + items[i];
                var thumbImg = "/admin/ckeditor/thumb/" + items[i];
                fileArray.push({ "image": img, "thumb": thumbImg, "folder": "color" });
                if (i == (fileCount - 1)) {
                    res.status(200).json(fileArray)
                }
            }
        });
    });

    /**
     * This API use for upload file image for CKEDITOR
     */
    app.post('/api/upload_file_manage', function(req, res) {
        var form = new formidable.IncomingForm();
        form.parse(req);
        var imgName;
        var imgPath;
        form.on('fileBegin', function(name, file) {
            var name = file.name.split('.');
            imgName = name[0] + '_' + new Date().getTime() + '.' + name.pop();
            file.path = req.app.locals.base_path + '/public/admin/ckeditor/images/' + imgName;
            imgPath = file.path;
        });
        form.on('end', function() {
            im.crop({
                srcPath: imgPath,
                dstPath: 'public/admin/ckeditor/thumb/' + imgName,
                width: 150,
                height: 99,
                quality: 1,
            }, function(err, stdout, stderr) {
                console.log(err)
                res.status(200).json({ status: '1' });
            });
        });
    });

    /**
     * This API use for Unlink image for all
     */
    app.post('/api/unlink_file', function(req, res) {
        fs.unlink(req.app.locals.base_path + '/' + req.body.path + '/' + req.body.img, function(err) {
            if (err) {
                res.status(500).json({ status: 0, error: { error_message: err } });
            } else {
                res.status(200).json({ status: 1, message: 'unlinked' });
            }
        });
    });


    app.post('/api/user/forgot_password', function(req, res) {
        User.forgotpassword(req, res);
    });
    app.post('/api/user/uploadPic', function(req, res) {
        User.userProfilePic(req, res);
    });
    // app.post('/api/user/signup', function(req, res) {
    //     User.userSignup(req, res);
    // });

    //******************* User API start****************************//
    app.post('/api/user/admin_forgot_pass', function(req, res) {
        User.adminForgotPass(req, res);
    });
    app.post('/api/user/getByToken', function(req, res) {
        User.getAccessToken(req, res);
    });
    app.post('/api/user/signin', function(req, res) {
        User.signIn(req, res);
    });
    app.post('/api/user/reset_password', function(req, res) {
        User.resetPassword(req, res);
    });
    app.post('/api/user/check_reset_password_token', function(req, res) {
        User.checkresetPasswordToken(req, res);
    });
    app.post('/api/user/change_password', function(req, res) {
        User.changePassword(req, res);
    });
    app.post('/api/user/change_profile_password', function(req, res) {
        User.changeProfilePassword(req, res);
    });
    app.get('/api/user/count_users', function(req, res) {
        User.countUsers(req, res);
    });
    app.get('/api/user/loadUsers', function(req, res) {
        User.loadUsers(req, res);
    });
    app.post('/api/user/get_user_by_id', function(req, res) {
        User.getUserDetail(req, res);
    });
    app.post('/api/user/update_user_file', function(req, res) {
        User.updateUserFile(req, res);
    });
    app.post('/api/user/update_user', function(req, res) {
        User.updateUser(req, res);
    });
    app.post('/api/user/delete_user_by_id', function(req, res) {
        User.deleteUser(req, res);
    });
    app.post('/api/user/profile_update', function(req, res) {
        User.profileUpdate(req, res);
    });
    app.post('/api/user/get_my_profile', function(req, res) {
        User.getProfileByID(req, res);
    });
    app.post('/api/user/update_user_profile_mob', function(req, res) {
        User.updateProfileMob(req, res);
    });
    app.post('/api/user/cms_page_by_id', function(req, res) {
        User.cmsPageByID(req, res);
    });
    app.post('/api/user/verify_otp', function(req, res, next) {
        User.verifyOtp(req, res);
    })
    app.post('/api/user/regenerate_otp', function(req, res, next) {
        User.regenerateOtp(req, res);
    })
    app.post('/api/user/logout_mob', function(req, res, next) {
        User.logoutMob(req, res);
    })
    app.post('/api/user/contact_us', function(req, res, next) {
        User.contactUs(req, res);
    })
    app.post('/api/user/user_rating', function(req, res, next) {
        User.userRating(req, res);
    })
    app.post('/api/user/rate_owner_by_renter', function(req, res, next) {
        User.rateOwnerByRenter(req, res);
    })
    app.post('/api/user/pushNotification_for_iphone', function(req, res, next) {
        User.pushNotificationForIphone(req, res);
    })
    app.post('/api/user/pushNotification_for_android', function(req, res, next) {
        User.pushNotificationForAndroid(req, res);
    })
    app.get('/api/user/load_contact_list', function(req, res) {
        User.loadContactList(req, res);
    });
    app.post('/api/user/get_contact_by_id', function(req, res) {
        User.getContactById(req, res);
    });
    app.post('/api/user/delete_contact_list', function(req, res) {
        User.deleteContactList(req, res);
    });
    app.post('/api/user/get_dispute_id_list', function(req, res) {
        User.getDisputeIdList(req, res);
    });
    app.post('/api/user/save_dispute_data', function(req, res) {
        User.saveDisputeData(req, res);
    });
    app.get('/api/user/get_dispute_list', function(req, res) {
        User.getDisputeList(req, res);
    });
    app.post('/api/user/delete_dispute', function(req, res) {
        User.deleteDispute(req, res);
    });
    app.post('/api/user/get_invoices_by_user', function(req, res) {
        User.getInvoicesByUser(req, res);
    });
    app.post('/api/user/ask_question', function(req, res) {
        User.askQuestion(req, res);
    });
    app.post('/api/user/check_mobile_exist', function(req, res) {
        User.checkMobileExist(req, res);
    });
    app.post('/api/user/check_email_exist', function(req, res) {
        User.checkEmailExist(req, res);
    });

    //******************* Default Trailer API start****************************//
    // app.get('/api/trailar/loadDTrailer', function(req, res) {
    //     Trailer.loadDTrailers(req, res);
    // });
    // app.get('/api/trailar/loadDTrailerFull', function(req, res) {
    //     Trailer.loadDTrailersFull(req, res);
    // });
    // app.post('/api/trailar/add_Dtrailar', function(req, res) {
    //     Trailer.addDTrailer(req, res);
    // });
    // app.post('/api/trailar/get_Dtrailer_by_id', function(req, res) {
    //     Trailer.getDTrailerDetail(req, res);
    // });
    // app.post('/api/trailar/update_Dtrailer_file', function(req, res) {
    //     Trailer.updateDTrailerFile(req, res);
    // });
    // app.post('/api/trailar/update_Dtrailer', function(req, res) {
    //     Trailer.updateDTrailer(req, res);
    // });
    // app.post('/api/trailar/delete_Dtrailer_by_id', function(req, res) {
    //     Trailer.deleteDTrailer(req, res);
    // });
    // app.post('/api/trailar/check_type_exists', function(req, res) {
    //     Trailer.checkTypeExists(req, res);
    // });

    //******************* Trailer API start****************************//
    // app.get('/api/trailar/loadTrailer', function(req, res) {
    //     Trailer.loadTrailers(req, res);
    // });
    // app.post('/api/trailar/loadTrailer_by_user', isSuspendRequest, function(req, res) {
    //     Trailer.loadTrailersByUser(req, res);
    // });
    // app.post('/api/trailar/add_trailar', function(req, res) {
    //     Trailer.addTrailer(req, res);
    // });
    // app.get('/api/trailar/edit_trailer_by_id', function(req, res) {
    //     Trailer.editTrailerDetail(req, res);
    // });
    // app.post('/api/trailar/get_trailer_detail', function(req, res) {
    //     Trailer.getTrailerDetail(req, res);
    // });
    // app.post('/api/trailar/update_trailar', function(req, res) {
    //     Trailer.updateTrailer(req, res);
    // });
    // app.post('/api/trailar/get_selected_trailer', isSuspendRequest, function(req, res) {
    //     Trailer.selectedTrailer(req, res);
    // });
    // app.post('/api/trailar/delete_trailar', function(req, res) {
    //     Trailer.DeleteTrailer(req, res);
    // });
    // app.post('/api/trailar/get_trailer_by_latlng', function(req, res) {
    //     Trailer.getTrailerByLatlng(req, res);
    // });

    //******************* Size API start****************************//
    // app.get('/api/size/loadSize', function(req, res) {
    //     Size.loadSizes(req, res);
    // });
    // app.get('/api/size/load_duration', function(req, res) {
    //     Size.loadDuration(req, res);
    // });

    //******************* Type API start****************************//
    // app.get('/api/type/loadType', function(req, res) {
    //     Type.loadTypes(req, res);
    // });

    //******************* CMS API start****************************//
    app.get('/api/cms/loadCms', function(req, res) {
        Cms.loadCms(req, res);
    });
    app.post('/api/cms/add_cms', function(req, res) {
        Cms.addCms(req, res);
    });
    app.post('/api/cms/get_cms_by_id', function(req, res) {
        Cms.getCmsDetail(req, res);
    });
    app.post('/api/cms/update_cms', function(req, res) {
        Cms.updateCms(req, res);
    });
    app.post('/api/cms/delete_cms_by_id', function(req, res) {
        Cms.deleteCms(req, res);
    });

    //******************* Booked Trailer API start****************************//
    // app.post('/api/bookedTrailer/book_trailar', function(req, res) {
    //     bookedTrailer.bookTrailer(req, res);
    // });
    // app.get('/api/bookedTrailer/get_all_book_trailar', function(req, res) {
    //     bookedTrailer.getAllbookTrailerList(req, res);
    // });
    // app.post('/api/bookedTrailer/get_book_list_by_renter', isSuspendRequest, function(req, res) {
    //     bookedTrailer.getBookListByRenter(req, res);
    // });
    // app.post('/api/bookedTrailer/get_book_list_by_owner', isSuspendRequest, function(req, res) {
    //     bookedTrailer.getBookListByOwner(req, res);
    // });
    // app.post('/api/bookedTrailer/owner_accept_booking', function(req, res) {
    //     bookedTrailer.ownerAcceptBooking(req, res);
    // });
    // app.post('/api/bookedTrailer/ownerCancelBooking', function(req, res) {
    //     bookedTrailer.ownerCancelBooking(req, res);
    // });
    // app.post('/api/bookedTrailer/renterCancelBooking', function(req, res) {
    //     bookedTrailer.renterCancelBooking(req, res);
    // });
    // app.post('/api/bookedTrailer/pickup_booking', function(req, res) {
    //     bookedTrailer.pickUpBooking(req, res);
    // });
    // app.post('/api/bookedTrailer/dropoff_booking', function(req, res) {
    //     bookedTrailer.dropoffBooking(req, res);
    // });
    // app.post('/api/bookedTrailer/owner_decline_booking', function(req, res) {
    //     bookedTrailer.ownerDeclineBooking(req, res);
    // });
    // app.post('/api/bookedTrailer/extend_booking_date', function(req, res) {
    //     bookedTrailer.extendBookingDate(req, res);
    // });
    // app.post('/api/bookedTrailer/confirm_extend_request', function(req, res) {
    //     bookedTrailer.confirmExtendRequest(req, res);
    // });
    // app.post('/api/bookedTrailer/decline_extend_request', function(req, res) {
    //     bookedTrailer.declineExtendRequest(req, res);
    // });
    // app.get('/api/server/get_request', function(req, res) {
    //     bookedTrailer.getRequest(req, res);
    // });
    // app.get('/api/server/get_request_err', function(req, res) {
    //     bookedTrailer.getRequestErr(req, res);
    // });
    // app.post('/api/bookedTrailer/contact_before_decline', function(req, res) {
    //     bookedTrailer.contactBeforeDecline(req, res);
    // });

    //******************* Daily Rate API start****************************//
    // app.get('/api/dailyRate/loadRate', function(req, res) {
    //     dailyRate.loadRate(req, res);
    // });
    // app.post('/api/dailyRate/add_rate', function(req, res) {
    //     dailyRate.addRate(req, res);
    // });
    // app.post('/api/dailyRate/get_rate_by_id', function(req, res) {

    //     dailyRate.getRateDetail(req, res);
    // });
    // app.post('/api/dailyRate/update_rate', function(req, res) {
    //     dailyRate.updateRate(req, res);
    // });
    // app.post('/api/dailyRate/delete_rate_by_id', function(req, res) {
    //     dailyRate.deleteRate(req, res);
    // });
    // app.post('/api/dailyRate/calculate_daily_rate', function(req, res) {
    //     dailyRate.calculateDailyRate(req, res);
    // });
    // app.post('/api/dailyRate/check_exists', function(req, res) {
    //     dailyRate.checkExists(req, res);
    // });

    // //******************* Notication API start****************************//
    // app.get('/api/notification/load_notification', function(req, res) {
    //     Notification.loadNotification(req, res);
    // });
    // app.post('/api/notification/delete_notification_by_id', function(req, res) {
    //     Notification.deleteNotificationById(req, res);
    // });
    // app.post('/api/notification/get_receiver_list', function(req, res) {
    //     Notification.getReceiverList(req, res);
    // });

    //******************* Faq API start****************************//
    app.get('/api/faq/getFaqCategory', function(req, res) {
        Faq.getFaqCategory(req, res);
    });
    app.post('/api/faq/add_faq', function(req, res) {
        Faq.addFaq(req, res);
    });
    app.get('/api/faq/loadFaq', function(req, res) {
        Faq.loadFaqs(req, res);
    });
    app.post('/api/faq/get_faq_by_id', function(req, res) {
        Faq.getFaqDetail(req, res);
    });
    app.post('/api/faq/update_faq', function(req, res) {
        Faq.updateFaq(req, res);
    });
    app.post('/api/faq/delete_faq_by_id', function(req, res) {
        Faq.deleteFaq(req, res);
    });
    app.post('/api/faq/faq_detail_by_id', function(req, res) {
        Faq.faqDetailById(req, res);
    });
    app.post('/api/faq/search_help_by_key', function(req, res) {
        Faq.searchHelpByKey(req, res);
    });


    //******************* Setting API start ***************************//
    app.get('/api/setting/loadSettings', function(req, res) {
        Setting.loadSettings(req, res);
    });
    app.post('/api/setting/update_setting', function(req, res) {
        Setting.updateSetting(req, res);
    });

    //******************* Payment API start****************************//
    // app.post('/api/payment/add_cards', function(req, res) {
    //     Payment.addCards(req, res);
    // });
    // app.post('/api/payment/delete_card', function(req, res) {
    //     Payment.deleteCard(req, res);
    // });
    // app.post('/api/payment/retrive_cards', function(req, res) {
    //     Payment.retriveCards(req, res);
    // });
    // app.post('/api/payment/retrive_cards_for_customer', function(req, res) {
    //     Payment.retriveCardsForCustomer(req, res);
    // });
    // app.post('/api/payment/set_default_card', function(req, res) {
    //     Payment.setDefaultCard(req, res);
    // });
    // app.post('/api/payment/create_account', function(req, res) {
    //     Payment.createAccount(req, res);
    // });
    // app.post('/api/payment/create_bank_account', function(req, res) {
    //     Payment.addBankAccount(req, res);
    // });
    // app.post('/api/payment/update_bank_account', function(req, res) {
    //     Payment.updateBankAccount(req, res);
    // });
    // app.post('/api/payment/retrive_bank_accounts', function(req, res) {
    //     Payment.retriveBankAccounts(req, res);
    // });
    // app.post('/api/payment/charge_money', function(req, res) {
    //     Payment.chargeMoney(req, res);
    // });
    // app.get('/api/payment/load_payment_list', function(req, res) {
    //     Payment.loadPaymentList(req, res);
    // });
    // app.get('/api/payment/load_charge_list', function(req, res) {
    //     Payment.loadChargeList(req, res);
    // });
    // app.get('/api/payment/refund_payment', function(req, res) {
    //     Payment.refundPayment(req, res);
    // });
    // app.get('/api/payment/load_calcel_txn_list', function(req, res) {
    //     Payment.loadCalcelTxnList(req, res);
    // });


    //******************* Help API start****************************//
    app.post('/api/help/load_parent_category', function(req, res) {
        Help.loadParentCategory(req, res);
    });
    app.post('/api/help/add_parent_category', function(req, res) {
        Help.addParentCategory(req, res);
    });
    app.post('/api/help/delete_parent_category', function(req, res) {
        Help.deleteParentCategory(req, res);
    });
    app.post('/api/help/get_parent_category_by_id', function(req, res) {
        Help.editParentCategory(req, res);
    });
    app.post('/api/help/update_parent_category', function(req, res) {
        Help.updateParentCategory(req, res);
    });
    app.post('/api/help/duplicate_category', function(req, res) {
        Help.duplicateCategory(req, res);
    });

    app.post('/api/help/load_category', function(req, res) {
        Help.loadCategory(req, res);
    });
    app.post('/api/help/add_category', function(req, res) {
        Help.addCategory(req, res);
    });
    app.post('/api/help/delete_category', function(req, res) {
        Help.deleteCategory(req, res);
    });
    app.post('/api/help/get_category_by_id', function(req, res) {
        Help.editCategory(req, res);
    });
    app.post('/api/help/update_category', function(req, res) {
        Help.updateCategory(req, res);
    });

};
