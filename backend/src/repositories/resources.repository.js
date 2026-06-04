const prisma = require('../config/db');

async function countFiltered(userId, filters = {}){
  const where = { user_id: userId };
  if(filters.subject_id) where.subject_id = filters.subject_id;
  if(filters.file_type) where.file_type = filters.file_type;
  return prisma.resource.count({ where });
}

async function findAll(userId, filters = {}, skip = 0, take = 20){
  const where = { user_id: userId };
  if(filters.subject_id) where.subject_id = filters.subject_id;
  if(filters.file_type) where.file_type = filters.file_type;
  return prisma.resource.findMany({ where, skip, take, orderBy: { created_at: 'desc' } });
}

async function findById(id){
  return prisma.resource.findUnique({ where: { id } });
}

async function create(data){
  return prisma.resource.create({ data });
}

async function remove(id){
  return prisma.resource.delete({ where: { id } });
}

module.exports = { countFiltered, findAll, findById, create, remove };
