// @deprecated since Checkpoint 7 — frontend uses analytics_* views
// directly. Kept alive for the legacy HTTP routes until Checkpoint 8 deletion.
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const Analytics = require('../services/analytics.service');

async function overview(req, res){
  const data = await Analytics.calculateOverview(req.user.id);
  return res.json(ApiResponse.success(data, 'Overview'));
}

async function attendance(req, res){
  const period = req.query.period || '7d';
  const data = await Analytics.calculateAttendanceTrends(req.user.id, period);
  return res.json(ApiResponse.success(data, 'Attendance trends'));
}

async function assignments(req, res){
  const period = req.query.period || '30d';
  const data = await Analytics.calculateAssignmentStats(req.user.id, period);
  return res.json(ApiResponse.success(data, 'Assignment stats'));
}

async function studyHours(req, res){
  // placeholder
  const data = { daily: [ { date: new Date().toISOString().slice(0,10), hours: 2 } ] };
  return res.json(ApiResponse.success(data, 'Study hours (placeholder)'));
}

async function productivity(req, res){
  const data = await Analytics.calculateProductivityScore(req.user.id);
  return res.json(ApiResponse.success(data, 'Productivity'));
}

async function subjects(req, res){
  const data = await Analytics.calculateSubjectsOverview(req.user.id);
  return res.json(ApiResponse.success(data, 'Subjects overview'));
}

module.exports = {
  overview: asyncHandler(overview),
  attendance: asyncHandler(attendance),
  assignments: asyncHandler(assignments),
  studyHours: asyncHandler(studyHours),
  productivity: asyncHandler(productivity),
  subjects: asyncHandler(subjects),
};
