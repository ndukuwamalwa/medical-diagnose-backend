const router = require("express").Router();
const users = require("./users");
const diagnosis = require("./diagnosis");
const auth = require("./auth");

router.use(auth.authorize, users, diagnosis);

module.exports = router;