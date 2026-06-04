const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { globalLimiter } = require('./middlewares/rateLimit.middleware');
const { corsOptions } = require('./config/cors');
const morganMiddleware = require('./middlewares/logger.middleware');
const cors = require('cors');
const hpp = require('hpp');
const requestId = require('./middlewares/requestId.middleware');
const sanitizeMiddleware = require('./middlewares/sanitize.middleware');
const routes = require('./routes');
const { errorHandler } = require('./middlewares/error.middleware');

const app = express();

// Security middlewares
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors(corsOptions));
app.use(hpp());
app.use(requestId);
app.use(morganMiddleware);
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeMiddleware);
app.use(cookieParser());
app.use(globalLimiter);

app.use('/api/v1', routes);

app.use(errorHandler);

module.exports = app;
