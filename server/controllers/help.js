var Connection = require('../../config/database.js');
var config = require('../../config/config.js');
var mails = require('../controllers/send_mail.js'); // included controller for sending mails

/*
 * @funcion: loadCategory : used for get all blog category list
 */
exports.loadParentCategory = function(req, res) {
    Connection.query('SELECT * from parent_categories ORDER BY id DESC', function(err, category) {
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
 * @funcion: updateBlog : used for update blog without file by id
 */
exports.addParentCategory = function(req, res) {
    var data = { title: req.body.title };
    Connection.query('INSERT INTO parent_categories SET ?', data, function(err, category) {
        if (err) {
            res.status(200).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
        } else {
            res.status(200).json({ status: config.CODES.statusOk, message: "Category Added Successfully" });
        }
    })
}

/*
 * @funcion: updateBlog : used for update blog without file by id
 */
exports.deleteParentCategory = function(req, res) {
    var userId = req.body.id;
    Connection.query('DELETE FROM parent_categories WHERE id= ?', [userId], function(err, category, fields) {
        if (err) {
            res.status(200).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
        } else {
            res.status(200).json({ status: config.CODES.statusOk, message: 'Category Successfully Deleted' });
        }
    })
}

/*
 * @funcion: getCategoryDetail : used for get category details by id
 */
exports.editParentCategory = function(req, res) {
    Connection.query('SELECT * from parent_categories where id = ?', [req.body.id], function(err, category) {
        if (err) {
            res.status(200).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
        } else {
            res.status(200).json({
                status: config.CODES.statusOk,
                message: 'Success',
                data: category[0]
            });
        }
    })
}

/*
 * @funcion: updateBlog : used for update blog without file by id
 */
exports.updateParentCategory = function(req, res) {
    Connection.query("UPDATE parent_categories SET title= ? WHERE id= ?", [req.body.title, req.body.id], function(err, category) {
        if (err) {
            res.status(200).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
        } else {
            res.status(200).json({
                status: config.CODES.statusOk,
                message: 'Successfully Updated',
                error: {}
            });
        }
    })
}

/*
 * @funcion: duplicateCategory : check duplicate category name
 */
exports.duplicateCategory = function(req, res) {
    Connection.query('SELECT * FROM parent_categories WHERE title= ?', [req.body.title], function(err, category, fields) {
        if (err) {
            res.status(200).json({
                status: 0,
                error: {
                    error_message: config.MESSAGES.DBErr
                }
            });
        } else if ((category.length > 0) && (category[0].title === req.body.title)) {
            res.status(200).json({
                status: 0,
                error: {
                    error_message: "category is already registered."
                }
            });
        } else {
            res.status(200).json({
                status: 1
            });
        }
    });
}


/*
 * @funcion: loadCategory : used for get all blog category list
 */
exports.loadCategory = function(req, res) {
    Connection.query('SELECT cat.*, pc.title as pc_title from categories as cat left join parent_categories as pc on pc.id = cat.parent_category_id ORDER BY id DESC', function(err, category) {
        if (err) {
            res.status(200).json({ status: 0, error: { error_message: config.MESSAGES.DBErr } });
        } else {
            res.status(200).json({
                status: 1,
                data: category
            });
        }
    })
}

/*
 * @funcion: updateBlog : used for update blog without file by id
 */
exports.addCategory = function(req, res) {
    var data = { parent_category_id: req.body.cat_id, title: req.body.title };
    var query = Connection.query('INSERT INTO categories SET ?', data, function(err, category) {
        if (err) {
            res.status(200).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
        } else {
            res.status(200).json({ status: config.CODES.statusOk, message: "Category Added Successfully" });
        }
    });
}

/*
 * @funcion: updateBlog : used for update blog without file by id
 */
exports.deleteCategory = function(req, res) {
    var userId = req.body.id;
    Connection.query('DELETE FROM categories WHERE id= ?', [userId], function(err, category, fields) {
        if (err) {
            res.status(200).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
        } else {
            res.status(200).json({ status: config.CODES.statusOk, message: 'Category Successfully Deleted' });
        }
    })
}

/*
 * @funcion: getCategoryDetail : used for get category details by id
 */
exports.editCategory = function(req, res) {
    Connection.query('SELECT * from categories where id = ?', [req.body.id], function(err, category) {
        if (err) {
            res.status(200).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
        } else {
            res.status(200).json({
                status: config.CODES.statusOk,
                message: 'Success',
                data: category[0]
            });
        }
    })
}

/*
 * @funcion: updateBlog : used for update blog without file by id
 */
exports.updateCategory = function(req, res) {
    Connection.query("UPDATE categories SET parent_category_id= ?, title= ?  WHERE id= ?", [req.body.cat_id, req.body.title, req.body.id], function(err, category) {
        if (err) {
            res.status(200).json({ status: config.CODES.statusFail, error: { error_message: config.MESSAGES.DBErr } });
        } else {
            res.status(200).json({
                status: config.CODES.statusOk,
                message: 'Successfully Updated',
                error: {}
            });
        }
    })
}
