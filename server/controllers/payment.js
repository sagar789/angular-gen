var Connection = require('../../config/database.js');
var config = require('../../config/config.js');
var stripe = require("stripe")(config.STRIPKEY);
var Pin = require('pinjs');
var pin = Pin.setup({
    key: 'fn44jULCMociKBotSetkZQ',
    production: false
});

/* @function : addCards
 *  @method  : POST
 *  @purpose  : This function used for add card on stripe server
 */
exports.addCards = function(req, res) {
    console.log(req.body);
    if (req.body.user_id && req.body.email) {
        var query = 'SELECT id, customer_key from accounts where user_id= "' + req.body.user_id + '"';
        Connection.query(query, function(err, users) {
            if (err) {
                res.status(config.CODES.OK).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
            } else if (users[0] && (users[0].customer_key != 0)) {
                pin.createMultiCards(
                    users[0].customer_key, {
                        number: req.body.number,
                        expiry_month: req.body.month,
                        expiry_year: req.body.year,
                        cvc: req.body.cvc,
                        name: req.body.name,
                        address_line1: req.body.address1,
                        address_city: req.body.city,
                        address_country: req.body.country
                    },
                    function(err, response) {
                        if (response.body.response) {
                            res.status(config.CODES.OK).json({ status: config.CODES.statusOk, message: 'Card added successfully' });
                        } else {
                            res.status(config.CODES.OK).json({ status: config.CODES.statusFail, error: { error_message: response.body.messages } });
                        }
                    }
                )
            } else {
                pin.createCustomer({
                    email: req.body.email,
                    card: {
                        number: req.body.number,
                        expiry_month: req.body.month,
                        expiry_year: req.body.year,
                        cvc: req.body.cvc,
                        name: req.body.name,
                        address_line1: req.body.address1,
                        address_city: req.body.city,
                        address_country: req.body.country
                    }
                }, function(response) {
                    if (response.body.response) {
                        var customer = response.body.response;
                        var query = "UPDATE accounts SET customer_key = '" + customer.token + "' WHERE user_id= '" + req.body.user_id + "'";
                        Connection.query(query, function(err, trailer) {
                            if (err) {
                                console.log(err)
                                res.status(config.CODES.OK).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
                            } else {
                                res.status(config.CODES.OK).json({ status: config.CODES.statusOk, message: 'Card added successfully' });
                            }
                        });
                    } else {
                        res.status(config.CODES.OK).json({ status: config.CODES.statusFail, error: { error_message: response.body.messages } });
                    }
                })
            }
        });
    } else {
        res.status(config.CODES.OK).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.InvalidParameter } });
    }
}

/* @function : retriveCards
 *  @method  : GET
 *  @purpose  : This function used get all save cards on stripr server as per customer id
 */
exports.retriveCardsForCustomer = function(req, res) {
    if (req.body.user_id) {
        var query = 'SELECT id, customer_key from accounts where user_id = "' + req.body.user_id + '"';
        Connection.query(query, function(err, users) {
            if (err) {
                res.status(config.CODES.OK).json({ 'error': err });
            } else if (users[0] && users[0].customer_key) {
                pin.retrieveCards(users[0].customer_key, function(err, response) {
                    if (err) {
                        res.status(config.CODES.OK).json({ status: config.CODES.statusFail, error: { error_message: err } });
                    } else if (response.body.response) {
                        res.status(config.CODES.OK).json({ status: config.CODES.statusOk, data: response.body.response });
                    } else {
                        res.status(config.CODES.OK).json({ status: config.CODES.statusOk, data: '' });
                    }
                });
            } else {
                res.status(config.CODES.OK).json({ status: config.CODES.statusOk, data: users });
            }
        });
    } else {
        res.status(config.CODES.OK).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.InvalidParameter } });
    }
}

/* @function : setDefaultCard
 *  @method  : GET
 *  @purpose  : This function used for set customer default card
 */
exports.setDefaultCard = function(req, res) {
    if (req.body.user_id && req.body.card_token && req.body.email) {
        var query = 'SELECT id, customer_key from accounts where user_id = "' + req.body.user_id + '"';
        Connection.query(query, function(err, users) {
            if (err) {
                res.status(config.CODES.OK).json({ 'error': err });
            } else if (users[0] && users[0].customer_key) {
                pin.setDefaultcard(
                    users[0].customer_key, { email: req.body.email, primary_card_token: req.body.card_token },
                    function(err, response) {
                        if (err) {
                            res.status(config.CODES.OK).json({ status: config.CODES.statusFail, error: { error_message: err } });
                        } else {
                            res.status(config.CODES.OK).json({ status: config.CODES.statusOk, message: config.MESSAGES.DefaultCardUpdated });
                        }
                    }
                )
            } else {
                res.status(config.CODES.OK).json({ status: config.CODES.statusOk, data: users });
            }
        });
    } else {
        res.status(config.CODES.OK).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.InvalidParameter } });
    }
}

/* @function : createAccount
 *  @method  : POST
 *  @purpose  : This function used to create account as per user id
 */
