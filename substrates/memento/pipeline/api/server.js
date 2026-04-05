#!/usr/bin/env node

/**
 * Memento API server.
 *
 * Usage: node pipeline/api/server.js [port]
 * Default port: 7890
 */

const http = require('http');
const reminders = require('./reminders');

const PORT = parseInt(process.argv[2] || process.env.MEMENTO_API_PORT || '7890', 10);

const server = http.createServer((req, res) => {
  // CORS for local dev tools
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  reminders.route(req, res);
});

server.listen(PORT, () => {
  console.log(`[memento-api] Listening on http://localhost:${PORT}`);
});
