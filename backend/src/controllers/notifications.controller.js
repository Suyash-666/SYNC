const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const NotificationService = require('../services/notification.service');
const { parsePagination } = require('../utils/pagination');

async function list(req, res){
  const p = parsePagination(req.query);
  const filters = { type: req.query.type, is_read: typeof req.query.is_read !== 'undefined' ? (req.query.is_read === 'true') : undefined };
  const result = await NotificationService.list(req.user.id, filters, { skip: p.skip, take: p.limit });
  return res.json(ApiResponse.success(result.data, 'Notifications', 200, { pagination: { total: result.total, page: p.page, limit: p.limit, totalPages: Math.ceil(result.total / p.limit) } }));
}

async function markRead(req, res){
  await NotificationService.markRead(req.user.id, req.params.id);
  return res.json(ApiResponse.success(null, 'Marked read'));
}

async function markAllRead(req, res){
  await NotificationService.markAllRead(req.user.id);
  return res.json(ApiResponse.success(null, 'All marked read'));
}

async function remove(req, res){
  await NotificationService.remove(req.user.id, req.params.id);
  return res.json(ApiResponse.success(null, 'Deleted'));
}

module.exports = { list: asyncHandler(list), markRead: asyncHandler(markRead), markAllRead: asyncHandler(markAllRead), remove: asyncHandler(remove) };
