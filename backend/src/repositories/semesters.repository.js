const prisma = require('../config/db');

async function findAllByUser(userId, skip = 0, take = 20){
  return prisma.semester.findMany({ where: { user_id: userId }, skip, take, orderBy: { semester_number: 'desc' } });
}

async function findById(id){
  return prisma.semester.findUnique({ where: { id } });
}

async function create(data){
  return prisma.semester.create({ data });
}

async function update(id, data){
  return prisma.semester.update({ where: { id }, data });
}

async function remove(id){
  return prisma.semester.delete({ where: { id } });
}

async function unsetCurrentForUser(userId){
  return prisma.semester.updateMany({ where: { user_id: userId, is_current: true }, data: { is_current: false } });
}

module.exports = { findAllByUser, findById, create, update, remove, unsetCurrentForUser };
