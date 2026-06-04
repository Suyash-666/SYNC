const http = require('http');
const app = require('./src/app');
const { initSockets } = require('./src/sockets');
const { PORT } = require('./src/config/env');

const server = http.createServer(app);
const logger = require('./src/utils/logger');
initSockets(server);

server.listen(PORT, () => {
  logger.info('SYNC backend listening on port %d', PORT);
});
