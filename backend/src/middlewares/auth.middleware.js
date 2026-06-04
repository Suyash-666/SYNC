const jwtUtils = require('../utils/jwt.utils');
const ApiError = require('../utils/ApiError');

async function optional(req, res, next){
  const auth = req.headers.authorization;
  if(!auth || !auth.startsWith('Bearer ')) return next();
  const token = auth.split(' ')[1];
  try{
    const payload = jwtUtils.verifyAccessToken(token);
    req.user = payload;
  }catch(err){ }
  return next();
}

async function required(req, res, next){
  const auth = req.headers.authorization;
  if(!auth || !auth.startsWith('Bearer ')) return next(new ApiError('Authorization required', 401));
  const token = auth.split(' ')[1];
  try{
    const payload = jwtUtils.verifyAccessToken(token);
    req.user = payload;
    return next();
  }catch(err){
    return next(new ApiError('Invalid token', 401));
  }
}

module.exports = { optional, required };
