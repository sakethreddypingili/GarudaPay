const express = require("express");
const router = express.Router();
const {topUp} = require("../controllers/wallet.controller");


router.post("/topup", topUp);

module.exports = router;