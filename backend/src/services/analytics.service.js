const prisma = require('../config/db');
const { startOfDay, subDays, formatISO, startOfWeek, endOfWeek } = require('date-fns');

async function calculateOverview(userId){
  // current semester attendance %
  const semester = await prisma.semester.findFirst({ where: { user_id: userId, is_current: true } });
  let attendancePct = 0;
  if(semester){
    const subjects = await prisma.subject.findMany({ where: { semester_id: semester.id } });
    let totals = { present: 0, total: 0 };
    for(const s of subjects){
      const total = await prisma.attendanceRecord.count({ where: { subject_id: s.id, user_id: userId } });
      const present = await prisma.attendanceRecord.count({ where: { subject_id: s.id, user_id: userId, status: 'PRESENT' } });
      totals.present += present; totals.total += total;
    }
    attendancePct = totals.total === 0 ? 0 : Math.round((totals.present / totals.total) * 100);
  }

  // pending assignments
  const pending = await prisma.assignment.count({ where: { user_id: userId, status: { in: ['TODO','IN_PROGRESS','REVIEW'] } } });

  // study streak: consecutive days with activity (notes created or assignments updated)
  const today = startOfDay(new Date());
  let streak = 0;
  for(let i=0;i<365;i++){
    const day = subDays(today, i);
    const dayStart = day;
    const dayEnd = subDays(startOfDay(new Date()), i-1);
    const notes = await prisma.note.count({ where: { user_id: userId, created_at: { gte: startOfDay(day), lt: startOfDay(subDays(day, -1)) } } });
    const assigns = await prisma.assignment.count({ where: { user_id: userId, updated_at: { gte: startOfDay(day), lt: startOfDay(subDays(day, -1)) } } });
    if(notes + assigns > 0) streak += 1; else break;
  }

  // assignment completion rate
  const totalAssigned = await prisma.assignment.count({ where: { user_id: userId } });
  const submitted = await prisma.assignment.count({ where: { user_id: userId, status: 'SUBMITTED' } });
  const inProgress = await prisma.assignment.count({ where: { user_id: userId, status: 'IN_PROGRESS' } });
  const todo = await prisma.assignment.count({ where: { user_id: userId, status: 'TODO' } });
  const completionRate = (submitted === 0 && totalAssigned === 0) ? 0 : Math.round((submitted / (submitted + inProgress + todo || submitted)) * 100);

  return { attendancePct, pendingAssignments: pending, studyStreak: streak, assignmentCompletionRate: completionRate };
}

async function calculateAttendanceTrends(userId, period='7d'){
  const today = startOfDay(new Date());
  let days = 7;
  if(period === '30d') days = 30;
  // semester: use current semester start to today
  if(period === 'semester'){
    const semester = await prisma.semester.findFirst({ where: { user_id: userId, is_current: true } });
    if(!semester) days = 7; else {
      const start = startOfDay(new Date(semester.start_date || new Date()));
      const diff = Math.floor((today - start) / (24*3600*1000));
      days = Math.max(7, diff);
    }
  }
  const start = subDays(today, days-1);
  const records = await prisma.attendanceRecord.findMany({ where: { user_id: userId, date: { gte: start, lte: today } } });
  const map = {};
  for(let i=0;i<days;i++){
    const d = subDays(today, i);
    const key = formatISO(d, { representation: 'date' });
    map[key] = { date: key, present: 0, absent: 0, total: 0 };
  }
  for(const r of records){
    const key = formatISO(startOfDay(r.date), { representation: 'date' });
    if(!map[key]) map[key] = { date: key, present: 0, absent: 0, total: 0 };
    map[key].total += 1;
    if(r.status === 'PRESENT') map[key].present += 1;
    if(r.status === 'ABSENT') map[key].absent += 1;
  }
  const out = Object.values(map).sort((a,b)=> a.date.localeCompare(b.date));
  return out;
}

async function calculateAssignmentStats(userId, period='30d'){
  const today = new Date();
  let start = subDays(today, 30);
  if(period === '7d') start = subDays(today, 7);
  // get assignments in period
  const assigns = await prisma.assignment.findMany({ where: { user_id: userId, created_at: { gte: start, lte: today } } });
  const weeks = {};
  for(const a of assigns){
    const wStart = startOfWeek(a.created_at, { weekStartsOn: 1 });
    const key = formatISO(wStart, { representation: 'date' });
    if(!weeks[key]) weeks[key] = { week: key, assigned: 0, submitted: 0, overdue: 0 };
    weeks[key].assigned += 1;
    if(a.status === 'SUBMITTED') weeks[key].submitted += 1;
    if(a.due_date && new Date(a.due_date) < today && a.status !== 'SUBMITTED') weeks[key].overdue += 1;
  }
  return Object.values(weeks).sort((a,b)=> a.week.localeCompare(b.week));
}

async function calculateProductivityScore(userId){
  // attendance % for current semester
  const overview = await calculateOverview(userId);
  const attendancePct = overview.attendancePct;
  const attendanceScore = Math.min(25, (attendancePct / 75) * 25);

  const assignmentScore = Math.min(25, (overview.assignmentCompletionRate/100) * 25);

  const streakDays = overview.studyStreak || 0;
  const streakScore = (Math.min(streakDays,14)/14) * 25;

  // notes created this week
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const notesThisWeek = await prisma.note.count({ where: { user_id: userId, created_at: { gte: weekStart } } });
  const notesScore = Math.min(25, (notesThisWeek / 5) * 25);

  const total = Math.round(attendanceScore + assignmentScore + streakScore + notesScore);
  return { breakdown: { attendanceScore: Math.round(attendanceScore), assignmentScore: Math.round(assignmentScore), streakScore: Math.round(streakScore), notesScore: Math.round(notesScore) }, total };
}

async function calculateSubjectsOverview(userId){
  const semester = await prisma.semester.findFirst({ where: { user_id: userId, is_current: true } });
  if(!semester) return [];
  const subjects = await prisma.subject.findMany({ where: { semester_id: semester.id } });
  const out = [];
  for(const s of subjects){
    const totalModules = await prisma.module.count({ where: { subject_id: s.id } });
    const completedTopics = await prisma.topic.count({ where: { module: { subject_id: s.id }, is_completed: true } });
    const totalTopics = await prisma.topic.count({ where: { module: { subject_id: s.id } } });
    out.push({ subject: { id: s.id, name: s.name }, modules: totalModules, topicsCompleted: completedTopics, topicsTotal: totalTopics });
  }
  return out;
}

module.exports = { calculateOverview, calculateAttendanceTrends, calculateAssignmentStats, calculateProductivityScore, calculateSubjectsOverview };
