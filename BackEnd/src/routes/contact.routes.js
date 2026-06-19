const express = require('express');
const router = express.Router();
const { submitContactForm } = require('../controllers/contactController');

router.post('/', submitContactForm);

router.get('/config', (req, res) => {
    res.json({
        appName: "GarudaPay",
        supportEmail: "support@garudapay.com",
        supportPhone: "+91 98765 43210",
        features: [
            "Instant Wallet-to-Wallet Money Transfer",
            "UPI & Debit Card Top-ups",
            "Comprehensive Transaction History with CSV Statement Export",
            "Real-time Notification Alerts & Payment Updates",
            "Sleek Dark Mode & Profile Customization"
        ]
    });
});

module.exports = router;
