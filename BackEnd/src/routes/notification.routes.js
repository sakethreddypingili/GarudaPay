const express = require('express');
const router = express.Router();
const { getNotifications } = require('../controllers/notificationController');
const verifyToken = require('../middleware/auth.middleware');

router.use(verifyToken.optional);

router.get('/', getNotifications);

module.exports = router;
