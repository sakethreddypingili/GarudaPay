const express = require("express");
const router = express.Router();
const {
  getOrCreateUser,
  getWalletBalance,
  topUp,
  getWalletSummary,
  transferWallet
} = require("../controllers/wallet.controller");

router.get("/user", getOrCreateUser);
router.get("/balance", getWalletBalance);
router.post("/topup", topUp);
router.post("/transfer", transferWallet);
router.get("/summary", getWalletSummary);

module.exports = router;
