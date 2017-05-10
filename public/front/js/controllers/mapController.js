/********************************
 * Controller : Map Controller *
 * created    : 11-03-2016      *
 ********************************/
(function() {
    'use strict';
    myApp.controller('MapCtrl', ['$scope', '$timeout', '$http', '$rootScope', function($scope, $timeout, $http, $rootScope) {

        var infoWindow;
        var location;
        $scope.markers = [];
        var cityCircle;
        $timeout(function() {
            // var mapOptions = {
            //     zoom: 4,
            //     center: new google.maps.LatLng(25, 80),
            //     mapTypeId: google.maps.MapTypeId.TERRAIN
            // }

            // $scope.map = new google.maps.Map(document.getElementById('map'), mapOptions);

            var latlng = new google.maps.LatLng(-34.397, 150.644);

            $scope.map = new google.maps.Map(document.getElementById('map'), {
                center: latlng,
                zoom: 11,
                minZoom: 4,
            });
            infoWindow = new google.maps.InfoWindow({ map: $scope.map });
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function(position) {
                    var pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };

                    console.log(pos)

                    infoWindow.setPosition(pos);
                    infoWindow.setContent('Your are here');
                    $scope.map.setCenter(pos);
                    var sunCircle = {
                        strokeColor: "#c3fc49",
                        strokeOpacity: 0.8,
                        strokeWeight: 2,
                        fillColor: "#c3fc49",
                        fillOpacity: 0.35,
                        map: $scope.map,
                        center: new google.maps.LatLng(pos.lat, pos.lng),
                        radius: 16093.440 // in meters
                    };
                    cityCircle = new google.maps.Circle(sunCircle)
                    $http.post('/api/trailar/get_trailer_by_latlng', { lat: pos.lat, lng: pos.lng }).then(function(res) {
                        location = [];
                        angular.forEach(res.data.data, function(key) {
                            location.push({ lat: key.lat, long: key.lng });
                        });

                        for (var i = 0; i < location.length; i++) {
                            createMarker(location[i]);
                        }
                    }, function(err) {
                        $rootScope.showLoading = false;
                        console.log(err)
                    });

                }, function() {
                    handleLocationError(true, infoWindow, $scope.map.getCenter());

                });
            } else {
                // Browser doesn't support Geolocation
                handleLocationError(false, infoWindow, $scope.map.getCenter());
            }
        }, 1000);


        function handleLocationError(browserHasGeolocation, infoWindow, pos) {
            infoWindow.setPosition(pos);
            infoWindow.setContent(browserHasGeolocation ?
                'Error: The Geolocation service failed.' :
                'Error: Your browser doesn\'t support geolocation.');
        }

        var createMarker = function(info) {
            var marker = new google.maps.Marker({
                map: $scope.map,
                position: new google.maps.LatLng(info.lat, info.long),
                icon: 'front/images/map-pin-img.png'
            });
            marker.content = '<div class="infoWindowContent">' + info.desc + '</div>';
            //marker.setMap(null);
            // google.maps.event.addListener(marker, 'click', function() {
            //     infoWindow.setContent('<h2>' + marker.title + '</h2>' + marker.content);
            //     infoWindow.open($scope.map, marker);
            // });
            cityCircle.bindTo('center', marker, 'position');
            $scope.markers.push(marker);
        }

        var removeMarker = function() {
            infoWindow = new google.maps.InfoWindow();
            infoWindow.close();
            for (var i = 0; i < $scope.markers.length; i++) {
                $scope.markers[i].setMap(null);
            }
            $scope.markers.length = 0;
        }

        $scope.openInfoWindow = function(e, selectedMarker) {
            e.preventDefault();
            google.maps.event.trigger(selectedMarker, 'click');
        }

        $scope.showSearch = function() {
            if ($scope.searchForm.$valid) {
                var geocoder = new google.maps.Geocoder();
                var address = $scope.searchAddress;
                console.log(address)
                geocoder.geocode({ 'address': address }, function(results, status) {
                    console.log(results)
                    removeMarker()
                    var newLat = results[0].geometry.location.lat();
                    var newLng = results[0].geometry.location.lng();
                    $scope.map.setCenter({
                        lat: newLat,
                        lng: newLng
                    });
                    if (status == google.maps.GeocoderStatus.OK) {
                        $http.post('/api/trailar/get_trailer_by_latlng', { lat: newLat, lng: newLng }).then(function(res) {
                            location = [];
                            angular.forEach(res.data.data, function(key) {
                                location.push({ lat: key.lat, long: key.lng });
                            });

                            for (var i = 0; i < location.length; i++) {
                                createMarker(location[i]);
                            }
                        }, function(err) {
                            $rootScope.showLoading = false;
                            console.log(err)
                        });
                    }
                });
            } else {
                alert('Please enter location');
            }
        }

        $scope.$on('gmPlacesAutocomplete::placeChanged', function() {
            var location = $scope.searchAddress.getPlace().geometry.location;
            console.log(location)
            $scope.lat = location.lat();
            $scope.lng = location.lng();
            $scope.map.setCenter({
                lat: $scope.lat,
                lng: $scope.lng
            });
            if (status == google.maps.GeocoderStatus.OK) {
                $http.post('/api/trailar/get_trailer_by_latlng', { lat: newLat, lng: newLng }).then(function(res) {
                    location = [];
                    angular.forEach(res.data.data, function(key) {
                        location.push({ lat: key.lat, long: key.lng });
                    });
                    for (var i = 0; i < location.length; i++) {
                        createMarker(location[i]);
                    }
                }, function(err) {
                    $rootScope.showLoading = false;
                    console.log(err)
                });
            }
        });
    }]);
})();
