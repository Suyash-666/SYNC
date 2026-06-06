const express = require('express');
const router = express.Router();
const StudyController = require('../controllers/studyRooms.controller');
const InviteController = require('../controllers/studyRoomInvites.controller');
const auth = require('../middlewares/auth.middleware');

router.use(auth.required);

// Rooms CRUD
router.get('/', StudyController.list);
router.post('/', StudyController.create);
router.get('/:id', StudyController.get);
router.post('/:id/join', StudyController.join);
router.post('/:id/leave', StudyController.leave);
router.delete('/:id', StudyController.remove);

// Invite management (room creator only — enforced in service layer)
router.post('/:roomId/invites', InviteController.create);
router.get('/:roomId/invites', InviteController.list);
router.delete('/:roomId/invites/:inviteId', InviteController.revoke);

// Invite preview + redeem (auth required, membership not —
// user must be logged in to redeem)
router.get('/invites/:code/preview', InviteController.preview);
router.post('/invites/:code/redeem', InviteController.redeem);

module.exports = router;
