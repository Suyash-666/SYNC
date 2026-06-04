const { createClient } = require('@supabase/supabase-js');
const { SUPABASE_URL, SUPABASE_KEY } = require('../config/env');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function uploadFile(bucket, path, fileBuffer, mime){
  const { data, error } = await supabase.storage.from(bucket).upload(path, fileBuffer, { contentType: mime, upsert: false });
  if(error) throw new Error(error.message);
  // Build public URL
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${data.Key || data.Key || data?.path || data?.Key}`;
  // Supabase returns 'Key' in some SDKs; to be safe, use from().getPublicUrl
  const { publicURL } = supabase.storage.from(bucket).getPublicUrl(path);
  return { path, publicURL };
}

async function deleteFile(bucket, path){
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if(error) throw new Error(error.message);
  return true;
}

module.exports = { uploadFile, deleteFile };
