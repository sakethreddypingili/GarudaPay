const express = require('express');
const router = express.Router();
const walletController = require('../controllers/wallet.controller');
const verifyToken = require("../middleware/auth.middleware");

router.use(verifyToken.optional);

router.get('/user', walletController.getOrCreateUser);
router.get('/balance', walletController.getWalletBalance);
router.post('/topup', walletController.topupWallet);
router.post('/transfer', walletController.transferWallet);
router.get('/summary', walletController.getWalletSummary);

module.exports = router;