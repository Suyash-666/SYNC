const ResourcesRepo = require('../repositories/resources.repository');
const Storage = require('./storage.service');
const ApiError = require('../utils/ApiError');

async function listResources(userId, filters = {}, { skip = 0, take = 20 } = {}){
  const data = await ResourcesRepo.findAll(userId, filters, skip, take);
  const total = await ResourcesRepo.countFiltered(userId, filters);
  return { data, pagination: { total, page: Math.floor(skip / take) + 1, limit: take, totalPages: Math.ceil(total / take) } };
}

async function uploadFile(userId, fileBuffer, bucket, path, mime, size, subject_id, title){
  const { publicURL } = await Storage.uploadFile(bucket, path, fileBuffer, mime);
  const data = { user_id: userId, subject_id: subject_id || null, title: title || path.split('/').pop(), file_url: publicURL, file_type: mime.includes('image') ? 'IMAGE' : 'PDF', file_size: size };
  return ResourcesRepo.create(data);
}

async function createLinkResource(userId, payload){
  const data = Object.assign({}, payload, { user_id: userId });
  return ResourcesRepo.create(data);
}

async function getResource(id){
  const r = await ResourcesRepo.findById(id);
  if(!r) throw new ApiError('Resource not found', 404);
  return r;
}

async function deleteResource(id){
  const r = await ResourcesRepo.findById(id);
  if(!r) throw new ApiError('Resource not found', 404);
  // attempt to delete file from storage if URL contains path
  try{
    const marker = '/object/public/';
    if(r.file_url && r.file_url.includes(marker)){
      const idx = r.file_url.indexOf(marker) + marker.length;
      const after = r.file_url.substring(idx);
      const parts = after.split('/');
      const bucket = parts.shift();
      const path = parts.join('/');
      await Storage.deleteFile(bucket, path);
    }
  }catch(e){ /* ignore storage delete errors */ }
  return ResourcesRepo.remove(id);
}

module.exports = { listResources, uploadFile, createLinkResource, getResource, deleteResource };
