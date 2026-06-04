const ApiError = require('../utils/ApiError');

function validate(schema){
  return (req, res, next) => {
    try{
      const result = schema.parse(req.body);
      req.body = result;
      return next();
    }catch(err){
      return next(new ApiError('Validation failed', 400, err.errors || err.message));
    }
  };
}

module.exports = validate;
