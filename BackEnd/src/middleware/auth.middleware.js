const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
    try {
        // reads token from cookies or authorization header
        let token = req.cookies.token;

        if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        }

        // if there is no token, it rejects the request
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access denied, Please log in."
            });
        }

        // if the toke is there then we will verify it, whether it is valid and not expired
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "garudapay_secret_key_123")

        // if everything is good then the decoded object will be attached to user
        req.user = decoded;

        next(); // calling next() to pass the control to the controller

    } catch (e) {
        // if the jwt.verify() fails then it will give error which will be catched here
        return res.status(401).json({
            success: false,
            message: "Session expired or invalid. Please log in again."
        });
    }
}

const optionalVerifyToken = (req, res, next) => {
    try {
        let token = req.cookies.token;
        if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        }
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || "garudapay_secret_key_123");
            req.user = decoded;
        }
        next();
    } catch (e) {
        next();
    }
}

verifyToken.optional = optionalVerifyToken;

module.exports = verifyToken;
