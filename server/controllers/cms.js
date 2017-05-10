var Connection = require('../../config/database.js');
var config = require('../../config/config.js');

/* @function : addCms
 *  @method  : POST
 *  @purpose  : This function used for add cmd data in DB
 */
exports.addCms = function(req, res) {
    query = "INSERT INTO cms (title,description,status) VALUES ('" +
        req.body.title + "'" + ',' + "'" +
        req.body.description + "'" + ',' + "'" +
        req.body.status +
        "')";
    Connection.query(query, function(err, trailer) {
        console.log(err)
        if (err) {
            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
        } else {
            res.status(200).json({ status: config.CODES.statusOk, message: 'CMS successfully added' });
        }
    });
}

/* @function : loadCms
 *  @method  : GET
 *  @purpose  : This function used get all cmd data from DB
 */
exports.loadCms = function(req, res) {
    var query = 'SELECT id, title, status, class, created, @curRow := @curRow + 1 AS row_number from cms JOIN (SELECT @curRow := 0) r ORDER BY id DESC';
    Connection.query(query, function(err, cms) {
        if (err) {
            res.status(500).json({ 'error': err });
        } else {
            res.status(200).json({ message: 'Success', data: cms, error: {} });
        }
    })
}

/* @function : getCmsDetail
 *  @method  : POST
 *  @purpose  : This function used get cms data as per cms_id
 */
exports.getCmsDetail = function(req, res) {
    Connection.query('SELECT id, title, description, status from cms where id="' + req.body.id + '"', function(err, cms) {
        if (err) {
            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
        } else if (cms.length < 1) {
            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: 'Id does not exist' } });
        } else {
            res.status(200).json({ status: config.CODES.statusOk, data: cms[0] });
        }
    })
}

/* @function : deleteCms
 *  @method  : POST
 *  @purpose  : This function used delete cms data as per cms_id
 */
exports.deleteCms = function(req, res) {
    Connection.query('DELETE FROM cms WHERE id="' + req.body.id + '"', function(err, trailer) {
        if (err) {
            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
        } else {
            res.status(200).json({ status: config.CODES.statusOk, data: 'Cms is successfully deleted' });
        }
    })
}

/* @function : updateCms
 *  @method  : POST
 *  @purpose  : This function used update cms data as per cms_id
 */
exports.updateCms = function(req, res) {
    var query = "UPDATE cms SET title = '" + req.body.title + "',description='" + req.body.description + "',status= '" + req.body.status + "', modified= '" + req.body.modified + "' WHERE id= '" + req.body.cms_id + "'";
    Connection.query(query, function(err, trailer) {
        if (err) {
            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
        } else if (trailer.affectedRows == 0) {
            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: 'Cms id does not exists' } });
        } else {
            res.status(200).json({ status: config.CODES.statusOk, data: 'Cms successfully updated' });
        }
    })
}
