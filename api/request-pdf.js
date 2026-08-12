import { generateRequestPdf, requestPdfFilename } from '../lib/request-pdf.js';
import { currentUser, getState, handleError, methodAllowed, setSecurityHeaders } from '../lib/platform.js';

export default async function handler(req, res) {
  try {
    if (!methodAllowed(req, res, 'GET')) return;
    const user = await currentUser(req);
    if (!user || user.role !== 'admin') {
      res.status(403).json({ error: 'Administrator permission is required.' });
      return;
    }
    const id = Number(req.query?.id);
    if (!Number.isSafeInteger(id) || id < 1) {
      res.status(400).json({ error: 'Invalid request number.' });
      return;
    }
    const state = await getState();
    const request = state.requests.find(item => item.id === id);
    if (!request) {
      res.status(404).json({ error: 'Request was not found.' });
      return;
    }
    const requester = state.users.find(item => item.id === request.uid);
    const printer = state.printers.find(item => item.name === request.printer);
    const pdf = generateRequestPdf({ request, requester, printer });
    setSecurityHeaders(res);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${requestPdfFilename(request.id)}"`);
    res.setHeader('Content-Length', String(pdf.length));
    res.status(200).send(pdf);
  } catch (error) {
    handleError(res, error);
  }
}
