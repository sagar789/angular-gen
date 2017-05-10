/*******************************
 * Controller : PAYMENT Controller *
 * created    : 10-23-2016     *
 *******************************/
(function() {
    'use strict';
    myApp.controller('paymentCtrl', ['$scope', '$rootScope', 'Notify', '$http', '$state', '$stateParams', function($scope, $rootScope, Notify, $http, $state, $stateParams) {

        $scope.currentPage = 1;
        $scope.paginationOption = $rootScope.constant.paginationOptn;
        $scope.pageSize = $scope.paginationOption[$rootScope.constant.pageSize];

        /**
         *@Function            : loadAll()
         *@Description         : This function used for get all payment list
         *@unit test performed : check for get list
         *@Result              : Done successfully and get all list of payment
         */
        $scope.loadAll = function() {
            $http.get('/api/payment/load_payment_list').then(function(res) {
                $scope.userTitle = 'All Transaction List';
                $rootScope.showLoading = false;
                $scope.list = res.data.data;
            }, function(err) {
                $rootScope.showLoading = false;
            });
        }

        /**
         *@Function            : loadAllCharge()
         *@Description         : This function used for get all charge/Captured charge list
         *@unit test performed : check for get list
         *@Result              : Done successfully and get all charge/Captured charge payment
         */
        $scope.loadAllCharge = function() {
            $http.get('/api/payment/load_charge_list').then(function(res) {
                $scope.userTitle = 'All Charge/Captured List';
                $rootScope.showLoading = false;
                $scope.list = res.data.data;
            }, function(err) {
                $rootScope.showLoading = false;
            });
        }

        /**
         *@Function            : loadAllCancelTxn()
         *@Description         : This function used for get all canceled charge/Captured charge boooking list
         *@unit test performed : check for get list
         *@Result              : Done successfully and get all canceled charge/Captured charge boooking list
         */
        $scope.loadAllCancelTxn = function() {
            $http.get('/api/payment/load_calcel_txn_list').then(function(res) {
                $scope.userTitle = 'All Cancel Transaction List';
                $rootScope.showLoading = false;
                $scope.list = res.data.data;
            }, function(err) {
                $rootScope.showLoading = false;
            });
        }

    }]);
})();
