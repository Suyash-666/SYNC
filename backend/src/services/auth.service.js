const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const jwtUtils = require('../utils/jwt.utils');
const AuthRepo = require('../repositories/auth.repository');
const UserRepo = require('../repositories/user.repository');
const ApiError = require('../utils/ApiError');

// Simple in-memory brute force tracker. Replace with Redis in production.
const failedLogins = new Map(); // email -> { count, firstAttempt }
const LOCK_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_FAILED = 5;

function recordFailed(email){
  const now = Date.now();
  const entry = failedLogins.get(email) || { count: 0, firstAttempt: now };
  if (now - entry.firstAttempt > LOCK_WINDOW) {
    entry.count = 1;
    entry.firstAttempt = now;
  } else {
    entry.count += 1;
  }
  failedLogins.set(email, entry);
}

function clearFailed(email){
  failedLogins.delete(email);
}

async function signup(data){
  const existing = await AuthRepo.findByEmail(data.email);
  if (existing) throw new ApiError('User already exists', 400);
  const hashed = await bcrypt.hash(data.password, 12);
  const user = await AuthRepo.createUser({ email: data.email, password_hash: hashed, full_name: data.full_name, role: 'STUDENT' });
  const access = jwtUtils.signAccessToken({ id: user.id, role: user.role });
  const refresh = jwtUtils.signRefreshToken({ id: user.id });
  await AuthRepo.updateRefreshToken(user.id, refresh);
  return { user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role }, tokens: { access, refresh } };
}

async function login(data){
  const user = await AuthRepo.findByEmail(data.email);
  if (!user) {
    recordFailed(data.email);
    throw new ApiError('Invalid credentials', 401);
  }

  // check brute force
  const entry = failedLogins.get(data.email);
  if (entry && entry.count >= MAX_FAILED && (Date.now() - entry.firstAttempt) < LOCK_WINDOW) {
    throw new ApiError('Too many failed attempts. Try again later.', 429);
  }

  const ok = await bcrypt.compare(data.password, user.password_hash);
  if (!ok) {
    recordFailed(data.email);
    throw new ApiError('Invalid credentials', 401);
  }

  clearFailed(data.email);
  const access = jwtUtils.signAccessToken({ id: user.id, role: user.role });
  const refresh = jwtUtils.signRefreshToken({ id: user.id });
  await AuthRepo.updateRefreshToken(user.id, refresh);
  return { user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role }, tokens: { access, refresh } };
}

async function refreshToken(refreshToken){
  if(!refreshToken) throw new ApiError('Refresh token required', 401);
  let payload;
  try{ payload = jwtUtils.verifyRefreshToken(refreshToken); } catch(e){ throw new ApiError('Invalid refresh token', 401); }
  const user = await AuthRepo.findById(payload.id);
  if(!user || !user.refresh_token) throw new ApiError('Invalid refresh token', 401);
  const match = await bcrypt.compare(refreshToken, user.refresh_token);
  if(!match) throw new ApiError('Refresh token mismatch', 401);

  // rotate tokens
  const newAccess = jwtUtils.signAccessToken({ id: user.id, role: user.role });
  const newRefresh = jwtUtils.signRefreshToken({ id: user.id });
  await AuthRepo.updateRefreshToken(user.id, newRefresh);
  return { access: newAccess, refresh: newRefresh };
}

async function logout(userId){
  await AuthRepo.clearRefreshToken(userId);
  return true;
}

async function me(userId){
  if(!userId) return null;
  const u = await AuthRepo.findById(userId);
  if(!u) return null;
  return { id: u.id, email: u.email, full_name: u.full_name, role: u.role };
}

async function forgotPassword(email){
  const user = await AuthRepo.findByEmail(email);
  if(!user) return true; // don't reveal existence
  const token = uuidv4();
  const tokenHash = await bcrypt.hash(token, 12);
  const expiresAt = new Date(Date.now() + (60 * 60 * 1000)); // 1 hour
  await AuthRepo.createPasswordReset(user.id, tokenHash, expiresAt);
  // In production: send email. For now return token so dev can use it.
  return token;
}

async function resetPassword(token, newPassword){
  const resets = await AuthRepo.findValidResets();
  for(const r of resets){
    const ok = await bcrypt.compare(token, r.token_hash);
    if(ok){
      // found
      const hash = await bcrypt.hash(newPassword, 12);
      await AuthRepo.updatePassword(r.user_id, hash);
      await AuthRepo.invalidateResetsForUser(r.user_id);
      await AuthRepo.clearRefreshToken(r.user_id);
      return true;
    }
  }
  throw new ApiError('Invalid or expired reset token', 400);
}

module.exports = { signup, login, refreshToken, logout, forgotPassword, resetPassword, me };
