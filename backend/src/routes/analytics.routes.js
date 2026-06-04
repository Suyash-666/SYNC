const express = require('express');
const router = express.Router();
const AnalyticsController = require('../controllers/analytics.controller');
const auth = require('../middlewares/auth.middleware');

router.use(auth.required);

router.get('/overview', AnalyticsController.overview);
router.get('/attendance', AnalyticsController.attendance);
router.get('/assignments', AnalyticsController.assignments);
router.get('/study-hours', AnalyticsController.studyHours);
router.get('/productivity', AnalyticsController.productivity);
router.get('/subjects', AnalyticsController.subjects);

module.exports = router;
