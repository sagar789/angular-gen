//*******************************//
//     App Controller            //
//*******************************//
'use strict'
var myApp = angular.module('myApp', ['ui.router', 'ngStorage', 'cgNotify', 'ngFileUpload']);

myApp.config(['$stateProvider', '$urlRouterProvider', '$locationProvider', '$httpProvider', function($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {
    //initialize get if not there
    if (!$httpProvider.defaults.headers.get) {
        $httpProvider.defaults.headers.get = {};
    }

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
    //$locationProvider.hashPrefix('!');
    $urlRouterProvider.otherwise('/page_not_found');
    $stateProvider.state('home', {
        url: '/',
        views: {
            "middle": { templateUrl: 'front/views/user/middle.html' },
            "header": { templateUrl: 'front/views/header/header.html' },
            "footer": { templateUrl: 'front/views/footer/footer.html' }
        },
        resolve: {
            check: function($rootScope, AuthService) {
                $rootScope.activePricing = false;
                $rootScope.activeHelp = false;
                $rootScope.activeRenetInfo = false;
                $rootScope.activeOwnerInfo = false;
                $rootScope.activeRegister = false;
                if (AuthService.isLoggedIn()) {
                    $rootScope.propShow = true;
                } else {
                    $rootScope.propShow = false;
                }
            }
        }
    }).state('signup', {
        url: '/signup',
        views: {
            "middle": { templateUrl: 'front/views/user/signup.html' },
            "header": { templateUrl: 'front/views/header/header.html' },
            "footer": { templateUrl: 'front/views/footer/footer.html' }
        },
        resolve: {
            check: function($rootScope, $stateParams, $window) {
                $rootScope.activePricing = false;
                $rootScope.activeRenetInfo = false;
                $rootScope.activeHelp = false;
                $rootScope.activeOwnerInfo = false;
                $rootScope.activeRegister = true;
            }
        }
    }).state('login', {
        url: '/login',
        views: {
            "middle": { templateUrl: 'front/views/user/login.html' },
            "header": { templateUrl: 'front/views/header/header.html' },
            "footer": { templateUrl: 'front/views/footer/footer.html' }
        },
        resolve: {
            check: function(AuthService, $state, $location) {

                if (AuthService.isLoggedIn()) {
                    console.log('assasa');
                    //$location.path('/profile');
                } else {
                    console.log('oioioi');
                }
            }
        }
    }).state('profile', {
        url: '/profile',
        views: {
            "middle": { templateUrl: 'front/views/user/profile.html' },
            "header": { templateUrl: 'front/views/header/header.html' },
            "footer": { templateUrl: 'front/views/footer/footer.html' }
        },
        resolve: {
            check: function($rootScope, AuthService, $window) {
                $rootScope.propShow = false;
                if (!AuthService.isLoggedIn()) {
                    $window.location.href = '/';
                }
            }
        }
    }).state('verify', {
        url: '/verify?access_token',
        resolve: {
            check: function($stateParams, $window, $http, Notify, $state) {
                if (!$stateParams.access_token || ($stateParams.access_token == '') || ($stateParams.access_token == "true")) {
                    $window.location.href = '/page-not-found'
                } else {
                    $http.post('/api/user/getByToken', { token: $stateParams.access_token }).success(function(res) {
                        Notify.showNotification(res.message);
                        $state.go('home');
                    }).error(function(err) {
                        console.log('111111')
                        console.log(err)
                        $window.location.href = '/invalid_token'
                    });
                }
            }
        }
    }).state('resetPassword', {
        url: '/reset_password?token',
        views: {
            "middle": { templateUrl: 'front/views/user/reset_password.html' },
            "header": { templateUrl: 'front/views/header/header.html' },
            "footer": { templateUrl: 'front/views/footer/footer.html' }
        },
        resolve: {
            check: function($rootScope, $state, $stateParams, $window, $http, Notify) {
                $rootScope.showMiddle = false;
                if (!$stateParams.token || ($stateParams.token == "true")) {
                    $window.location.href = '/page_not_found'
                } else {
                    $http.post('/api/user/check_reset_password_token', { token: $stateParams.token }).then(function(res) {
                        console.log('done');
                    }, function(err) {
                        $rootScope.showLoading = false;
                        if (err.data.status == 2) {
                            Notify.showNotification(err.data.error.error_message, 'error-class');
                            $state.go('home');
                        } else if (err.data.status == 3) {
                            $window.location.href = '/invalid_token'
                        } else {
                            Notify.showNotification(err.data.error.error_message, 'error-class');
                        }
                    });
                }
            }
        }
    }).state('termsCondition', {
        url: '/terms-and-condition{slash:[/]{0,1}}',
        views: {
            "middle": { templateUrl: 'front/views/main/term_and_cond_detail.html' },
            "header": { templateUrl: 'front/views/header/header.html' },
            "footer": { templateUrl: 'front/views/footer/footer.html' }
        },
        resolve: {
            check: function($rootScope, AuthService) {
                $rootScope.activetc = true;
                if (AuthService.isLoggedIn()) {
                    $rootScope.propShow = true;
                } else {
                    $rootScope.propShow = false;
                }
            }
        }
    }).state('privacyPolicy', {
        url: '/privacy-policy{slash:[/]{0,1}}',
        views: {
            "middle": { templateUrl: 'front/views/main/privacy_policay.html' },
            "header": { templateUrl: 'front/views/header/header.html' },
            "footer": { templateUrl: 'front/views/footer/footer.html' }
        },
        resolve: {
            check: function($rootScope, AuthService) {
                if (AuthService.isLoggedIn()) {
                    $rootScope.propShow = true;
                } else {
                    $rootScope.propShow = false;
                }
            }
        }
    }).state('contactus', {
        url: '/contact-us{slash:[/]{0,1}}',
        views: {
            "middle": { templateUrl: 'front/views/main/contact.html' },
            "header": { templateUrl: 'front/views/header/header.html' },
            "footer": { templateUrl: 'front/views/footer/footer.html' }
        },
        resolve: {
            check: function($rootScope, AuthService) {
                $rootScope.activePricing = false;
                $rootScope.activeRenetInfo = false;
                $rootScope.activeOwnerInfo = false;
                $rootScope.activeHelp = false;
                $rootScope.activeRegister = false;
                if (AuthService.isLoggedIn()) {
                    $rootScope.propShow = true;
                } else {
                    $rootScope.propShow = false;
                }
            }
        }
    }).state('notFound', {
        url: '/page_not_found',
        views: {
            "middle": { templateUrl: 'front/notfound.html' },
            //"header": { templateUrl: 'front/views/header/header.html' },
            "footer": { templateUrl: 'front/views/footer/footer.html' }
        }
    });
    // $urlRouterProvider.rule(function($i, $location) {
    //     return $location.path().toLowerCase();
    // }).otherwise('/page_not_found');
}]);
//**************************************************************//
myApp.run(['$rootScope', 'AuthService', function($rootScope, AuthService) {
    $rootScope.currentUser = AuthService.isLoggedIn();
    $rootScope.userData = AuthService.getUserDetail();
    $rootScope.$on('$stateChangeStart', function(event, next, current) {
        $rootScope.showLoading = true;
    });
    $rootScope.$on('$stateChangeSuccess', function(event, next, current) {
        $rootScope.showLoading = false;
    });
}]);
