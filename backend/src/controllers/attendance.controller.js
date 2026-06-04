const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const AttendanceService = require('../services/attendance.service');
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
  return res.status(201).json(ApiResponse.success(rec, 'Attendance marked', 201));
}

async function update(req, res){
  const payload = attendanceSchema.parse(req.body);
  const rec = await AttendanceService.updateAttendance(req.params.subjectId, payload.date, payload.status);
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
