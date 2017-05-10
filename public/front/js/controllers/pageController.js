/********************************
 * Controller : Page Controller *
 * created    : 10-23-2016      *
 ********************************/
(function() {
    'use strict';
    myApp.controller('pageCtrl', ['$scope', '$http', 'Notify', '$sce', '$filter', '$stateParams', 'loadAsync', '$compile', '$timeout', '$rootScope', '$state', function($scope, $http, Notify, $sce, $filter, $stateParams, loadAsync, $compile, $timeout, $rootScope, $state) {


        $scope.selectResult = function(data) {
            console.log(data)
            console.log($scope.selectedQuestion)
        }

        if ($scope.selectedQuestion) {
            console.log($scope.selectedQuestion)
        }


        /**
         *@Function            : loadPages()
         *@Description         : This function used for get page data
         *@unit test performed : check id and get data data
         *@Result              : Done successfully and get and load data on page
         */

        $scope.loadPages = function(ids) {
            $http.post('/api/user/cms_page_by_id', { id: ids }).then(function(res) {
                var dataPage = res.data.data.description
                if (dataPage !== 'null') {
                    $scope.description = $sce.trustAsHtml(dataPage);
                    $scope.lengthPage = false;
                } else {
                    console.log('sdsdsds');
                    $scope.lengthPage = true;
                    $scope.noData = "No Data Available";
                }
                if (ids == 17) {
                    $scope.activeHtc = true;
                    $scope.activeOtc = false;
                    $scope.activetc = false;
                } else if (ids == 18) {
                    $scope.activeHtc = false;
                    $scope.activeOtc = true;
                    $scope.activetc = false;
                } else if (ids == 3) {
                    $scope.activeHtc = false;
                    $scope.activeOtc = false;
                    $scope.activetc = true;
                } else {
                    $scope.activeHtc = false;
                    $scope.activeOtc = false;
                    $scope.activetc = false;
                }
            }, function(err) {
                $rootScope.showLoading = false;
                Notify.showNotification(err.data.error, 'error-class');
            });
        }

        $scope.getHelpcatList = function(catId) {
            console.log(catId);
            $http.post('/api/help/get_role_category', { cat_id: catId }).then(function(res) {
                console.log(res.data.data);
                $scope.categoryList = res.data.data;
            }, function(err) {
                $rootScope.showLoading = false;
            });
        }

        $scope.getHelpQcatList = function(catId) {
            console.log(catId);
            $http.post('/api/help/get_q_category_link', { cat_id: catId }).then(function(res) {
                console.log(res.data.data);
                $scope.qCategoryList = res.data.data;
            }, function(err) {
                $rootScope.showLoading = false;
            });
        }

        /**
         *@Function            : getDTrailerData()
         *@Description         : This function used for get category trailer list on home page
         *@unit test performed : check service and get data
         *@Result              : Done successfully and get category trailer list and load on home page 
         */
        $scope.getDTrailerData = function() {
            $http.get('/api/size/load_duration').then(function(res) {
                $scope.userTitle = 'All Type List';
                $scope.durationOption = res.data.data;
                $scope.modelDuration = $scope.durationOption[0];
            }, function(err) {
                $rootScope.showLoading = false;
            });

            $http.get('/api/trailar/loadDTrailer').then(function(res) {
                $scope.dTrailerdata = [];
                angular.forEach(res.data.data, function(key) {
                    var desc = key.description;
                    var strDot = desc.length;
                    if (strDot > 0) {
                        var content = desc.substring(0, 70);
                    } else {
                        var content = desc.substring(0, 50);
                    }
                    $scope.dTrailerdata.push({ id: key.type_id, image: key.image, type_name: key.type_name, size_ids: key.size_id, description: $sce.trustAsHtml(content), caption: key.caption });;
                });
                $scope.modelType = $scope.dTrailerdata[0];
                $scope.getSizeData($scope.dTrailerdata[0].id, 0)
            }, function(err) {
                Notify.showNotification(err.data.error, 'error-class');
            });
        }

        /**
         *@Function            : getSizeData()
         *@Description         : This function used for get size data as per type id
         *@unit test performed : check service and get data
         *@Result              : Done successfully and get size data and load on page
         */
        $scope.getSizeData = function(id, index) {
            //$("#selredio" + id).prop('checked', true);
            $rootScope.showLoading = true;
            $scope.modelType = $scope.dTrailerdata[index];
            console.log($scope.dTrailerdata);
            angular.forEach($scope.dTrailerdata, function(i, key) {
                if (i.id === id) {
                    $scope.sizeOption = $scope.dTrailerdata[key].size_ids;
                    $scope.modelSize = $scope.sizeOption[1];
                    if ($scope.modelType.id && $scope.modelSize.id && $scope.modelDuration.id) {
                        $scope.calcularDailyRate($scope.modelType, $scope.modelSize, $scope.modelDuration)
                    } else {
                        $rootScope.showLoading = false;
                        $state.go($state.current, {}, { reload: true });
                    }
                }
            });
        }

        /**
         *@Function            : calcularDailyRate()
         *@Description         : This function used for calcular Daily Rate as per type, size and duration data
         *@unit test performed : check service and get data
         *@Result              : Done successfully and calcular Daily Rate and show on page
         */
        $scope.calcularDailyRate = function(type, size, duration) {
            $rootScope.showLoading = true;
            $("#sizeredio" + size.id).prop('checked', true);
            $http.post('/api/dailyRate/calculate_daily_rate', { type: type.id, size: size.id, duration: duration.id }).then(function(res) {
                if (res.data.data[0]) {
                    $scope.dailyRate = res.data.data[0].price;
                } else {
                    $scope.dailyRate = 0;
                }
                $rootScope.showLoading = false;
            }, function(err) {
                Notify.showNotification(err.data.error, 'error-class');
            });
        }

        /**
         *@Function            : loadFaqDetails()
         *@Description         : This function used for get faq data by category
         *@unit test performed : check id and get data data
         *@Result              : Done successfully and get faq data by category
         */
        $scope.loadFaqDetails = function(ids) {
            $rootScope.showLoading = true;
            //$timeout(function() {
            $http.post('/api/faq/faq_detail_by_id', { cat_id: $stateParams.Id }).then(function(res) {
                if (res.data.data.length > 0) {
                    $scope.dataPage = res.data.data
                }
                $rootScope.showLoading = false;
            }, function(err) {
                $rootScope.showLoading = false;
                Notify.showNotification(err.data.error, 'error-class');
            });
            //},1000);
        }

        /**
         *@Function            : loadHelpDetail()
         *@Description         : This function used for load help pages
         *@unit test performed : check id and get data data
         *@Result              : Done successfully and load help pages
         */
        $scope.loadHelpDetail = function(ids) {
            var ids = ids || $stateParams.Id;
            var ele = angular.element('#element');
            $http.get('/api/cms/loadCms').then(function(res) {
                $scope.dataTrack = res.data.data;
            }, function(err) {
                $rootScope.showLoading = false;
                Notify.showNotification(err.data.error, 'error-class');
            });
            ele.html('');
            loadAsync.template({ view: 'front/views/main/help_detail_load.html' }).then(function(res) {
                ele.append($compile(res)($scope));
                if (ids == 8) {
                    $scope.activeOverview = true;
                    $scope.activeSignUp = false;
                    $scope.activeTrailerOpt = false;
                    $scope.loadPages(ids)
                } else if (ids == 9) {
                    $scope.activeOverview = false;
                    $scope.activeSignUp = true;
                    $scope.activeTrailerOpt = false;
                    $scope.loadPages(ids)
                } else if (ids == 10) {
                    $scope.activeOverview = false;
                    $scope.activeSignUp = false;
                    $scope.activeTrailerOpt = true;
                    $scope.loadPages(ids)
                } else if (ids == 11) {
                    $scope.activeOverview = true;
                    $scope.activeSignUp = false;
                    $scope.activeTrailerOpt = false;
                    $scope.loadPages(ids)
                } else if (ids == 12) {
                    $scope.activeOverview = false;
                    $scope.activeSignUp = true;
                    $scope.activeTrailerOpt = false;
                    $scope.loadPages(ids)
                } else if (ids == 13) {
                    $scope.activeOverview = false;
                    $scope.activeSignUp = false;
                    $scope.activeTrailerOpt = true;
                    $scope.loadPages(ids)
                } else if (ids == 14) {
                    $scope.activeOverview = true;
                    $scope.activeSignUp = false;
                    $scope.activeTrailerOpt = false;
                    $scope.loadPages(ids)
                } else if (ids == 15) {
                    $scope.activeOverview = false;
                    $scope.activeSignUp = true;
                    $scope.activeTrailerOpt = false;
                    $scope.loadPages(ids)
                } else if (ids == 16) {
                    $scope.activeOverview = false;
                    $scope.activeSignUp = false;
                    $scope.activeTrailerOpt = true;
                    $scope.loadPages(ids)
                }
            });
        }

        $scope.loadTcDetail = function(ids) {
            var ids = ids || $stateParams.Id;
            var ele = angular.element('#element');
            ele.html('');
            loadAsync.template({ view: 'front/views/main/term_and_cond_detail.html' }).then(function(res) {
                ele.append($compile(res)($scope));
                if (ids == 8) {
                    $scope.activeOverview = true;
                    $scope.activeSignUp = false;
                    $scope.activeTrailerOpt = false;
                    $scope.loadPages(ids)
                } else if (ids == 9) {
                    $scope.activeOverview = false;
                    $scope.activeSignUp = true;
                    $scope.activeTrailerOpt = false;
                    $scope.loadPages(ids)
                } else if (ids == 10) {
                    $scope.activeOverview = false;
                    $scope.activeSignUp = false;
                    $scope.activeTrailerOpt = true;
                    $scope.loadPages(ids)
                } else if (ids == 11) {
                    $scope.activeOverview = true;
                    $scope.activeSignUp = false;
                    $scope.activeTrailerOpt = false;
                    $scope.loadPages(ids)
                } else if (ids == 12) {
                    $scope.activeOverview = false;
                    $scope.activeSignUp = true;
                    $scope.activeTrailerOpt = false;
                    $scope.loadPages(ids)
                } else if (ids == 13) {
                    $scope.activeOverview = false;
                    $scope.activeSignUp = false;
                    $scope.activeTrailerOpt = true;
                    $scope.loadPages(ids)
                } else if (ids == 14) {
                    $scope.activeOverview = true;
                    $scope.activeSignUp = false;
                    $scope.activeTrailerOpt = false;
                    $scope.loadPages(ids)
                } else if (ids == 15) {
                    $scope.activeOverview = false;
                    $scope.activeSignUp = true;
                    $scope.activeTrailerOpt = false;
                    $scope.loadPages(ids)
                } else if (ids == 16) {
                    $scope.activeOverview = false;
                    $scope.activeSignUp = false;
                    $scope.activeTrailerOpt = true;
                    $scope.loadPages(ids)
                }
            });
        }

        $scope.getSearchData = function() {
            if ($scope.search.data) {
                var ele = angular.element('#element');
                ele.html('');
                loadAsync.template({ view: 'front/views/main/help_search.html' }).then(function(res) {
                    ele.append($compile(res)($scope));
                    $http.post('/api/faq/search_help_by_key', { key: $scope.search.data }).then(function(res) {
                        $scope.dataPage = res.data.data
                        console.log($scope.dataPage)
                    }, function(err) {
                        $rootScope.showLoading = false;
                        Notify.showNotification(err.data.error, 'error-class');
                    });
                });
            }
        }

        $scope.loadHelpMiddle = function() {
            var ele = angular.element('#element');
            ele.html('');
            loadAsync.template({ view: 'front/views/main/help_middle.html' }).then(function(res) {
                ele.append($compile(res)($scope));
                $http.get('/api/cms/loadCms').then(function(res) {
                    $scope.dataTrack = res.data.data;


                }, function(err) {
                    $rootScope.showLoading = false;
                    Notify.showNotification(err.data.error, 'error-class');
                });
            });
        }

        $scope.loadRenterHelp = function(id) {
            console.log($stateParams.Id)
            if ($stateParams.Id == 1) {
                $scope.activeReHl = true;
                $scope.activeOwHl = false;
            } else {
                $scope.activeReHl = false;
                $scope.activeOwHl = true;
            }

            $scope.loadSearchFn();

            $http.post('/api/help/load_help_cus_list', { id: $stateParams.Id }).then(function(res) {
                //console.log(JSON.stringify(res.data.data))
                var reList = res.data.data;
                var reLength = reList.length;
                if (reLength > 0) {
                    var newHelpArr = [];
                    var str = [];

                    for (var i = 0; i < reLength; i++) {
                        var aStr = str.indexOf(reList[i].hc_id);
                        if (aStr >= 0) {
                            // for (var j = 0; j < newHelpArr.length; j++) {
                            //     if (newHelpArr[j].hc_id === str) {

                            //     }
                            // }
                            newHelpArr[aStr].data_arr.push({ id: reList[i].id, question_category: reList[i].question_category })
                        } else {
                            newHelpArr.push({ hc_id: reList[i].hc_id, category_name: reList[i].category_name, data_arr: [{ id: reList[i].id, question_category: reList[i].question_category }] })
                            str.push(reList[i].hc_id);
                        }
                        if (i == (reLength - 1)) {
                            $scope.reListArr = newHelpArr;
                            $scope.helpLengthAll = newHelpArr.length;
                            $scope.helpLength = Math.ceil(newHelpArr.length / 2);
                            console.log($scope.helpLength)

                        }
                    }
                } else {
                    $state.go('help', { Id: 1 });
                }

            }, function(err) {
                $rootScope.showLoading = false;
            });
        }

        $scope.loadHelpCat = function(id) {
            $scope.loadSearchFn();
            $http.post('/api/help/load_help_single_cus_list', { id: $stateParams.Id }).then(function(res) {
                //console.log(JSON.stringify(res.data.data))
                var reList = res.data.data;
                var reLength = reList.length;
                if (reList[0].role == 1) {
                    $scope.mainTit = 'Renter';
                    $scope.mainid = 1;
                } else {
                    $scope.mainTit = 'Owner';
                    $scope.mainid = 2;
                }
                console.log(reList)
                if (reLength > 0) {
                    $scope.catTitle = reList[0].category_name;
                    $scope.role = reList[0].role;
                    $scope.getHelpcatList($scope.role);
                    var newHelpArr = [];
                    var str = '';
                    $scope.activeFunction(reList[0])
                    for (var i = 0; i < reLength; i++) {
                        if (reList[i].hqc_id == str) {
                            for (var j = 0; j < newHelpArr.length; j++) {
                                if (newHelpArr[j].hqc_id === str) {
                                    newHelpArr[j].data_arr.push({ id: reList[i].id, question: reList[i].question })
                                }
                            }
                            //
                        } else {
                            newHelpArr.push({ hqc_id: reList[i].hqc_id, slag: reList[i].slag, question_category: reList[i].question_category, data_arr: [{ id: reList[i].id, question: reList[i].question }] })
                            str = reList[i].hqc_id;
                        }

                        if (i == (reLength - 1)) {
                            $scope.reCatListArr = newHelpArr;
                            $scope.helpLengthAll = newHelpArr.length;
                            $scope.helpLength = Math.ceil(newHelpArr.length / 2);
                        }
                    }
                } else {
                     $state.go('help', { Id: 1 });
                }
            }, function(err) {
                $rootScope.showLoading = false;
            });
        }

        $scope.loadHelpSinAngCat = function(id) {
            $scope.loadSearchFn();
            $http.post('/api/help/load_help_single_cas_list', { id: $stateParams.Id }).then(function(res) {
                //console.log(JSON.stringify(res.data.data))
                var reList = res.data.data;
                var reLength = reList.length;

                if (reLength > 0) {
                    if (reList[0].role == 1) {
                        $scope.mainTit = 'Renter';
                        $scope.mainId = 1;
                    } else {
                        $scope.mainTit = 'Owner';
                        $scope.mainId = 2;
                    }
                    $scope.catTitle = reList[0].category_name;
                    console.log(reList)
                    $scope.role = reList[0].role;
                    $scope.getHelpcatList($scope.role);
                    var newHelpArr = [];
                    var str = '';
                    $scope.activeFunction(reList[0])
                    for (var i = 0; i < reLength; i++) {
                        if (reList[i].hqc_id == str) {
                            for (var j = 0; j < newHelpArr.length; j++) {
                                if (newHelpArr[j].hqc_id === str) {
                                    newHelpArr[j].data_arr.push({ id: reList[i].id, question: reList[i].question })
                                }
                            }
                        } else {
                            newHelpArr.push({ hqc_id: reList[i].hqc_id, question_category: reList[i].question_category, data_arr: [{ id: reList[i].id, question: reList[i].question }] })
                            str = reList[i].hqc_id;
                        }

                        if (i == (reLength - 1)) {
                            $scope.reCatListArr = newHelpArr;
                        }
                    }
                } else {
                    $state.go('help', { Id: 1 });
                }

            }, function(err) {
                $rootScope.showLoading = false;
            });
        }

        $scope.loadHelpAnsCat = function(id) {
            $scope.loadSearchFn();
            $http.post('/api/help/load_help_single_ans_list', { id: $stateParams.Id }).then(function(res) {
                $scope.anscat = res.data.data[0];
                $scope.filetrAnswer = $sce.trustAsHtml($scope.anscat.answer);
                $scope.filetrAnswerId = $scope.anscat.id;
                console.log($scope.anscat.role)
                if ($scope.anscat.role == 1) {
                    $scope.mainTit = 'Renter';
                    $scope.mainId = 1;
                } else {
                    $scope.mainTit = 'Owner';
                    $scope.mainId = 2;
                }

                var lengthAtt = res.data.data[0];
                if (lengthAtt) {
                    console.log('12121121', $scope.anscat)
                    $scope.helpCatTitle = res.data.data[0].category_name;
                    $scope.helpCatTitleId = res.data.data[0].help_category_id;
                    $scope.QCatTitle = res.data.data[0].question_category;
                    $scope.QCatTitleId = res.data.data[0].help_question_category_id;
                    $scope.activeQFunction(res.data.data[0].help_question_category_id)
                        //$scope.getHelpcatList($scope.anscat.role);
                    $scope.getHelpQcatList($scope.anscat.help_category_id);
                } else {
                     $state.go('help', { Id: 1 });
                }
            }, function(err) {
                $rootScope.showLoading = false;
            });
        }

        $scope.activeFunction = function(data) {
            var data = data.help_category_id;
            $scope['act' + data] = true;
        }

        $scope.activeQFunction = function(data) {
            $scope['act' + data] = true;
        }

        $scope.loadSearchFn = function() {
            $http.get('/api/help/get_all_question_list').then(function(res) {
                $scope.questions = res.data.data
            }, function(err) {
                $rootScope.showLoading = false;
            });
        }

        $scope.loadAllQCat = function(data) {
            $http.post('/api/help/get_question_help_all', { cat_id: $stateParams.Id }).then(function(res) {
                console.log('2222', res.data.data)
                //return

                $scope.AQList = res.data.data;
                $scope.helpCatTitle = res.data.data[0].category_name;
                $scope.helpCatTitleId = res.data.data[0].help_category_id;
                if (res.data.data[0].role == 1) {
                    $scope.mainTit = 'Renter';
                    $scope.mainId = 1;
                } else {
                    $scope.mainTit = 'Owner';
                    $scope.mainId = 2;
                }
                $scope.activeQFunction($stateParams.Id)
                $scope.getHelpQcatList($scope.AQList[0].help_category_id);
            });
        }

        $scope.submitHelp = function() {
            console.log($('.text1').val())
            if (($('.text1').val() != '') && ($('.text2').val() != '')) {
                $rootScope.showLoading = true;
                $http.post('/api/help/send_help_email', { text1: $('.text1').val(), text2: $('.text2').val() }).then(function(res) {
                    console.log('2222', res.data.data)
                    $('.text1').val('');
                    $('.text2').val('');
                    $rootScope.showLoading = false;
                    Notify.showNotification('Email has been sent to admin');
                }, function(err) {
                    $rootScope.showLoading = false;
                });

            } else {
                alert('Input can not be blank');
            }
        }


    }]);
})();
