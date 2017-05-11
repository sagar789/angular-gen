/********************************
 * Controller : user Controller *
 * created    : 10-15-2016      *
 ********************************/
(function() {
    'use strict';
    myApp.controller('userCtrl', ['$scope', '$rootScope', 'Notify', '$http', '$state', 'AuthService', '$stateParams', 'Upload', 'file', '$sce', function($scope, $rootScope, Notify, $http, $state, AuthService, $stateParams, Upload, file, $sce) {

        $scope.currentPage = $rootScope.constant.currentPage;
        $scope.statusOption = $rootScope.constant.statusOption;
        $scope.suspendedOption = [{ id: 1, name: 'Yes' }, { id: 0, name: 'No' }];
        $scope.disputeOption = [{ id: 1, name: 'Yes' }, { id: 0, name: 'No' }];
        $scope.notifOption = [{ id: 1, name: 'No' }, { id: 0, name: 'Yes' }];
        $scope.paginationOption = $rootScope.constant.paginationOptn;
        $scope.pageSize = $scope.paginationOption[$rootScope.constant.pageSize];
        $scope.pageOwSize = 10;
        $scope.currentOwPage = 1;
        $scope.pageReSize = 10;
        $scope.currentRePage = 1;

        /**
         *@Function            : userLogin()
         *@Description         : This function used for get login
         *@unit test performed : check form validation and get logged in user data in DB
         *@Result              : Done successfully and get logged in user data and create admin session
         */
        $scope.userLogin = function() {
            if ($scope.signinForm.$valid) {
                AuthService.adminlogin($scope.regform.email, $scope.regform.password, 1).then(function(res) {
                    Notify.showNotification('Welcome to Admin');
                    $state.go('dashboard');
                }).catch(function(err) {
                    Notify.showNotification(err.message, 'error-class');
                });
            }
        }

        /**
         *@Function            : adminLogout()
         *@Description         : This function used for logout logged in user
         *@unit test performed : check loggin user
         *@Result              : Done successfully and destroy logged in user session
         */
        $scope.adminLogout = function() {
            if (confirm('Are you sure you want to logout ?')) {
                AuthService.adminLogout().then(function() {
                    $state.go('signin');
                    Notify.showNotification("You have successfully logout");
                }).catch(function() {
                    console.log('errorrr');
                });
            }
        }

        /**
         *@Function            : forgotPass()
         *@Description         : This function used for check forgot password email and sent reset mail
         *@unit test performed : check email validation and sent forgot password emailget
         *@Result              : Done successfully and sent forgot password email
         */
        $scope.forgotPass = function() {
            if ($scope.signinForm.$valid) {
                $rootScope.showLoading = true;
                $http.post('/api/user/admin_forgot_pass', { email: $scope.forgotform.email, role: 1 }).then(function(res) {
                    $rootScope.showLoading = false;
                    Notify.showNotification(res.data.message);
                }, function(err) {
                    $rootScope.showLoading = false;
                    Notify.showNotification(err.data.error, 'error-class');
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
                $rootScope.showLoading = true;
                $http.post('/api/user/reset_password', { token: $stateParams.token, password: $scope.resform.cpassword }).then(function(res) {
                    $rootScope.showLoading = false;
                    Notify.showNotification(res.data.message);
                    $state.go('signin');
                }, function(err) {
                    $rootScope.showLoading = false;
                    Notify.showNotification(err.data.error, 'error-class');
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
            if ($scope.changeForm.$valid) {
                var userData = AuthService.getAdminDetail();
                $rootScope.showLoading = true;
                $http.post('/api/user/change_password', { id: userData.id, password: $scope.resform.cpassword }).then(function(res) {
                    $rootScope.showLoading = false;
                    Notify.showNotification(res.data.message);
                    $state.go($state.current, {}, { reload: true });
                }, function(err) {
                    $rootScope.showLoading = false;
                    Notify.showNotification(err.data.error, 'error-class');
                });
            }
        }

        /**
         *@Function            : loadAllUsers()
         *@Description         : This function used for get all registerd user list
         *@unit test performed : check for get list
         *@Result              : Done successfully and get all list of registerd user
         */
        $scope.loadAllUsers = function() {
            $http.get('/api/user/loadUsers').then(function(res) {
                $scope.userTitle = 'All User List';
                $rootScope.showLoading = false;
                $scope.userList = res.data.data;
                console.log($scope.userList);
            }, function(err) {
                $rootScope.showLoading = false;
            });
        }

        /**
         *@Function            : editUser()
         *@Description         : This function used for get user data by Id for Edit user detail
         *@unit test performed : check and get edit data by id
         *@Result              : Done successfully and get user data by Id
         */
        $scope.editUser = function() {
            $http.post('/api/user/get_user_by_id', { id: $stateParams.Id, modified: new Date() }).then(function(res) {
                $rootScope.showLoading = false;
                $scope.userData = res.data.data;
                console.log($scope.userData);
                $scope.userData.mobile_one = parseInt(res.data.data.mobile_one);
                if (res.data.data.profile_pic) {
                    $scope.propEdImg = res.data.data.profile_pic;
                } else {
                    $scope.propEdImg = '';
                }

                if (res.data.data.postcode == 0) {
                    $scope.userData.postcode = '';
                } else {
                    $scope.userData.postcode = res.data.data.postcode;
                }
                
                angular.forEach($scope.statusOption, function(i, key) {
                    if (i.id === res.data.data.status) {
                        $scope.userData.status = $scope.statusOption[key];
                    }
                });               
                $scope.fileTypeError = false;                
            }, function(err) {
                $rootScope.showLoading = false;
                Notify.showNotification(err.data.error, 'error-class');
            });
        }

        /**
         *@Function            : updateUser()
         *@Description         : This function used for update user data by Id
         *@unit test performed : check form validation and update data by id
         *@Result              : Done successfully and get updated user data by Id
         */
        $scope.updateUser = function() {
            console.log($scope.updateForm.$valid)
            if ($scope.updateForm.$valid && ($scope.fileTypeError == false)) {
                $rootScope.showLoading = true;
                $scope.showTypeError = false;
                var upData = {};
                upData.id = $scope.userData.id;
                upData.email = $scope.userData.email;
                upData.fname = $scope.userData.fname;
                upData.lname = $scope.userData.lname;
                upData.mobile = $scope.userData.mobile;
                upData.promo_code = $scope.userData.promo_code;
                upData.issuspend = $scope.userData.issuspend.id;
                upData.isdispute = $scope.userData.is_dispute.id;
                upData.address = $scope.userData.address || '';
                upData.suburb = $scope.userData.suburb || '';
                upData.state = $scope.userData.state || '';
                upData.postcode = $scope.userData.postcode || '';
                upData.lnumber = $scope.userData.lnumber || '';
                upData.lstate = $scope.userData.licence_state || '';
                upData.is_notification = $scope.userData.is_notification.id;
                upData.status = $scope.userData.status.id;
                if ($scope.userData.issuspend.id == 0) {
                    upData.is_login = 0;
                } else if ($scope.userData.issuspend.id == 1) {
                    upData.is_login = 5;
                } else {
                    upData.is_login = $scope.userData.is_login;
                }

                $scope.userData

                upData.modified = new Date();
                if ($scope.userData.Image) {
                    $http.post('/api/unlink_file/', { path: 'public/front/images/userpic/', img: $scope.propEdImg });
                    $http.post('/api/unlink_file/', { path: 'public/front/images/userpic/thumb/', img: $scope.propEdImg });
                    $scope._upload('/api/user/update_user_file', $scope.userData.Image, upData).success(function(res) {
                        $rootScope.showLoading = false;
                        Notify.showNotification(res.message);
                        $state.go('userManage')
                    }, function(err) {
                        $rootScope.showLoading = false;
                        Notify.showNotification(err.data.error, 'error-class');
                    });
                } else {
                    $http.post('/api/user/update_user', upData).then(function(res) {
                        $rootScope.showLoading = false;
                        Notify.showNotification(res.data.message);
                        $state.go('userManage')
                    }, function(err) {
                        $rootScope.showLoading = false;
                        Notify.showNotification(err.data.error, 'error-class');
                    });
                }

            } else {
                // if ($scope.trailerData.selectedItem.length > 0) {
                //     $scope.showTypeError = false;
                // } else {
                //     $scope.showTypeError = true;
                // }
            }
        }

        /**
         *@Function            : previewImage()
         *@Description         : This function used show preview image on browse
         *@parameter- e        : get event to get browse image
         *@unit test performed : check for get bolb image for show
         *@Result              : Done successfully and get bolb image path
         */
        $scope.previewImage = function(e) {
            file.preview(angular.element(e)[0].files[0]).then(function(res) {
                $scope.propImg = $sce.trustAsResourceUrl(res.data[0]);
                $scope.userData.Image = angular.element(e)[0].files[0];
                $rootScope.showLoading = false;
                $scope.fileTypeError = false;
            }, function(err) {
                $scope.fileTypeError = true;
                $scope.propImg = '';
                $scope.propEdImg = '';
                $scope.userData.Image = '';
                $rootScope.showLoading = false;
            });
        }

        /**
         *@Function            : _upload()
         *@Description         : This function used for upload image
         *@parameter- url      : where save form data
         *@parameter- Vfiles   : image file data
         *@parameter- dataT    : form data
         *@unit test performed : check for get all parameter and pass data to DB
         *@Result              : Done successfully and get all list of user
         */
        $scope._upload = function(url, Vfiles, dataT) {
            if (Vfiles) {
                return Upload.upload({
                    url: url,
                    file: Vfiles,
                    data: dataT
                });
            }
        };

        /**
         *@Function            : deleteUser()
         *@Description         : This function used for delete user data by Id
         *@parameter- id       : id for delete data
         *@unit test performed : check user deleted by id
         *@Result              : Done successfully and deleted user data by Id
         */
        $scope.deleteUser = function(id) {
            if (confirm('Are you sure you want to delete this ?')) {
                $http.post('/api/user/delete_user_by_id', { id: id }).then(function(res) {
                    $rootScope.showLoading = false;
                    console.log(res)
                    $state.go($state.current, {}, { reload: true });
                    Notify.showNotification('User deleted successfully');
                }, function(err) {
                    $rootScope.showLoading = false;
                    Notify.showNotification(err.data.error, 'error-class');
                });
            }
        }

        /**
         *@Function            : register()
         *@Description         : This function used for register
         *@unit test performed : check for get list
         *@Result              : Done successfully and get data of registered user
         */
        $scope.register = function() {
            if ($scope.regform.$valid) {
                console.log($scope.registerForm)
                $http.post('/api_user/signup', { username: $scope.registerForm.username, fname: $scope.registerForm.fname, lname: $scope.registerForm.lname, email: $scope.registerForm.email, password: $scope.registerForm.password }).then(function(res) {
                    Notify.showNotification(res.data.message);
                    //$state.go($state.current, {}, {reload: true});
                    blockUI.stop();
                }, function(res) {
                    console.log('error');
                    blockUI.stop();
                });

            }
        }

        /**
         *@Function            : loadAllContacts()
         *@Description         : This function used for get all Contact-us list
         *@unit test performed : check for get list
         *@Result              : Done successfully and get all Contact-us list which is submitted by user from contact-us form
         */
        $scope.loadAllContacts = function() {
            $http.get('/api/user/load_contact_list').then(function(res) {
                $scope.userTitle = 'All Contact List';
                $rootScope.showLoading = false;
                $scope.list = res.data.data;
            }, function(err) {
                $rootScope.showLoading = false;
            });
        }

        /**
         *@Function            : viewContact()
         *@Description         : This function used for get contact data by Id for view cms detail
         *@unit test performed : check and get edit data by id
         *@Result              : Done successfully and get contact data by Id
         */
        $scope.viewContact = function() {
            $http.post('/api/user/get_contact_by_id', { id: $stateParams.Id }).then(function(res) {
                $rootScope.showLoading = false;
                $scope.form = res.data.data;
            }, function(err) {
                $rootScope.showLoading = false;
                Notify.showNotification(err.error.error_message, 'error-class');
            });
        }

        /**
         *@Function            : deleteContact()
         *@Description         : This function used for delete contact data by Id
         *@parameter- id       : id for delete data
         *@unit test performed : check cms deleted by id
         *@Result              : Done successfully and deleted contact data by Id
         */
        $scope.deleteContact = function(id, file) {
            if (confirm('Are you sure you want to delete this...?')) {
                $http.post('/api/user/delete_contact_list', { id: id, file: file }).then(function(res) {
                    $rootScope.showLoading = false;
                    $state.go($state.current, {}, { reload: true });
                    Notify.showNotification(res.data.message);
                }, function(err) {
                    $rootScope.showLoading = false;
                    Notify.showNotification(err.error.error_message, 'error-class');
                });
            }
        }

        /**
         *@Function            : loadAllDispute()
         *@Description         : This function used for get all disputed list
         *@unit test performed : check for get list
         *@Result              : Done successfully and get all disputed list
         */
        $scope.loadAllDispute = function() {
            $http.get('/api/user/get_dispute_list').then(function(res) {
                $scope.userTitle = 'All Dispute List';
                $rootScope.showLoading = false;
                $scope.list = res.data.data;
            }, function(err) {
                $rootScope.showLoading = false;
            });
        }

        /**
         *@Function            : loadAllDispute()
         *@Description         : This function used for get all disputed list
         *@unit test performed : check for get list
         *@Result              : Done successfully and get all disputed list
         */
        $scope.deleteDispute = function(id) {
            if (confirm('Are you sure you want to delete this ?')) {
                $http.post('/api/user/delete_dispute', { id: id }).then(function(res) {
                    $rootScope.showLoading = false;
                    $state.go($state.current, {}, { reload: true });
                    Notify.showNotification(res.data.message);
                }, function(err) {
                    $rootScope.showLoading = false;
                    Notify.showNotification(err.data.error, 'error-class');
                });
            }
        }

    }]);
})();
