const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const UsersService = require('../services/users.service');
const { profileUpdateSchema } = require('../validators/user.validator');

async function getProfile(req, res){
  const user = await UsersService.getProfile(req.user.id);
  return res.json(ApiResponse.success(user, 'Profile fetched'));
}

async function updateProfile(req, res){
  const parsed = profileUpdateSchema.parse(req.body);
  const user = await UsersService.updateProfile(req.user.id, parsed);
  return res.json(ApiResponse.success(user, 'Profile updated'));
}

async function deleteAccount(req, res){
  await UsersService.deleteAccount(req.user.id);
  return res.json(ApiResponse.success(null, 'Account deactivated'));
}

module.exports = {
  getProfile: asyncHandler(getProfile),
  updateProfile: asyncHandler(updateProfile),
  deleteAccount: asyncHandler(deleteAccount),
};
