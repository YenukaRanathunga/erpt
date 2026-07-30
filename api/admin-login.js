import {
  adminPasswordMatches, createSessionCookie, getState, handleError,
  postAllowed, readJson, sendJson
} from '../lib/platform.js';

export default async function handler(req,res) {
  try {
    if (!postAllowed(req,res)) return;
    const body = await readJson(req);
    const username = String(body.username || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (username !== 'admin' || !adminPasswordMatches(password)) {
      sendJson(res,401,{error:'Incorrect admin name or password.'});
      return;
    }
    const state = await getState();
    const admin = state.users.find(user => user.id === 1 && user.role === 'admin');
    if (!admin) throw new Error('Administrator profile is missing.');
    sendJson(res,200,{ok:true},{'Set-Cookie':createSessionCookie(admin.id)});
  } catch (error) {
    handleError(res,error);
  }
}