exports.createAccount = function(req, res) {
    if (req.body.user_id) {
        query = "INSERT INTO accounts (user_id) VALUES ('" + req.body.user_id + "')";
        Connection.query(query, function(err, account) {
            if (err) {
                res.status(config.CODES.OK).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
            } else {
                res.status(config.CODES.OK).json({ status: config.CODES.statusOk, message: 'OK' });
            }
        });
    } else {
        res.status(config.CODES.OK).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.InvalidParameter } });
    }
}

/* @function : addBankAccount
 *  @method  : GET
 *  @purpose  : This function used add bank account as per user id and bank token
 */
exports.addBankAccount = function(req, res) {
    if (req.body.user_id && req.body.email) {
        pin.createRecipient({
                email: req.body.email,
                bank_account: {
                    "name": req.body.account_name,
                    "bsb": req.body.bsb,
                    "number": req.body.account_number
                }
            },
            function(response) {
                if (response.body.response) {
                    var customer = response.body.response;
                    var query = "UPDATE accounts SET recipient = '" + customer.token + "' WHERE user_id= '" + req.body.user_id + "'";
                    Connection.query(query, function(err, trailer) {
                        if (err) {
                            res.status(config.CODES.OK).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
                        } else {
                            res.status(config.CODES.OK).json({ status: config.CODES.statusOk, message: 'Bank account added successfully' });
                        }
                    });
                } else {
                    res.status(config.CODES.OK).json({ status: config.CODES.statusFail, error: { error_message: response.body.error_description } });
                }
            }
        );
    } else {
        res.status(config.CODES.OK).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.InvalidParameter } });
    }
}

/* @function : updateBankAccount
 *  @method  : GET
 *  @purpose  : This function used update bank account as per user id and bank token
 */
exports.updateBankAccount = function(req, res) {
    if (req.body.email && req.body.token) {
        pin.updateRecipient(req.body.token, {
                email: req.body.email,
                bank_account: {
                    "name": req.body.account_name,
                    "bsb": req.body.bsb,
                    "number": req.body.account_number
                }
            },
            function(response) {
                console.log(response.body);
                if (response.body.response) {
                    res.status(config.CODES.OK).json({ status: config.CODES.statusOk, message: 'Bank account update successfully' });
                } else {
                    res.status(config.CODES.OK).json({ status: config.CODES.statusFail, error: { error_message: response.body.error_description } });
                }
            }
        );
    } else {
        res.status(config.CODES.OK).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.InvalidParameter } });
    }
}

/* @function : retriveBankAccounts
 *  @method  : POST
 *  @purpose  : This function used get all bank account data on stripr server as per customer id
 */
exports.retriveBankAccounts = function(req, res) {
    if (req.body.user_id) {
        var query = 'SELECT id, recipient from accounts where user_id = "' + req.body.user_id + '"';
        Connection.query(query, function(err, users) {
            if (err) {
                res.status(config.CODES.OK).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
            } else if (users[0] && users[0].recipient == 0) {
                res.status(config.CODES.OK).json({ status: config.CODES.statusFail, error: { error_message: "Bank detail is not added" } });
            } else {
                pin.retriveRecipient(users[0].recipient, function(response) {
                    if (response.body.response) {
                        res.status(config.CODES.OK).json({ status: config.CODES.statusOk, data: response.body.response, message: 'OK' });
                    } else {
                        res.status(config.CODES.OK).json({ status: config.CODES.statusFail, error: { error_message: response.body.error_description } });
                    }
                });
            }
        });
    } else {
        res.status(config.CODES.OK).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.InvalidParameter } });
    }
}

/* @function : loadPaymentList
 *  @method  : GET
 *  @purpose  : This function used get all payment
 */
exports.loadPaymentList = function(req, res) {
    var query = 'SELECT transactions.renter_id,transactions.refunded_id,transactions.owner_id, transactions.booking_id, transactions.transfer_id,transactions.status, transactions.created, transactions.amount, transactions.application_fee, transactions.response, CONCAT(usr2.first_name, " ", usr2.last_name) AS owner, CONCAT(usr1.first_name, " ", usr1.last_name) AS renter, @curRow := @curRow + 1 AS row_number FROM `transactions`  LEFT JOIN users AS usr1 on usr1.id = transactions.renter_id LEFT JOIN users AS usr2 on usr2.id = transactions.owner_id JOIN (SELECT @curRow := 0) r ORDER BY transactions.created DESC';
    Connection.query(query, function(err, txn) {
        if (err) {
            res.status(500).json({ 'error': err });
        } else {
            res.status(config.CODES.OK).json({ message: 'Success', data: txn });
        }
    })
}

/* @function : loadChargeList
 *  @method  : GET
 *  @purpose  : This function used get all charged/captured list
 */
