const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const OnboardingService = require('../services/onboarding.service');
const { onboardingSchema } = require('../validators/onboarding.validator');

async function onboard(req, res){
  const payload = onboardingSchema.parse(req.body);
  const result = await OnboardingService.updateUserOnboarding(req.user.id, payload);
  return res.json(ApiResponse.success(result, 'Onboarding saved'));
}

module.exports = { onboard: asyncHandler(onboard) };
