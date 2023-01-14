const jwt = require("jsonwebtoken");

/**
 * 
 * @param {IncomingMessage} req 
 * @param {ServerResponse} res 
 * @param {Function} next 
 * @returns
 */
const authenticateToken = (req, res, next) => {
    const cookies = req.cookies;
    const token = ("jwtLogin" in cookies) && cookies["jwtLogin"];

    if (token == null)
        return res.status(401).send({ errorMsg: "You must login to access this page" });

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err)
            return res.status(403).send({ errorMsg: "Invalid login token provided, please relogin" });

        req.user = user;
        next();
    });
};

module.exports = {
    authenticateToken
};