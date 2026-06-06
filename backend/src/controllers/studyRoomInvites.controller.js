const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const InviteService = require('../services/studyRoomInvites.service');
const { createInviteSchema } = require('../validators/studyRoomInvites.validator');

async function create(req, res) {
  const body = createInviteSchema.parse(req.body || {});
  const invite = await InviteService.createInvite(req.user.id, req.params.roomId, {
    expires_at: body.expires_at,
    max_uses: body.max_uses,
  });
  return res.status(201).json(ApiResponse.success(invite, 'Invite created', 201));
}

async function list(req, res) {
  const invites = await InviteService.listInvites(req.user.id, req.params.roomId);
  return res.json(ApiResponse.success(invites, 'Invites'));
}

async function revoke(req, res) {
  const invite = await InviteService.revokeInvite(req.user.id, req.params.inviteId);
  return res.json(ApiResponse.success(invite, 'Invite revoked'));
}

// Public-ish: auth required, membership not. Lets the join page show
// a preview to a logged-in user before they accept.
async function preview(req, res) {
  const out = await InviteService.previewInvite(req.params.code);
  return res.json(ApiResponse.success(out, 'Invite preview'));
}

async function redeem(req, res) {
  const out = await InviteService.redeemInvite(req.user.id, req.params.code);
  return res.json(ApiResponse.success(out, 'Joined room'));
}

module.exports = {
  create: asyncHandler(create),
  list: asyncHandler(list),
  revoke: asyncHandler(revoke),
  preview: asyncHandler(preview),
  redeem: asyncHandler(redeem),
};
