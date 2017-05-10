/**************************************
 * Controller : Daily rate Controller *
 * created    : 11-08-2016            *
 **************************************/
(function() {
    'use strict';
    myApp.controller('rateCtrl', ['$scope', '$rootScope', 'Notify', '$http', '$state', 'AuthService', '$stateParams', 'Upload', 'file', '$sce', '$timeout', function($scope, $rootScope, Notify, $http, $state, AuthService, $stateParams, Upload, file, $sce, $timeout) {

        $scope.currentPage = 1;
        $scope.paginationOption = $rootScope.constant.paginationOptn;
        $scope.pageSize = 1; //$scope.paginationOption[$rootScope.constant.pageSize];
        $scope.trailerData = {};
        $scope.setDate = new Date();
        $http.get('/api/type/loadType').then(function(res) {
            $scope.userTitle = 'Daily Rate List';
            $scope.typeOption = res.data.data;
        }, function(err) {
            $rootScope.showLoading = false;
        });
        $http.get('/api/size/load_duration').then(function(res) {
            $scope.userTitle = 'Daily Rate List';
            $scope.durationOption = res.data.data;
        }, function(err) {
            $rootScope.showLoading = false;
        });

        /**
         *@Function            : loadAll()
         *@Description         : This function used for get all CMS list
         *@unit test performed : check for get list
         *@Result              : Done successfully and get all list of CMS
         */
        $scope.loadAll = function() {
            $http.get('/api/dailyRate/loadRate').then(function(res) {
                $scope.cmsTitle = 'All Daily Rate List';
                $rootScope.showLoading = false;
                var resData = res.data.data;
                var pageNumArr = []
                $scope.numberingLength = Math.ceil(resData.count / $scope.pageSize);
                console.log($scope.numberingLength)
                for (var i = 1; $scope.numberingLength >= i; i++) {
                    if (i == 4) {
                        pageNumArr.push({ id: '...' })
                    } else if (i > ($scope.numberingLength - 3)) {
                        pageNumArr.push({ id: i })
                    } else if (i <= 3) {
                        pageNumArr.push({ id: i })
                    }
                    if ($scope.numberingLength == i) {
                        $scope.numberingPage = pageNumArr
                        $scope.getPageRecord(1);
                    }
                }
            }, function(err) {
                $rootScope.showLoading = false;
            });
        }

        $scope.selectPageSize = function(size) {
            $scope.loadAll()
        }

        $scope.setCurrent = function(page) {
            if ((page >= 1) && (page <= 8)) {
                $scope.getPageRecord(page);
            }
        }

        $scope.getPageRecord = function(page) {
            $scope.currentPage = page;
            $scope.fromRecord = (page * $scope.pageSize) - $scope.pageSize;
            $http.get('/api/dailyRate/get_record_page/' + page + '/' + $scope.pageSize).then(function(res) {
                var recLength = res.data.data;
                $scope.list = recLength;
            }, function(err) {
                $rootScope.showLoading = false;
                Notify.showNotification(err.data.error.error_message, 'error-class');
            });
        }

        /**
         *@Function            : add()
         *@Description         : This function used for add cms form data in database
         *@unit test performed : check all form validation and submit data in DB
         *@Result              : Done successfully and get added data in database
         */
        $scope.add = function() {
            if ($scope.addForm.$valid) {
                var trData = {};
                trData.trailer_type = $scope.form.type.id;
                trData.trailer_size = $scope.form.size.id;
                trData.duration = $scope.form.duration.id;
                trData.price = $scope.form.price;
                $http.post('/api/dailyRate/add_rate', trData).then(function(res) {
                    $rootScope.showLoading = false;
                    Notify.showNotification(res.data.message);
                    $state.go('dailyRateManage')
                }, function(err) {
                    $rootScope.showLoading = false;
                    Notify.showNotification(err.data.error.error_message, 'error-class');
                });
            }
        }

        /**
         *@Function            : getTypeData()
         *@Description         : This function used for get all type list
         *@unit test performed : check for get list
         *@Result              : Done successfully and get all list of type
         */
        $scope.getTypeData = function(argument) {
            angular.forEach($scope.typeOption, function(key) {
                if (argument.id == key.id) {
                    $scope.sizeOption = JSON.parse(key.size_id);
                }
            });
        }

        /**
         *@Function            : edit()
         *@Description         : This function used for get daily rate data by Id for Edit daily rate detail
         *@unit test performed : check and get edit data by id
         *@Result              : Done successfully and get daily rate data by Id
         */
        $scope.edit = function() {
            $rootScope.showLoading = true;
            $timeout(function() {
                $http.post('/api/dailyRate/get_rate_by_id', { id: $stateParams.Id }).then(function(res) {
                    $scope.form = res.data.data;
                    angular.forEach($scope.durationOption, function(i, key) {
                        if (i.id === res.data.data.duration) {
                            $scope.form.duration = $scope.durationOption[key];
                        }
                    });
                    angular.forEach($scope.typeOption, function(i, key) {
                        if (i.id === res.data.data.trailer_type) {
                            $scope.form.type = $scope.typeOption[key];
                            $scope.sizeOption = JSON.parse($scope.form.type.size_id);
                            angular.forEach($scope.sizeOption, function(j, keys) {
                                if (j.id === res.data.data.trailer_size) {
                                    $scope.form.size = $scope.sizeOption[keys];
                                }
                            });
                        }
                    });
                    $rootScope.showLoading = false;
                }, function(err) {
                    $rootScope.showLoading = false;
                    Notify.showNotification(err.error.error_message, 'error-class');
                });
            }, 1000);

        }

        /**
         *@Function            : update()
         *@Description         : This function used for update daily rate data by Id
         *@unit test performed : check form validation and update data by id
         *@Result              : Done successfully and get updated daily rate data by Id
         */
        $scope.update = function() {
            if ($scope.updateForm.$valid) {
                $rootScope.showLoading = true;
                var upData = {};
                upData.id = $scope.form.id;
                upData.trailer_type = $scope.form.type.id;
                upData.trailer_size = $scope.form.size.id;
                upData.duration = $scope.form.duration.id;
                upData.price = $scope.form.price;
                upData.modified = new Date();
                $http.post('/api/dailyRate/update_rate', upData).then(function(res) {
                    $rootScope.showLoading = false;
                    Notify.showNotification(res.data.data);
                    $state.go('dailyRateManage');
                }, function(err) {
                    console.log(err)
                    $rootScope.showLoading = false;
                    Notify.showNotification(err.error.error_message, 'error-class');
                });
            }
        }

        /**
         *@Function            : delete()
         *@Description         : This function used for delete daily rate data by Id
         *@parameter- id       : id for delete data
         *@unit test performed : check daily rate deleted by id
         *@Result              : Done successfully and deleted daily rate data by Id
         */
        $scope.delete = function(id) {
            if (confirm('Are you sure you want to delete this...?')) {
                $http.post('/api/dailyRate/delete_rate_by_id', { id: id }).then(function(res) {
                    $rootScope.showLoading = false;
                    $state.go($state.current, {}, { reload: true });
                    Notify.showNotification(res.data);
                }, function(err) {
                    $rootScope.showLoading = false;
                    Notify.showNotification(err.error.error_message, 'error-class');
                });
            }
        }

        /**
         *@Function            : checkExists()
         *@Description         : This function used for check Rate for the selected trailer type/size/duration already exists
         *@unit test performed : check daily rate 
         *@Result              : Done successfully and check Rate for the selected trailer type/size/duration already exists
         */
        $scope.checkExists = function() {
            if ($scope.form.type.id && $scope.form.size.id && $scope.form.duration.id) {
                $http.post('/api/dailyRate/calculate_daily_rate', { type: $scope.form.type.id, size: $scope.form.size.id, duration: $scope.form.duration.id }).then(function(res) {
                    console.log(res.data.data)
                    if (res.data.data.length > 0) {
                        $scope.alrdyTkn = true;
                    } else {
                        $scope.alrdyTkn = false;
                    }
                }, function(err) {
                    $rootScope.showLoading = false;
                    Notify.showNotification(err.data.error, 'error-class');
                });
            }
        }

    }]);
})();
