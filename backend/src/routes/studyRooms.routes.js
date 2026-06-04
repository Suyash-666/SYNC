const express = require('express');
const router = express.Router();
const StudyController = require('../controllers/studyRooms.controller');
const auth = require('../middlewares/auth.middleware');

router.use(auth.required);

router.get('/', StudyController.list);
router.post('/', StudyController.create);
router.get('/:id', StudyController.get);
router.post('/:id/join', StudyController.join);
router.post('/:id/leave', StudyController.leave);
router.delete('/:id', StudyController.remove);

module.exports = router;
