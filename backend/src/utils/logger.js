const { createLogger, format, transports } = require('winston');
const path = require('path');

const isProd = process.env.NODE_ENV === 'production';

const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.errors({ stack: true }), format.splat(), format.json()),
  transports: [
    new transports.File({ filename: path.join('logs','error.log'), level: 'error' }),
    new transports.File({ filename: path.join('logs','app.log') }),
  ],
});

if(!isProd){
  logger.add(new transports.Console({ format: format.combine(format.colorize(), format.simple()) }));
}

logger.stream = { write: (msg) => logger.info(msg.trim()) };

module.exports = logger;
