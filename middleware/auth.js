const jwt = require('jsonwebtoken');

const User = require('../models/user');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });
        if (!user) {
            throw new Error('Kindly login again');
        }
        req.user = user;
        req.token = token;
        next();
    } catch (err) {
        res.status(401).send('User not authenticated');
    }
};

module.exports = auth;