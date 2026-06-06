const StudyRepo = require('../repositories/studyRooms.repository');
const ApiError = require('../utils/ApiError');
const NotifService = require('./notification.service');

async function listRooms(userId){
  // Only return rooms this user is a member of. A user who knows a room
  // exists should join it through the invite flow; we don't surface
  // every active room to every authenticated user.
  return StudyRepo.findAllForUser(userId);
}

async function createRoom(userId, payload){
  const room = await StudyRepo.create(Object.assign({}, payload, { created_by_id: userId }));
  // add creator as member
  await StudyRepo.addMember(room.id, userId);

  // COLLABORATION confirmation to the creator. Best-effort — never
  // break the room create if the notification fails.
  try {
    await NotifService.create(
      userId,
      'COLLABORATION',
      `Room “${room.name}” ready`,
      room.subject_tag
        ? `Subject: ${room.subject_tag}. Share the invite link to bring others in.`
        : 'Share the invite link to bring others in.',
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[createRoom] notification failed:', err?.message || err);
  }

  return room;
}

async function getRoom(id){
  const r = await StudyRepo.findById(id);
  if(!r) throw new ApiError('Room not found', 404);
  return r;
}

async function joinRoom(id, userId){
  const r = await StudyRepo.findById(id);
  if(!r) throw new ApiError('Room not found', 404);
  return StudyRepo.addMember(id, userId);
}

async function leaveRoom(id, userId){
  return StudyRepo.removeMember(id, userId);
}

async function deleteRoom(id, userId){
  const r = await StudyRepo.findById(id);
  if(!r) throw new ApiError('Room not found', 404);
  if(r.created_by_id !== userId) throw new ApiError('Forbidden', 403);
  return StudyRepo.deleteRoom(id);
}

module.exports = { listRooms, createRoom, getRoom, joinRoom, leaveRoom, deleteRoom };
