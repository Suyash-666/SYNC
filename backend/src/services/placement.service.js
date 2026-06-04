const PlacementRepo = require('../repositories/placement.repository');
const ApiError = require('../utils/ApiError');

async function listProgress(userId, filters = {}, { skip=0, take=20 } = {}){
  const data = await PlacementRepo.findAll(userId, filters, skip, take);
  return data;
}

async function addProgress(userId, payload){
  const data = Object.assign({}, payload, { user_id: userId });
  return PlacementRepo.create(data);
}

async function updateProgress(id, userId, payload){
  const item = await PlacementRepo.findById(id);
  if(!item) throw new ApiError('Not found', 404);
  if(String(item.user_id) !== String(userId)) throw new ApiError('Unauthorized', 403);
  return PlacementRepo.update(id, payload);
}

async function deleteProgress(id, userId){
  const item = await PlacementRepo.findById(id);
  if(!item) throw new ApiError('Not found', 404);
  if(String(item.user_id) !== String(userId)) throw new ApiError('Unauthorized', 403);
  return PlacementRepo.remove(id);
}

async function calculatePlacementStats(userId){
  return PlacementRepo.statsByCategory(userId);
}

module.exports = { listProgress, addProgress, updateProgress, deleteProgress, calculatePlacementStats };
