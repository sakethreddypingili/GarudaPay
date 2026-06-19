const User = require("../models/user.model");

const verifyAdmin = async (req, res, next) => {
    try {
        // req.userId should be populated by verifyToken middleware before this runs
        if (!req.userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please log in first."
            });
        }

        const user = await User.findById(req.userId);
        if (!user || user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Forbidden. Admin privileges required."
            });
        }

        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = verifyAdmin;
