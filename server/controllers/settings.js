var Connection = require('../../config/database.js');
var config = require('../../config/config.js');

/*
 * @funcion: loadSettings : used for get all setting list
 */
exports.loadSettings = function(req, res) {
    //Connection.query('SELECT * FROM blog_post ORDER BY id DESC', function(err, blog) {
    Connection.query('SELECT * FROM settings WHERE id=1', function(err, settings) {
        if (err) {
            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
        } else {
            res.status(200).json({
                message: 'Success',
                data: settings[0],
                error: {}
            });
        }
    })
}

/*
 * @funcion: updateSetting : used for updateSetting by id
 */
exports.updateSetting = function(req, res) {
    var query = "UPDATE settings SET application_fee= '" + req.body.application_fee +
        "', cancel_charge= '" + req.body.cancel_charge +
        "' WHERE id='" + req.body.id + "'";
    Connection.query(query, function(err, settings) {
        if (err) {
            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
        } else {
            res.status(200).json({ status: config.CODES.statusOk, message: config.MESSAGES.SettingUpdate });
        }
    })
}
