//*******************************//
//   Admin App Controller            //
//*******************************//
'use strict'
var myApp = angular.module('myApp', ['ui.router', 'ngStorage', 'cgNotify', 'angularUtils.directives.dirPagination', 'ngFileUpload', '720kb.datepicker', 'angularjs-dropdown-multiselect', 'ngCkeditor']);
myApp.constant('constant', constants);
myApp.config(['$stateProvider', '$urlRouterProvider', '$locationProvider', '$sceProvider', '$httpProvider', function($stateProvider, $urlRouterProvider, $locationProvider, $sceProvider, $httpProvider) {
    //initialize get if not there
    if (!$httpProvider.defaults.headers.get) {
        $httpProvider.defaults.headers.get = {};
    }

    $httpProvider.defaults.useXDomain = true;
  delete $httpProvider.defaults.headers.common['X-Requested-With'];

    // Answer edited to include suggestions from comments
    // because previous version of code introduced browser-related errors

    //disable IE ajax request caching
    $httpProvider.defaults.headers.get['If-Modified-Since'] = 'Mon, 26 Jul 1997 05:00:00 GMT';
    // extra
    $httpProvider.defaults.headers.get['Cache-Control'] = 'no-cache';
    $httpProvider.defaults.headers.get['Pragma'] = 'no-cache';
    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
    });
    $stateProvider.state('dashboard', {
            url: '/admin/',
            views: {

                "middle": { templateUrl: 'views/main/dashboard.html' }
            },
            resolve: {
                check: function($rootScope, AuthService, $window) {
                    if (!AuthService.adminLoggedIn()) {
                        $window.location.href = '/admin/signin'
                    } else {
                        $rootScope.showMiddle = true;
                        $rootScope.activeDash = true;
                        $rootScope.activeUser = false;
                        $rootScope.activeDTrailer = false;
                        $rootScope.activeCms = false;
                        $rootScope.activeTrailer = false;
                        $rootScope.activeBTrailer = false;
                        $rootScope.activeDRate = false;
                        $rootScope.activeNotif = false;
                        $rootScope.activeContact = false;
                        $rootScope.activeFaqCategory = false;
                        $rootScope.activeFaq = false;
                        $rootScope.activePayment = false;
                        $rootScope.activeSetting = false;
                        $rootScope.activeDispute = false;
                        $rootScope.crumbTitle = ''
                    }
                }
            }
        }).state('signin', {
            url: '/admin/signin',
            views: {
                "leftbar": { templateUrl: 'views/user/signin.html' }
            },
            resolve: {
                check: function($rootScope, AuthService, $window) {
                    if (AuthService.adminLoggedIn()) {
                        $window.location.href = '/admin'
                    } else {
                        $rootScope.showMiddle = false;
                    }

                }
            }
        }).state('forgotPassword', {
            url: '/admin/forgot_password',
            views: {
                "leftbar": { templateUrl: 'views/user/forgot_password.html' }
            },
            resolve: {
                check: function($rootScope) {
                    $rootScope.showMiddle = false;
                }
            }
        }).state('resetPassword', {
            url: '/admin/reset_password?token',
            views: {
                "leftbar": { templateUrl: 'views/user/reset_password.html' }
            },
            resolve: {
                check: function($rootScope, $stateParams, $window) {
                    $rootScope.showMiddle = false;
                    if (!$stateParams.token) {
                        $window.location.href = '/admin/page-not-found'
                    }
                }
            }
        }).state('changePassword', {
            url: '/admin/change_password',
            views: {

                "middle": { templateUrl: 'views/user/change_password.html' }
            },
            resolve: {
                check: function($rootScope, AuthService, $window) {
                    if (!AuthService.adminLoggedIn()) {
                        $window.location.href = '/admin/signin'
                    } else {
                        $rootScope.showMiddle = true;
                        $rootScope.crumbTitle = 'Change Password'
                    }
                }
            }
        }).state('userManage', {
            url: '/admin/user_management',
            views: {

                "middle": { templateUrl: 'views/user/users_list.html' }
            },
            resolve: {
                check: function($rootScope, AuthService, $window) {
                    if (!AuthService.adminLoggedIn()) {
                        $window.location.href = '/admin/signin'
                    } else {
                        $rootScope.showMiddle = true;
                        $rootScope.activeDash = false;
                        $rootScope.activeUser = true;
                        $rootScope.activeDTrailer = false;
                        $rootScope.activeCms = false;
                        $rootScope.activeTrailer = false;
                        $rootScope.activeBTrailer = false;
                        $rootScope.activeDRate = false;
                        $rootScope.activeNotif = false;
                        $rootScope.activeContact = false;
                        $rootScope.activeFaqCategory = false;
                        $rootScope.activeFaq = false;
                        $rootScope.activePayment = false;
                        $rootScope.activeSetting = false;
                        $rootScope.activeDispute = false;
                        $rootScope.crumbTitle = 'User management'
                    }
                }
            }
        }).state('viewUser', {
            url: '/admin/view_user?Id',
            views: {

                "middle": { templateUrl: 'views/user/view_user.html' }
            },
            resolve: {
                check: function($rootScope, AuthService, $window, $stateParams) {
                    if (!AuthService.adminLoggedIn()) {
                        $window.location.href = '/admin/signin'
                    }
                    if (!$stateParams.Id) {
                        $window.location.href = '/admin/user-management'
                    } else {
                        $rootScope.showMiddle = true;
                        $rootScope.activeDash = false;
                        $rootScope.activeUser = true;
                        $rootScope.activeDTrailer = false;
                        $rootScope.activeCms = false;
                        $rootScope.activeTrailer = false;
                        $rootScope.activeBTrailer = false;
                        $rootScope.activeDRate = false;
                        $rootScope.activeNotif = false;
                        $rootScope.activeContact = false;
                        $rootScope.activeFaqCategory = false;
                        $rootScope.activeFaq = false;
                        $rootScope.activePayment = false;
                        $rootScope.activeSetting = false;
                        $rootScope.activeDispute = false;
                        $rootScope.crumbTitle = 'User management / view user'
                    }
                }
            }
        }).state('editUser', {
            url: '/admin/edit_user?Id',
            views: {

                "middle": { templateUrl: 'views/user/edit_user.html' }
            },
            resolve: {
                check: function($rootScope, AuthService, $window, $stateParams) {
                    if (!AuthService.adminLoggedIn()) {
                        $window.location.href = '/admin/signin'
                    }
                    if (!$stateParams.Id) {
                        $window.location.href = '/admin/user-management'
                    } else {
                        $rootScope.showMiddle = true;
                        $rootScope.activeDash = false;
                        $rootScope.activeUser = true;
                        $rootScope.activeDTrailer = false;
                        $rootScope.activeCms = false;
                        $rootScope.activeTrailer = false;
                        $rootScope.activeBTrailer = false;
                        $rootScope.activeDRate = false;
                        $rootScope.activeNotif = false;
                        $rootScope.activeContact = false;
                        $rootScope.activeFaqCategory = false;
                        $rootScope.activeFaq = false;
                        $rootScope.activePayment = false;
                        $rootScope.activeSetting = false;
                        $rootScope.activeDispute = false;
                        $rootScope.crumbTitle = 'User management / edit user'
                    }
                }
            }
        }).state('dTrailerManage', {
            url: '/admin/default_trailer_management',
            views: {

                "middle": { templateUrl: 'views/trailers/D_trailer_list.html' }
            },
            resolve: {
                check: function($rootScope, AuthService, $window) {
                    if (!AuthService.adminLoggedIn()) {
                        $window.location.href = '/admin/signin'
                    } else {
                        $rootScope.showMiddle = true;
                        $rootScope.activeDash = false;
                        $rootScope.activeUser = false;
                        $rootScope.activeDTrailer = true;
                        $rootScope.activeCms = false;
                        $rootScope.activeTrailer = false;
                        $rootScope.activeBTrailer = false;
                        $rootScope.activeDRate = false;
                        $rootScope.activeNotif = false;
                        $rootScope.activeContact = false;
                        $rootScope.activeFaqCategory = false;
                        $rootScope.activeFaq = false;
                        $rootScope.activePayment = false;
                        $rootScope.activeSetting = false;
                        $rootScope.activeDispute = false;
                        $rootScope.crumbTitle = 'Trailers Category management'
                    }
                }
            }
        }).state('editDTrailer', {
            url: '/admin/edit_Dtrailer?Id',
            views: {

                "middle": { templateUrl: 'views/trailers/edit_Dtrailer.html' }
            },
            resolve: {
                check: function($rootScope, AuthService, $window, $stateParams) {
                    if (!AuthService.adminLoggedIn()) {
                        $window.location.href = '/admin/signin'
                    }
                    if (!$stateParams.Id) {
                        $window.location.href = '/admin/default_trailer_management'
                    } else {
                        $rootScope.showMiddle = true;
                        $rootScope.activeDash = false;
                        $rootScope.activeUser = false;
                        $rootScope.activeDTrailer = true;
                        $rootScope.activeCms = false;
                        $rootScope.activeTrailer = false;
                        $rootScope.activeBTrailer = false;
                        $rootScope.activeDRate = false;
                        $rootScope.activeNotif = false;
                        $rootScope.activeContact = false;
                        $rootScope.activeFaqCategory = false;
                        $rootScope.activeFaq = false;
                        $rootScope.activePayment = false;
                        $rootScope.activeSetting = false;
                        $rootScope.activeDispute = false;
                        $rootScope.crumbTitle = 'Trailers Category management / edit trailer'
                    }
                }
            }
        }).state('addDTrailer', {
            url: '/admin/add_DTrailer',
            views: {

                "middle": { templateUrl: 'views/trailers/add_Dtrailer.html' }
            },
            resolve: {
                check: function($rootScope, AuthService, $window, $stateParams) {
                    if (!AuthService.adminLoggedIn()) {
                        $window.location.href = '/admin/signin'
                    } else {
                        $rootScope.showMiddle = true;
                        $rootScope.activeDash = false;
                        $rootScope.activeUser = false;
                        $rootScope.activeDTrailer = true;
                        $rootScope.activeCms = false;
                        $rootScope.activeTrailer = false;
                        $rootScope.activeBTrailer = false;
                        $rootScope.activeDRate = false;
                        $rootScope.activeNotif = false;
                        $rootScope.activeContact = false;
                        $rootScope.activeFaqCategory = false;
                        $rootScope.activeFaq = false;
                        $rootScope.activePayment = false;
                        $rootScope.activeSetting = false;
                        $rootScope.activeDispute = false;
                        $rootScope.crumbTitle = 'Trailers Category management / add trailer'
                    }
                }
            }
        }).state('cmsManage', {
            url: '/admin/cms_management',
            views: {

                "middle": { templateUrl: 'views/cms/cms_list.html' }
            },
            resolve: {
                check: function($rootScope, AuthService, $window) {
                    if (!AuthService.adminLoggedIn()) {
                        $window.location.href = '/admin/signin'
                    } else {
                        $rootScope.showMiddle = true;
                        $rootScope.activeDash = false;
                        $rootScope.activeUser = false;
                        $rootScope.activeDTrailer = false;
                        $rootScope.activeCms = true;
                        $rootScope.activeTrailer = false;
                        $rootScope.activeBTrailer = false;
                        $rootScope.activeDRate = false;
                        $rootScope.activeNotif = false;
                        $rootScope.activeContact = false;
                        $rootScope.activeFaqCategory = false;
                        $rootScope.activeFaq = false;
                        $rootScope.activeSetting = false;
                        $rootScope.activeDispute = false;
                        $rootScope.crumbTitle = 'CMS management'
                    }
                }
            }
        }).state('editCms', {
            url: '/admin/edit_cms?Id',
            views: {

                "middle": { templateUrl: 'views/cms/edit_cms.html' }
            },
            resolve: {
                check: function($rootScope, AuthService, $window, $stateParams) {
                    if (!AuthService.adminLoggedIn()) {
                        $window.location.href = '/admin/signin'
                    }
                    if (!$stateParams.Id) {
                        $window.location.href = '/admin/cms_management'
                    } else {
                        $rootScope.showMiddle = true;
                        $rootScope.activeDash = false;
                        $rootScope.activeUser = false;
                        $rootScope.activeDTrailer = false;
                        $rootScope.activeCms = true;
                        $rootScope.activeTrailer = false;
                        $rootScope.activeBTrailer = false;
                        $rootScope.activeDRate = false;
                        $rootScope.activeNotif = false;
                        $rootScope.activeContact = false;
                        $rootScope.activeFaqCategory = false;
                        $rootScope.activeFaq = false;
                        $rootScope.activePayment = false;
                        $rootScope.activeSetting = false;
                        $rootScope.activeDispute = false;
                        $rootScope.crumbTitle = 'CMS management / edit cms'
                    }
                }
            }
        }).state('addCms', {
            url: '/admin/add_Cms',
            views: {

                "middle": { templateUrl: 'views/cms/add_cms.html' }
            },
            resolve: {
                check: function($rootScope, AuthService, $window, $stateParams) {
                    if (!AuthService.adminLoggedIn()) {
                        $window.location.href = '/admin/signin'
                    } else {
                        $rootScope.showMiddle = true;
                        $rootScope.activeDash = false;
                        $rootScope.activeUser = false;
                        $rootScope.activeDTrailer = false;
                        $rootScope.activeCms = true;
                        $rootScope.activeTrailer = false;
                        $rootScope.activeBTrailer = false;
                        $rootScope.activeDRate = false;
                        $rootScope.activeNotif = false;
                        $rootScope.activeContact = false;
                        $rootScope.activeFaqCategory = false;
                        $rootScope.activeFaq = false;
                        $rootScope.activePayment = false;
                        $rootScope.activeSetting = false;
                        $rootScope.activeDispute = false;
                        $rootScope.crumbTitle = 'Cms management / add cms'
                    }
                }
            }
        }).state('trailerManage', {
            url: '/admin/trailer_management',
            views: {

                "middle": { templateUrl: 'views/trailers/trailer_list.html' }
            },
            resolve: {
                check: function($rootScope, AuthService, $window) {
                    if (!AuthService.adminLoggedIn()) {
                        $window.location.href = '/admin/signin'
                    } else {
                        $rootScope.showMiddle = true;
                        $rootScope.activeDash = false;
                        $rootScope.activeUser = false;
                        $rootScope.activeDTrailer = false;
                        $rootScope.activeCms = false;
                        $rootScope.activeTrailer = true;
                        $rootScope.activeBTrailer = false;
                        $rootScope.activeDRate = false;
                        $rootScope.activeNotif = false;
                        $rootScope.activeContact = false;
                        $rootScope.activeFaqCategory = false;
                        $rootScope.activeFaq = false;
                        $rootScope.activePayment = false;
                        $rootScope.activeSetting = false;
                        $rootScope.activeDispute = false;
                        $rootScope.crumbTitle = 'Trailer management'
                    }
                }
            }
        }).state('editTrailer', {
            url: '/admin/edit_trailer?Id',
            views: {

                "middle": { templateUrl: 'views/trailers/edit_trailer.html' }
            },
            resolve: {
                check: function($rootScope, AuthService, $window, $stateParams) {
                    if (!AuthService.adminLoggedIn()) {
                        $window.location.href = '/admin/signin'
                    }
                    if (!$stateParams.Id) {
                        $window.location.href = '/admin/trailer_management'
                    } else {
                        $rootScope.showMiddle = true;
                        $rootScope.activeDash = false;
                        $rootScope.activeUser = false;
                        $rootScope.activeDTrailer = false;
                        $rootScope.activeCms = false;
                        $rootScope.activeTrailer = true;
                        $rootScope.activeBTrailer = false;
                        $rootScope.activeDRate = false;
                        $rootScope.activeNotif = false;
                        $rootScope.activeContact = false;
                        $rootScope.activeFaqCategory = false;
                        $rootScope.activeFaq = false;
                        $rootScope.activePayment = false;
                        $rootScope.activeSetting = false;
                        $rootScope.activeDispute = false;
                        $rootScope.crumbTitle = 'Trailer management / edit cms'
                    }
                }
            }
        }).state('addTrailer', {
            url: '/admin/add_trailer',
            views: {

                "middle": { templateUrl: 'views/trailers/add_trailer.html' }
            },
            resolve: {
                check: function($rootScope, AuthService, $window, $stateParams) {
                    if (!AuthService.adminLoggedIn()) {
                        $window.location.href = '/admin/signin'
                    } else {
                        $rootScope.showMiddle = true;
                        $rootScope.activeDash = false;
                        $rootScope.activeUser = false;
                        $rootScope.activeDTrailer = false;
                        $rootScope.activeCms = false;
                        $rootScope.activeTrailer = true;
                        $rootScope.activeBTrailer = false;
                        $rootScope.activeDRate = false;
                        $rootScope.activeNotif = false;
                        $rootScope.activeContact = false;
                        $rootScope.activeFaqCategory = false;
                        $rootScope.activeFaq = false;
                        $rootScope.activePayment = false;
                        $rootScope.activeSetting = false;
                        $rootScope.activeDispute = false;
                        $rootScope.crumbTitle = 'Trailer management / add cms'
                    }
                }
            }
        }).state('viewTrailer', {
            url: '/admin/view_trailer?Id',
            views: {
                "middle": { templateUrl: 'views/trailers/view_trailer.html' }
            },
            resolve: {
                check: function($rootScope, AuthService, $window, $stateParams) {
                    if (!AuthService.adminLoggedIn()) {
                        $window.location.href = '/admin/signin'
                    }
                    if (!$stateParams.Id) {
                        $window.location.href = '/admin/trailer_management'
                    } else {
                        $rootScope.showMiddle = true;
                        $rootScope.activeDash = false;
                        $rootScope.activeUser = false;
                        $rootScope.activeDTrailer = false;
                        $rootScope.activeCms = false;
                        $rootScope.activeTrailer = true;
                        $rootScope.activeBTrailer = false;
                        $rootScope.activeDRate = false;
                        $rootScope.activeNotif = false;
                        $rootScope.activeContact = false;
                        $rootScope.activeFaqCategory = false;
                        $rootScope.activeFaq = false;
                        $rootScope.activePayment = false;
                        $rootScope.activeSetting = false;
                        $rootScope.activeDispute = false;
                        $rootScope.crumbTitle = 'Trailer management / View trailer'
                    }
                }
            }
        }).state('bookTrailerManage', {
            url: '/admin/book_trailer?Id',
            views: {

                "middle": { templateUrl: 'views/book_trailer/booking_list.html' }
            },
            resolve: {
                check: function($rootScope, AuthService, $window) {
                    if (!AuthService.adminLoggedIn()) {
                        $window.location.href = '/admin/signin'
                    } else {
                        $rootScope.showMiddle = true;
                        $rootScope.activeDash = false;
                        $rootScope.activeUser = false;
                        $rootScope.activeDTrailer = false;
                        $rootScope.activeCms = false;
                        $rootScope.activeTrailer = false;
                        $rootScope.activeBTrailer = true;
                        $rootScope.activeDRate = false;
                        $rootScope.activeNotif = false;
                        $rootScope.activeContact = false;
                        $rootScope.activeFaqCategory = false;
                        $rootScope.activeFaq = false;
                        $rootScope.activePayment = false;
                        $rootScope.activeSetting = false;
                        $rootScope.activeDispute = false;
                        $rootScope.crumbTitle = 'Trailer management'
                    }
                }
            }
        }).state('dailyRateManage', {
            url: '/admin/rate_management',
            views: {

                "middle": { templateUrl: 'views/daily_rate/rate_list.html' }
            },
            resolve: {
                check: function($rootScope, AuthService, $window) {
                    if (!AuthService.adminLoggedIn()) {
                        $window.location.href = '/admin/signin'
                    } else {
                        $rootScope.showMiddle = true;
                        $rootScope.activeDash = false;
                        $rootScope.activeUser = false;
                        $rootScope.activeDTrailer = false;
                        $rootScope.activeTrailer = false;
                        $rootScope.activeBTrailer = false;
                        $rootScope.activeCms = false;
                        $rootScope.activeDRate = true;
                        $rootScope.activeNotif = false;
                        $rootScope.activeContact = false;
                        $rootScope.activeFaqCategory = false;
                        $rootScope.activeFaq = false;
                        $rootScope.activePayment = false;
                        $rootScope.activeSetting = false;
                        $rootScope.activeDispute = false;
                        $rootScope.crumbTitle = 'Daily Rate management'
                    }
                }
            }
        }).state('editRate', {
            url: '/admin/edit_rate?Id',
            views: {

                "middle": { templateUrl: 'views/daily_rate/edit_rate.html' }
            },
            resolve: {
                check: function($rootScope, AuthService, $window, $stateParams) {
                    if (!AuthService.adminLoggedIn()) {
                        $window.location.href = '/admin/signin'
                    }
                    if (!$stateParams.Id) {
                        $window.location.href = '/admin/rate_management'
                    } else {
                        $rootScope.showMiddle = true;
                        $rootScope.activeDash = false;
                        $rootScope.activeUser = false;
                        $rootScope.activeDTrailer = false;
                        $rootScope.activeCms = false;
                        $rootScope.activeTrailer = false;
                        $rootScope.activeBTrailer = false;
                        $rootScope.activeDRate = true;
                        $rootScope.activeNotif = false;
                        $rootScope.activeContact = false;
                        $rootScope.activeFaqCategory = false;
                        $rootScope.activeFaq = false;
                        $rootScope.activePayment = false;
                        $rootScope.activeSetting = false;
                        $rootScope.activeDispute = false;
                        $rootScope.crumbTitle = 'Daily Rate management / edit Daily Rate'
                    }
                }
            }
        }).state('addRate', {
            url: '/admin/add_rate',
            views: {

                "middle": { templateUrl: 'views/daily_rate/add_rate.html' }
            },
            resolve: {
                check: function($rootScope, AuthService, $window, $stateParams) {
                    if (!AuthService.adminLoggedIn()) {
                        $window.location.href = '/admin/signin'
                    } else {
                        $rootScope.showMiddle = true;
                        $rootScope.activeDash = false;
                        $rootScope.activeUser = false;
                        $rootScope.activeDTrailer = false;
                        $rootScope.activeCms = false;
                        $rootScope.activeTrailer = false;
                        $rootScope.activeBTrailer = false;
                        $rootScope.activeDRate = true;
                        $rootScope.activeNotif = false;
                        $rootScope.activeContact = false;
                        $rootScope.activeFaqCategory = false;
                        $rootScope.activeFaq = false;
                        $rootScope.activePayment = false;
                        $rootScope.activeSetting = false;
                        $rootScope.activeDispute = false;
                        $rootScope.crumbTitle = 'Daily Rate management / add Daily Rate'
                    }
                }
            }
        }).state('notificationManage', {
            url: '/admin/notification_management',
            views: {

                "middle": { templateUrl: 'views/notification/notification_list.html' }
            },
            resolve: {
                check: function($rootScope, AuthService, $window) {
                    if (!AuthService.adminLoggedIn()) {
                        $window.location.href = '/admin/signin'
                    } else {
                        $rootScope.showMiddle = true;
                        $rootScope.activeDash = false;
                        $rootScope.activeUser = false;
                        $rootScope.activeDTrailer = false;
                        $rootScope.activeCms = false;
                        $rootScope.activeTrailer = false;
                        $rootScope.activeBTrailer = false;
                        $rootScope.activeDRate = false;
                        $rootScope.activeNotif = true;
                        $rootScope.activeContact = false;
                        $rootScope.activeFaqCategory = false;
                        $rootScope.activeFaq = false;
                        $rootScope.activePayment = false;
                        $rootScope.activeSetting = false;
                        $rootScope.activeDispute = false;
                        $rootScope.crumbTitle = 'Notification management'
                    }
                }
            }
        }).state('contactManage', {
            url: '/admin/contact_management',
            views: {

                "middle": { templateUrl: 'views/contact/contact_list.html' }
            },
            resolve: {
                check: function($rootScope, AuthService, $window) {
                    if (!AuthService.adminLoggedIn()) {
                        $window.location.href = '/admin/signin'
                    } else {
                        $rootScope.showMiddle = true;
                        $rootScope.activeDash = false;
                        $rootScope.activeUser = false;
                        $rootScope.activeDTrailer = false;
                        $rootScope.activeCms = false;
                        $rootScope.activeTrailer = false;
                        $rootScope.activeBTrailer = false;
                        $rootScope.activeDRate = false;
                        $rootScope.activeNotif = false;
                        $rootScope.activeContact = true;
                        $rootScope.activeFaqCategory = false;
                        $rootScope.activeFaq = false;
                        $rootScope.activePayment = false;
                        $rootScope.activeSetting = false;
                        $rootScope.activeDispute = false;
                        $rootScope.crumbTitle = 'Contact management'
                    }
                }
            }
        }).state('viewContact', {
            url: '/admin/view_contact?Id',
            views: {
                "middle": { templateUrl: 'views/contact/contact_view.html' }
            },
            resolve: {
                check: function($rootScope, AuthService, $window, $stateParams) {
                    if (!AuthService.adminLoggedIn()) {
                        $window.location.href = '/admin/signin'
                    }
                    if (!$stateParams.Id) {
                        $window.location.href = '/admin/trailer_management'
                    } else {
                        $rootScope.showMiddle = true;
                        $rootScope.activeDash = false;
                        $rootScope.activeUser = false;
                        $rootScope.activeDTrailer = false;
                        $rootScope.activeCms = false;
                        $rootScope.activeTrailer = false;
                        $rootScope.activeBTrailer = false;
                        $rootScope.activeDRate = false;
                        $rootScope.activeNotif = false;
                        $rootScope.activeContact = true;
                        $rootScope.activeFaqCategory = false;
                        $rootScope.activeFaq = false;
                        $rootScope.activePayment = false;
                        $rootScope.activeSetting = false;
                        $rootScope.activeDispute = false;
                        $rootScope.crumbTitle = 'Contact management / View contact detail'
                    }
                }
            }
        }).state('manageFaqCat', {
            url: '/admin/manage_faq_category',
            views: {
                "middle": { templateUrl: 'views/faq/faq_cat_list.html' }
            },
            resolve: {
                check: function($rootScope, AuthService, $window) {
                    if (!AuthService.adminLoggedIn()) {
                        $window.location.href = '/admin/signin'
                    } else {
                        $rootScope.showMiddle = true;
                        $rootScope.activeDash = false;
                        $rootScope.activeUser = false;
                        $rootScope.activeDTrailer = false;
                        $rootScope.activeCms = false;
                        $rootScope.activeTrailer = false;
                        $rootScope.activeBTrailer = false;
                        $rootScope.activeDRate = false;
                        $rootScope.activeNotif = false;
                        $rootScope.activeContact = false;
                        $rootScope.activeFaqCategory = true;
                        $rootScope.activeFaq = false;
                        $rootScope.activePayment = false;
                        $rootScope.activeSetting = false;
                        $rootScope.activeDispute = false;
                        $rootScope.crumbTitle = 'Faq Category Management'
                    }
                }
            }
        }).state('editfaqCategory', {
            url: '/admin/edit_faq_category?Id',
            views: {
                "middle": { templateUrl: 'views/faq/edit_category.html' }
            },
            resolve: {
                check: function($rootScope, AuthService, $window, $stateParams) {
                    if (!AuthService.adminLoggedIn()) {
                        $window.location.href = '/admin/signin'
                    }
                    if (!$stateParams.Id) {
                        $window.location.href = '/admin/manage_faq_category'
                    } else {
                        $rootScope.showMiddle = true;
                        $rootScope.activeDash = false;
                        $rootScope.activeUser = false;
                        $rootScope.activeDTrailer = false;
                        $rootScope.activeCms = false;
                        $rootScope.activeTrailer = false;
                        $rootScope.activeBTrailer = false;
                        $rootScope.activeDRate = false;
                        $rootScope.activeNotif = false;
                        $rootScope.activeContact = false;
                        $rootScope.activeFaqCategory = true;
                        $rootScope.activeFaq = false;
                        $rootScope.activePayment = false;
                        $rootScope.activeSetting = false;
                        $rootScope.activeDispute = false;
                        $rootScope.crumbTitle = 'Faq Category Management / Edit Faq Category'
                    }
                }
            }
        }).state('addfaqCategory', {
            url: '/admin/add_faq_category',
            views: {
                "middle": { templateUrl: 'views/faq/add_category.html' }
            },
            resolve: {
                check: function($rootScope, AuthService, $window, $stateParams) {
                    if (!AuthService.adminLoggedIn()) {
                        $window.location.href = '/admin/signin'
                    } else {
                        $rootScope.showMiddle = true;
                        $rootScope.activeDash = false;
                        $rootScope.activeUser = false;
                        $rootScope.activeDTrailer = false;
                        $rootScope.activeCms = false;
                        $rootScope.activeTrailer = false;
                        $rootScope.activeBTrailer = false;
                        $rootScope.activeDRate = false;
                        $rootScope.activeNotif = false;
                        $rootScope.activeContact = false;
                        $rootScope.activeFaqCategory = true;
                        $rootScope.activeFaq = false;
                        $rootScope.activePayment = false;
                        $rootScope.activeSetting = false;
                        $rootScope.activeDispute = false;
                        $rootScope.crumbTitle = 'Faq Category Management / Add Faq Category'
                    }
                }
            }
        }).state('manageFaq', {
            url: '/admin/faq_management',
            views: {

                "middle": { templateUrl: 'views/faq/faq_list.html' }
            },
            resolve: {
                check: function($rootScope, AuthService, $window) {
                    if (!AuthService.adminLoggedIn()) {
                        $window.location.href = '/admin/signin'
                    } else {
                        $rootScope.showMiddle = true;
                        $rootScope.activeDash = false;
                        $rootScope.activeUser = false;
                        $rootScope.activeDTrailer = false;
                        $rootScope.activeCms = false;
                        $rootScope.activeTrailer = false;
                        $rootScope.activeBTrailer = false;
                        $rootScope.activeDRate = false;
                        $rootScope.activeNotif = false;
                        $rootScope.activeContact = false;
                        $rootScope.activeFaqCategory = false;
                        $rootScope.activeFaq = true;
                        $rootScope.activePayment = false;
                        $rootScope.activeSetting = false;
                        $rootScope.activeDispute = false;
                        $rootScope.crumbTitle = 'Faq Management'
                    }
                }
            }
        }).state('editFaq', {
            url: '/admin/edit_faq?Id',
            views: {
                "middle": { templateUrl: 'views/faq/edit_faq.html' }
            },
            resolve: {
                check: function($rootScope, AuthService, $window, $stateParams) {
                    if (!AuthService.adminLoggedIn()) {
                        $window.location.href = '/admin/signin'
                    }
                    if (!$stateParams.Id) {
                        $window.location.href = '/admin/faq_management'
                    } else {
                        $rootScope.showMiddle = true;
                        $rootScope.activeDash = false;
                        $rootScope.activeUser = false;
                        $rootScope.activeDTrailer = false;
                        $rootScope.activeCms = false;
                        $rootScope.activeTrailer = false;
                        $rootScope.activeBTrailer = false;
                        $rootScope.activeDRate = false;
                        $rootScope.activeNotif = false;
                        $rootScope.activeContact = false;
                        $rootScope.activeFaqCategory = false;
                        $rootScope.activeFaq = true;
                        $rootScope.activePayment = false;
                        $rootScope.activeSetting = false;
                        $rootScope.activeDispute = false;
                        $rootScope.crumbTitle = 'Faq Management / Edit Faq'
                    }
                }
            }
        }).state('addFaq', {
            url: '/admin/add_faq',
            views: {
                "middle": { templateUrl: 'views/faq/add_faq.html' }
            },
            resolve: {
                check: function($rootScope, AuthService, $window, $stateParams) {
                    if (!AuthService.adminLoggedIn()) {
                        $window.location.href = '/admin/signin'
                    } else {
                        $rootScope.showMiddle = true;
                        $rootScope.activeDash = false;
                        $rootScope.activeUser = false;
                        $rootScope.activeDTrailer = false;
                        $rootScope.activeCms = false;
                        $rootScope.activeTrailer = false;
                        $rootScope.activeBTrailer = false;
                        $rootScope.activeDRate = false;
                        $rootScope.activeNotif = false;
                        $rootScope.activeContact = false;
                        $rootScope.activeFaqCategory = false;
                        $rootScope.activeFaq = true;
                        $rootScope.activeSetting = false;
                        $rootScope.activeDispute = false;
                        $rootScope.crumbTitle = 'Faq Management / Add Faq'
                    }
                }
            }
        }).state('paymentManage', {
            url: '/admin/payment_management',
            views: {

                "middle": { templateUrl: 'views/payment/payment_list.html' }
            },
            resolve: {
                check: function($rootScope, AuthService, $window) {
                    if (!AuthService.adminLoggedIn()) {
                        $window.location.href = '/admin/signin'
                    } else {
                        $rootScope.showMiddle = true;
                        $rootScope.activeDash = false;
                        $rootScope.activeUser = false;
                        $rootScope.activeDTrailer = false;
                        $rootScope.activeCms = false;
                        $rootScope.activeTrailer = false;
                        $rootScope.activeBTrailer = false;
                        $rootScope.activeDRate = false;
                        $rootScope.activeNotif = false;
                        $rootScope.activeContact = false;
                        $rootScope.activeFaqCategory = false;
                        $rootScope.activeFaq = false;
                        $rootScope.activePayment = true;
                        $rootScope.crumbTitle = 'Payment management'
                    }
                }
            }
        }).state('chargeManage', {
            url: '/admin/charge_management',
            views: {

                "middle": { templateUrl: 'views/payment/charge_list.html' }
            },
            resolve: {
                check: function($rootScope, AuthService, $window) {
                    if (!AuthService.adminLoggedIn()) {
                        $window.location.href = '/admin/signin'
                    } else {
                        $rootScope.showMiddle = true;
                        $rootScope.activeDash = false;
                        $rootScope.activeUser = false;
                        $rootScope.activeDTrailer = false;
                        $rootScope.activeCms = false;
                        $rootScope.activeTrailer = false;
                        $rootScope.activeBTrailer = false;
                        $rootScope.activeDRate = false;
                        $rootScope.activeNotif = false;
                        $rootScope.activeContact = false;
                        $rootScope.activeFaqCategory = false;
                        $rootScope.activeFaq = false;
                        $rootScope.activePayment = true;
                        $rootScope.crumbTitle = 'Payment management'
                    }
                }
            }
        }).state('calcelTxnManage', {
            url: '/admin/calcel_txn_management',
            views: {

                "middle": { templateUrl: 'views/payment/cancle_booking_list.html' }
            },
            resolve: {
                check: function($rootScope, AuthService, $window) {
                    if (!AuthService.adminLoggedIn()) {
                        $window.location.href = '/admin/signin'
                    } else {
                        $rootScope.showMiddle = true;
                        $rootScope.activeDash = false;
                        $rootScope.activeUser = false;
                        $rootScope.activeDTrailer = false;
                        $rootScope.activeCms = false;
                        $rootScope.activeTrailer = false;
                        $rootScope.activeBTrailer = false;
                        $rootScope.activeDRate = false;
                        $rootScope.activeNotif = false;
                        $rootScope.activeContact = false;
                        $rootScope.activeFaqCategory = false;
                        $rootScope.activeFaq = false;
                        $rootScope.activePayment = true;
                        $rootScope.crumbTitle = 'Payment management'
                    }
                }
            }
        }).state('DisputeManage', {
            url: '/admin/dispute_management',
            views: {

                "middle": { templateUrl: 'views/user/dispute_list.html' }
            },
            resolve: {
                check: function($rootScope, AuthService, $window) {
                    if (!AuthService.adminLoggedIn()) {
                        $window.location.href = '/admin/signin'
                    } else {
                        $rootScope.showMiddle = true;
                        $rootScope.activeDash = false;
                        $rootScope.activeUser = false;
                        $rootScope.activeDTrailer = false;
                        $rootScope.activeCms = false;
                        $rootScope.activeTrailer = false;
                        $rootScope.activeBTrailer = false;
                        $rootScope.activeDRate = false;
                        $rootScope.activeNotif = false;
                        $rootScope.activeContact = false;
                        $rootScope.activeFaqCategory = false;
                        $rootScope.activeFaq = false;
                        $rootScope.activePayment = false;
                        $rootScope.activeSetting = false;
                        $rootScope.activeDispute = true;
                        $rootScope.crumbTitle = 'Dispute management'
                    }
                }
            }
        }).state('manageHelpCat', {
            url: '/admin/parent_category',
            views: {
                "middle": { templateUrl: 'views/help/help_cat/help_cat_list.html' }
            },
            resolve: {
                check: function($rootScope, AuthService, $window) {
                    if (!AuthService.adminLoggedIn()) {
                        $window.location.href = '/admin/signin'
                    } else {
                        $rootScope.showMiddle = true;
                        $rootScope.activeDash = false;
                        $rootScope.activeUser = false;
                        $rootScope.activeDTrailer = false;
                        $rootScope.activeCms = false;
                        $rootScope.activeTrailer = false;
                        $rootScope.activeBTrailer = false;
                        $rootScope.activeDRate = false;
                        $rootScope.activeNotif = false;
                        $rootScope.activeContact = false;
                        $rootScope.activeFaqCategory = true;
                        $rootScope.activeFaq = false;
                        $rootScope.activePayment = false;
                        $rootScope.activeSetting = false;
                        $rootScope.activeDispute = false;
                        $rootScope.crumbTitle = 'Category Management'
                    }
                }
            }
        }).state('editHelpCategory', {
            url: '/admin/edit_parent_category?Id',
            views: {
                "middle": { templateUrl: 'views/help/help_cat/edit_category.html' }
            },
            resolve: {
                check: function($rootScope, AuthService, $window, $stateParams) {
                    if (!AuthService.adminLoggedIn()) {
                        $window.location.href = '/admin/signin'
                    }
                    if (!$stateParams.Id) {
                        $window.location.href = '/admin/parent_category'
                    } else {
                        $rootScope.showMiddle = true;
                        $rootScope.activeDash = false;
                        $rootScope.activeUser = false;
                        $rootScope.activeDTrailer = false;
                        $rootScope.activeCms = false;
                        $rootScope.activeTrailer = false;
                        $rootScope.activeBTrailer = false;
                        $rootScope.activeDRate = false;
                        $rootScope.activeNotif = false;
                        $rootScope.activeContact = false;
                        $rootScope.activeFaqCategory = true;
                        $rootScope.activeFaq = false;
                        $rootScope.activePayment = false;
                        $rootScope.activeSetting = false;
                        $rootScope.activeDispute = false;
                        $rootScope.crumbTitle = 'Help Category Management / Edit Help Category'
                    }
                }
            }
        }).state('addHelpCategory', {
            url: '/admin/add_parent_category',
            views: {
                "middle": { templateUrl: 'views/help/help_cat/add_category.html' }
            },
            resolve: {
                check: function($rootScope, AuthService, $window, $stateParams) {
                    if (!AuthService.adminLoggedIn()) {
                        $window.location.href = '/admin/signin'
                    } else {
                        $rootScope.showMiddle = true;
                        $rootScope.activeDash = false;
                        $rootScope.activeUser = false;
                        $rootScope.activeDTrailer = false;
                        $rootScope.activeCms = false;
                        $rootScope.activeTrailer = false;
                        $rootScope.activeBTrailer = false;
                        $rootScope.activeDRate = false;
                        $rootScope.activeNotif = false;
                        $rootScope.activeContact = false;
                        $rootScope.activeFaqCategory = true;
                        $rootScope.activeFaq = false;
                        $rootScope.activePayment = false;
                        $rootScope.activeSetting = false;
                        $rootScope.activeDispute = false;
                        $rootScope.crumbTitle = 'Parent Category Management / Add Parent Category'
                    }
                }
            }
        }).state('manageHelpQCat', {
            url: '/admin/manage_category',
            views: {
                "middle": { templateUrl: 'views/help/question_cat/list.html' }
            },
            resolve: {
                check: function($rootScope, AuthService, $window) {
                    if (!AuthService.adminLoggedIn()) {
                        $window.location.href = '/admin/signin'
                    } else {
                        $rootScope.showMiddle = true;
                        $rootScope.activeDash = false;
                        $rootScope.activeUser = false;
                        $rootScope.activeDTrailer = false;
                        $rootScope.activeCms = false;
                        $rootScope.activeTrailer = false;
                        $rootScope.activeBTrailer = false;
                        $rootScope.activeDRate = false;
                        $rootScope.activeNotif = false;
                        $rootScope.activeContact = false;
                        $rootScope.activeFaqCategory = true;
                        $rootScope.activeFaq = false;
                        $rootScope.activePayment = false;
                        $rootScope.activeSetting = false;
                        $rootScope.activeDispute = false;
                        $rootScope.crumbTitle = 'Category Management'
                    }
                }
            }
        }).state('editHelpQCategory', {
            url: '/admin/edit_category?Id',
            views: {
                "middle": { templateUrl: 'views/help/question_cat/edit.html' }
            },
            resolve: {
                check: function($rootScope, AuthService, $window, $stateParams) {
                    if (!AuthService.adminLoggedIn()) {
                        $window.location.href = '/admin/signin'
                    }
                    if (!$stateParams.Id) {
                        $window.location.href = '/admin/manage_category'
                    } else {
                        $rootScope.showMiddle = true;
                        $rootScope.activeDash = false;
                        $rootScope.activeUser = false;
                        $rootScope.activeDTrailer = false;
                        $rootScope.activeCms = false;
                        $rootScope.activeTrailer = false;
                        $rootScope.activeBTrailer = false;
                        $rootScope.activeDRate = false;
                        $rootScope.activeNotif = false;
                        $rootScope.activeContact = false;
                        $rootScope.activeFaqCategory = true;
                        $rootScope.activeFaq = false;
                        $rootScope.activePayment = false;
                        $rootScope.activeSetting = false;
                        $rootScope.activeDispute = false;
                        $rootScope.crumbTitle = 'Category Management / Edit Category'
                    }
                }
            }
        }).state('addHelpQCategory', {
            url: '/admin/add_category',
            views: {
                "middle": { templateUrl: 'views/help/question_cat/add.html' }
            },
            resolve: {
                check: function($rootScope, AuthService, $window, $stateParams) {
                    if (!AuthService.adminLoggedIn()) {
                        $window.location.href = '/admin/signin'
                    } else {
                        $rootScope.showMiddle = true;
                        $rootScope.activeDash = false;
                        $rootScope.activeUser = false;
                        $rootScope.activeDTrailer = false;
                        $rootScope.activeCms = false;
                        $rootScope.activeTrailer = false;
                        $rootScope.activeBTrailer = false;
                        $rootScope.activeDRate = false;
                        $rootScope.activeNotif = false;
                        $rootScope.activeContact = false;
                        $rootScope.activeFaqCategory = true;
                        $rootScope.activeFaq = false;
                        $rootScope.activePayment = false;
                        $rootScope.activeSetting = false;
                        $rootScope.activeDispute = false;
                        $rootScope.crumbTitle = 'Category Management / Add Category'
                    }
                }
            }
        }).state('manageHelpQ', {
            url: '/admin/manage_question',
            views: {
                "middle": { templateUrl: 'views/help/question/list.html' }
            },
            resolve: {
                check: function($rootScope, AuthService, $window) {
                    if (!AuthService.adminLoggedIn()) {
                        $window.location.href = '/admin/signin'
                    } else {
                        $rootScope.showMiddle = true;
                        $rootScope.activeDash = false;
                        $rootScope.activeUser = false;
                        $rootScope.activeDTrailer = false;
                        $rootScope.activeCms = false;
                        $rootScope.activeTrailer = false;
                        $rootScope.activeBTrailer = false;
                        $rootScope.activeDRate = false;
                        $rootScope.activeNotif = false;
                        $rootScope.activeContact = false;
                        $rootScope.activeFaqCategory = true;
                        $rootScope.activeFaq = false;
                        $rootScope.activePayment = false;
                        $rootScope.activeSetting = false;
                        $rootScope.activeDispute = false;
                        $rootScope.crumbTitle = 'Question Management'
                    }
                }
            }
        }).state('editHelpQ', {
            url: '/admin/edit_question?Id',
            views: {
                "middle": { templateUrl: 'views/help/question/edit.html' }
            },
            resolve: {
                check: function($rootScope, AuthService, $window, $stateParams) {
                    if (!AuthService.adminLoggedIn()) {
                        $window.location.href = '/admin/signin'
                    }
                    if (!$stateParams.Id) {
                        $window.location.href = '/admin/manage_question'
                    } else {
                        $rootScope.showMiddle = true;
                        $rootScope.activeDash = false;
                        $rootScope.activeUser = false;
                        $rootScope.activeDTrailer = false;
                        $rootScope.activeCms = false;
                        $rootScope.activeTrailer = false;
                        $rootScope.activeBTrailer = false;
                        $rootScope.activeDRate = false;
                        $rootScope.activeNotif = false;
                        $rootScope.activeContact = false;
                        $rootScope.activeFaqCategory = true;
                        $rootScope.activeFaq = false;
                        $rootScope.activePayment = false;
                        $rootScope.activeSetting = false;
                        $rootScope.activeDispute = false;
                        $rootScope.crumbTitle = 'Question Management / Edit Question'
                    }
                }
            }
        }).state('addHelpQ', {
            url: '/admin/add_question',
            views: {
                "middle": { templateUrl: 'views/help/question/add.html' }
            },
            resolve: {
                check: function($rootScope, AuthService, $window, $stateParams) {
                    if (!AuthService.adminLoggedIn()) {
                        $window.location.href = '/admin/signin'
                    } else {
                        $rootScope.showMiddle = true;
                        $rootScope.activeDash = false;
                        $rootScope.activeUser = false;
                        $rootScope.activeDTrailer = false;
                        $rootScope.activeCms = false;
                        $rootScope.activeTrailer = false;
                        $rootScope.activeBTrailer = false;
                        $rootScope.activeDRate = false;
                        $rootScope.activeNotif = false;
                        $rootScope.activeContact = false;
                        $rootScope.activeFaqCategory = true;
                        $rootScope.activeFaq = false;
                        $rootScope.activePayment = false;
                        $rootScope.activeSetting = false;
                        $rootScope.activeDispute = false;
                        $rootScope.crumbTitle = 'Question Management / Add Question'
                    }
                }
            }
        }).state('manageHelpA', {
            url: '/admin/manage_help',
            views: {
                "middle": { templateUrl: 'views/help/answer/list.html' }
            },
            resolve: {
                check: function($rootScope, AuthService, $window) {
                    if (!AuthService.adminLoggedIn()) {
                        $window.location.href = '/admin/signin'
                    } else {
                        $rootScope.showMiddle = true;
                        $rootScope.activeDash = false;
                        $rootScope.activeUser = false;
                        $rootScope.activeDTrailer = false;
                        $rootScope.activeCms = false;
                        $rootScope.activeTrailer = false;
                        $rootScope.activeBTrailer = false;
                        $rootScope.activeDRate = false;
                        $rootScope.activeNotif = false;
                        $rootScope.activeContact = false;
                        $rootScope.activeFaqCategory = true;
                        $rootScope.activeFaq = false;
                        $rootScope.activePayment = false;
                        $rootScope.activeSetting = false;
                        $rootScope.activeDispute = false;
                        $rootScope.crumbTitle = 'Help Management'
                    }
                }
            }
        }).state('editHelpA', {
            url: '/admin/edit_help?Id',
            views: {
                "middle": { templateUrl: 'views/help/answer/edit.html' }
            },
            resolve: {
                check: function($rootScope, AuthService, $window, $stateParams) {
                    if (!AuthService.adminLoggedIn()) {
                        $window.location.href = '/admin/signin'
                    }
                    if (!$stateParams.Id) {
                        $window.location.href = '/admin/manage_help'
                    } else {
                        $rootScope.showMiddle = true;
                        $rootScope.activeDash = false;
                        $rootScope.activeUser = false;
                        $rootScope.activeDTrailer = false;
                        $rootScope.activeCms = false;
                        $rootScope.activeTrailer = false;
                        $rootScope.activeBTrailer = false;
                        $rootScope.activeDRate = false;
                        $rootScope.activeNotif = false;
                        $rootScope.activeContact = false;
                        $rootScope.activeFaqCategory = true;
                        $rootScope.activeFaq = false;
                        $rootScope.activePayment = false;
                        $rootScope.activeSetting = false;
                        $rootScope.activeDispute = false;
                        $rootScope.crumbTitle = 'Help Management / Edit Help'
                    }
                }
            }
        }).state('addHelpA', {
            url: '/admin/add_help',
            views: {
                "middle": { templateUrl: 'views/help/answer/add.html' }
            },
            resolve: {
                check: function($rootScope, AuthService, $window, $stateParams) {
                    if (!AuthService.adminLoggedIn()) {
                        $window.location.href = '/admin/signin'
                    } else {
                        $rootScope.showMiddle = true;
                        $rootScope.activeDash = false;
                        $rootScope.activeUser = false;
                        $rootScope.activeDTrailer = false;
                        $rootScope.activeCms = false;
                        $rootScope.activeTrailer = false;
                        $rootScope.activeBTrailer = false;
                        $rootScope.activeDRate = false;
                        $rootScope.activeNotif = false;
                        $rootScope.activeContact = false;
                        $rootScope.activeFaqCategory = true;
                        $rootScope.activeFaq = false;
                        $rootScope.activePayment = false;
                        $rootScope.activeSetting = false;
                        $rootScope.activeDispute = false;
                        $rootScope.crumbTitle = 'Help Management / Add Help'
                    }
                }
            }
        })
        .state('settingManage', {
            url: '/admin/setting_management',
            views: {

                "middle": { templateUrl: 'views/setting/manage_setting.html' }
            },
            resolve: {
                check: function($rootScope, AuthService, $window) {
                    if (!AuthService.adminLoggedIn()) {
                        $window.location.href = '/admin/signin'
                    } else {
                        $rootScope.showMiddle = true;
                        $rootScope.activeDash = false;
                        $rootScope.activeUser = false;
                        $rootScope.activeDTrailer = false;
                        $rootScope.activeCms = false;
                        $rootScope.activeTrailer = false;
                        $rootScope.activeBTrailer = false;
                        $rootScope.activeDRate = false;
                        $rootScope.activeNotif = false;
                        $rootScope.activeContact = false;
                        $rootScope.activeFaqCategory = false;
                        $rootScope.activeFaq = false;
                        $rootScope.activePayment = false;
                        $rootScope.activeSetting = true;
                        $rootScope.activeDispute = false;
                        $rootScope.crumbTitle = 'Setting management'
                    }
                }
            }
        }).state('notFound', {
            url: '/admin/page-not-found',
            views: {
                "leftbar": { templateUrl: 'views/notfound.html' }
            },
            resolve: {
                check: function($rootScope) {
                    $rootScope.showMiddle = false;
                    $rootScope.swNotFnd = true;
                }
            }
        });
    $urlRouterProvider.rule(function($i, $location) {
        return $location.path().toLowerCase();
    }).otherwise('/');
}]);

myApp.directive('ckEditor', function() {
    return {
        require: '?ngModel',
        link: function(scope, elm, attr, ngModel) {
            var ck = CKEDITOR.replace(elm[0]);

            if (!ngModel) return;
            ck.on('instanceReady', function() {
                ck.setData(ngModel.$viewValue);
            });

            function updateModel() {
                scope.$apply(function() {
                    ngModel.$setViewValue(ck.getData());
                });
            }
            ck.on('change', updateModel);
            ck.on('key', updateModel);
            ck.on('dataReady', updateModel);

            ngModel.$render = function(value) {
                ck.setData(ngModel.$viewValue);
            };
        }
    };
});
myApp.run(['$rootScope', 'constant', function($rootScope, constant) {
    $rootScope.constant = constant;
}]);
