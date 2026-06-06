const dotenv = require('dotenv');
dotenv.config();

const required = ['DATABASE_URL','JWT_SECRET','JWT_REFRESH_SECRET','PORT','CORS_ORIGIN'];

required.forEach(key=>{
  if(!process.env[key]){
    throw new Error(`Missing required env var: ${key}`);
  }
});

module.exports = {
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  PORT: process.env.PORT || 4000,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_KEY: process.env.SUPABASE_KEY,
  // Additive exports for the Supabase migration.  Both are optional during
  // Checkpoint 1; SUPABASE_SERVICE_KEY takes priority, SUPABASE_KEY remains
  // for backward compatibility with the existing storage service.
  // We also accept VITE_SUPABASE_SERVICE_KEY so that a single env file can
  // be shared between the Node backend and the Vite frontend without
  // duplicating the service-role key.
  SUPABASE_SERVICE_KEY:
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.VITE_SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_KEY,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  REDIS_URL: process.env.REDIS_URL,
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  // AI provider — OpenAI-compatible. Defaults to Groq (groq.com — fast LLM
  // inference) with llama-3.3-70b. Override via env to swap providers:
  //   Groq:   AI_BASE_URL=https://api.groq.com/openai/v1  AI_MODEL=llama-3.3-70b-versatile
  //   xAI:    AI_BASE_URL=https://api.x.ai/v1             AI_MODEL=grok-2-latest
  //   OpenAI: AI_BASE_URL=https://api.openai.com/v1       AI_MODEL=gpt-4o-mini
  // GROQ_API_KEY is the preferred env var; the rest are accepted aliases.
  AI_API_KEY: process.env.AI_API_KEY || process.env.GROQ_API_KEY || process.env.GROK_API_KEY || process.env.XAI_API_KEY || process.env.OPENAI_API_KEY,
  AI_BASE_URL: process.env.AI_BASE_URL || 'https://api.groq.com/openai/v1',
  AI_MODEL: process.env.AI_MODEL || 'llama-3.3-70b-versatile'
};
