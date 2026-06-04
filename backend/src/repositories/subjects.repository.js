const prisma = require('../config/db');

async function findBySemester(semesterId, skip = 0, take = 20){
  return prisma.subject.findMany({ where: { semester_id: semesterId }, skip, take });
}

async function findByIdWithRelations(id){
  return prisma.subject.findUnique({ where: { id }, include: { modules: { include: { topics: true } }, attendance_records: true } });
}

async function findById(id){
  return prisma.subject.findUnique({ where: { id } });
}

async function create(data){
  return prisma.subject.create({ data });
}

async function update(id, data){
  return prisma.subject.update({ where: { id }, data });
}

async function remove(id){
  return prisma.subject.delete({ where: { id } });
}

async function createModule(subjectId, payload){
  return prisma.module.create({ data: Object.assign({}, payload, { subject_id: subjectId }) });
}

async function updateModule(moduleId, payload){
  return prisma.module.update({ where: { id: moduleId }, data: payload });
}

async function deleteModule(moduleId){
  return prisma.module.delete({ where: { id: moduleId } });
}

async function toggleTopic(subjectId, topicId){
  const topic = await prisma.topic.findUnique({ where: { id: topicId } });
  if(!topic) return null;
  return prisma.topic.update({ where: { id: topicId }, data: { is_completed: !topic.is_completed } });
}

module.exports = { findBySemester, findByIdWithRelations, findById, create, update, remove, createModule, updateModule, deleteModule, toggleTopic };