exports.loadChargeList = function(req, res) {
    var query = 'SELECT mc.id,mc.charge_key,mc.description,mc.status,mc.renter_id,mc.transfer_balance,mc.owner_id, mc.booking_id, mc.created, mc.amount, CONCAT(usr2.first_name, " ", usr2.last_name) AS owner, CONCAT(usr1.first_name, " ", usr1.last_name) AS renter, @curRow := @curRow + 1 AS row_number FROM `manage_charges` AS mc LEFT JOIN users AS usr1 on usr1.id = mc.renter_id LEFT JOIN users AS usr2 on usr2.id = mc.owner_id JOIN (SELECT @curRow := 0) r ORDER BY mc.created DESC';
    Connection.query(query, function(err, charge) {
        if (err) {
            res.status(500).json({ 'error': err });
        } else {
            res.status(config.CODES.OK).json({ message: 'Success', data: charge });
        }
    })
}

/* @function : loadCalcelTxnList
 *  @method  : GET
 *  @purpose  : This function used get all charged/captured list
 */
exports.loadCalcelTxnList = function(req, res) {
    var query = 'SELECT bcl.id,bcl.description,bcl.booking_id,bcl.created,bcl.amount,bcl.total_amount,bcl.manage_charge_id,bcl.user_id, CONCAT(usr1.first_name, " ", usr1.last_name) AS username, @curRow := @curRow + 1 AS row_number FROM booking_cancel_log AS bcl LEFT JOIN users AS usr1 on usr1.id = bcl.user_id JOIN (SELECT @curRow := 0) r ORDER BY bcl.created DESC';
    Connection.query(query, function(err, cancelTxn) {
        if (err) {
            res.status(500).json({ 'error': err });
        } else {
            res.status(config.CODES.OK).json({ message: 'Success', data: cancelTxn });
        }
    })
}

/* @function : refundPayment
 *  @method  : POST
 *  @purpose  : This function used to refund amount to user as per chargeID
 */
function refundPayment(amount, chargeId, callback) {
    pin.refundCharge(chargeId, {
        amount: amount
    }, function(response) {
        if (response.body.response) {
            return callback({ status: config.CODES.statusOk, data: response.body.response })
        } else {
            return callback({ status: config.CODES.statusFail, data: response.body.error_description })
        }
    });
}
exports.refundPayment = refundPayment;

/* @function : refundPayment
 *  @method  : POST
 *  @purpose  : This function used to refund amount to user as per chargeID
 */
function refundAllPayment(chargeId, callback) {
    pin.refundCharge(chargeId, function(response) {
        if (response.body.response) {
            return callback({ status: config.CODES.statusOk, data: response.body.response })
        } else {
            return callback({ status: config.CODES.statusFail, data: response.body.error_description })
        }
    });

}
exports.refundAllPayment = refundAllPayment;

/* @function : chargeMoney
 *  @method  : POST
 *  @purpose  : This function used get all bank account data on stripr server as per customer id
 */
function transferMoney(amount, recipientKey, discription, callback) {
    pin.transferMoney({
        amount: amount,
        currency: "AUD",
        description: discription,
        recipient: recipientKey // account key - where money to be send (owner id)
    }, function(response) {
        if (response.body.response) {
            return callback({ status: config.CODES.statusOk, data: response.body.response })
        } else {
            return callback({ status: config.CODES.statusFail, data: response.body.error_description })
        }
    });
}
exports.transferMoney = transferMoney;

/* @function : createCharge
 *  @method  : POST
 *  @purpose  : This function used create charge id and add save captured amount on stripe server
 */
function createCharge(email, discription, amount, customerKey, callback) {
    var ip = require('ip');
    pin.createCharge({
        email: email,
        amount: amount,
        ip_address: ip.address(),
        currency: "AUD",
        customer_token: customerKey, // customer key- from (Renter id)
        description: discription,
        capture: false
    }, function(response) {
        if (response.body.response) {
            return callback({ status: config.CODES.statusOk, data: response.body.response })
        } else {
            return callback({ status: config.CODES.statusFail, data: response.body.error_description })
        }
    });
}
exports.createCharge = createCharge;

/* @function : captureCharge
 *  @method  : POST
 *  @purpose  : This function used add captured amount at stripe server
 */
function captureCharge(chargeId, callback) {
    pin.captureCharge(chargeId, function(response) {
        if (response.body.response) {
            return callback({ status: config.CODES.statusOk, data: response.body.response })
        } else {
            return callback({ status: config.CODES.statusFail, data: response.body.error_description })
        }
    });
}
exports.captureCharge = captureCharge;

/* @function : deleteCard
 *  @method  : POST
 *  @purpose  : This function used delete card from pin payment
 */
exports.deleteCard = function(req, res) {
   // console.log(req.body);
    if (req.body.cus_token && req.body.card_token) {
        pin.deleteCard(req.body.cus_token, req.body.card_token, function(response) {
            console.log(response.body);
            if ((response.body.error == 'cannot_delete_primary_card') || (response.body.error == 'not_found') || (response.body.error == 'resource_not_found')) {
                res.status(200).json({ status: config.CODES.statusFail, error: { error_message: response.body.error_description } });
            } else {
                res.status(200).json({ status: config.CODES.statusOk, message: 'Card deleted successfully' });
            }
        });
    } else {
        res.status(200).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.InvalidParameter } });
    }

}
