const express = require('express');
const router = express.Router();
const { getDashboardSummary, getRecentActivity } = require('../controllers/dashboardController');
const verifyToken = require('../middleware/auth.middleware');

router.use(verifyToken.optional);

router.get('/summary', getDashboardSummary);
router.get('/activity', getRecentActivity);

module.exports = router;
