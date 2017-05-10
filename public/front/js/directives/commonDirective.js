//********************* Add Custom Directive *****************//
myApp.directive('compareTo', function() {
    return {
        restrict: 'A',
        require: ['^form', 'ngModel'],
        link: function(scope, elm, attrs, ctrls) {
            ctrls[1].$validators.compareTo = function(modelValue, viewValue) {
                return (modelValue === ctrls[0][attrs.compareTo].$modelValue);
            };
        }
    };
}).directive('validFile', function() {
    return {
        require: 'ngModel',
        link: function(scope, el, attrs, ngModel) {
            ngModel.$render = function() {
                ngModel.$setViewValue(el.val());
            };

            el.bind('change', function() {
                scope.$apply(function() {
                    ngModel.$render();
                });
            });
        }
    };
}).directive('googlePlace', function($rootScope) {
    return {
        require: 'ngModel',
        scope: {
            ngModel: '=',
            details: '=?'
        },
        link: function(scope, element, attrs, model) {
            var options = {
                types: [],
                componentRestrictions: {}
            };
            scope.gPlace = new google.maps.places.Autocomplete(element[0], options);

            google.maps.event.addListener(scope.gPlace, 'place_changed', function() {
                scope.$apply(function() {
                    scope.details = scope.gPlace.getPlace();
                    model.$setViewValue(element.val());
                    $rootScope.$broadcast('place_changed', scope.details);
                });
            });
        }
    };
}).directive('autoComplete', function($timeout) {
    return function(scope, elem, attr) {
        elem.autocomplete({
            source: scope[attr.uiItems],
            select: function() {
                $timeout(function() {
                    elem.trigger('input');
                }, 0);
            }
        });
    };
});
