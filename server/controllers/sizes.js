var Connection = require('../../config/database.js');
var config = require('../../config/config.js');

/* @function : loadSizes
 *  @method  : GET
 *  @purpose  : This function used get all size data from DB
 */
exports.loadSizes = function(req, res) {
    Connection.query('SELECT id, label FROM sizes', function(err, size) {
        if (err) {
            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
        } else {
            res.status(200).json({ message: 'Success', data: size, error: {} });
        }
    })
}

/* @function : loadDuration
 *  @method  : GET
 *  @purpose  : This function used get all duration data from DB
 */
exports.loadDuration = function(req, res) {
    Connection.query('SELECT id, name FROM durations', function(err, duration) {
        if (err) {
            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
        } else {
            res.status(200).json({ message: 'Success', data: duration, error: {} });
        }
    })
}
