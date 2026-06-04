const express = require('express');
const router = express.Router();
const ResourcesController = require('../controllers/resources.controller');
const auth = require('../middlewares/auth.middleware');

router.use(auth.required);

router.get('/', ResourcesController.list);
router.post('/upload', ResourcesController.uploadFile);
router.post('/link', ResourcesController.createLink);
router.delete('/:id', ResourcesController.remove);

module.exports = router;
