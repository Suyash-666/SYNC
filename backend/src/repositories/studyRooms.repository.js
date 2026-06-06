const prisma = require('../config/db');

async function findAllActive(){
  return prisma.studyRoom.findMany({ where: { is_active: true }, orderBy: { created_at: 'desc' } });
}

/**
 * Rooms the given user is a member of. A room is "visible" to a user iff
 * there is a StudyRoomMembership row linking them. The room's creator
 * gets a membership at create-time, so owner-rooms show up here.
 */
async function findAllForUser(userId){
  return prisma.studyRoom.findMany({
    where: {
      is_active: true,
      memberships: { some: { user_id: userId } },
    },
    orderBy: { created_at: 'desc' },
  });
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

/**
 * List members with a SAFE user projection.
 *
 * Why: the User model declares `password_hash String` (non-nullable) but
 * Supabase users authenticate via Supabase Auth and have no password_hash.
 * `include: { user: true }` therefore fails with a Prisma conversion
 * error. Selecting only the public fields sidesteps that.
 */
async function listMembers(roomId){
  return prisma.studyRoomMembership.findMany({
    where: { room_id: roomId },
    select: {
      id: true,
      room_id: true,
      user_id: true,
      joined_at: true,
      user: { select: { id: true, email: true, full_name: true, avatar_url: true } },
    },
  });
}

async function deleteRoom(id){
  return prisma.studyRoom.delete({ where: { id } });
}

module.exports = { findAllActive, findAllForUser, findById, create, addMember, removeMember, listMembers, deleteRoom };
