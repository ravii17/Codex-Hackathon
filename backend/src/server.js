import http from 'node:http';

const PORT = Number(process.env.PORT || 4000);

const sendJson = (res, statusCode, body) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || 'http://127.0.0.1:5173',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization'
  });
  res.end(JSON.stringify(body));
};

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/api/health' && req.method === 'GET') {
    sendJson(res, 200, {
      ok: true,
      service: 'amex-resolve-ai-backend',
      timestamp: new Date().toISOString()
    });
    return;
  }

  sendJson(res, 404, {
    ok: false,
    error: 'Route not found'
  });
});

server.listen(PORT, () => {
  console.log(`Backend API listening on http://127.0.0.1:${PORT}`);
});
