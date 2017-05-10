/****************************************
 * Controller : Book Trailer Controller *
 * created    : 11-02-2016              *
 ****************************************/
(function() {
    'use strict';
    myApp.controller('bookTrailerCtrl', ['$scope', '$rootScope', 'Notify', '$http', '$state', 'AuthService', '$stateParams', 'Upload', 'file', '$sce', function($scope, $rootScope, Notify, $http, $state, AuthService, $stateParams, Upload, file, $sce) {

        $scope.currentPage = $rootScope.constant.currentPage; // set current page in pagination
        $scope.statusOption = $rootScope.constant.statusOption; // set station option 
        $scope.paginationOption = $rootScope.constant.paginationOptn; //set pagination option
        $scope.pageSize = $scope.paginationOption[$rootScope.constant.pageSize]; //set page size in pagination

        /**
         *@Function            : loadAll()
         *@Description         : This function used for get all booked trailer list
         *@unit test performed : check for get list
         *@Result              : Done successfully and get all list of booked trailer
         */
        $scope.loadAll = function() {
            if ($stateParams.Id == 2) {
                $scope.cancelby = true;
            } else {
                $scope.cancelby = false;
            }
            loadFunction($stateParams.Id)
        }

        function loadFunction(id) {
            if (id == 0) {
                $scope.userTitle = "Pending Booking List";
            } else if (id == 1) {
                $scope.userTitle = "Accepted Booking List";
            } else if (id == 2) {
                $scope.userTitle = "Canceled Booking List";
            } else if (id == 3) {
                $scope.userTitle = "Declined Booking List";
            } else if (id == 4) {
                $scope.userTitle = "Pick-Up Booking List";
            } else if (id == 5) {
                $scope.userTitle = "Drop-Off Booking List";
            }
            $http.get('/api/bookedTrailer/get_all_book_trailar').then(function(res) {
                $scope.List = [];
                angular.forEach(res.data.data, function(key) {
                    if (key.status == id) {
                        $scope.List.push(key)
                    }
                });
            }, function(err) {
                return err
            });
        }


    }]);
})();
