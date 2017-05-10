//******************************//
//      User Controller         //
//******************************//
(function() {
    'use strict';
    myApp.controller('faqCtrl', ['$scope', '$rootScope', 'Notify', '$http', '$state', 'AuthService', '$stateParams', 'Upload', 'file', '$sce', '$timeout', function($scope, $rootScope, Notify, $http, $state, AuthService, $stateParams, Upload, file, $sce, $timeout) {

        //console.log(AuthService.getAdminDetail())
        //console.log(AuthService.adminLoggedIn())

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
        $scope.statusOption = [{
            id: 1,
            name: "Active"
        }, {
            id: 0,
            name: "Inactive"
        }];

        $scope.loadAllfaqs = function() {
            $rootScope.showLoading = true;
            $http.get('/api/faq/loadFaq').then(function(res) {
                $scope.blogTitle = 'All Faq List';
                $rootScope.showLoading = false;
                $scope.blogList = res.data.data;
            }, function(err) {
                $rootScope.showLoading = false;
            });
        }

        $scope.addFaq = function() {
            if ($scope.addForm.$valid) {
                // $rootScope.showLoading = true;
                var trData = {};
                trData.question = $scope.blogData.blog_title;
                trData.faq_category = $scope.blogData.category.faq_id;
                trData.answer = $scope.blogData.blog_content;
                //console.log(trData);return false;
                $http.post('/api/faq/add_faq', trData).success(function(res) {
                    $rootScope.showLoading = false;
                    Notify.showNotification('Faq added successfully');
                    $state.go('manageFaq')
                }, function(err) {
                    $rootScope.showLoading = false;
                    Notify.showNotification(err.data.error, 'error-class');

                });
            }
        }

        $scope.editFaq = function() {
            $rootScope.showLoading = true;
            $scope.getFaqCategory();
            $http.post('/api/faq/get_faq_by_id', {
                id: $stateParams.Id
            }).then(function(res) {
                $rootScope.showLoading = false;
                $scope.blogData = res.data.data;
                angular.forEach($scope.statusOption, function(i, key) {
                    if (i.id === res.data.data.status) {
                        $scope.blogData.status = $scope.statusOption[key];
                    }
                });
                $timeout(function() {
                    angular.forEach($scope.categoryList, function(i, key) {
                        if (i.faq_id === res.data.data.faq_category_id) {
                            $scope.blogData.category = $scope.categoryList[key];
                        }
                    });
                }, 100);
            }, function(err) {
                $rootScope.showLoading = false;
                Notify.showNotification(err.data.error, 'error-class');
            });
        }

        $scope.updateFaq = function() {
            if ($scope.updateForm.$valid) {
                $rootScope.showLoading = true;
                var trData = {};
                trData.id = $scope.blogData.id;
                trData.question = $scope.blogData.question;
                trData.faq_category = $scope.blogData.category.faq_id;
                trData.answer = $scope.blogData.answer;
                trData.status = $scope.blogData.status.id;
                trData.modified = new Date();
                $http.post('/api/faq/update_faq', trData).then(function(res) {
                    $rootScope.showLoading = false;
                    Notify.showNotification('Faq updated successfully');
                    $state.go('manageFaq')
                }, function(err) {
                    $rootScope.showLoading = false;
                    Notify.showNotification(err.data.error.error_message, 'error-class');
                });
            }
        }

        $scope.deleteFaq = function(id) {
            if (confirm('Are you sure you want to delete?')) {
                $http.post('/api/faq/delete_faq_by_id', {
                    id: id
                }).then(function(res) {
                    $rootScope.showLoading = false;
                    console.log(res)
                    $state.go($state.current, {}, {
                        reload: true
                    });
                    Notify.showNotification('Faq deleted successfully');
                }, function(err) {
                    $rootScope.showLoading = false;
                    Notify.showNotification(err.data.error, 'error-class');
                });
            }
        }


        $scope.getFaqCategory = function() {
            $http.get('/api/faq/getFaqCategory').then(function(res) {
                $scope.categoryList = res.data.data;
            }, function(err) {
                $rootScope.showLoading = false;
            });
        }

        $scope.loadAllCategory = function() {
            $rootScope.showLoading = true;
            $http.get('/api/faq/loadCategory').then(function(res) {
                //console.log(res)
                $scope.categoryTitle = 'Faq Category List';
                $rootScope.showLoading = false;
                $scope.categoryList = res.data.data;
            }, function(err) {
                $rootScope.showLoading = false;
            });
        }

        $scope.editCategory = function() {
            $rootScope.showLoading = true;
            $http.post('/api/faq/get_category_by_id', {
                id: $stateParams.Id
            }).then(function(res) {
                $rootScope.showLoading = false;
                $scope.categoryData = res.data.data;
                angular.forEach($scope.statusOption, function(i, key) {
                    if (i.id === res.data.data.status) {
                        $scope.categoryData.status = $scope.statusOption[key];
                    }
                });
                $scope.fileTypeError = false;
            }, function(err) {
                $rootScope.showLoading = false;
                Notify.showNotification(err.data.error, 'error-class');
            });

        }

        $scope.updateCategory = function() {
            if ($scope.updateForm.$valid && $scope.alReg == false) {
                $rootScope.showLoading = true;
                var upData = {};
                upData.id = $scope.categoryData.faq_id;
                upData.category_name = $scope.categoryData.category_name;
                upData.status_id = $scope.categoryData.status.id;
                $http.post('/api/faq/update_category', upData).then(function(res) {
                    $rootScope.showLoading = false;
                    Notify.showNotification('Category updated successfully');
                    $state.go('manageFaqCat')
                }, function(err) {
                    $rootScope.showLoading = false;
                    Notify.showNotification(err.data.error, 'error-class');
                });
            }
        }

        $scope.addCategory = function() {
            if ($scope.addForm.$valid && $scope.alReg == false) {
                $rootScope.showLoading = true;
                var trData = {};
                trData.category_name = $scope.categoryData.category_name;
                //console.log(trData);return false;
                $http.post('/api/faq/add_category', trData).then(function(res) {
                    $rootScope.showLoading = false;
                    Notify.showNotification('Category added successfully');
                    $state.go('manageFaqCat')
                }, function(err) {
                    $rootScope.showLoading = false;
                    Notify.showNotification(err.data.error, 'error-class');
                });
            }
        }

        $scope.deleteCategory = function(id) {
            if (confirm('Are you sure you want to delete?')) {
                $http.post('/api/faq/delete_category_by_id', {
                    id: id
                }).then(function(res) {
                    $rootScope.showLoading = false;
                    $state.go($state.current, {}, {
                        reload: true
                    });
                    Notify.showNotification('Category deleted successfully');
                }, function(err) {
                    $rootScope.showLoading = false;
                    Notify.showNotification(err.data.error, 'error-class');
                });
            }
        }

        $scope.duplicateCategory = function(category_name) {
            console.log(category_name)
            $rootScope.showLoading = true;
            $http.post('/api/faq/duplicate_category', {
                category_name: category_name
            }).then(function(res) {
                $rootScope.showLoading = false;
                if (res.data.status == 1) {
                    $scope.alReg = true;
                } else {
                    $scope.alReg = false;
                }
            }, function(err) {
                $rootScope.showLoading = false;
            });
        }



    }]);
})();
