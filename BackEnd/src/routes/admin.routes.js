const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth.middleware");
const verifyAdmin = require("../middleware/admin.middleware");
const {
    getPlatformStats,
    getAllUsers,
    updateUserBalance
} = require("../controllers/admin.controller");

// Apply authentication and admin verification middleware to all admin routes
router.use(verifyToken, verifyAdmin);

router.get("/stats", getPlatformStats);
router.get("/users", getAllUsers);
router.put("/users/:id/balance", updateUserBalance);

module.exports = router;
