const express = require('express');
const router = express.Router();
const NotesController = require('../controllers/notes.controller');
const auth = require('../middlewares/auth.middleware');

router.use(auth.required);

router.get('/', NotesController.list);
router.post('/', NotesController.create);
router.get('/folders', NotesController.folders);
router.get('/:id', NotesController.get);
router.patch('/:id', NotesController.update);
router.delete('/:id', NotesController.remove);

module.exports = router;
