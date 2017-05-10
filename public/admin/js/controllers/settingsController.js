//******************************//
//      User Controller         //
//******************************//
(function() {
    'use strict';
    myApp.controller('settingCtrl', ['$scope', '$rootScope', 'Notify', '$http', '$state', '$stateParams', function($scope, $rootScope, Notify, $http, $state, $stateParams) {


        /**
         *@Function            : loadAllSettings()
         *@Description         : This function used for load all setting data
         *@unit test performed : check form validation
         *@Result              : Done successfully and load all setting data
         */
        $scope.loadAllSettings = function() {
            $rootScope.showLoading = true;
            $http.get('/api/setting/loadSettings').then(function(res) {
                $scope.settingTitle = 'All settings';
                $rootScope.showLoading = false;
                $scope.settingList = res.data.data;
            }, function(err) {
                $rootScope.showLoading = false;
            });
        }

        /**
         *@Function            : update()
         *@Description         : This function used for update cms data by Id
         *@unit test performed : check form validation and update data by id
         *@Result              : Done successfully and get updated cms data by Id
         */
        $scope.update = function() {
            if ($scope.addForm.$valid) {
                $rootScope.showLoading = true;
                var upData = {};
                upData.id = $scope.settingList.id;
                upData.application_fee = $scope.settingList.application_fee;
                upData.cancel_charge = $scope.settingList.cancel_charge;
                $http.post('/api/setting/update_setting', upData).then(function(res) {
                    $rootScope.showLoading = false;
                    Notify.showNotification(res.data.message);
                    $state.go('settingManage');
                }, function(err) {
                    $rootScope.showLoading = false;
                    Notify.showNotification(err.error.error_message, 'error-class');
                });
            }
        }

    }]);
})();
