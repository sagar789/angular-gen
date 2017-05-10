var Connection = require('../../config/database.js');
var config = require('../../config/config.js');

/* @function : loadNotification
 *  @method  : GET
 *  @purpose  : This function used get all loadNotification data from DB
 */
exports.loadNotification = function(req, res) {
    var query = 'SELECT nft.*, CONCAT(usr1.first_name," ",usr1.last_name) AS receiver, CONCAT(usr2.first_name," ",usr2.last_name) AS sender, @curRow := @curRow + 1 AS row_number FROM `notifications` AS nft LEFT JOIN users AS usr1 ON usr1.id=nft.receiver_id LEFT JOIN users AS usr2 ON usr2.id= nft.sender_id JOIN (SELECT @curRow := 0) r WHERE nft.is_deleted = 0 ORDER BY nft.notification_id DESC';
    Connection.query(query, function(err, cms) {
        if (err) {
            res.status(500).json({ 'error': err });
        } else {
            res.status(200).json({ message: 'Success', data: cms, error: {} });
        }
    })
}

/* @function : deleteNotificationById
 *  @method  : POST
 *  @purpose  : This function used delete notificatin data as per notificatin_id
 */
exports.deleteNotificationById = function(req, res) {
    var query = "DELETE FROM notifications WHERE notification_id= '" + req.body.notification_id + "'";
    Connection.query(query, function(err, trailer) {
        if (err) {
            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
        } else {
            res.status(200).json({ status: config.CODES.statusOk, message: 'Notification is successfully deleted' });
        }
    })
}

/* @function : getReceiverList
 *  @method  : POST
 *  @purpose  : This function used get all getReceiverList as per receiver id
 */
exports.getReceiverList = function(req, res) {
    console.log(req.body);
    if (req.body.user_id) {
        var query = 'SELECT notification_id, text, created, notification_type FROM notifications WHERE receiver_id ="' + req.body.user_id + '" AND is_deleted=0 ORDER BY created DESC';
        console.log(query)
        Connection.query(query, function(err, notif) {
            if (err) {
                res.status(200).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
            } else {
                Connection.query('UPDATE badge_counts SET count=0 WHERE user_id = "' + req.body.user_id + '"', function(err, bookTrailer) {});
                res.status(200).json({ status: config.CODES.statusOk, data: notif });
            }
        })
    } else {
        res.status(200).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.InvalidParameter } });
    }
}
