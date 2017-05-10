/********************************
 * Controller : user Controller *
 * created    : 10-15-2016      *
 ********************************/
(function() {
    'use strict';
    myApp.controller('dashCtrl', ['$scope', '$rootScope', 'Notify', '$http', '$state', 'AuthService', '$stateParams', function($scope, $rootScope, Notify, $http, $state, AuthService, $stateParams) {

        /**
         *@Function            : index()
         *@Description         : This function used for get total count of regisetred user, total count of trailers booking, total sum of payment done during booking
         *@unit test performed : check WS
         *@Result              : Done successfully and regisetred user, total count of trailers booking, total sum of payment done during booking
         */
        $scope.index = function() {
            // var piedata = [{
            //     label: "Series 1",
            //     data: [
            //         [1, 10]
            //     ],
            //     color: '#D9534F'
            // }, {
            //     label: "Series 2",
            //     data: [
            //         [1, 30]
            //     ],
            //     color: '#1CAF9A'
            // }, {
            //     label: "Series 3",
            //     data: [
            //         [1, 90]
            //     ],
            //     color: '#F0AD4E'
            // }, {
            //     label: "Series 4",
            //     data: [
            //         [1, 70]
            //     ],
            //     color: '#428BCA'
            // }, {
            //     label: "Series 5",
            //     data: [
            //         [1, 80]
            //     ],
            //     color: '#5BC0DE'
            // }];
            // jQuery.plot('#piechart', piedata, {
            //     series: {
            //         pie: {
            //             show: true,
            //             radius: 1,
            //             label: {
            //                 show: true,
            //                 radius: 2 / 3,
            //                 formatter: labelFormatter,
            //                 threshold: 0.1
            //             }
            //         }
            //     },
            //     grid: {
            //         hoverable: true,
            //         clickable: true
            //     }
            // });
            $http.get('/api/user/count_users').then(function(res) {
                console.log(res.data.data);
                $scope.countUser = res.data.data.one.user_count;
                $scope.lastWeekCount = res.data.data.two.last_week_count;
                $scope.booked_trailer_pending = res.data.data.three.booked_trailer_pending;
                $scope.total_booking_list = res.data.data.four.total_booking_list;
                $scope.booked_trailer_cancelled = res.data.data.five.booked_trailer_cancelled;
                $scope.booked_trailer_dropoff = res.data.data.seven.booked_trailer_dropoff;
                $scope.total_amount = res.data.data.six.total_amount;
                $scope.total_application_fee = res.data.data.six.total_application_fee;
                $scope.refunded_amount = res.data.data.nine.refunded_amount;
                $scope.transfer_amount = res.data.data.eight.transfer_amount;
            }, function(err) {
                $rootScope.showLoading = false;
            });
        }

        function labelFormatter(label, series) {
            return "<div style='font-size:8pt; text-align:center; padding:2px; color:white;'>" + label + "<br/>" + Math.round(series.percent) + "%</div>";
        }

    }]);
})();
