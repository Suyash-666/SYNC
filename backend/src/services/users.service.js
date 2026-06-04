const UsersRepo = require('../repositories/users.repository');
const ApiError = require('../utils/ApiError');

async function getProfile(userId){
  const u = await UsersRepo.findById(userId);
  if(!u) throw new ApiError('User not found', 404);
  return { id: u.id, email: u.email, full_name: u.full_name, avatar_url: u.avatar_url, role: u.role, is_onboarded: u.is_onboarded, college: u.college, degree: u.degree };
}

async function updateProfile(userId, payload){
  // Basic validation done via zod in controller; ensure user exists
  const u = await UsersRepo.findById(userId);
  if(!u) throw new ApiError('User not found', 404);
  const updated = await UsersRepo.updateProfile(userId, payload);
  return { id: updated.id, full_name: updated.full_name, avatar_url: updated.avatar_url, college: updated.college, degree: updated.degree };
}

async function deleteAccount(userId){
  const u = await UsersRepo.findById(userId);
  if(!u) throw new ApiError('User not found', 404);
  await UsersRepo.softDeleteAccount(userId);
  return true;
}

module.exports = { getProfile, updateProfile, deleteAccount };
