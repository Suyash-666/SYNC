const express = require('express');
const router = express.Router();
const PlacementController = require('../controllers/placement.controller');
const auth = require('../middlewares/auth.middleware');

router.use(auth.required);

router.get('/progress', PlacementController.list);
router.post('/progress', PlacementController.create);
router.patch('/progress/:id', PlacementController.update);
router.delete('/progress/:id', PlacementController.remove);
router.get('/stats', PlacementController.stats);

// DSA specific
router.post('/dsa/problems', PlacementController.addDsaProblem);
router.get('/dsa/problems', PlacementController.listDsaProblems);

module.exports = router;
