const prisma = require('../config/db');
const bcrypt = require('bcrypt');

/**
 * Find user by email
 * @param {string} email
 */
async function findByEmail(email){
  return prisma.user.findUnique({ where: { email } });
}

/**
 * Create new user
 * @param {object} data
 */
async function createUser(data){
  return prisma.user.create({ data });
}

/**
 * Update refresh token hash for a user
 * @param {string} userId
 * @param {string} refreshTokenPlain
 */
async function updateRefreshToken(userId, refreshTokenPlain){
  const hash = await bcrypt.hash(refreshTokenPlain, 10);
  return prisma.user.update({ where: { id: userId }, data: { refresh_token: hash } });
}

/**
 * Clear refresh token
 */
async function clearRefreshToken(userId){
  return prisma.user.update({ where: { id: userId }, data: { refresh_token: null } });
}

/**
 * Update user password hash
 */
async function updatePassword(userId, hash){
  return prisma.user.update({ where: { id: userId }, data: { password_hash: hash } });
}

/**
 * Find user by id
 */
async function findById(userId){
  return prisma.user.findUnique({ where: { id: userId } });
}

/**
 * Create password reset record
 */
async function createPasswordReset(userId, tokenHash, expiresAt){
  return prisma.passwordReset.create({ data: { user_id: userId, token_hash: tokenHash, expires_at: expiresAt } });
}

/**
 * Find all valid password reset records (not expired)
 */
async function findValidResets(){
  return prisma.passwordReset.findMany({ where: { expires_at: { gt: new Date() } } });
}

/**
 * Invalidate all password resets for a user
 */
async function invalidateResetsForUser(userId){
  return prisma.passwordReset.deleteMany({ where: { user_id: userId } });
}

module.exports = {
  findByEmail,
  createUser,
  updateRefreshToken,
  clearRefreshToken,
  updatePassword,
  findById,
  createPasswordReset,
  findValidResets,
  invalidateResetsForUser,
};
