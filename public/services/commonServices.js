//******* Services******************//
myApp.service('Notify', ['notify', function(notify) {
    this.showNotification = function(msg, classes) {
        notify.closeAll();
        notify({
            templateUrl: '/notify.html',
            message: msg,
            classes: (classes ? classes : ''),
            position: 'center',
            duration: 5000
        });
        return this;
    };
}]).service('file', ['$q', 'Upload', function($q, Upload) {
    this.preview = function(file) {
            var def = $q.defer();
            var imgURL = [];
            if (file.type.match('image.*') || file.type.match('video.*')) {
                //create object url support
                var URL = window.URL || window.webkitURL;
                if (URL !== undefined) {
                    imgURL.push(URL.createObjectURL(file));
                    imgURL.push(file.name);

                    URL.revokeObjectURL(file);
                    def.resolve({ status: 200, message: 'OK', data: imgURL, error: {} });
                }
                //file reader support
                else if (window.File && window.FileReader) {
                    var reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onloadend = function() {
                        imgURL = reader.result;
                        def.resolve({ status: 200, message: 'OK', data: imgURL, error: {} });
                    }
                } else {
                    def.reject({ status: 400, message: 'File uploader not supported', data: imgURL, error: {} });
                }
            } else
                def.reject({ status: 400, message: 'File type not supported', error: {} });
            return def.promise;
        },
        this.uploadImg = function(file, path) {
            var def = $q.defer();
            Upload.upload({ url: '/upload/' + path, file: file }).success(function(res) {
                var namePackage = res.data.file.path.split('/');
                def.resolve({ status: 200, message: 'OK', data: namePackage.pop(), error: {} });
            }).error(function(err) {
                def.reject({ status: 400, message: 'Error', data: null, error: err });
            });
            return def.promise;
        }
}]).service('fileCok', ['$q', 'Upload', function($q, Upload) {
    this.preview = function(file) {
            var def = $q.defer();
            var imgURL = [];
            if (file.type.match('jpg.*') || file.type.match('jpeg.*') || file.type.match('png.*') || file.type.match('docx.*') || file.type.match('pdf.*') || file.type.match('document.*') || file.type.match('rtf.*') || file.type.match('plain.*') || file.type.match('msword.*')) {
                //create object url support
                if (file.size < 500000) {
                    var URL = window.URL || window.webkitURL;
                    if (URL !== undefined) {
                        imgURL.push(URL.createObjectURL(file));
                        imgURL.push(file.name);

                        URL.revokeObjectURL(file);
                        def.resolve({ status: 200, message: 'OK', data: imgURL, error: {} });
                    } else if (window.File && window.FileReader) {
                        var reader = new FileReader();
                        reader.readAsDataURL(file);
                        reader.onloadend = function() {
                            imgURL = reader.result;
                            def.resolve({ status: 200, message: 'OK', data: imgURL, error: {} });
                        }
                    } else {
                        def.reject({ status: 400, message: 'File uploader not supported', data: imgURL, error: {} });
                    }
                } else {
                    def.reject({ status: 400, message: 'File size allowed only : 500kb', data: imgURL, error: {} });
                }
            } else
                def.reject({ status: 400, message: 'File type allowed only : jpeg, .docx, .rtf, .bmp, .png, .pdf, .doc', error: {} });
            return def.promise;
        },
        this.uploadImg = function(file, path) {
            var def = $q.defer();
            Upload.upload({ url: '/upload/' + path, file: file }).success(function(res) {
                var namePackage = res.data.file.path.split('/');
                def.resolve({ status: 200, message: 'OK', data: namePackage.pop(), error: {} });
            }).error(function(err) {
                def.reject({ status: 400, message: 'Error', data: null, error: err });
            });
            return def.promise;
        }
}]).service('loadAsync', ['$q', '$http', '$templateCache', function($q, $http, $templateCache) {
    this.css = function(url) {
            var res = document.createElement('link');
            res.href = url;
            res.rel = 'stylesheet';
            var ele = document.getElementsByTagName('head')[0];
            ele.appendChild(res);
        },
        this.js = function(url, cb, defer) {
            defer = defer || $q.defer();
            var res = document.createElement('script');
            res.type = "application/javascript";
            if (angular.isArray(url)) {
                var self = this;
                res.src = url[0];
                res.onerror = res.onload = function() {
                    url.shift();
                    if (url.length)
                        self.js(url, cb, defer);
                    else
                        defer.resolve();
                };
            } else {
                res.src = url;
                res.onload = cb || function() {
                    defer.resolve();
                };
            }
            document.body.appendChild(res);
            return defer.promise;
        },
        this.template = function(params) {
            if (angular.isUndefined(params) || angular.isUndefined(params.view)) {
                console.log('Required arguments missing : view');
            } else {
                if (!angular.isUndefined(params.controller)) {
                    var counter = 0,
                        resp = '',
                        total = Object.keys(params).length,
                        defer = $q.defer();
                    this.js(params.controller).then(function() {
                        counter++;
                        if (counter === total)
                            defer.resolve(resp);
                    });
                    $http.get(params.view, { cache: $templateCache }).then(function(res) {
                        counter++;
                        resp = res.data;
                        if (counter === total)
                            defer.resolve(resp);
                    });
                    return defer.promise;
                } else {
                    return $http.get(params.view, { cache: $templateCache }).then(function(res) {
                        return res.data;
                    });
                }
            }
        };
}]);
