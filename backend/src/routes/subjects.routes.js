const express = require('express');
const router = express.Router({ mergeParams: true });
const SubjectsController = require('../controllers/subjects.controller');
const auth = require('../middlewares/auth.middleware');
const ownershipGuard = require('../middlewares/ownership.middleware');
const SubjectsRepo = require('../repositories/subjects.repository');
const attendanceRouter = require('./attendance.routes');

router.use(auth.required);

router.get('/', SubjectsController.list);
router.post('/', SubjectsController.create);

// subject-specific routes
router.get('/:id', ownershipGuard(SubjectsRepo.findById, 'id'), SubjectsController.get);
router.patch('/:id', ownershipGuard(SubjectsRepo.findById, 'id'), SubjectsController.update);
router.delete('/:id', ownershipGuard(SubjectsRepo.findById, 'id'), SubjectsController.remove);

// modules
router.post('/:id/modules', ownershipGuard(SubjectsRepo.findById, 'id'), SubjectsController.addModule);
router.patch('/:subjectId/modules/:moduleId', SubjectsController.updateModule);
router.delete('/:subjectId/modules/:moduleId', SubjectsController.deleteModule);

// topics toggle
router.patch('/:subjectId/topics/:topicId/toggle', SubjectsController.toggleTopic);

// attendance nested
router.use('/:id/attendance', (req, res, next)=>{ req.params.subjectId = req.params.id; next(); }, attendanceRouter);

module.exports = router;
