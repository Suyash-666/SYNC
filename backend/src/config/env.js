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
  REDIS_URL: process.env.REDIS_URL,
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000'
};
