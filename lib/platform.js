import { createHmac, timingSafeEqual } from 'node:crypto';
import postgres from 'postgres';
import { publicView, seedState } from './core.js';

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('POSTGRES_URL or DATABASE_URL is not configured.');
}

export const sql = postgres(connectionString, {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 15,
  prepare: false,
  ssl: 'require'
});

let initPromise;

export function ensureDatabase() {
  if (!initPromise) {
    initPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS tonererp_state (
          id INTEGER PRIMARY KEY,
          state JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      const initial = JSON.stringify(seedState());
      await sql`
        INSERT INTO tonererp_state (id, state)
        VALUES (1, ${initial}::jsonb)
        ON CONFLICT (id) DO NOTHING
      `;
    })();
  }
  return initPromise;
}

export async function getState() {
  await ensureDatabase();
  const rows = await sql`SELECT state FROM tonererp_state WHERE id = 1`;
  if (!rows.length) throw new Error('TonerERP database state is missing.');
  return typeof rows[0].state === 'string' ? JSON.parse(rows[0].state) : rows[0].state;
}

export async function updateState(userId, updater) {
  await ensureDatabase();
  return sql.begin(async transaction => {
    const rows = await transaction`SELECT state FROM tonererp_state WHERE id = 1 FOR UPDATE`;
    const state = typeof rows[0].state === 'string' ? JSON.parse(rows[0].state) : rows[0].state;
    const user = state.users.find(item => item.id === Number(userId));
    if (!user) throw new Error('Please sign in again.');
    const result = await updater(state, user);
    await transaction`
      UPDATE tonererp_state
      SET state = ${JSON.stringify(state)}::jsonb, updated_at = NOW()
      WHERE id = 1
    `;
    return result ?? { user, state:publicView(state,user) };
  });
}

function sessionSecret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error('SESSION_SECRET must contain at least 32 characters.');
  return value;
}

function sign(value) {
  return createHmac('sha256', sessionSecret()).update(value).digest('base64url');
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && timingSafeEqual(a,b);
}

function parseCookies(req) {
  return Object.fromEntries(String(req.headers.cookie || '').split(';').map(item => item.trim()).filter(Boolean).map(item => {
    const index = item.indexOf('=');
    return [item.slice(0,index), decodeURIComponent(item.slice(index+1))];
  }));
}

export function createSessionCookie(userId) {
  const payload = Buffer.from(JSON.stringify({
    userId:Number(userId),
    expiresAt:Date.now() + 8 * 60 * 60 * 1000
  })).toString('base64url');
  const token = `${payload}.${sign(payload)}`;
  return `tonererp_session=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`;
}

export function clearSessionCookie() {
  return 'tonererp_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0';
}

export function sessionUserId(req) {
  const token = parseCookies(req).tonererp_session;
  if (!token) return null;
  const separator = token.lastIndexOf('.');
  if (separator < 1) return null;
  const payload = token.slice(0,separator);
  const signature = token.slice(separator+1);
  if (!safeEqual(signature,sign(payload))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload,'base64url').toString('utf8'));
    if (!parsed.userId || parsed.expiresAt < Date.now()) return null;
    return Number(parsed.userId);
  } catch {
    return null;
  }
}

export async function currentUser(req) {
  const userId = sessionUserId(req);
  if (!userId) return null;
  const state = await getState();
  return state.users.find(item => item.id === userId) || null;
}

export function adminPasswordMatches(password) {
  const configured = process.env.ADMIN_PASSWORD;
  if (!configured) throw new Error('ADMIN_PASSWORD is not configured.');
  return safeEqual(password,configured);
}

export async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { throw new Error('Invalid request data.'); }
  }
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 100000) throw new Error('Request is too large.');
  }
  try { return body ? JSON.parse(body) : {}; }
  catch { throw new Error('Invalid request data.'); }
}

export function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    const originHost = new URL(origin).host;
    const requestHost = req.headers['x-forwarded-host'] || req.headers.host;
    return originHost === requestHost;
  } catch {
    return false;
  }
}

export function setSecurityHeaders(res) {
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-Frame-Options','DENY');
  res.setHeader('Referrer-Policy','no-referrer');
}

export function sendJson(res,status,body,headers={}) {
  setSecurityHeaders(res);
  Object.entries(headers).forEach(([name,value]) => res.setHeader(name,value));
  res.status(status).json(body);
}

export function methodAllowed(req,res,method) {
  if (req.method === method) return true;
  sendJson(res,405,{error:'Method not allowed.'},{Allow:method});
  return false;
}

export function postAllowed(req,res) {
  if (!methodAllowed(req,res,'POST')) return false;
  if (!sameOrigin(req)) {
    sendJson(res,403,{error:'Blocked cross-site request.'});
    return false;
  }
  if (req.headers['x-tonererp-request'] !== '1') {
    sendJson(res,403,{error:'Invalid request.'});
    return false;
  }
  return true;
}

export function handleError(res,error) {
  const message = error instanceof Error ? error.message : 'Request failed.';
  const configurationError = /not configured|SESSION_SECRET|database/i.test(message);
  sendJson(res,configurationError ? 500 : 400,{error:configurationError ? 'The online database is not configured yet.' : message});
}
