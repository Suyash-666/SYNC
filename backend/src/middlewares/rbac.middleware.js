const ApiError = require('../utils/ApiError');
const { ROLES } = require('../constants/roles');

function permit(...allowed){
  return (req, res, next) => {
    const user = req.user;
    if(!user) return next(new ApiError('Unauthorized', 401));
    if(allowed.includes(user.role)) return next();
    return next(new ApiError('Forbidden', 403));
  };
}

module.exports = { permit };
