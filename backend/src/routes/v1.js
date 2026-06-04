const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const authRouter = require('./auth.routes');
const usersRouter = require('./users.routes');
const semestersRouter = require('./semesters.routes');
const subjectsNestedRouter = require('./subjects.routes');
const SubjectsController = require('../controllers/subjects.controller');
const auth = require('../middlewares/auth.middleware');
const assignmentsRouter = require('./assignments.routes');
const notesRouter = require('./notes.routes');
const resourcesRouter = require('./resources.routes');
const analyticsRouter = require('./analytics.routes');
const aiRouter = require('./ai.routes');

router.get('/health', (req, res) => res.json({ status: 'ok' }));
router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/semesters', semestersRouter);
router.use('/semesters/:semesterId/subjects', subjectsNestedRouter);
router.use('/assignments', assignmentsRouter);
router.use('/notes', notesRouter);
router.use('/resources', resourcesRouter);
router.use('/analytics', analyticsRouter);
router.use('/ai', aiRouter);
const studyRoomsRouter = require('./studyRooms.routes');
const notificationsRouter = require('./notifications.routes');

router.use('/study-rooms', studyRoomsRouter);
router.use('/notifications', notificationsRouter);
const placementRouter = require('./placement.routes');

router.use('/placement', placementRouter);

// Standalone subject endpoints (by id)
router.get('/subjects/:id', auth.required, SubjectsController.get);
router.patch('/subjects/:id', auth.required, SubjectsController.update);
router.delete('/subjects/:id', auth.required, SubjectsController.remove);

router.get('/', (req, res) => {
  return res.json({ message: 'Sync API v1' });
});

module.exports = router;
