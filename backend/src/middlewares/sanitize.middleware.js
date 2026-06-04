function sanitizeString(s){
  return String(s).replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '').trim();
}

function sanitize(obj){
  if(typeof obj === 'string') return sanitizeString(obj);
  if(Array.isArray(obj)) return obj.map(sanitize);
  if(typeof obj === 'object' && obj !== null){
    const out = {};
    for(const k of Object.keys(obj)){
      out[k] = sanitize(obj[k]);
    }
    return out;
  }
  return obj;
}

function sanitizeMiddleware(req, res, next){
  if(req.body) req.body = sanitize(req.body);
  if(req.query) req.query = sanitize(req.query);
  return next();
}

module.exports = sanitizeMiddleware;
