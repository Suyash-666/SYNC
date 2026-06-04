const prisma = require('../config/db');

async function findAllActive(){
  return prisma.studyRoom.findMany({ where: { is_active: true }, orderBy: { created_at: 'desc' } });
}

async function findById(id){
  return prisma.studyRoom.findUnique({ where: { id } });
}

async function create(data){
  return prisma.studyRoom.create({ data });
}

async function addMember(roomId, userId){
  return prisma.studyRoomMembership.create({ data: { room_id: roomId, user_id: userId } });
}

async function removeMember(roomId, userId){
  return prisma.studyRoomMembership.deleteMany({ where: { room_id: roomId, user_id: userId } });
}

async function listMembers(roomId){
  return prisma.studyRoomMembership.findMany({ where: { room_id: roomId }, include: { user: true } });
}

async function deleteRoom(id){
  return prisma.studyRoom.delete({ where: { id } });
}

module.exports = { findAllActive, findById, create, addMember, removeMember, listMembers, deleteRoom };
