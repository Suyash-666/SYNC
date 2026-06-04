// Redis client stub — returns null if REDIS_URL not configured.
const { REDIS_URL } = require('./env');

function initRedis(){
  if(!REDIS_URL) return null;
  // If you add ioredis or redis, initialize here.
  return null;
}

module.exports = { initRedis };
