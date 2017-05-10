var async = require('async');
var fs = require('fs');
var config = require('../../config/config');

module.exports = function(app) {
    app.all('/*', function(req, res) {
        //Allow request types
        req.app.locals.protocol = 'http' + (config.ssl ? 's' : '');
        req.app.locals.base_url = req.app.locals.protocol + '://' + req.get('host') + '/';
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');

        if (req.params) {
            var paramArray = new Array();
            if (req.params[0]) {
                paramArray = req.params[0].split('/');
                req.params = paramArray;
                if (paramArray && paramArray[0]) {
                    var controllerName = paramArray[0];
                }
                if (paramArray && paramArray[1]) {
                    var methoodName = paramArray[1];
                }
            }
            fs.exists('./controllers/' + controllerName + '.js', function(exist) {
                if (exist) {
                    var controller = require('../controllers/' + controllerName.toLowerCase());
                    var method = '';
                    if (methoodName && typeof controller[methoodName.toLowerCase()] === 'function') {
                        method = methoodName.toLowerCase();
                    } else if (typeof controller.index === 'function') {
                        method = 'index';
                    } else res.status(200).json({ message: 'Method Not Found', error: {} });
                    controller[method](req, res);
                } else {
                    //console.log(controllerName);
                    if (controllerName == 'admin') {
                        res.sendfile('./public/admin/index.html');
                    } else if (controllerName == 'sitemap.xml') {
                        res.sendfile('./public/sitemap.xml');
                    } else {
                        res.sendfile('./public/index.html');
                    }
                }
            });
        } else {
            console.log('np params');
        }
    });

};
