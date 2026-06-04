const prisma = require('../config/db');

async function findAll(userId, filters = {}, skip = 0, take = 20){
  const where = { user_id: userId };
  if(filters.category) where.category = filters.category;
  if(filters.status) where.status = filters.status;
  return prisma.placementProgress.findMany({ where, skip, take, orderBy: { created_at: 'desc' } });
}

async function findById(id){
  return prisma.placementProgress.findUnique({ where: { id } });
}

async function create(data){
  return prisma.placementProgress.create({ data });
}

async function update(id, data){
  return prisma.placementProgress.update({ where: { id }, data });
}

async function remove(id){
  return prisma.placementProgress.delete({ where: { id } });
}

async function statsByCategory(userId){
  const categories = ['DSA','INTERVIEW','APTITUDE','RESUME'];
  const out = [];
  for(const c of categories){
    const total = await prisma.placementProgress.count({ where: { user_id: userId, category: c } });
    const completed = await prisma.placementProgress.count({ where: { user_id: userId, category: c, status: 'COMPLETED' } });
    const inProgress = await prisma.placementProgress.count({ where: { user_id: userId, category: c, status: 'IN_PROGRESS' } });
    const notStarted = await prisma.placementProgress.count({ where: { user_id: userId, category: c, status: 'NOT_STARTED' } });
    const pct = total === 0 ? 0 : Math.round((completed/total)*100);
    out.push({ category: c, total, completed, inProgress, notStarted, completionPct: pct });
  }
  // DSA difficulty breakdown
  const dsaByDifficulty = await prisma.placementProgress.groupBy({ by: ['difficulty'], where: { user_id: userId, category: 'DSA' }, _count: { _all: true } });
  return { perCategory: out, dsaDifficulty: dsaByDifficulty };
}

module.exports = { findAll, findById, create, update, remove, statsByCategory };
