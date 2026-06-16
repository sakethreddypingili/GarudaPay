const express = require('express');
const router = express.Router();
const { topUp } = require("../controllers/wallet.controller");

router.post("/topup", topUp);
const walletController = require('../controllers/wallet.controller');

router.get('/user', walletController.getOrCreateUser);
router.get('/balance', walletController.getWalletBalance);
router.post('/topup', walletController.topupWallet);
router.post('/transfer', walletController.transferWallet);
router.get('/summary', walletController.getWalletSummary);

module.exports = router;