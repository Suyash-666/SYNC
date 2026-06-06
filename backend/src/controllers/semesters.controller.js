// @deprecated since Checkpoint 5e — frontend uses supabase.from('Semester')
// directly. Kept alive for the legacy HTTP routes until Checkpoint 8 deletion.
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const SemService = require('../services/semesters.service');
const { parsePagination } = require('../utils/pagination');
const { semesterSchema } = require('../validators/semester.validator');

async function list(req, res){
  const { skip, limit } = (()=>{ const p = parsePagination(req.query); return { skip: p.skip, limit: p.limit }; })();
  const items = await SemService.listSemesters(req.user.id, { skip, take: limit });
  return res.json(ApiResponse.success(items, 'Semesters'));
}

async function get(req, res){
  const s = await SemService.getSemester(req.params.id);
  return res.json(ApiResponse.success(s, 'Semester'));
}

async function create(req, res){
  const payload = semesterSchema.parse(req.body);
  const s = await SemService.createSemester(req.user.id, payload);
  return res.status(201).json(ApiResponse.success(s, 'Semester created', 201));
}

async function update(req, res){
  const payload = semesterSchema.partial().parse(req.body);
  const s = await SemService.updateSemester(req.params.id, payload);
  return res.json(ApiResponse.success(s, 'Semester updated'));
}

async function remove(req, res){
  await SemService.deleteSemester(req.params.id);
  return res.json(ApiResponse.success(null, 'Semester deleted'));
}

async function setCurrent(req, res){
  const s = await SemService.setCurrentSemester(req.user.id, req.params.id);
  return res.json(ApiResponse.success(s, 'Semester set as current'));
}

module.exports = {
  list: asyncHandler(list),
  get: asyncHandler(get),
  create: asyncHandler(create),
  update: asyncHandler(update),
  remove: asyncHandler(remove),
  setCurrent: asyncHandler(setCurrent),
};
