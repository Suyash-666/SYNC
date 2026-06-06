// @deprecated since Checkpoint 5f — frontend uses supabase.from('PlacementProgress')
// directly. Kept alive for the legacy HTTP routes until Checkpoint 8 deletion.
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const PlacementService = require('../services/placement.service');
const { progressSchema, dsaProblemSchema } = require('../validators/placement.validator');

async function list(req, res){
  const filters = { category: req.query.category, status: req.query.status };
  const data = await PlacementService.listProgress(req.user.id, filters, { skip: 0, take: 100 });
  return res.json(ApiResponse.success(data, 'Placement progress'));
}

async function create(req, res){
  const payload = progressSchema.parse(req.body);
  const item = await PlacementService.addProgress(req.user.id, payload);
  return res.status(201).json(ApiResponse.success(item, 'Created', 201));
}

async function update(req, res){
  const payload = progressSchema.partial().parse(req.body);
  const item = await PlacementService.updateProgress(req.params.id, req.user.id, payload);
  return res.json(ApiResponse.success(item, 'Updated'));
}

async function remove(req, res){
  await PlacementService.deleteProgress(req.params.id, req.user.id);
  return res.json(ApiResponse.success(null, 'Deleted'));
}

async function stats(req, res){
  const data = await PlacementService.calculatePlacementStats(req.user.id);
  return res.json(ApiResponse.success(data, 'Stats'));
}

async function addDsaProblem(req, res){
  const payload = dsaProblemSchema.parse(req.body);
  const item = await PlacementService.addProgress(req.user.id, Object.assign({}, payload, { category: 'DSA' }));
  return res.status(201).json(ApiResponse.success(item, 'DSA problem added', 201));
}

async function listDsaProblems(req, res){
  const filters = { difficulty: req.query.difficulty, status: req.query.status, topic: req.query.topic };
  const data = await PlacementService.listProgress(req.user.id, Object.assign({}, filters, { category: 'DSA' }));
  return res.json(ApiResponse.success(data, 'DSA problems'));
}

module.exports = { list: asyncHandler(list), create: asyncHandler(create), update: asyncHandler(update), remove: asyncHandler(remove), stats: asyncHandler(stats), addDsaProblem: asyncHandler(addDsaProblem), listDsaProblems: asyncHandler(listDsaProblems) };
