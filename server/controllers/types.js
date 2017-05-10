var Connection = require('../../config/database.js');
var config = require('../../config/config.js');

/* @function : loadTypes
 *  @method  : GET
 *  @purpose  : This function used for get all type list as
 */
exports.loadTypes = function(req, res) {
        Connection.query('SELECT id, name,size_id, created FROM types', function(err, type) {
            if (err) {
                res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
            } else {
                res.status(200).json({ message: 'Success', data: type, error: {} });
            }
        })
    }
