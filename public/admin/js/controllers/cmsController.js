/*******************************
 * Controller : CMS Controller *
 * created    : 10-23-2016     *
 *******************************/
(function() {
    'use strict';
    myApp.controller('cmsCtrl', ['$scope', '$rootScope', 'Notify', '$http', '$state', 'AuthService', '$stateParams', 'Upload', 'file', '$sce', function($scope, $rootScope, Notify, $http, $state, AuthService, $stateParams, Upload, file, $sce) {

        $scope.currentPage = 1;
        $scope.paginationOption = $rootScope.constant.paginationOptn;
        $scope.pageSize = $scope.paginationOption[$rootScope.constant.pageSize];
        $scope.trailerData = {};
        $scope.setDate = new Date();
        $scope.statusOption = [{ id: 1, name: "Active" }, { id: 0, name: "Inactive" }];
        $scope.editorOptionsOne = {
            language: 'en',
            uiColor: '#9AB8F3',
            enabled: "false",
            extraPlugins: 'imagebrowser,justify',
            imageBrowser_listUrl: "/api/v1/ckeditor/gallery"
        };

        $scope.editorOptionsTwo = {
            language: 'en',
            uiColor: '#9AB8F3',
            enabled: "false",
            removePlugins: 'image',
            extraPlugins: 'imagebrowser,justify',
            imageBrowser_listUrl: "/api/v1/ckeditor/gallery"
        };

        /**
         *@Function            : loadAll()
         *@Description         : This function used for get all CMS list
         *@unit test performed : check for get list
         *@Result              : Done successfully and get all list of CMS
         */
        $scope.loadAll = function() {
            $http.get('/api/cms/loadCms').then(function(res) {
                $scope.cmsTitle = 'All Cms List';
                $rootScope.showLoading = false;
                $scope.list = res.data.data;
            }, function(err) {
                $rootScope.showLoading = false;
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
                trData.title = $scope.form.title;
                trData.description = $scope.form.description || "No Data Available";
                trData.status = 1;
                $http.post('/api/cms/add_cms', trData).then(function(res) {
                    $rootScope.showLoading = false;
                    Notify.showNotification(res.data.message);
                    $state.go('cmsManage')
                }, function(err) {
                    $rootScope.showLoading = false;
                    Notify.showNotification(err.data.error, 'error-class');
                });
            }
        }

        /**
         *@Function            : edit()
         *@Description         : This function used for get cms data by Id for Edit cms detail
         *@unit test performed : check and get edit data by id
         *@Result              : Done successfully and get cms data by Id
         */
        $scope.edit = function() {
            $http.post('/api/cms/get_cms_by_id', { id: $stateParams.Id }).then(function(res) {
                $rootScope.showLoading = false;
                $scope.form = res.data.data;
                // angular.forEach($scope.statusOption, function(i, key) {
                //     if (i.id === res.data.data.status) {
                //         $scope.form.status = $scope.statusOption[key];
                //     }
                // });
            }, function(err) {
                $rootScope.showLoading = false;
                Notify.showNotification(err.error.error_message, 'error-class');
            });
        }

        /**
         *@Function            : update()
         *@Description         : This function used for update cms data by Id
         *@unit test performed : check form validation and update data by id
         *@Result              : Done successfully and get updated cms data by Id
         */
        $scope.update = function() {
            if ($scope.updateForm.$valid) {
                $rootScope.showLoading = true;
                var upData = {};
                upData.cms_id = $scope.form.id;
                upData.title = $scope.form.title;
                upData.status = 1;
                upData.description = $scope.form.description || "No Data Available";
                upData.modified = new Date();
                $http.post('/api/cms/update_cms', upData).then(function(res) {
                    $rootScope.showLoading = false;
                    Notify.showNotification(res.data.data);
                    $state.go('cmsManage');
                }, function(err) {
                    $rootScope.showLoading = false;
                    Notify.showNotification(err.error.error_message, 'error-class');
                });
            }
        }

        /**
         *@Function            : delete()
         *@Description         : This function used for delete cms data by Id
         *@parameter- id       : id for delete data
         *@unit test performed : check cms deleted by id
         *@Result              : Done successfully and deleted cms data by Id
         */
        $scope.delete = function(id) {
            if (confirm('Are you sure you want to delete this...?')) {
                $http.post('/api/cms/delete_cms_by_id', { id: id }).then(function(res) {
                    $rootScope.showLoading = false;
                    $state.go($state.current, {}, { reload: true });
                    Notify.showNotification(res.data);
                }, function(err) {
                    $rootScope.showLoading = false;
                    Notify.showNotification(err.error.error_message, 'error-class');
                });
            }
        }

    }]);
})();
