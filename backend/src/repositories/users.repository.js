const prisma = require('../config/db');

async function findById(id){
  return prisma.user.findUnique({ where: { id } });
}

async function updateProfile(userId, data){
  const allowed = {
    full_name: data.full_name,
    avatar_url: data.avatar_url,
    college: data.college,
    degree: data.degree,
    total_semesters: data.total_semesters,
  };
  return prisma.user.update({ where: { id: userId }, data: allowed });
}

async function softDeleteAccount(userId){
  return prisma.user.update({ where: { id: userId }, data: { is_active: false } });
}

module.exports = { findById, updateProfile, softDeleteAccount };
