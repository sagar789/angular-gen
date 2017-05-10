myApp.factory('AuthService', ['$q', '$timeout', '$http', '$localStorage', '$sessionStorage', '$window', '$rootScope', function($q, $timeout, $http, $localStorage, $sessionStorage, $window, $rootScope) {

    // create user variable
    var user = null;

    // return available functions for use in controllers
    return ({
        isLoggedIn: isLoggedIn,
        adminLoggedIn: adminLoggedIn,
        getUserDetail: getUserDetail,
        getAdminDetail: getAdminDetail,
        login: login,
        userLogout: userLogout,
        adminLogout: adminLogout,
        register: register
    });

    function isLoggedIn() {
        if ($localStorage.user) {
            return true;
        } else {
            return false;
        }
    }

    function getUserDetail() {
        return $localStorage.user;
    }

    function adminLoggedIn() {
        if ($localStorage.admin) {
            return true;
        } else {
            return false;
        }
    }    

    function getAdminDetail() {
        return $localStorage.admin;
    }

    function login(email, password, role) {
        // create a new instance of deferred
        var deferred = $q.defer();

        // send a post request to the server
        $http.post('/api_user/signin', { email: email, password: password, role:role }).success(function(res, status) {
            //console.log(res)
            if (status === 200 && res.data) {
                //user = res.data;
                if (res.data.role == 1) {
                     $localStorage.admin = {};
                    $localStorage.admin = res.data;
                } else {
                    $localStorage.user = {};
                    $localStorage.user = res.data;
                }
                deferred.resolve(res.data);
            } else {
                user = false;
                deferred.reject();
            }
        }).error(function(data) {
            user = false;
            deferred.reject(data);
        });

        // return promise object
        return deferred.promise;

    }

    function userLogout() {
        // create a new instance of deferred
        var deferred = $q.defer();
        // send a get request to the server
        $http.get('/api_user/userlogout')
            // handle success
            .success(function(data) {
                delete $localStorage.user;
                deferred.resolve();
            }).error(function(data) {
                user = false;
                deferred.reject();
            });
        // return promise object
        return deferred.promise;
    }

    function adminLogout() {
        // create a new instance of deferred
        var deferred = $q.defer();
        // send a get request to the server
        $http.get('/api_user/adminlogout')
            // handle success
            .success(function(data) {
                delete $localStorage.admin;
                deferred.resolve();
            }).error(function(data) {
                deferred.reject();
            });
        // return promise object
        return deferred.promise;
    }

    function register(data) {
        // create a new instance of deferred
        var deferred = $q.defer();

        // send a post request to the server
        $http.post('/api_user/signup', { email: data.email,mobile: data.mobile, password: data.password }).success(function(res, status) {
            if (status === 200 && res.data) {
                deferred.resolve(res);
            } else {
                deferred.reject();
            }
        }).error(function(data) {
            deferred.reject(data);
        });

        // return promise object
        return deferred.promise;

    }

}]);
