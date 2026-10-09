#!/usr/bin/env node
// A tiny stand-in for Supabase so the web app can run locally with no account.
// It answers the handful of auth and REST calls the app makes, for ONE fictional user.
// Nothing here talks to the internet. Start it with `npm run demo:supabase`, then `npm run demo`.
//
//   GET  /demo/login       sets the session cookie and redirects to the app (open this first)
//   GET  /auth/v1/user     the signed-in user
//   POST /auth/v1/token    refresh
//   POST /auth/v1/logout
//   GET|PATCH /rest/v1/<table>
import http from 'node:http';
import crypto from 'node:crypto';

const PORT = Number(process.env.DEMO_SUPABASE_PORT || 54399);
const APP_URL = process.env.DEMO_APP_URL || 'http://127.0.0.1:3000';
// Must match SUPABASE_JWT_SECRET in demo.env. Not a real secret.
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET || 'local-demo-only-not-a-secret';

const now = Math.floor(Date.now() / 1000);
const user = {
  id: '0b6f3c1e-7d2a-4c8e-9a51-5e3d2f8b6a10',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'maya@northwind.example.com',
  email_confirmed_at: '2025-09-02T08:00:00Z',
  created_at: '2025-09-02T08:00:00Z',
  updated_at: '2025-10-14T07:00:00Z',
  app_metadata: { provider: 'google', providers: ['google'], role: 'user' },
  user_metadata: { full_name: 'Maya Chen', avatar_url: '' },
  identities: [],
};

const b64url = (b) => Buffer.from(b).toString('base64url');
function signJwt(payload) {
  const head = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(`${head}.${body}`).digest('base64url');
  return `${head}.${body}.${sig}`;
}

function session() {
  const exp = Math.floor(Date.now() / 1000) + 3600 * 24;
  return {
    access_token: signJwt({ sub: user.id, email: user.email, role: 'authenticated', aud: 'authenticated', exp, iat: now, app_metadata: user.app_metadata, user_metadata: user.user_metadata }),
    token_type: 'bearer',
    expires_in: 3600 * 24,
    expires_at: exp,
    refresh_token: 'demo-refresh',
    user,
  };
}

const prices = [
  { id: 'price_demo_month', product_id: 'prod_demo', active: true, currency: 'usd', type: 'recurring', unit_amount: 2000, interval: 'month', interval_count: 1, trial_period_days: 7, metadata: {} },
  { id: 'price_demo_year', product_id: 'prod_demo', active: true, currency: 'usd', type: 'recurring', unit_amount: 15000, interval: 'year', interval_count: 1, trial_period_days: 7, metadata: {} },
];
const product = { id: 'prod_demo', active: true, name: 'InboxClarity', description: 'A daily AI summary of your inbox.', image: null, metadata: { index: 0, app_code: 'inboxclarity' } };
const tables = {
  products: [{ ...product, prices }],
  subscriptions: [{
    id: 'sub_demo', user_id: user.id, email: user.email, status: 'trialing', price_id: 'price_demo_month', quantity: 1,
    cancel_at_period_end: false, created: '2025-10-10T08:00:00Z', current_period_start: '2025-10-10T08:00:00Z', current_period_end: '2025-11-10T08:00:00Z',
    trial_start: '2025-10-10T08:00:00Z', trial_end: '2025-10-17T08:00:00Z', metadata: { app_code: 'inboxclarity' },
    prices: { ...prices[0], products: product },
  }],
  inboxclarity_user_newsletters: [{ user_id: user.id, email: user.email, preferred_hour: 7, timezone: 'Europe/London', is_subscribed: true }],
  users: [{ id: user.id, full_name: 'Maya Chen', avatar_url: '', email: user.email }],
  customers: [],
};

function send(res, status, body, headers = {}) {
  const h = { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS', ...headers };
  res.writeHead(status, h);
  res.end(body === undefined ? '' : typeof body === 'string' ? body : JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve) => {
    let d = '';
    req.on('data', (c) => (d += c));
    req.on('end', () => resolve(d));
  });
}

function filterRows(rows, params) {
  return rows.filter((row) => {
    for (const [k, v] of params) {
      if (['select', 'order', 'limit', 'offset'].includes(k) || k.includes('.')) continue;
      if (!(k in row)) continue;
      const val = String(row[k]);
      if (v.startsWith('eq.') && val !== decodeURIComponent(v.slice(3))) return false;
      if (v.startsWith('in.')) {
        const set = v.slice(4, -1).split(',').map((s) => s.replace(/"/g, ''));
        if (!set.includes(val)) return false;
      }
    }
    return true;
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (req.method === 'OPTIONS') return send(res, 204);

  if (url.pathname === '/demo/login') {
    // Same cookie format @supabase/ssr 0.4 writes: sb-<host prefix>-auth-token = "base64-" + base64url(session)
    const cookieName = `sb-${new URL(`http://${req.headers.host}`).hostname.split('.')[0]}-auth-token`;
    const value = 'base64-' + b64url(JSON.stringify(session()));
    return send(res, 302, '', { location: `${APP_URL}/settings`, 'set-cookie': `${cookieName}=${value}; Path=/; SameSite=Lax` });
  }
  if (url.pathname === '/auth/v1/user') return send(res, 200, user);
  if (url.pathname === '/auth/v1/token') return send(res, 200, session());
  if (url.pathname === '/auth/v1/logout') return send(res, 204);

  const m = url.pathname.match(/^\/rest\/v1\/([a-z_]+)$/);
  if (m) {
    const rows = tables[m[1]] || [];
    const params = [...url.searchParams.entries()];
    const single = (req.headers.accept || '').includes('vnd.pgrst.object');
    if (req.method === 'PATCH' || req.method === 'POST') {
      const patch = JSON.parse((await readBody(req)) || '{}');
      const hit = req.method === 'PATCH' ? filterRows(rows, params) : [];
      hit.forEach((r) => Object.assign(r, patch));
      return send(res, req.headers.prefer?.includes('return=representation') ? 200 : 204, req.headers.prefer?.includes('return=representation') ? hit : undefined);
    }
    const out = filterRows(rows, params);
    if (single) return out.length ? send(res, 200, out[0]) : send(res, 406, { code: 'PGRST116', message: 'no rows' });
    return send(res, 200, out, { 'content-range': `0-${Math.max(out.length - 1, 0)}/${out.length}` });
  }
  return send(res, 404, { message: 'not found in demo stub', path: url.pathname });
});

server.listen(PORT, '127.0.0.1', () => console.log(`demo supabase on http://127.0.0.1:${PORT} (open /demo/login)`));
