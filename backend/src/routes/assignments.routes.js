const express = require('express');
const router = express.Router();
const AssignController = require('../controllers/assignments.controller');
const auth = require('../middlewares/auth.middleware');

router.use(auth.required);

router.get('/', AssignController.list);
router.post('/', AssignController.create);
router.get('/:id', AssignController.get);
router.patch('/:id', AssignController.update);
router.delete('/:id', AssignController.remove);
router.patch('/:id/status', AssignController.updateStatus);

module.exports = router;
