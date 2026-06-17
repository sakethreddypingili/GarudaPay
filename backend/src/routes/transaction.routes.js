const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth.middleware");
const { getHistory, getTransactionById, exportTransactions, sendMoney } = require("../controllers/transaction.controller");

router.use(verifyToken);

router.post("/send-money", sendMoney);
router.get("/history", getHistory);
router.get("/export", exportTransactions);
router.get("/:id", getTransactionById);

module.exports = router;
