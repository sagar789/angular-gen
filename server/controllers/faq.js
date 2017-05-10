var Connection = require('../../config/database.js');
var config = require('../../config/config.js');


/*
 * @funcion: addFaq : used for add Faq
 */
exports.addFaq = function(req, res) {
    query = 'INSERT INTO faqs (question,answer,faq_category_id) VALUES ("'+req.body.question+'","'+req.body.answer+'","'+req.body.faq_category+'")';
    Connection.query(query, function(err, faq) {
        if (err) {
            res.status(500).json({
                status: config.CODES.statusFail,
                error: {
                    error_message: config.MESSAGES.DBErr
                }
            });
        } else {
            res.status(200).json({
                status: config.CODES.statusOk,
                message: 'Faq successfully added'
            });
        }
    });
}

/*
 * @funcion: loadFaqs : used for get all Faq list
 */
exports.loadFaqs = function(req, res) {
    Connection.query('SELECT faqs.*, fc.category_name, @curRow := @curRow + 1 AS row_number FROM `faqs` LEFT JOIN faq_categories AS fc on fc.faq_id = faqs.faq_category_id JOIN (SELECT @curRow := 0) r ORDER BY faqs.id DESC', function(err, faq) {
        if (err) {
            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
        } else {
            res.status(200).json({
                message: 'Success',
                data: faq,
                error: {}
            });
        }
    })
}

/*
 * @funcion: getFaqDetail : used for get faq details by id
 */
exports.getFaqDetail = function(req, res) {
        Connection.query('SELECT * FROM `faqs` WHERE id="' + req.body.id + '"', function(err, faq) {
            if (err) {
                res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
            } else {
                res.status(200).json({
                    message: 'Success',
                    data: faq[0],
                    error: {}
                });
            }
        })
    }
    /*
     * @funcion: deleteFaq : used for delete blog by id
     */
exports.deleteFaq = function(req, res) {
    Connection.query('DELETE FROM faqs WHERE id="' + req.body.id + '"', function(err, blog) {
        if (err) {
            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
        } else {
            res.status(200).json({
                message: 'Success',
                error: {}
            });
        }
    })

}

/*
 * @funcion: updateFaq : used for update faq by id
 */
exports.updateFaq = function(req, res) {
    var query = 'UPDATE faqs SET question= "' + req.body.question +
        '", status= "' + req.body.status +
        '", answer= "' + req.body.answer +
        '", faq_category_id= "' + req.body.faq_category +
        '", modified= "' + req.body.modified +
        '" WHERE id= "' + req.body.id + '"';
        console.log(query);
    Connection.query(query, function(err, user) {
        if (err) {
           res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
        } else {
            res.status(200).json({
                message: 'Success',
                data: user[0],
                error: {}
            });
        }
    })

}

/*
 * @funcion: getFaqCategory : used for get all blog category list
 */
exports.getFaqCategory = function(req, res) {
    Connection.query('SELECT * FROM faq_categories where status = 1 ORDER BY faq_id DESC', function(err, faq_category) {
        if (err) {
            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
        } else {
            res.status(200).json({
                message: 'Success',
                data: faq_category,
                error: {}
            });
        }
    })
}

/*
 * @funcion: loadCategory : used for get all blog category list
 */
exports.loadCategory = function(req, res) {
    //console.log('SELECT * from blog_category ORDER BY category_id DESC');
    Connection.query('SELECT * from faq_categories ORDER BY faq_id DESC', function(err, category) {
        if (err) {
            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
        } else {
            res.status(200).json({
                message: 'Success',
                data: category,
                error: {}
            });
        }
    })
}

/*
 * @funcion: getCategoryDetail : used for get category details by id
 */
exports.getCategoryDetail = function(req, res) {
    Connection.query('SELECT * from faq_categories where faq_id = "' + req.body.id + '"', function(err, category) {
        if (err) {
            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
        } else {
            res.status(200).json({
                message: 'Success',
                data: category[0],
                error: {}
            });
        }
    })
}


/*
 * @funcion: updateBlog : used for update blog without file by id
 */
exports.updateCategory = function(req, res) {
    var query = "UPDATE faq_categories SET category_name= '" + req.body.category_name +
        "', status= '" + req.body.status_id +
        "' WHERE faq_id='" + req.body.id + "'";
    Connection.query(query, function(err, category) {
        if (err) {
            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
        } else {
            res.status(200).json({
                message: 'Success',
                data: category[0],
                error: {}
            });
        }
    })

}


/*
 * @funcion: updateBlog : used for update blog without file by id
 */
exports.addCategory = function(req, res) {
    query = "INSERT INTO faq_categories (category_name) VALUES ('" +
        req.body.category_name +
        "')";
    Connection.query(query, function(err, category) {
        if (err) {
            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
        } else {
            res.status(200).json({
                message: 'Success',
                data: category[0],
                error: {}
            });
        }
    })

}

/*
 * @funcion: deleteCategory : used for delete blog category by id
 */
exports.deleteCategory = function(req, res) {
    Connection.query('DELETE FROM faq_categories WHERE faq_id="' + req.body.id + '"', function(err, category) {
        if (err) {
            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
        } else {
            res.status(200).json({
                message: 'Success',
                data: category[0],
                error: {}
            });
        }
    })

}


/*
 * @funcion: duplicateCategory : check duplicate category name
 */
exports.duplicateCategory = function(req, res) {
    Connection.query('SELECT * FROM faq_categories WHERE category_name="' + req.body.category_name + '"', function(err, category, fields) {
        if (err) {
            res.status(500).json({
                status: 0,
                error: {
                    error_message: config.MESSAGES.DBErr
                }
            });
        } else if ((category.length > 0) && (category[0].category_name === req.body.category_name)) {
            res.status(200).json({
                status: 1,
                message: 'category is already registered.'
            });
        } else {
            res.status(200).json({
                status: 2
            });
        }
    });
}

/*
 * @funcion: faqDetailById : used for get faq list by category
 */
exports.faqDetailById = function(req, res) {
    Connection.query('SELECT id, question, answer FROM `faqs` WHERE faq_category_id ="' + req.body.cat_id + '" AND status = 1', function(err, faq) {
        if (err) {
            res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
        } else {
            res.status(200).json({
                message: 'Success',
                data: faq
            });
        }
    })
}

/* @function : searchHelpByKey
 *  @method  : POST
 *  @purpose  : This function used for search keyword in question
 */
exports.searchHelpByKey = function(req, res) {
    if (req.body.key) {
        var query = 'SELECT * FROM `faqs` WHERE status = 1 AND (question LIKE "%'+req.body.key+'%" OR answer LIKE "%'+req.body.key+'%")';
        Connection.query(query, function(err, faq) {
            if (err) {
                res.status(500).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
            } else {
                res.status(200).json({ status: config.CODES.statusOk, data: faq });
            }
        })
    } else {
        res.status(500).json({ status: config.CODES.statusFail, error: { error_message: "Invalid keyword" } });
    }
}
