const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');
const AuthController = require('../controllers/auth.controller');
const rateLimit = require('../middlewares/rateLimit.middleware');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/register', rateLimit.authLimiter, asyncHandler(AuthController.signup));
router.post('/signup', rateLimit.authLimiter, asyncHandler(AuthController.signup));
router.post('/login', rateLimit.authLimiter, asyncHandler(AuthController.login));
router.post('/refresh', asyncHandler(AuthController.refresh));
router.post('/logout', authMiddleware.optional, asyncHandler(AuthController.logout));
router.post('/forgot-password', rateLimit.authLimiter, asyncHandler(AuthController.forgotPassword));
router.post('/reset-password', rateLimit.authLimiter, asyncHandler(AuthController.resetPassword));
router.get('/me', authMiddleware.required, asyncHandler(AuthController.me));

module.exports = router;
