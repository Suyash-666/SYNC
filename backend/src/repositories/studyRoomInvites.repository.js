const prisma = require('../config/db');

async function create(data) {
  return prisma.studyRoomInvite.create({ data });
}

async function findByCode(code) {
  return prisma.studyRoomInvite.findUnique({ where: { code } });
}

async function findById(id) {
  return prisma.studyRoomInvite.findUnique({ where: { id } });
}

async function listForRoom(roomId) {
  return prisma.studyRoomInvite.findMany({
    where: { room_id: roomId },
    orderBy: { created_at: 'desc' },
  });
}

async function incrementUseCount(id) {
  return prisma.studyRoomInvite.update({
    where: { id },
    data: { use_count: { increment: 1 } },
  });
}

async function revoke(id) {
  return prisma.studyRoomInvite.update({
    where: { id },
    data: { revoked_at: new Date() },
  });
}

module.exports = { create, findByCode, findById, listForRoom, incrementUseCount, revoke };
