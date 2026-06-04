const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const NotesService = require('../services/notes.service');
const { parsePagination } = require('../utils/pagination');
const { noteSchema } = require('../validators/note.validator');

async function list(req, res){
  const p = parsePagination(req.query);
  const filters = { folder: req.query.folder, tags: req.query.tags ? (Array.isArray(req.query.tags) ? req.query.tags : [req.query.tags]) : undefined, search: req.query.search };
  const result = await NotesService.listNotes(req.user.id, filters, { skip: p.skip, take: p.limit });
  return res.json(ApiResponse.success(result.data, 'Notes', 200, { pagination: result.pagination }));
}

async function create(req, res){
  const payload = noteSchema.parse(req.body);
  const n = await NotesService.createNote(req.user.id, payload);
  return res.status(201).json(ApiResponse.success(n, 'Note created', 201));
}

async function get(req, res){
  const n = await NotesService.getNote(req.params.id);
  if(String(n.user_id) !== String(req.user.id)) return res.status(403).json(ApiResponse.error('Unauthorized', 403));
  return res.json(ApiResponse.success(n, 'Note'));
}

async function update(req, res){
  const payload = noteSchema.partial().parse(req.body);
  const n = await NotesService.getNote(req.params.id);
  if(String(n.user_id) !== String(req.user.id)) return res.status(403).json(ApiResponse.error('Unauthorized', 403));
  const updated = await NotesService.updateNote(req.params.id, payload);
  return res.json(ApiResponse.success(updated, 'Note updated'));
}

async function remove(req, res){
  const n = await NotesService.getNote(req.params.id);
  if(String(n.user_id) !== String(req.user.id)) return res.status(403).json(ApiResponse.error('Unauthorized', 403));
  await NotesService.deleteNote(req.params.id);
  return res.json(ApiResponse.success(null, 'Note deleted'));
}

async function folders(req, res){
  const data = await NotesService.listFolders(req.user.id);
  return res.json(ApiResponse.success(data, 'Folders'));
}

module.exports = {
  list: asyncHandler(list),
  create: asyncHandler(create),
  get: asyncHandler(get),
  update: asyncHandler(update),
  remove: asyncHandler(remove),
  folders: asyncHandler(folders),
};
