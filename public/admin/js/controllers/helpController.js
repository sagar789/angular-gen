//******************************//
//      User Controller         //
//******************************//
(function() {
    'use strict';
    myApp.controller('helpCtrl', ['$scope', '$rootScope', 'Notify', '$http', '$state', 'AuthService', '$stateParams', 'Upload', 'file', '$sce', '$timeout', function($scope, $rootScope, Notify, $http, $state, AuthService, $stateParams, Upload, file, $sce, $timeout) {

        $scope.currentPage = 1;
        $scope.paginationOption = $rootScope.constant.paginationOptn;
        $scope.pageSize = $scope.paginationOption[$rootScope.constant.pageSize];
        $scope.trailerData = {};
        $scope.setDate = new Date();
        $scope.editorOptions = {
            language: 'en',
            uiColor: '#9AB8F3',
            enabled: "false",
            extraPlugins: 'imagebrowser',
            imageBrowser_listUrl: "/api/v1/ckeditor/gallery"
        };

        $scope.loadParentCategory = function() {
            $rootScope.showLoading = true;
            $http.post('/api/help/load_parent_category').then(function(res) {
                $scope.categoryTitle = 'Parent Category List';
                $rootScope.showLoading = false;
                $scope.categoryList = res.data.data;
            }, function(err) {
                $rootScope.showLoading = false;
            });
        }

        $scope.addParentCategory = function() {
            if ($scope.addForm.$valid) {
                $rootScope.showLoading = true;
                var trData = {};
                trData.title = $scope.categoryData.title;
                $http.post('/api/help/add_parent_category', trData).then(function(res) {
                    $rootScope.showLoading = false;
                    if (res.data.status == 1) {
                        Notify.showNotification(res.data.message);
                        $state.go('manageHelpCat')
                    } else {
                        Notify.showNotification(res.data.error.error_message, 'error-class');
                    }
                }, function(err) {
                    $rootScope.showLoading = false;
                    Notify.showNotification(res.data.error.error_message, 'error-class');
                });
            }
        }

        $scope.editParentCategory = function(model) {
            $rootScope.showLoading = true;
            $http.post('/api/help/get_parent_category_by_id', {
                id: $stateParams.Id
            }).then(function(res) {
                $rootScope.showLoading = false;
                if (res.data.status == 1) {
                    $scope.categoryData = res.data.data;
                } else {
                    Notify.showNotification(res.data.error.error_message, 'error-class');
                }
            }, function(err) {
                $rootScope.showLoading = false;
                Notify.showNotification(err.data.error.error_message, 'error-class');
            });
        }

        $scope.updateParentCategory = function() {
            if ($scope.updateForm.$valid) {
                $rootScope.showLoading = true;
                var upData = {};
                upData.id = $scope.categoryData.id;
                upData.title = $scope.categoryData.title;
                $http.post('/api/help/update_parent_category', upData).then(function(res) {
                    $rootScope.showLoading = false;
                    if (res.data.status == 1) {
                        Notify.showNotification(res.data.message);
                        $state.go('manageHelpCat')
                    } else {
                        Notify.showNotification(res.data.error.error_message, 'error-class');
                    }
                }, function(err) {
                    $rootScope.showLoading = false;
                    Notify.showNotification(err.data.error.error_message, 'error-class');
                });
            }
        }

        $scope.deleteParentCategory = function(id) {
            if (confirm('Are you sure you want to delete?')) {
                $http.post('/api/help/delete_parent_category', { id: id }).then(function(res) {
                    $rootScope.showLoading = false;
                    if (res.data.status === 1) {
                        $state.go($state.current, {}, {
                            reload: true
                        });
                        Notify.showNotification(res.data.message);
                        //$state.go('manageHelpCat')
                    } else {
                        Notify.showNotification(res.data.error.error_message, 'error-class');
                    }
                }, function(err) {
                    $rootScope.showLoading = false;
                    Notify.showNotification(err.data.error.error_message, 'error-class');
                });
            }
        }

        $scope.duplicateCategory = function(category_name) {
            $rootScope.showLoading = true;
            $http.post('/api/help/duplicate_category', { title: category_name }).then(function(res) {
                $rootScope.showLoading = false;
                if (res.data.status == 0) {
                    $scope.alReg = true;
                    //Notify.showNotification(res.data.error.error_message, 'error-class');
                } else {
                    $scope.alReg = false;
                }
            }, function(err) {
                $rootScope.showLoading = false;
                Notify.showNotification(res.data.error.error_message, 'error-class');
            });
        }


        $scope.loadAllCategory = function() {
            $rootScope.showLoading = true;
            $http.post('/api/help/load_category').then(function(res) {
                $scope.categoryTitle = 'Category List';
                $rootScope.showLoading = false;
                $scope.categoryList = res.data.data;
            }, function(err) {
                $rootScope.showLoading = false;
            });
        }

        $scope.addCategory = function() {
            if ($scope.addForm.$valid) {
                $rootScope.showLoading = true;
                var trData = {};
                trData.cat_id = $scope.categoryData.cat_id.id;
                trData.title = $scope.categoryData.title;
                $http.post('/api/help/add_category', trData).then(function(res) {
                    $rootScope.showLoading = false;
                    if (res.data.status == 1) {
                        Notify.showNotification(res.data.message);
                        $state.go('manageHelpQCat')
                    } else {
                        Notify.showNotification(res.data.error.error_message, 'error-class');
                    }
                }, function(err) {
                    $rootScope.showLoading = false;
                    Notify.showNotification(res.data.error.error_message, 'error-class');
                });
            }
        }

        $scope.editCategory = function(model) {
            $rootScope.showLoading = true;
            $scope.loadParentCategory();
            $http.post('/api/help/get_category_by_id', {
                id: $stateParams.Id
            }).then(function(res) {
                $rootScope.showLoading = false;
                if (res.data.status == 1) {
                    $scope.categoryData = res.data.data;
                    angular.forEach($scope.categoryList, function(i, key) {
                        if (i.id === res.data.data.parent_category_id) {
                            $scope.categoryData.cat_id = $scope.categoryList[key];
                        }
                    });
                } else {
                    Notify.showNotification(res.data.error.error_message, 'error-class');
                }
            }, function(err) {
                $rootScope.showLoading = false;
                Notify.showNotification(err.data.error.error_message, 'error-class');
            });
        }

        $scope.updateCategory = function() {
            if ($scope.updateForm.$valid) {
                $rootScope.showLoading = true;
                var upData = {};
                upData.id = $scope.categoryData.id;
                upData.cat_id = $scope.categoryData.cat_id.id;
                upData.title = $scope.categoryData.title;
                $http.post('/api/help/update_category', upData).then(function(res) {
                    $rootScope.showLoading = false;
                    if (res.data.status == 1) {
                        Notify.showNotification(res.data.message);
                        $state.go('manageHelpQCat')
                    } else {
                        Notify.showNotification(res.data.error.error_message, 'error-class');
                    }
                }, function(err) {
                    $rootScope.showLoading = false;
                    Notify.showNotification(err.data.error.error_message, 'error-class');
                });
            }
        }

        $scope.deleteCategory = function(id) {
            if (confirm('Are you sure you want to delete?')) {
                $http.post('/api/help/delete_category', { id: id }).then(function(res) {
                    $rootScope.showLoading = false;
                    if (res.data.status === 1) {
                        $state.go($state.current, {}, {
                            reload: true
                        });
                        Notify.showNotification(res.data.message);
                        //$state.go('manageHelpCat')
                    } else {
                        Notify.showNotification(res.data.error.error_message, 'error-class');
                    }
                }, function(err) {
                    $rootScope.showLoading = false;
                    Notify.showNotification(err.data.error.error_message, 'error-class');
                });
            }
        }
    }]);

})();
