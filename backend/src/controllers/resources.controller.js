// @deprecated since Checkpoint 3 — frontend uploads directly to Supabase
// Storage. Kept alive for the legacy HTTP routes until Checkpoint 8 deletion.
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const ResourcesService = require('../services/resources.service');
const upload = require('../middlewares/upload.middleware');
const { linkResourceSchema } = require('../validators/resource.validator');

// Allowed MIME types
const ALLOWED = ['application/pdf','image/jpeg','image/png','image/webp'];

async function list(req, res){
  const page = Math.max(1, parseInt(req.query.page||'1',10));
  const limit = Math.min(100, parseInt(req.query.limit||'20',10));
  const skip = (page-1)*limit;
  const filters = { subject_id: req.query.subject_id, file_type: req.query.file_type };
  const result = await ResourcesService.listResources(req.user.id, filters, { skip, take: limit });
  return res.json(ApiResponse.success(result.data, 'Resources', 200, { pagination: result.pagination }));
}

async function uploadFileHandler(req, res){
  // multer has populated req.file
  if(!req.file) return res.status(400).json(ApiResponse.error('No file uploaded',400));
  if(!ALLOWED.includes(req.file.mimetype)) return res.status(400).json(ApiResponse.error('File type not allowed',400));
  const bucket = process.env.SUPABASE_BUCKET || 'resources';
  const path = `${req.user.id}/${Date.now()}_${encodeURIComponent(req.file.originalname)}`;
  const resource = await ResourcesService.uploadFile(req.user.id, req.file.buffer, bucket, path, req.file.mimetype, req.file.size, req.body.subject_id, req.body.title || req.file.originalname);
  return res.status(201).json(ApiResponse.success(resource, 'File uploaded', 201));
}

async function createLink(req, res){
  const payload = linkResourceSchema.parse(req.body);
  const r = await ResourcesService.createLinkResource(req.user.id, payload);
  return res.status(201).json(ApiResponse.success(r, 'Resource created', 201));
}

async function remove(req, res){
  const r = await ResourcesService.getResource(req.params.id);
  if(String(r.user_id) !== String(req.user.id)) return res.status(403).json(ApiResponse.error('Unauthorized',403));
  await ResourcesService.deleteResource(req.params.id);
  return res.json(ApiResponse.success(null, 'Resource deleted'));
}

module.exports = {
  list: asyncHandler(list),
  uploadFile: [upload.single('file'), asyncHandler(uploadFileHandler)],
  createLink: asyncHandler(createLink),
  remove: asyncHandler(remove),
};
