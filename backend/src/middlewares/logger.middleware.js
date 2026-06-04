const morgan = require('morgan');
const logger = require('../utils/logger');

const morganMiddleware = morgan('combined', { stream: logger.stream });

module.exports = morganMiddleware;
