const AssignRepo = require('../repositories/assignments.repository');
const ApiError = require('../utils/ApiError');

async function getAssignments(userId, filters = {}, { skip = 0, take = 20 } = {}){
  const data = await AssignRepo.findAll(userId, filters, skip, take);
  const total = await AssignRepo.countFiltered(userId, filters);
  return { data, pagination: { total, page: Math.floor(skip / take) + 1, limit: take, totalPages: Math.ceil(total / take) } };
}

async function createAssignment(userId, payload){
  const p = Object.assign({}, payload, { user_id: userId });
  return AssignRepo.create(p);
}

async function getAssignment(id){
  const a = await AssignRepo.findById(id);
  if(!a) throw new ApiError('Assignment not found', 404);
  return a;
}

async function updateAssignment(id, payload){
  const a = await AssignRepo.findById(id);
  if(!a) throw new ApiError('Assignment not found', 404);
  return AssignRepo.update(id, payload);
}

async function deleteAssignment(id){
  const a = await AssignRepo.findById(id);
  if(!a) throw new ApiError('Assignment not found', 404);
  return AssignRepo.remove(id);
}

async function updateStatus(id, status){
  const a = await AssignRepo.findById(id);
  if(!a) throw new ApiError('Assignment not found', 404);
  const payload = { status };
  if(status === 'SUBMITTED') payload.submitted_at = new Date();
  return AssignRepo.update(id, payload);
}

async function getOverdueAssignments(userId){
  return AssignRepo.findOverdue(userId);
}

module.exports = { getAssignments, createAssignment, getAssignment, updateAssignment, deleteAssignment, updateStatus, getOverdueAssignments };
