import { setCors, handleOptions, handleError } from './shared.js';

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    // Vercel parses multipart/form-data into req.body when content-type matches.
    // For text files we can read directly; for PDF/Word we do a best-effort text extraction.
    const body = req.body;
    let text = '';
    if (body && typeof body === 'object' && body.file) {
      const f = body.file;
      if (typeof f === 'string') text = f;
      else if (f.data) text = Buffer.from(f.data, 'base64').toString('utf8');
    } else if (typeof body === 'string') {
      text = body;
    }
    // Strip binary noise for PDF/Word best-effort
    text = (text || '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ').trim();
    if (!text) return res.status(400).json({ error: '无法解析文件内容，请直接粘贴文本' });
    res.json({ text });
  } catch (err) { handleError(res, err); }
}
