const { CORS_ORIGIN } = require('./env');

const corsOptions = {
  origin: CORS_ORIGIN.split(',').map(s=>s.trim()),
  credentials: true,
};

module.exports = { corsOptions };
