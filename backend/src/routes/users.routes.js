const express = require('express');
const router = express.Router();
const UsersController = require('../controllers/users.controller');
const auth = require('../middlewares/auth.middleware');
const OnboardingController = require('../controllers/onboarding.controller');
const AttendanceController = require('../controllers/attendance.controller');

router.get('/profile', auth.required, UsersController.getProfile);
router.patch('/profile', auth.required, UsersController.updateProfile);
router.delete('/account', auth.required, UsersController.deleteAccount);
router.post('/onboarding', auth.required, OnboardingController.onboard);
router.get('/attendance/summary', auth.required, AttendanceController.summary);

module.exports = router;
