const express = require('express');
const router = express.Router();
const NotificationsController = require('../controllers/notifications.controller');
const auth = require('../middlewares/auth.middleware');

router.use(auth.required);

router.get('/', NotificationsController.list);
router.patch('/:id/read', NotificationsController.markRead);
router.patch('/read-all', NotificationsController.markAllRead);
router.delete('/:id', NotificationsController.remove);

module.exports = router;
