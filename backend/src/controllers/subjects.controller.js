const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const SubjectsService = require('../services/subjects.service');
const { parsePagination } = require('../utils/pagination');
const { subjectSchema, moduleSchema } = require('../validators/subject.validator');

async function list(req, res){
  const p = parsePagination(req.query);
  const items = await SubjectsService.listSubjects(req.params.semesterId, { skip: p.skip, take: p.limit });
  return res.json(ApiResponse.success(items, 'Subjects'));
}

async function get(req, res){
  const s = await SubjectsService.getSubject(req.params.id);
  return res.json(ApiResponse.success(s, 'Subject'));
}

async function create(req, res){
  const payload = subjectSchema.parse(req.body);
  const s = await SubjectsService.createSubject(req.params.semesterId, payload);
  return res.status(201).json(ApiResponse.success(s, 'Subject created', 201));
}

async function update(req, res){
  const payload = subjectSchema.partial().parse(req.body);
  const s = await SubjectsService.updateSubject(req.params.id, payload);
  return res.json(ApiResponse.success(s, 'Subject updated'));
}

async function remove(req, res){
  await SubjectsService.deleteSubject(req.params.id);
  return res.json(ApiResponse.success(null, 'Subject deleted'));
}

async function addModule(req, res){
  const payload = moduleSchema.parse(req.body);
  const m = await SubjectsService.addModule(req.params.id, payload);
  return res.status(201).json(ApiResponse.success(m, 'Module added', 201));
}

async function updateModule(req, res){
  const payload = moduleSchema.partial().parse(req.body);
  const m = await SubjectsService.updateModule(req.params.moduleId, payload);
  return res.json(ApiResponse.success(m, 'Module updated'));
}

async function deleteModule(req, res){
  await SubjectsService.deleteModule(req.params.moduleId);
  return res.json(ApiResponse.success(null, 'Module deleted'));
}

async function toggleTopic(req, res){
  const t = await SubjectsService.toggleTopic(req.params.subjectId, req.params.topicId);
  return res.json(ApiResponse.success(t, 'Topic toggled'));
}

module.exports = {
  list: asyncHandler(list),
  get: asyncHandler(get),
  create: asyncHandler(create),
  update: asyncHandler(update),
  remove: asyncHandler(remove),
  addModule: asyncHandler(addModule),
  updateModule: asyncHandler(updateModule),
  deleteModule: asyncHandler(deleteModule),
  toggleTopic: asyncHandler(toggleTopic),
};
