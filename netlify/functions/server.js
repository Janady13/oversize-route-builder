const serverless = require('serverless-http');
// server/index.js exports the configured Express app without starting a listener
const app = require('../../server');

module.exports.handler = serverless(app);

