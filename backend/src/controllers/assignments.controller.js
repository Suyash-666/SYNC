const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const AssignService = require('../services/assignments.service');
const { parsePagination } = require('../utils/pagination');
const { assignmentSchema } = require('../validators/assignment.validator');

async function list(req, res){
  const p = parsePagination(req.query);
  const filters = {
    status: req.query.status,
    priority: req.query.priority,
    subject_id: req.query.subject_id,
    due_from: req.query.due_from,
    due_to: req.query.due_to,
  };
  const result = await AssignService.getAssignments(req.user.id, filters, { skip: p.skip, take: p.limit });
  return res.json(ApiResponse.success(result.data, 'Assignments fetched', 200, { pagination: result.pagination }));
}

async function create(req, res){
  const payload = assignmentSchema.parse(req.body);
  const a = await AssignService.createAssignment(req.user.id, payload);
  return res.status(201).json(ApiResponse.success(a, 'Assignment created', 201));
}

async function get(req, res){
  const a = await AssignService.getAssignment(req.params.id);
  if(String(a.user_id) !== String(req.user.id)) return res.status(403).json(ApiResponse.error('Unauthorized', 403));
  return res.json(ApiResponse.success(a, 'Assignment'));
}

async function update(req, res){
  const payload = assignmentSchema.partial().parse(req.body);
  const a = await AssignService.getAssignment(req.params.id);
  if(String(a.user_id) !== String(req.user.id)) return res.status(403).json(ApiResponse.error('Unauthorized', 403));
  const updated = await AssignService.updateAssignment(req.params.id, payload);
  return res.json(ApiResponse.success(updated, 'Assignment updated'));
}

async function remove(req, res){
  const a = await AssignService.getAssignment(req.params.id);
  if(String(a.user_id) !== String(req.user.id)) return res.status(403).json(ApiResponse.error('Unauthorized', 403));
  await AssignService.deleteAssignment(req.params.id);
  return res.json(ApiResponse.success(null, 'Assignment deleted'));
}

async function updateStatus(req, res){
  const status = req.body.status;
  const a = await AssignService.getAssignment(req.params.id);
  if(String(a.user_id) !== String(req.user.id)) return res.status(403).json(ApiResponse.error('Unauthorized', 403));
  const updated = await AssignService.updateStatus(req.params.id, status);
  return res.json(ApiResponse.success(updated, 'Status updated'));
}

module.exports = {
  list: asyncHandler(list),
  create: asyncHandler(create),
  get: asyncHandler(get),
  update: asyncHandler(update),
  remove: asyncHandler(remove),
  updateStatus: asyncHandler(updateStatus),
};
