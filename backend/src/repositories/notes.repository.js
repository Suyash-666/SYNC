const prisma = require('../config/db');

async function countFiltered(userId, filters = {}){
  const where = { user_id: userId, is_deleted: false };
  if(filters.folder) where.folder = filters.folder;
  if(filters.search) where.title = { contains: filters.search, mode: 'insensitive' };
  if(filters.tags && filters.tags.length) where.tags = { hasSome: filters.tags };
  return prisma.note.count({ where });
}

async function findAll(userId, filters = {}, skip = 0, take = 20){
  const where = { user_id: userId, is_deleted: false };
  if(filters.folder) where.folder = filters.folder;
  if(filters.search) where.title = { contains: filters.search, mode: 'insensitive' };
  if(filters.tags && filters.tags.length) where.tags = { hasSome: filters.tags };
  return prisma.note.findMany({ where, skip, take, orderBy: { updated_at: 'desc' } });
}

async function findById(id){
  return prisma.note.findUnique({ where: { id } });
}

async function create(data){
  return prisma.note.create({ data });
}

async function update(id, data){
  return prisma.note.update({ where: { id }, data });
}

async function softDelete(id){
  return prisma.note.update({ where: { id }, data: { is_deleted: true } });
}

async function distinctFolders(userId){
  const rows = await prisma.note.findMany({ where: { user_id: userId, is_deleted: false }, select: { folder: true } });
  const set = new Set(rows.map(r=>r.folder).filter(Boolean));
  return Array.from(set);
}

module.exports = { countFiltered, findAll, findById, create, update, softDelete, distinctFolders };
