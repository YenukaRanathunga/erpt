import { clearSessionCookie, handleError, postAllowed, sendJson } from '../lib/platform.js';

export default async function handler(req,res) {
  try {
    if (!postAllowed(req,res)) return;
    sendJson(res,200,{ok:true},{'Set-Cookie':clearSessionCookie()});
  } catch (error) {
    handleError(res,error);
  }
}

