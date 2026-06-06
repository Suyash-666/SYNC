// @deprecated since Checkpoint 2 — auth now goes through Supabase Auth + a
// thin legacy JWT issuance layer. Kept alive for the auth endpoints' HTTP
// routes until Checkpoint 8 deletion (which only happens after production
// validation per MIGRATION_RULES.md).
//
// HALT NOTE: the controller below is the PREVIOUS implementation. A prior
// edit replaced it with 410 stubs. That change is being reverted pending a
// caller audit.  Do not switch these endpoints to 410 until every caller
// (frontend, mobile, scripts, integration tests) has been confirmed to use
// Supabase Auth directly.
const AuthService = require('../services/auth.service');
const ApiResponse = require('../utils/ApiResponse');
const { JWT_REFRESH_SECRET } = require('../config/env');

function cookieOptions(req){
  const secure = process.env.NODE_ENV === 'production';
  return { httpOnly: true, secure, sameSite: 'strict', path: '/', maxAge: 7 * 24 * 60 * 60 * 1000 };
}

async function signup(req, res){
  const result = await AuthService.signup(req.body);
  res.cookie('refreshToken', result.tokens.refresh, cookieOptions(req));
  return res.status(201).json(ApiResponse.success({ access: result.tokens.access, user: result.user }, 'User created', 201));
}

async function login(req, res){
  const result = await AuthService.login(req.body);
  res.cookie('refreshToken', result.tokens.refresh, cookieOptions(req));
  return res.json(ApiResponse.success({ access: result.tokens.access, user: result.user }, 'Logged in'));
}

async function refresh(req, res){
  const token = req.cookies?.refreshToken || req.body.refreshToken || null;
  const tokens = await AuthService.refreshToken(token);
  res.cookie('refreshToken', tokens.refresh, cookieOptions(req));
  return res.json(ApiResponse.success({ access: tokens.access }, 'Token refreshed'));
}

async function logout(req, res){
  const userId = req.user?.id;
  if(userId) await AuthService.logout(userId);
  res.clearCookie('refreshToken');
  return res.json(ApiResponse.success(null, 'Logged out'));
}

async function forgotPassword(req, res){
  const token = await AuthService.forgotPassword(req.body.email);
  // return token for development purposes
  return res.json(ApiResponse.success({ token }, 'Password reset token generated'));
}

async function resetPassword(req, res){
  await AuthService.resetPassword(req.body.token, req.body.new_password);
  return res.json(ApiResponse.success(null, 'Password has been reset'));
}

async function me(req, res){
  if(!req.user) return res.json(ApiResponse.success(null, 'No user'));
  const user = await AuthService.me(req.user.id);
  return res.json(ApiResponse.success(user, 'Current user'));
}

module.exports = { signup, login, refresh, logout, forgotPassword, resetPassword, me };
