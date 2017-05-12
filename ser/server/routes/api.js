const express = require('express');
const router = express.Router();
const Posts = require('../../schema/posts');
const Users = require('../../schema/users');


/* GET api listing. */
router.get('/get_posts', (req, res) => {
    Posts.find({}, null, { sort: { _id: -1 } }, function(err, result) {
        if (err) {
            console.log(err);
        } else {
            res.json({ "status": 1, data: result })
        }
    });
});

router.post('/add_posts', (req, res) => {
    console.log(req.body);
    var AddData = new Posts(req.body);
    AddData.save(req.body, function(err, result) {
        if (err) {
            console.log(err);
        } else {
            res.json({ "status": 1, data: result })
        }
    });
});

router.post('/get_posts_by_id', (req, res) => {
    console.log("id----", req.body.Id)
    Posts.findById(req.body.Id, function(err, result) {
        if (err) {
            console.log(err);
        } else {
            console.log(result)
            res.json({ "status": 1, data: result })
        }
    });
});

router.post('/update_post', (req, res) => {
    console.log("update_post----", req.body.Id)
    Posts.findByIdAndUpdate(req.body.Id, req.body.data, function(err, user) {
        if (err) {
            console.log("err", err);
        } else {
            console.log("user", user)
            res.json({ "status": 1, data: user })
        }
    });
});

router.post('/delete_post', (req, res) => {
    console.log("id----", req.body.Id)
    Posts.findByIdAndRemove(req.body.Id, function(err, result) {
        if (err) {
            console.log(err);
        } else {
            console.log(result)
            res.json({ "status": 1, data: result })
        }
    });
});

router.post('/user_register', (req, res) => {
    var userData = new Users(req.body);
    userData.save(req.body, function(err, result) {
        if (err) {
            console.log(err);
        } else {
            res.json({ "status": 1, data: result })
        }
    });
});

router.post('/user_login', (req, res) => {
    Users.find({ $and:[{email: req.body.email}, {password: req.body.pass }]}, function(err, result) {
        console.log("result", result)
        if (err) {
            res.json({ "status": 0, data: "DB error" })
        } else if(result && result.length > 0){
            res.json({ "status": 1, data:result[0], message: "successfully login" })
        } else{
            res.json({ "status": 0, message: "User not found" })
        }
    });
});


module.exports = router;
