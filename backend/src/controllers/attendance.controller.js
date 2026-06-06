// @deprecated since Checkpoint 5c — frontend uses supabase.from('AttendanceRecord')
// directly. Kept alive for the legacy HTTP routes until Checkpoint 8 deletion.
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const AttendanceService = require('../services/attendance.service');
const NotifService = require('../services/notification.service');
const prisma = require('../config/db');
const { attendanceSchema } = require('../validators/attendance.validator');

async function list(req, res){
  const filters = {};
  if(req.query.month && req.query.year){ filters.month = parseInt(req.query.month,10); filters.year = parseInt(req.query.year,10); }
  const records = await AttendanceService.getSubjectAttendance(req.params.subjectId, req.user.id, filters);
  return res.json(ApiResponse.success(records, 'Attendance records'));
}

async function create(req, res){
  const payload = attendanceSchema.parse(req.body);
  const rec = await AttendanceService.markAttendance(req.params.subjectId, req.user.id, payload.date, payload.status);
  // Best-effort notification. Look up the subject's friendly name.
  try {
    let subjectName = null;
    const subj = await prisma.subject.findUnique({ where: { id: req.params.subjectId }, select: { name: true } });
    if (subj?.name) subjectName = subj.name;
    const title = payload.status === 'PRESENT'
      ? `Marked present in ${subjectName || 'class'}`
      : payload.status === 'ABSENT'
        ? `Marked absent in ${subjectName || 'class'}`
        : `Attendance updated for ${subjectName || 'class'}`;
    await NotifService.create(req.user.id, 'ATTENDANCE', title, subjectName ? `${subjectName} — ${new Date(payload.date).toLocaleDateString()}` : null);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[attendance.create] notification failed:', err?.message || err);
  }
  return res.status(201).json(ApiResponse.success(rec, 'Attendance marked', 201));
}

async function update(req, res){
  const payload = attendanceSchema.parse(req.body);
  const rec = await AttendanceService.updateAttendance(req.params.subjectId, payload.date, payload.status);
  try {
    let subjectName = null;
    const subj = await prisma.subject.findUnique({ where: { id: req.params.subjectId }, select: { name: true } });
    if (subj?.name) subjectName = subj.name;
    const title = payload.status === 'PRESENT'
      ? `Marked present in ${subjectName || 'class'}`
      : payload.status === 'ABSENT'
        ? `Marked absent in ${subjectName || 'class'}`
        : `Attendance updated for ${subjectName || 'class'}`;
    await NotifService.create(req.user.id, 'ATTENDANCE', title, null);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[attendance.update] notification failed:', err?.message || err);
  }
  return res.json(ApiResponse.success(rec, 'Attendance updated'));
}

async function summary(req, res){
  const data = await AttendanceService.summaryForCurrentSemester(req.user.id);
  return res.json(ApiResponse.success(data, 'Attendance summary'));
}

module.exports = {
  list: asyncHandler(list),
  create: asyncHandler(create),
  update: asyncHandler(update),
  summary: asyncHandler(summary),
};
