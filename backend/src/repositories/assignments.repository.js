const prisma = require('../config/db');

async function countFiltered(userId, filters = {}){
  const where = { user_id: userId };
  if(filters.status) where.status = filters.status;
  if(filters.priority) where.priority = filters.priority;
  if(filters.subject_id) where.subject_id = filters.subject_id;
  if(filters.due_from || filters.due_to) where.due_date = {};
  if(filters.due_from) where.due_date.gte = new Date(filters.due_from);
  if(filters.due_to) where.due_date.lte = new Date(filters.due_to);
  return prisma.assignment.count({ where });
}

async function findAll(userId, filters = {}, skip = 0, take = 20){
  const where = { user_id: userId };
  if(filters.status) where.status = filters.status;
  if(filters.priority) where.priority = filters.priority;
  if(filters.subject_id) where.subject_id = filters.subject_id;
  if(filters.due_from || filters.due_to) where.due_date = {};
  if(filters.due_from) where.due_date.gte = new Date(filters.due_from);
  if(filters.due_to) where.due_date.lte = new Date(filters.due_to);
  return prisma.assignment.findMany({ where, skip, take, orderBy: { due_date: 'asc' } });
}

async function findById(id){
  return prisma.assignment.findUnique({ where: { id } });
}

async function create(payload){
  return prisma.assignment.create({ data: payload });
}

async function update(id, payload){
  return prisma.assignment.update({ where: { id }, data: payload });
}

async function remove(id){
  return prisma.assignment.delete({ where: { id } });
}

async function findOverdue(userId){
  return prisma.assignment.findMany({ where: { user_id: userId, due_date: { lt: new Date() }, status: { not: 'SUBMITTED' } } });
}

module.exports = { countFiltered, findAll, findById, create, update, remove, findOverdue };
