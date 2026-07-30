import {
  createSessionCookie, getState, handleError, postAllowed, readJson, sendJson
} from '../lib/platform.js';

export default async function handler(req,res) {
  try {
    if (!postAllowed(req,res)) return;
    const body = await readJson(req);
    const state = await getState();
    const user = state.users.find(item => item.id === Number(body.userId) && item.role === 'staff');
    if (!user) {
      sendJson(res,404,{error:'Staff profile was not found.'});
      return;
    }
    sendJson(res,200,{ok:true},{'Set-Cookie':createSessionCookie(user.id)});
  } catch (error) {
    handleError(res,error);
  }
}

