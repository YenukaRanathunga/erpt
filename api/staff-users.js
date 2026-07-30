import { getState, handleError, methodAllowed, sendJson } from '../lib/platform.js';

export default async function handler(req,res) {
  try {
    if (!methodAllowed(req,res,'GET')) return;
    const state = await getState();
    const users = state.users
      .filter(user => user.role === 'staff')
      .map(({id,name,dept,avatar}) => ({id,name,dept,avatar}));
    sendJson(res,200,{users});
  } catch (error) {
    handleError(res,error);
  }
}

