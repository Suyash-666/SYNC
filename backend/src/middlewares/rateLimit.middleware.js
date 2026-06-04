const rateLimit = require('express-rate-limit');

const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false });

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });

// AI routes limiter: 20 req per hour per user
const aiLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 20, keyGenerator: (req)=> req.user?.id || req.ip, standardHeaders: true, legacyHeaders: false });

module.exports = { globalLimiter, authLimiter, aiLimiter };
