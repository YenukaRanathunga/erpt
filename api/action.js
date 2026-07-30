import { performAction, publicView } from '../lib/core.js';
import {
  handleError, postAllowed, readJson, sendJson, sessionUserId, updateState
} from '../lib/platform.js';

export default async function handler(req,res) {
  try {
    if (!postAllowed(req,res)) return;
    const userId = sessionUserId(req);
    if (!userId) {
      sendJson(res,401,{error:'Please sign in.'});
      return;
    }
    const body = await readJson(req);
    const response = await updateState(userId,(state,user) => {
      performAction(state,user,String(body.action || ''),body.payload || {});
      const refreshedUser = state.users.find(item => item.id === user.id) || user;
      return {user:refreshedUser,state:publicView(state,refreshedUser)};
    });
    sendJson(res,200,response);
  } catch (error) {
    handleError(res,error);
  }
}
