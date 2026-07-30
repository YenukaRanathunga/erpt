import { publicView } from '../lib/core.js';
import {
  getState, handleError, methodAllowed, sendJson, sessionUserId
} from '../lib/platform.js';

export default async function handler(req,res) {
  try {
    if (!methodAllowed(req,res,'GET')) return;
    const userId = sessionUserId(req);
    if (!userId) {
      sendJson(res,401,{error:'Please sign in.'});
      return;
    }
    const state = await getState();
    const user = state.users.find(item => item.id === userId);
    if (!user) {
      sendJson(res,401,{error:'Please sign in again.'});
      return;
    }
    sendJson(res,200,{user,state:publicView(state,user)});
  } catch (error) {
    handleError(res,error);
  }
}

