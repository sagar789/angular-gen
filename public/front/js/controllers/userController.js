/********************************
 * Controller : user Controller *
 * created    : 10-23-2016      *
 ********************************/
(function() {
    'use strict';
    myApp.controller('userCtrl', ['$scope', '$http', '$state', 'AuthService', 'Notify', '$rootScope', 'Upload', 'file', '$sce', '$stateParams', '$localStorage', 'loadAsync', '$compile', 'fileCok', function($scope, $http, $state, AuthService, Notify, $rootScope, Upload, file, $sce, $stateParams, $localStorage, loadAsync, $compile, fileCok) {

        $scope.contact = {};
        $scope.currentUser = AuthService.isLoggedIn();
        $scope.userData = AuthService.getUserDetail();
        $scope.userTypeOption = ['Renter', 'Owner', 'Other'];
        $scope.contact.user = $scope.userTypeOption[0];
        $scope.pageSize = 15
        $scope.currentPage = 1;

        if ($scope.currentUser) {

            $scope.profile = { fname: $scope.userData.first_name, lname: $scope.userData.last_name, address: $scope.userData.address, suburb: $scope.userData.suburb, state: $scope.userData.state, lstate: $scope.userData.licence_state, email: $scope.userData.email, mobile: $scope.userData.mobile, otpVerfied: $scope.userData.otp_verified }
            $scope.checkProfile = { fname: $scope.userData.first_name, lname: $scope.userData.last_name, address: $scope.userData.address, suburb: $scope.userData.suburb, state: $scope.userData.state, lstate: $scope.userData.licence_state, email: $scope.userData.email, mobile: $scope.userData.mobile, otpVerfied: $scope.userData.otp_verified }
            if ($scope.userData.postcode == 0) {
                $scope.profile.postcode = '';
            } else {
                $scope.profile.postcode = $scope.userData.postcode;
            }
            if ($scope.userData.licence_number == 0) {
                $scope.profile.lnumber = '';
            } else {
                $scope.profile.lnumber = $scope.userData.licence_number;
            }
            if ($scope.userData.postcode == 0) {
                $scope.checkProfile.postcode = '';
            } else {
                $scope.checkProfile.postcode = $scope.userData.postcode;
            }
            if ($scope.userData.licence_number == 0) {
                $scope.checkProfile.lnumber = '';
            } else {
                $scope.checkProfile.lnumber = $scope.userData.licence_number;
            }
        }

        /**
         *@Function            : forgotPass()
         *@Description         : This function used for check forgot password email and sent reset mail
         *@unit test performed : check email validation and sent forgot password emailget
         *@Result              : Done successfully and sent forgot password email
         */
        $scope.forgotPass = function() {
            console.log('gchhkjhkjkj')
            if ($scope.forgotForm.$valid) {
                $rootScope.showLoading = true;
                $http.post('/api/user/forgot_password', { email: $scope.forgotform.email, role: 2 }).then(function(res) {
                    if (res.data.status == 0) {
                        $scope.forgotform = {};
                        $scope.forgotForm.$setPristine();
                        $scope.forgotForm.$setUntouched();
                        $rootScope.showLoading = false;
                        Notify.showNotification(res.data.error.error_message, 'error-class');
                    } else {
                        $scope.forgotform = {};
                        $scope.forgotForm.$setPristine();
                        $scope.forgotForm.$setUntouched();
                        $rootScope.showLoading = false;
                        $('#myModalForgotPass').modal('hide');
                        Notify.showNotification(res.data.message);
                    }
                }, function(err) {
                    $scope.forgotform = {};
                    $scope.forgotForm.$setPristine();
                    $scope.forgotForm.$setUntouched();
                    $rootScope.showLoading = false;
                    Notify.showNotification(err.data.error.error_message, 'error-class');
                });
            }
        }

        /**
         *@Function            : register()
         *@Description         : This function used for check forgot password email and sent reset mail
         *@unit test performed : check email validation and sent forgot password emailget
         *@Result              : Done successfully and sent forgot password email
         */
        $scope.register = function() {
            console.log('gchhkjhkjkj')
            if ($scope.signinForm.$valid) {
                console.log('121212121211212', $scope.regform);
                // $rootScope.showLoading = true;
                var obj = {};
                obj.fname = $scope.regform.fname;
                obj.lname = $scope.regform.lname;
                obj.mobile_one = $scope.regform.mobile1;
                obj.mobile_two = $scope.regform.mobile2;
                obj.email = $scope.regform.email;
                $http.post('/api_user/signup', obj).then(function(res) {
                    if (res.data.status == 1) {
                        $scope.signinForm = {};
                       // $scope.signinForm.$setPristine();
                       // $scope.signinForm.$setUntouched();
                       // $rootScope.showLoading = false;
                        Notify.showNotification(res.data.message);
                    }
                }, function(err) {
                    console.log(err.data.error.error_message)
                    $scope.signinForm = {};
                   // $scope.signinForm.$setPristine();
                   // $scope.signinForm.$setUntouched();
                   // $rootScope.showLoading = false;
                    Notify.showNotification(err.data.error.error_message, 'error-class');
                });
            }
        }

        /**
         *@Function            : userLogin()
         *@Description         : This function used for get login
         *@unit test performed : check form validation and get logged in user data in DB
         *@Result              : Done successfully and get logged in user data and create front user session
         */
        $scope.userLogin = function() {
            if ($scope.signinForm.$valid) {
                console.log('787878',$scope.reginform)
                AuthService.login($scope.reginform.mobile, 2).then(function(res) {
                    console.log(res)
                }).catch(function(err) {
                    console.log(err)
                    Notify.showNotification(err.error.error_message, 'error-class')
                });
            }
        }

        /**
         *@Function            : resetPass()
         *@Description         : This function used for reset password
         *@unit test performed : check form validation and check password
         *@Result              : Done successfully and reset password by given token
         */
        $scope.resetPass = function() {
            if ($scope.resetForm.$valid) {
                //$rootScope.showLoading = true;
                $http.post('/api/user/reset_password', { token: $stateParams.token, password: $scope.resform.cpassword }).then(function(res) {
                    $rootScope.showLoading = false;
                    Notify.showNotification(res.data.message);
                    $state.go('home');
                }, function(err) {
                    $rootScope.showLoading = false;
                    Notify.showNotification(err.data.error.error_message, 'error-class');
                });
            }
        }

        /**
         *@Function            : changePass()
         *@Description         : This function used for change password after loggin user
         *@unit test performed : check form validation and check password
         *@Result              : Done successfully and change password after loggin user
         */
        $scope.changePass = function() {
            if ($scope.signinpForm.$valid) {
                $rootScope.showLoading = true;
                $http.post('/api/user/change_profile_password', { id: $scope.userData.id, oldpassword: $scope.resform.oldpassword, password: $scope.resform.cpassword }).then(function(res) {
                    $rootScope.showLoading = false;
                    Notify.showNotification(res.data.message);
                }, function(err) {
                    $rootScope.showLoading = false;
                    Notify.showNotification(err.data.error.error_message, 'error-class');
                });
            }
        }

        /**
         *@Function            : profileUpdate()
         *@Description         : This function used for update profile data after login user in DB
         *@unit test performed : check form validation and save data in DB
         *@Result              : Done successfully and get update result
         */
        $scope.profileUpdate = function() {
            if ($scope.profileForm.$valid) {
                $rootScope.showLoading = true;
                var up = {};
                up.id = $scope.userData.id;
                up.fname = $scope.profile.fname;
                up.lname = $scope.profile.lname;
                up.address = $scope.profile.address || '';
                up.suburb = $scope.profile.suburb || '';
                up.state = $scope.profile.state || '';
                up.postcode = $scope.profile.postcode || '';
                up.lstate = $scope.profile.lstate || '';
                up.lnumber = $scope.profile.lnumber || '';
                $http.post('/api/user/profile_update', up).then(function(res) {
                    $rootScope.showLoading = false;
                    $scope.userData.first_name = $scope.profile.fname;
                    $scope.userData.last_name = $scope.profile.lname;
                    $scope.userData.address = $scope.profile.address;
                    $scope.userData.suburb = $scope.profile.suburb;
                    $scope.userData.state = $scope.profile.state;
                    $scope.userData.postcode = $scope.profile.postcode;
                    $scope.userData.licence_state = $scope.profile.lstate;
                    $scope.userData.licence_number = $scope.profile.lnumber;
                    Notify.showNotification(res.data.message);
                    $state.go($state.current, {}, { reload: true });
                }, function(err) {
                    $rootScope.showLoading = false;
                    Notify.showNotification(err.data.error, 'error-class');
                });
            }
        }

        $scope.checkDisable = function() {
            return angular.equals($scope.checkProfile, $scope.profile);
        }

        /**
         *@Function            : userLogout()
         *@Description         : This function used for logout logged in user
         *@unit test performed : check loggin user
         *@Result              : Done successfully and destroy logged in user session
         */
        $scope.userLogout = function() {
            AuthService.userLogout().then(function() {
                $state.go('home');
                $rootScope.currentUser = false;
                Notify.showNotification("You have successfully logout");
            }).catch(function() {
                console.log('errorrr');
            });
        }

        /**
         *@Function            : uploadUserImage()
         *@Description         : This function used for upload image on click
         *@unit test performed : check image data and send to service
         *@Result              : Done successfully and get update profile image
         */
        $scope.uploadUserImage = function(e) {
            $rootScope.showLoading = true;
            file.preview(angular.element(e)[0].files[0]).then(function(res) {
                $scope.userImgP = $sce.trustAsResourceUrl(res.data[0]);
                //console.log(angular.element(e)[0].files[0]);
                $http.post('/api/unlink_file/', { path: 'public/front/images/userpic/', img: $scope.userData.profile_pic });
                $http.post('/api/unlink_file/', { path: 'public/front/images/userpic/thumb/', img: $scope.userData.profile_pic });

                $scope._upload('/api/user/uploadPic', angular.element(e)[0].files[0], $scope.userData.id).success(function(res) {
                    $rootScope.showLoading = false;
                    $localStorage.user.profile_pic = res.data;
                    $scope.width = "100%";
                    Notify.showNotification(res.message);
                }, function(err) {
                    $rootScope.showLoading = false;
                    Notify.showNotification(err.data.error, 'error-class');
                });
            }, function(err) {
                $rootScope.showLoading = false;
                Notify.showNotification(err.message, 'error-class');
            });
        }

        $scope.openForgotPass = function() {
            $('#myModal').modal('hide');
            $('#myModalForgotPass').modal('show');
            grecaptcha.reset();



        }

        $scope.openLoginPop = function() {
            $('#myModal').modal('show');
            $('#myModalForgotPass').modal('hide');
        }

        /**
         *@Function            : sendContact()
         *@Description         : This function used for contact information to admin
         *@unit test performed : check validation and data send to service
         *@Result              : Done successfully and send contact info mail to admin
         */
        $scope.sendContact = function(e) {
            if ($scope.contactForm.$valid) {
                $rootScope.showLoading = true;
                var ctData = {};
                ctData.email = $scope.contact.email;
                ctData.name = $scope.contact.name;
                ctData.phone = $scope.contact.phone;
                ctData.subject = $scope.contact.subject;
                ctData.user_type = $scope.contact.user;
                if ($scope.contact.message) {
                    ctData.message = $scope.contact.message.replace(/"|""|`/gi, "'") || '';
                } else {
                    ctData.message = '';
                }

                if ($scope.contact.file) {
                    $scope._upload('/api/user/contact_us', $scope.contact.file, ctData).success(function(res) {
                        $rootScope.showLoading = false;
                        Notify.showNotification(res.message);
                        $state.go($state.current, {}, { reload: true });
                    }, function(err) {
                        $rootScope.showLoading = false;
                        Notify.showNotification(err.data.error, 'error-class');
                    });
                } else {
                    $scope._upload('/api/user/contact_us', null, ctData).success(function(res) {
                        $rootScope.showLoading = false;
                        Notify.showNotification(res.message);
                        $state.go($state.current, {}, { reload: true });
                    }, function(err) {
                        $rootScope.showLoading = false;
                        Notify.showNotification(err.data.error, 'error-class');
                    });
                }
            }
        }

        /**
         *@Function            : getAttacmentFile()
         *@Description         : This function used to get attachment file
         *@parameter- e        : get event to get browse image
         *@unit test performed : check for get bolb image for show
         *@Result              : Done successfully and get bolb image path and file name
         */
        $scope.getAttacmentFile = function(e) {
            // var file = angular.element(e)[0].files[0];
            // $scope.contact.file = file;
            fileCok.preview(angular.element(e)[0].files[0]).then(function(res) {
                $scope.contact.file = angular.element(e)[0].files[0];
                $scope.fileShowError = false;
            }, function(err) {
                $scope.fileShowError = true;
                $scope.fileShowErrorText = err.message;
                //$rootScope.showLoading = false;
            });
        }

        /**
         *@Function            : _upload()
         *@Description         : This function used for upload image
         *@parameter- url      : API WS url
         *@parameter- Vfiles   : image file data
         *@parameter- dataT    : form data
         *@unit test performed : check for get all parameter and pass data to DB
         *@Result              : Done successfully and get update profile data
         */
        $scope._upload = function(url, Vfiles, dataT) {
            return Upload.upload({
                url: url,
                file: Vfiles,
                data: dataT
            });
        };

        /**
         *@Function            : index()
         *@Description         : This function used for load my_profile page on profile load
         *@unit test performed : check validation and data send to service
         *@Result              : Done successfully and load my_profile page on profile load
         */
        $scope.index = function() {
            $scope.activeProfile = true;
            $scope.activeOwnerInvoice = false;
            $scope.activeRenterInvoice = false;
            $scope.activeDispute = false;
            $scope.width = "80%";
            if ($scope.userData.profile_pic) {
                $scope.width = "100%";
            }
            var ele = angular.element('#element');
            ele.html('');
            loadAsync.template({ view: 'front/views/user/my_profile.html' }).then(function(res) {
                ele.append($compile(res)($scope));
            });
        }

        /**
         *@Function            : raiseDisputeLoad()
         *@Description         : This function used for load raise_a_dispute page on profile load
         *@unit test performed : check validation and data send to service
         *@Result              : Done successfully and load raise_a_dispute page on profile load
         */
        $scope.raiseDisputeLoad = function() {
            $scope.activeProfile = false;
            $scope.activeOwnerInvoice = false;
            $scope.activeRenterInvoice = false;
            $scope.activeDispute = true;
            var ele = angular.element('#element');
            ele.html('');
            $http.post('/api/user/get_dispute_id_list', { user_id: $scope.userData.id }).then(function(res) {
                $scope.renterOption = res.data.data;
                $scope.conditionOption = [{ id: 1, name: "Previous" }, { id: 2, name: "Good" }, { id: 3, name: "Poor" }, { id: 4, name: "Very Poor" }];
                loadAsync.template({ view: 'front/views/user/raise_a_dispute.html' }).then(function(res) {
                    ele.append($compile(res)($scope));
                });
            });
        }

        /**
         *@Function            : raiseDispute()
         *@Description         : This function used for get data of raiseDispute form
         *@unit test performed : check validation and data send to service
         *@Result              : Done successfully and send email to 
         */
        $scope.raiseDispute = function() {
            if ($scope.disputeForm.$valid) {
                var dsData = {};
                dsData.user_id = $scope.userData.id;
                dsData.renter_name = $scope.dispute.name.fullname;
                dsData.renter_email = $scope.dispute.name.email;
                dsData.trailer_condition = $scope.dispute.condition.name;
                dsData.discription = $scope.dispute.textarea;
                $http.post('/api/user/save_dispute_data', dsData).then(function(res) {
                    $scope.renterOption = res.data.data;
                    Notify.showNotification('Your dispute has been assigned for action, we will be in contact shortly. Your reference number is (unique ref code, to be similar to HMT-DIS-0000001)');
                    $state.go($state.current, {}, { reload: true });
                });
            }
        }

        /**
         *@Function            : ownerInvoice()
         *@Description         : This function used for load all owner invoices
         *@unit test performed : data send to service
         *@Result              : Done successfully and load all owner invoices
         */

        $scope.ownerInvoice = function() {
            $scope.activeProfile = false;
            $scope.activeOwnerInvoice = true;
            $scope.activeRenterInvoice = false;
            $scope.activeDispute = false;
            var ele = angular.element('#element');
            ele.html('');
            $http.post('/api/user/get_invoices_by_user', { user_id: $scope.userData.id, role: 2 }).then(function(res) {
                $scope.invoiceOwList = res.data.data;
                loadAsync.template({ view: 'front/views/user/owner_invoice.html' }).then(function(res) {
                    ele.append($compile(res)($scope));
                });
            });
        }

        /**
         *@Function            : renterInvoice()
         *@Description         : This function used for load all renter invoices
         *@unit test performed : data send to service
         *@Result              : Done successfully and load all owner invoices
         */
        $scope.renterInvoice = function() {
            $scope.activeProfile = false;
            $scope.activeOwnerInvoice = false;
            $scope.activeRenterInvoice = true;
            $scope.activeDispute = false;
            var ele = angular.element('#element');
            ele.html('');
            $http.post('/api/user/get_invoices_by_user', { user_id: $scope.userData.id, role: 1 }).then(function(res) {
                $scope.invoiceReList = res.data.data;
                loadAsync.template({ view: 'front/views/user/renter_invoice.html' }).then(function(res) {
                    ele.append($compile(res)($scope));
                });
            });
        }

        $scope.resendOtp = function() {
            $rootScope.showLoading = true;
            $http.post('/api/user/regenerate_otp', { user_id: $scope.userData.id }).then(function(res) {
                console.log(res);
                if (res.data.status == 0) {
                    $rootScope.showLoading = false;
                    Notify.showNotification(err.data.error.error_message, 'error-class');
                } else {
                    $rootScope.showLoading = false;
                    Notify.showNotification(res.data.message);
                }
            }, function(err) {
                $rootScope.showLoading = false;
                Notify.showNotification(err.data.error.error_message, 'error-class');
            });
        }

    }]);
})();
