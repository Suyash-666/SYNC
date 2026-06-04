const ApiError = require('../utils/ApiError');

/**
 * Generic ownership guard factory.
 * @param {Function} fetchResource - async (id) => resource
 * @param {string} idParam - req.params param name containing the id
 */
function ownershipGuard(fetchResource, idParam = 'id'){
  return async function(req, res, next){
    const userId = req.user?.id;
    if(!userId) return next(new ApiError('Authorization required', 401));
    const id = req.params[idParam];
    if(!id) return next(new ApiError('Missing id', 400));
    const resource = await fetchResource(id);
    if(!resource) return next(new ApiError('Not found', 404));
    // Common field names: user_id or userId
    const ownerId = resource.user_id || resource.userId || resource.user?.id;
    if(!ownerId) return next(new ApiError('Ownership check not possible', 500));
    if(String(ownerId) !== String(userId)) return next(new ApiError('Unauthorized', 403));
    req.resource = resource;
    return next();
  }
}

module.exports = ownershipGuard;
