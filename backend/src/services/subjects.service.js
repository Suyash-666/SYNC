const SubjectsRepo = require('../repositories/subjects.repository');
const ApiError = require('../utils/ApiError');

async function listSubjects(semesterId, { skip = 0, take = 20 } = {}){
  return SubjectsRepo.findBySemester(semesterId, skip, take);
}

async function getSubject(id){
  const s = await SubjectsRepo.findByIdWithRelations(id);
  if(!s) throw new ApiError('Subject not found', 404);
  return s;
}

async function createSubject(semesterId, payload){
  return SubjectsRepo.create(Object.assign({}, payload, { semester_id: semesterId }));
}

async function updateSubject(id, payload){
  return SubjectsRepo.update(id, payload);
}

async function deleteSubject(id){
  return SubjectsRepo.remove(id);
}

async function addModule(subjectId, payload){
  return SubjectsRepo.createModule(subjectId, payload);
}

async function updateModule(moduleId, payload){
  return SubjectsRepo.updateModule(moduleId, payload);
}

async function deleteModule(moduleId){
  return SubjectsRepo.deleteModule(moduleId);
}

async function toggleTopic(subjectId, topicId){
  const t = await SubjectsRepo.toggleTopic(subjectId, topicId);
  if(!t) throw new ApiError('Topic not found', 404);
  return t;
}

module.exports = { listSubjects, getSubject, createSubject, updateSubject, deleteSubject, addModule, updateModule, deleteModule, toggleTopic };
