const prisma = require('../config/db');
const AttendanceRepo = require('../repositories/attendance.repository');

async function calculateAttendanceStats(subjectId, userId){
  const total = await prisma.attendanceRecord.count({ where: { subject_id: subjectId, user_id: userId } });
  const present = await prisma.attendanceRecord.count({ where: { subject_id: subjectId, user_id: userId, status: 'PRESENT' } });
  const absent = await prisma.attendanceRecord.count({ where: { subject_id: subjectId, user_id: userId, status: 'ABSENT' } });
  const percentage = total === 0 ? 0 : Math.round((present / total) * 100);
  return { total, present, absent, percentage };
}

async function getSubjectAttendance(subjectId, userId, filters){
  const records = await AttendanceRepo.findBySubject(subjectId, filters);
  return records;
}

async function markAttendance(subjectId, userId, date, status){
  return AttendanceRepo.upsert(subjectId, userId, date, status);
}

async function updateAttendance(subjectId, date, status){
  return AttendanceRepo.updateByDate(subjectId, date, status);
}

async function summaryForCurrentSemester(userId){
  const semester = await prisma.semester.findFirst({ where: { user_id: userId, is_current: true } });
  if(!semester) return [];
  const subjects = await prisma.subject.findMany({ where: { semester_id: semester.id } });
  const results = [];
  for(const s of subjects){
    const stats = await calculateAttendanceStats(s.id, userId);
    results.push({ subject: { id: s.id, name: s.name }, stats });
  }
  return results;
}

module.exports = { calculateAttendanceStats, getSubjectAttendance, markAttendance, updateAttendance, summaryForCurrentSemester };
