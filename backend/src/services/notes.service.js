const NotesRepo = require('../repositories/notes.repository');
const ApiError = require('../utils/ApiError');

async function listNotes(userId, filters = {}, { skip = 0, take = 20 } = {}){
  const data = await NotesRepo.findAll(userId, filters, skip, take);
  const total = await NotesRepo.countFiltered(userId, filters);
  return { data, pagination: { total, page: Math.floor(skip / take) + 1, limit: take, totalPages: Math.ceil(total / take) } };
}

async function createNote(userId, payload){
  return NotesRepo.create(Object.assign({}, payload, { user_id: userId }));
}

async function getNote(id){
  const n = await NotesRepo.findById(id);
  if(!n || n.is_deleted) throw new ApiError('Note not found', 404);
  return n;
}

async function updateNote(id, payload){
  const n = await NotesRepo.findById(id);
  if(!n || n.is_deleted) throw new ApiError('Note not found', 404);
  return NotesRepo.update(id, payload);
}

async function deleteNote(id){
  const n = await NotesRepo.findById(id);
  if(!n) throw new ApiError('Note not found', 404);
  return NotesRepo.softDelete(id);
}

async function listFolders(userId){
  return NotesRepo.distinctFolders(userId);
}

module.exports = { listNotes, createNote, getNote, updateNote, deleteNote, listFolders };
