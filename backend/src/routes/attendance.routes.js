const express = require('express');
const router = express.Router({ mergeParams: true });
const AttendanceController = require('../controllers/attendance.controller');
const auth = require('../middlewares/auth.middleware');

router.use(auth.required);

router.get('/', AttendanceController.list);
router.post('/', AttendanceController.create);
router.put('/:date', AttendanceController.update);

module.exports = router;
