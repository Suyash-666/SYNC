const StudyRepo = require('../repositories/studyRooms.repository');
const ApiError = require('../utils/ApiError');

async function listRooms(){
  return StudyRepo.findAllActive();
}

async function createRoom(userId, payload){
  const room = await StudyRepo.create(Object.assign({}, payload, { created_by_id: userId }));
  // add creator as member
  await StudyRepo.addMember(room.id, userId);
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
