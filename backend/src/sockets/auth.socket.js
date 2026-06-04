const jwtUtils = require('../utils/jwt.utils');
const ApiError = require('../utils/ApiError');

async function authSocket(socket, next){
  try{
    const token = socket.handshake?.auth?.token;
    if(!token) return next(new Error('Authentication error: token required'));
    const payload = jwtUtils.verifyAccessToken(token);
    socket.user = payload;
    return next();
  }catch(err){
    return next(new Error('Authentication error'));
  }
}

module.exports = authSocket;
