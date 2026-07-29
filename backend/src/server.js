import http from 'node:http';
import { getCustomerCase, getInvestigatorCase, investigateDispute } from './investigationService.js';

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

  const role = req.headers['x-user-role'];
  const customerId = req.headers['x-customer-id'] || 'CUST-1008';

  const investigateMatch = req.url?.match(/^\/api\/investigations\/([^/]+)\/run$/);
  if (investigateMatch && req.method === 'POST') {
    if (role !== 'investigator') {
      sendJson(res, 403, { ok: false, error: 'Investigator access required' });
      return;
    }
    try {
      sendJson(res, 200, { ok: true, case: investigateDispute(decodeURIComponent(investigateMatch[1])) });
    } catch (error) {
      sendJson(res, error.statusCode || 500, { ok: false, error: error.message || 'Investigation failed' });
    }
    return;
  }

  const investigatorMatch = req.url?.match(/^\/api\/investigator\/cases\/([^/]+)\/investigation$/);
  if (investigatorMatch && req.method === 'GET') {
    if (role !== 'investigator') {
      sendJson(res, 403, { ok: false, error: 'Investigator access required' });
      return;
    }
    const record = getInvestigatorCase(decodeURIComponent(investigatorMatch[1]));
    if (!record) {
      sendJson(res, 404, { ok: false, error: 'Case not found' });
      return;
    }
    sendJson(res, 200, { ok: true, case: record });
    return;
  }

  const customerMatch = req.url?.match(/^\/api\/customer\/cases\/([^/]+)$/);
  if (customerMatch && req.method === 'GET') {
    if (role !== 'cardmember' && role !== 'investigator') {
      sendJson(res, 403, { ok: false, error: 'Authorized case access required' });
      return;
    }
    const record = getCustomerCase(decodeURIComponent(customerMatch[1]), String(customerId));
    if (!record) {
      sendJson(res, 404, { ok: false, error: 'Case not found' });
      return;
    }
    sendJson(res, 200, { ok: true, case: record });
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
