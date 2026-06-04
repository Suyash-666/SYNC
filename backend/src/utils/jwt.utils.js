const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_REFRESH_SECRET } = require('../config/env');

function signAccessToken(payload, expiresIn = '15m'){
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

function signRefreshToken(payload, expiresIn = '7d'){
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn });
}

function verifyAccessToken(token){
  return jwt.verify(token, JWT_SECRET);
}

function verifyRefreshToken(token){
  return jwt.verify(token, JWT_REFRESH_SECRET);
}

module.exports = { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken };
