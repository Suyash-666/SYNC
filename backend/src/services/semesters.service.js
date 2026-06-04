const SemRepo = require('../repositories/semesters.repository');
const ApiError = require('../utils/ApiError');

async function listSemesters(userId, { skip = 0, take = 20 } = {}){
  return SemRepo.findAllByUser(userId, skip, take);
}

async function getSemester(id){
  const s = await SemRepo.findById(id);
  if(!s) throw new ApiError('Semester not found', 404);
  return s;
}

async function createSemester(userId, payload){
  const data = Object.assign({}, payload, { user_id: userId });
  return SemRepo.create(data);
}

async function updateSemester(id, payload){
  return SemRepo.update(id, payload);
}

async function deleteSemester(id){
  return SemRepo.remove(id);
}

async function setCurrentSemester(userId, id){
  await SemRepo.unsetCurrentForUser(userId);
  return SemRepo.update(id, { is_current: true });
}

module.exports = { listSemesters, getSemester, createSemester, updateSemester, deleteSemester, setCurrentSemester };
