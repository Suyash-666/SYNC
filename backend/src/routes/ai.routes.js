const express = require('express');
const router = express.Router();
const AIController = require('../controllers/ai.controller');
const auth = require('../middlewares/auth.middleware');
const { aiLimiter } = require('../middlewares/rateLimit.middleware');

router.use(auth.required);

router.post('/chat', aiLimiter, AIController.chat);
router.post('/study-plan', aiLimiter, AIController.studyPlan);
router.get('/history', AIController.history);
router.get('/history/:conversationId', AIController.historyById);
router.delete('/history/:conversationId', AIController.deleteHistory);

module.exports = router;
