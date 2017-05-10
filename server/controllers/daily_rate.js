var Connection = require('../../config/database.js');
var config = require('../../config/config.js');

/* @function : addRate
 *  @method  : POST
 *  @purpose  : This function used for add daily rate data in DB
 */
exports.addRate = function(req, res) {
    query = "INSERT INTO daily_rates (trailer_type,trailer_size,duration,price) VALUES ('" +
        req.body.trailer_type + "'" + ',' + "'" +
        req.body.trailer_size + "'" + ',' + "'" +
        req.body.duration + "'" + ',' + "'" +
        req.body.price +
        "')";
    Connection.query(query, function(err, rate) {
        if (err) {
            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
        } else {
            res.status(200).json({ status: config.CODES.statusOk, message: 'Daily Rate successfully added' });
        }
    });
}

/* @function : loadRate
 *  @method  : GET
 *  @purpose  : This function used get all daily rate data from DB
 */
exports.loadRate = function(req, res) {
    var query = 'SELECT daily_rates.id,daily_rates.price,daily_rates.created, types.name, sizes.label, durations.name As duration, @curRow := @curRow + 1 AS row_number FROM `daily_rates` LEFT JOIN types ON types.id = daily_rates.trailer_type LEFT JOIN sizes on sizes.id = daily_rates.trailer_size LEFT JOIN durations on durations.id = daily_rates.duration JOIN (SELECT @curRow := 0) r';
    Connection.query(query, function(err, rate) {
        if (err) {
            res.status(500).json({ 'error': err });
        } else {
            res.status(200).json({ message: 'Success', data: rate, error: {} });
        }
    })
}

/* @function : getRateDetail
 *  @method  : POST
 *  @purpose  : This function used get daily rate data as per id
 */
exports.getRateDetail = function(req, res) {
    Connection.query('SELECT * from daily_rates where id="' + req.body.id + '"', function(err, rate) {
        if (err) {
            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
        } else if (rate.length < 1) {
            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: 'Id does not exist' } });
        } else {
            res.status(200).json({ status: config.CODES.statusOk, data: rate[0] });
        }
    })
}

/* @function : deleteRate
 *  @method  : POST
 *  @purpose  : This function used delete daily rate data as per id
 */
exports.deleteRate = function(req, res) {
    Connection.query('DELETE FROM daily_rates WHERE id="' + req.body.id + '"', function(err, trailer) {
        if (err) {
            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
        } else {
            res.status(200).json({ status: config.CODES.statusOk, data: 'Data is successfully deleted' });
        }
    })
}

/* @function : updateRate
 *  @method  : POST
 *  @purpose  : This function used update daily rate data as per id
 */
exports.updateRate = function(req, res) {
    var query = "UPDATE daily_rates SET price = '" +
        req.body.price +
        "',trailer_type='" + req.body.trailer_type +
        "',trailer_size= '" + req.body.trailer_size +
        "',duration= '" + req.body.duration +
        "', modified= '" + req.body.modified +
        "' WHERE id= '" + req.body.id + "'";
    Connection.query(query, function(err, rate) {
        if (err) {
            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
        } else if (rate.affectedRows == 0) {
            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: 'Data id does not exists' } });
        } else {
            res.status(200).json({ status: config.CODES.statusOk, data: 'Data successfully updated' });
        }
    })
}

/* @function : calculateDailyRate
 *  @method  : POST
 *  @purpose  : This function used calculate Daily Rate as per type, size and duration data
 */
exports.calculateDailyRate = function(req, res) {
    var query = 'SELECT price from daily_rates where trailer_type="' + req.body.type + '" AND trailer_size="' + req.body.size + '" AND duration="' + req.body.duration + '"'
    Connection.query(query, function(err, price) {
        if (err) {
            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
        } else {
            if (price && price.length) {
                res.status(200).json({ status: config.CODES.statusOk, data: price });
            } else {
                res.status(200).json({ status: config.CODES.statusOk, data: 0 });
            }
        }
    })
}

/* @function : checkExists
 *  @method  : POST
 *  @purpose  : This function used check Rate for the selected trailer type/size/duration is already exists or not
 */
exports.checkExists = function(req, res) {
    var query = 'SELECT price from daily_rates where trailer_type="' + req.body.type + '" AND trailer_size="' + req.body.size + '" AND duration="' + req.body.duration + '"'
    Connection.query(query, function(err, price) {
        console.log(price);
        if (err) {
            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
        } else {
            res.status(200).json({ status: config.CODES.statusOk, data: price });
        }
    })
}
