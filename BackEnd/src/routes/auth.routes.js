//importing all the necessary modules
const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth.middleware");
const { 
    register, 
    login, 
    logout, 
    getMe, 
    forgotPassword, 
    resetPassword,
    updateProfile,
    changePassword,
    updatePreferences
} = require("../controllers/auth.controller");

// Any request starts with /api/something goes to their respective files
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.get("/me", verifyToken, getMe);
router.put("/profile", verifyToken, updateProfile);
router.put("/change-password", verifyToken, changePassword);
router.put("/preferences", verifyToken, updatePreferences);

module.exports = router;