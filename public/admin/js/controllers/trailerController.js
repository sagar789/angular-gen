/***********************************
 * Controller : Trailer Controller *
 * created    : 10-19-2016         *
 ***********************************/
(function() {
    'use strict';
    myApp.controller('trailerCtrl', ['$scope', '$rootScope', 'Notify', '$http', '$state', 'AuthService', '$stateParams', 'Upload', 'file', '$sce', '$timeout', function($scope, $rootScope, Notify, $http, $state, AuthService, $stateParams, Upload, file, $sce, $timeout) {

        $scope.currentPage = 1;
        $scope.paginationOption = $rootScope.constant.paginationOptn;
        $scope.pageSize = $scope.paginationOption[$rootScope.constant.pageSize];
        $scope.trailerData = {};
        $scope.setDate = new Date();
        $scope.statusOption = [{ id: 1, name: "Active" }, { id: 0, name: "Inactive" }];
        $scope.editorOptions = {
            language: 'en',
            uiColor: '#9AB8F3',
            enabled: "false",
            extraPlugins: 'imagebrowser',
            imageBrowser_listUrl: "/api/v1/ckeditor/gallery"
        };
        $scope.example7settings = { externalIdProp: '' }
        $http.get('/api/type/loadType').then(function(res) {
            $scope.userTitle = 'All Type List';
            $scope.typeOption = res.data.data;
        }, function(err) {
            $rootScope.showLoading = false;
        });

        /**
         *@Function            : loadAllDTrailers()
         *@Description         : This function used for get all  list
         *@unit test performed : check for get list
         *@Result              : Done successfully and get all list of category trailer
         */
        $scope.loadAllDTrailers = function() {
            $http.get('/api/trailar/loadDTrailerFull').then(function(res) {
                $scope.userTitle = 'All Trailers Category List';
                $rootScope.showLoading = false;
                $scope.trailersList = res.data.data;
            }, function(err) {
                $rootScope.showLoading = false;
            });
        }

        /**
         *@Function            : addDTrailar()
         *@Description         : This function used for add category trailer
         *@unit test performed : check form validation and add form data in DB
         *@Result              : Done successfully and get added data in DB
         */
        $scope.addDTrailar = function() {
            if ($scope.addForm.$valid && ($scope.alTkn == false)) {
                var size = [];
                angular.forEach($scope.trailerData.selectedItems, function(key) {
                    size.push({ id: key.id, label: key.label });
                });
                var trData = {};
                trData.title = $scope.trailerData.title;
                trData.size = JSON.stringify(size);
                trData.type = $scope.trailerData.type.id;
                trData.status = $scope.trailerData.status.id;
                trData.description = $scope.trailerData.description || ''
                $scope._upload('/api/trailar/add_Dtrailar', $scope.trailerData.Image, trData).success(function(res) {
                    $rootScope.showLoading = false;
                    Notify.showNotification('Trailer add successfully');
                    $state.go('dTrailerManage')
                }, function(err) {
                    $rootScope.showLoading = false;
                    Notify.showNotification(err.data.error, 'error-class');

                });
            }
        }

        /**
         *@Function            : editDTrailar()
         *@Description         : This function used for get category trailer by id
         *@unit test performed : check and get edit data by id
         *@Result              : Done successfully and get category trailer data by Id
         */
        $scope.editDTrailar = function() {
            $rootScope.showLoading = true;
            $http.post('/api/trailar/get_Dtrailer_by_id', { id: $stateParams.Id }).then(function(res) {
                $rootScope.showLoading = false;
                $scope.trailerData = res.data.data;
                $scope.propEdImg = res.data.data.image;
                $timeout(function() {
                    angular.forEach($scope.typeOption, function(i, key) {
                        if (i.id === res.data.data.type_id) {
                            $scope.trailerData.type = $scope.typeOption[key];
                        }
                    });
                }, 100);
                $scope.typeFunction(res.data.data.type_id);
                $scope.trailerData.selectedItem = JSON.parse(res.data.data.size_id)
                angular.forEach($scope.statusOption, function(i, key) {
                    if (i.id === res.data.data.status) {
                        $scope.trailerData.status = $scope.statusOption[key];
                    }
                });
                $scope.fileTypeError = false;
                $scope.alTkn = false;
            }, function(err) {
                $rootScope.showLoading = false;
                Notify.showNotification(err.error.error_message, 'error-class');
            });
        }

        /**
         *@Function            : updateDTrailar()
         *@Description         :This function used for update category trailer data by Id
         *@unit test performed : check form validation and update data by id
         *@Result              :  Done successfully and get updated category trailer data by Id
         */
        $scope.updateDTrailar = function() {
            if ($scope.updateForm.$valid && ($scope.fileTypeError == false) && ($scope.alTkn == false) && ($scope.trailerData.selectedItem.length > 0)) {
                $scope.showTypeError = false;
                var size = [];
                angular.forEach($scope.trailerData.selectedItem, function(key) {
                    size.push({ id: key.id, label: key.label });
                });
                var trData = {};
                trData.dtrailer_id = $scope.trailerData.id;
                trData.title = $scope.trailerData.title;
                trData.size = JSON.stringify(size);
                trData.type = $scope.trailerData.type.id;
                trData.description = $scope.trailerData.description || '';
                trData.status = $scope.trailerData.status.id;
                trData.modified = new Date();
                console.log(trData)
                if ($scope.trailerData.Image) {
                    //$http.post('/api/unlink_file/', { path: 'public/admin/images/trailers/', img: $scope.propEdImg });
                    //$http.post('/api/unlink_file/', { path: 'public/admin/images/trailers/thumb/', img: $scope.propEdImg });
                    $scope._upload('/api/trailar/update_Dtrailer_file', $scope.trailerData.Image, trData).success(function(res) {
                        $rootScope.showLoading = false;
                        Notify.showNotification('Trailer is updated successfully');
                        $state.go('dTrailerManage')
                    }, function(err) {
                        $rootScope.showLoading = false;
                        Notify.showNotification(err.data.error, 'error-class');

                    });
                } else {
                    $http.post('/api/trailar/update_Dtrailer', trData).then(function(res) {
                        $rootScope.showLoading = false;
                        Notify.showNotification(res.data.message);
                        $state.go('dTrailerManage')
                    }, function(err) {
                        $rootScope.showLoading = false;
                        Notify.showNotification(err.data.error.error_message, 'error-class');
                    });
                }

            } else {
                if ($scope.trailerData.selectedItem.length > 0) {
                    $scope.showTypeError = false;
                } else {
                    $scope.showTypeError = true;
                }
            }
        }

        /**
         *@Function            : previewImage()
         *@Description         : This function used show preview image on browse
         *@parameter- e        : get event to get browse image
         *@unit test performed : check for get bolb image for show
         *@Result              : Done successfully and get bolb image path
         */
        $scope.previewImage = function(e) {
            file.preview(angular.element(e)[0].files[0]).then(function(res) {
                $scope.propImg = $sce.trustAsResourceUrl(res.data[0]);
                $scope.trailerData.Image = angular.element(e)[0].files[0];
                $rootScope.showLoading = false;
                $scope.fileTypeError = false;
            }, function(err) {
                $scope.fileTypeError = true;
                $scope.propImg = '';
                $scope.propEdImg = '';
                $scope.trailerData.Image = '';
                $rootScope.showLoading = false;
            });
        }

        /**
         *@Function            : _upload()
         *@Description         : This function used for upload image
         *@parameter- url      : where save form data
         *@parameter- Vfiles   : image file data
         *@parameter- dataT    : form data
         *@unit test performed : check for get all parameter and pass data to DB
         *@Result              : Done successfully and get all list of category trailer
         */
        $scope._upload = function(url, Vfiles, dataT) {
            if (Vfiles) {
                return Upload.upload({
                    url: url,
                    file: Vfiles,
                    data: dataT
                });
            }
        };

        /**
         *@Function            : deleteDTrailar()
         *@Description         : This function used for delete data by id
         *@parameter- id       : id for delete data
         *@unit test performed : check cms deleted by id
         *@Result              : Done successfully and deleted category trailer data by Id
         */
        $scope.deleteDTrailar = function(id) {
            if (confirm('Are you sure you want to delete this...?')) {
                $http.post('/api/trailar/delete_Dtrailer_by_id', { id: id }).then(function(res) {
                    $rootScope.showLoading = false;
                    console.log(res)
                    $state.go($state.current, {}, { reload: true });
                    Notify.showNotification(res.data.data);
                }, function(err) {
                    $rootScope.showLoading = false;
                    Notify.showNotification(err.error.error_message, 'error-class');
                });
            }
        }

        /**
         *@Function            : loadAll()
         *@Description         : This function used for get all trailer list
         *@unit test performed : check for get trailer list
         *@Result              : Done successfully and get all list of trailer
         */
        $scope.loadAll = function() {
            $http.get("/api/trailar/loadTrailer").then(function(res) {
                $scope.DataTitle = 'All Trailer List';
                $rootScope.showLoading = false;
                $scope.list = res.data.data;
            }, function(err) {
                $rootScope.showLoading = false;
            });
        }

        /**
         *@Function            : edit()
         *@Description         : This function used for get trailer data by Id for Edit trailer detail
         *@unit test performed : check and get edit data by id
         *@Result              : Done successfully and get trailer data by Id
         */
        $scope.edit = function() {
            $rootScope.showLoading = true;
            $http.get('/api/trailar/edit_trailer_by_id?trailer_id=' + $stateParams.Id).then(function(res) {
                $rootScope.showLoading = false;
                $scope.form = res.data.data[0];
                $scope.form.trailer_type_image = res.data.data[0].trailer_type_image.split('/').pop();
                console.log($scope.form);
            }, function(err) {
                $rootScope.showLoading = false;
                Notify.showNotification(err.error.error_message, 'error-class');
            });
        }

        /**
         *@Function            : delete()
         *@Description         : This function used for delete trailer data by Id
         *@parameter- id       : id for delete data
         *@unit test performed : check trailer deleted by id
         *@Result              : Done successfully and deleted trailer data by Id
         */
        $scope.delete = function(id) {
            if (confirm('Are you sure you want to delete this...?')) {
                $http.post('/api/trailar/delete_trailar', { trailer_id: id }).then(function(res) {
                    $rootScope.showLoading = false;
                    $state.go($state.current, {}, { reload: true });
                    Notify.showNotification(res.data.message);
                }, function(err) {
                    $rootScope.showLoading = false;
                    Notify.showNotification(err.error.error_message, 'error-class');
                });
            }
        }

        /**
         *@Function            : chackTypeSelect()
         *@Description         : This function used for check trailer type is already exist or not
         *@parameter- argument : pass argument
         *@unit test performed : check for argument exist in DB or not
         *@Result              : Done successfully and return true and false if argument is exists or not
         */
        $scope.chackTypeSelect = function(argument) {
            if (argument) {
                $scope.dropDSize = false;
                $http.post('/api/trailar/check_type_exists', { type_id: argument.id }).then(function(res) {
                    console.log($scope.trailerData.type_id)
                    if (res.data.status == 0 && ($scope.trailerData.type_id !== argument.id)) {
                        $scope.alTkn = true;
                    } else {
                        $scope.alTkn = false;
                    }
                }, function(err) {
                    $scope.alTkn = false;
                    Notify.showNotification(err.error.error_message, 'error-class');
                });
            } else {
                $scope.alTkn = false;
            }
            $scope.typeFunction(argument.id);
        }

        /**
         *@Function            : typeFunction()
         *@Description         : This function used for get all CMS list
         *@unit test performed : check for get list
         *@Result              : Done successfully and get all list of CMS
         */
        $scope.typeFunction = function(idData) {
            $http.get('/api/type/loadType').then(function(res) {
                angular.forEach(res.data.data, function(key) {
                    if (idData == key.id) {
                        $scope.example7settings = { externalIdProp: '' }
                        $scope.sizeOption = JSON.parse(key.size_id);
                        $scope.dropDSize = true;
                        $scope.trailerData.selectedItems = JSON.parse(key.size_id);
                    }
                });
            }, function(err) {
                $rootScope.showLoading = false;
            });
        }

    }]);
})();
