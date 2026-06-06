// @deprecated since Checkpoint 6 — frontend uses supabase.from('StudyRoom')
// directly. Socket.IO study-room handler is unchanged. Kept alive for the
// legacy HTTP routes until Checkpoint 8 deletion.
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const StudyService = require('../services/studyRooms.service');

async function list(req, res){
  const data = await StudyService.listRooms(req.user.id);
  return res.json(ApiResponse.success(data, 'Study rooms'));
}

async function create(req, res){
  const payload = { name: req.body.name, subject_tag: req.body.subject_tag };
  const r = await StudyService.createRoom(req.user.id, payload);
  return res.status(201).json(ApiResponse.success(r, 'Room created', 201));
}

async function get(req, res){
  const r = await StudyService.getRoom(req.params.id);
  const members = await require('../repositories/studyRooms.repository').listMembers(req.params.id);
  return res.json(ApiResponse.success(Object.assign({}, r, { members }), 'Room'));
}

async function join(req, res){
  await StudyService.joinRoom(req.params.id, req.user.id);
  return res.json(ApiResponse.success(null, 'Joined'));
}

async function leave(req, res){
  await StudyService.leaveRoom(req.params.id, req.user.id);
  return res.json(ApiResponse.success(null, 'Left'));
}

async function remove(req, res){
  await StudyService.deleteRoom(req.params.id, req.user.id);
  return res.json(ApiResponse.success(null, 'Deleted'));
}

module.exports = { list: asyncHandler(list), create: asyncHandler(create), get: asyncHandler(get), join: asyncHandler(join), leave: asyncHandler(leave), remove: asyncHandler(remove) };
