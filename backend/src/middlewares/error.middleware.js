const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

function errorHandler(err, req, res, next){
  if (err instanceof ApiError) {
    const payload = { success: false, message: err.message, statusCode: err.statusCode || 400, errors: err.errors || null };
    return res.status(err.statusCode || 400).json(payload);
  }
  // Route unexpected errors through winston so the stack lands in logs/error.log
  // (the previous plain `console.error` went to the terminal and was easy to miss).
  logger.error({ err, requestId: req.id, path: req.originalUrl, method: req.method }, 'unhandled_error');

  const isProd = process.env.NODE_ENV === 'production';
  return res.status(500).json({
    success: false,
    message: isProd ? 'Internal server error' : (err?.message || 'Internal server error'),
    statusCode: 500,
    errors: null,
  });
}

module.exports = { errorHandler };
