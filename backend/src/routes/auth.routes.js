const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth.middleware");
const { register, login, logout, getMe, forgotPassword, resetPassword } = require("../controllers/auth.controller");

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get("/me", verifyToken, getMe);

module.exports = router;
