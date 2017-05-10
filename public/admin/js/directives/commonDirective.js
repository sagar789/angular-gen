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
}).directive('ngTeEditor', function() {
    return {
        restrict: 'A',
        require: 'ngModel',
        scope: { ngTeEditor: "@" },
        link: function(scope, elm) {
            $(elm).jqte().jqteVal(scope.ngTeEditor);
        }
    };
});