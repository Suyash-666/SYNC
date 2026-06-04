const ApiError = require('../utils/ApiError');

function errorHandler(err, req, res, next){
  if (err instanceof ApiError) {
    const payload = { success: false, message: err.message, statusCode: err.statusCode || 400, errors: err.errors || null };
    return res.status(err.statusCode || 400).json(payload);
  }
  // eslint-disable-next-line no-console
  console.error(err);
  return res.status(500).json({ success: false, message: 'Internal server error', statusCode: 500, errors: null });
}

module.exports = { errorHandler };
