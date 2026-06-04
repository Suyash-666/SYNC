const express = require('express');
const router = express.Router();
const SemController = require('../controllers/semesters.controller');
const auth = require('../middlewares/auth.middleware');
const ownershipGuard = require('../middlewares/ownership.middleware');
const SemRepo = require('../repositories/semesters.repository');

router.use(auth.required);

router.get('/', SemController.list);
router.post('/', SemController.create);
router.get('/:id', ownershipGuard(SemRepo.findById, 'id'), SemController.get);
router.patch('/:id', ownershipGuard(SemRepo.findById, 'id'), SemController.update);
router.delete('/:id', ownershipGuard(SemRepo.findById, 'id'), SemController.remove);
router.patch('/:id/set-current', ownershipGuard(SemRepo.findById, 'id'), SemController.setCurrent);

module.exports = router;
