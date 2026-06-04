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
