//importing all the necessary modules
const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth.middleware");
const { getHistory, getTransactionById, exportTransactions } = require("../controllers/transaction.controller");

// this will add verifyToken to every routes implicitly
router.use(verifyToken);

router.get("/history", getHistory);
router.get("/export", exportTransactions);
router.get("/:id", getTransactionById);

/*
here above, routes for getHistory, exportTransactionand getTransactionId is just a place holder
It is supposed to be completed in module 6. Which is mot handled by me (Karan).
*/

module.exports = router;