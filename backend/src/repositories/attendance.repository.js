const prisma = require('../config/db');

async function findBySubject(subjectId, filters = {}){
  const where = { subject_id: subjectId };
  if(filters.month && filters.year){
    const start = new Date(filters.year, filters.month -1, 1);
    const end = new Date(filters.year, filters.month, 1);
    where.date = { gte: start, lt: end };
  }
  return prisma.attendanceRecord.findMany({ where, orderBy: { date: 'desc' } });
}

async function findBySubjectAndDate(subjectId, date){
  return prisma.attendanceRecord.findUnique({ where: { subject_id_date: { subject_id: subjectId, date } } });
}

async function upsert(subjectId, userId, date, status){
  // Ensure date is Date object
  const d = new Date(date);
  return prisma.attendanceRecord.upsert({
    where: { subject_id_date: { subject_id: subjectId, date: d } },
    update: { status },
    create: { subject_id: subjectId, user_id: userId, date: d, status }
  });
}

async function updateByDate(subjectId, date, status){
  const d = new Date(date);
  return prisma.attendanceRecord.updateMany({ where: { subject_id: subjectId, date: d }, data: { status } });
}

module.exports = { findBySubject, findBySubjectAndDate, upsert, updateByDate };
