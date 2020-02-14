const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const SECRET = "BIG SECRET";
const User = require("../models/user");

exports.authenticate = async (req, res) => {
    if (!req.body.username || !req.body.password) return res.status(401).json();
    const uname = req.body.username;
    const pass = req.body.password;
    try {
        let user = await User.findOne({ where: { email: uname } });
        user = user.dataValues;
        if (!user) {
            return res.status(401).json();
        }
        if (!bcrypt.compareSync(pass, user.password)) return res.status(401).json();
        const package = { ...user };
        const token = jwt.sign(package, SECRET, { expiresIn: '24h' });
        return res.status(200).json({ token });
    } catch (error) {
        return res.status(500).json({});
    }
};

exports.authorize = async (req, res, next) => {
    //For signup only
    if (req.url.toLowerCase() === '/users' && req.method.toLowerCase() === "post") {
        return next();
    }
    if (!req.headers.authorization && !req.query.token) {
        return res.status(401).json();
    }
    try {
        let token;
        if (req.headers.authorization) {
            token = req.headers.authorization.replace('Bearer ', '');
        }
        if (!token) {
            token = req.query.token;
        }
        const decoded = jwt.verify(token, SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: `Authorization failed. Ensure you are logged in.` });
    }
};
