// 公共模块：CORS处理、DeepSeek调用、JSON解析
const MODEL = 'deepseek-v4-flash';
const BASE_URL = 'https://api.deepseek.com/chat/completions';

export function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export function handleOptions(req, res) {
  if (req.method === 'OPTIONS') { res.status(200).end(); return true; }
  return false;
}

export function checkPost(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return false; }
  return true;
}

export async function deepseekCall(prompt, options = {}) {
  const API_KEY = process.env.DEEPSEEK_KEY;
  if (!API_KEY) throw new Error('DEEPSEEK_KEY 未设置');
  const timeout = options.timeout ?? 30000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const body = {
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: options.temperature ?? 0.3,
    max_tokens: options.maxTokens ?? 4096
  };
  if (options.jsonMode) body.response_format = { type: 'json_object' };
  try {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`DeepSeek API error (${res.status}): ${errText}`);
    }
    const data = await res.json();
    return data.choices[0].message.content;
  } finally { clearTimeout(timer); }
}

export function parseJson(content) {
  if (!content) return null;
  let s = String(content).replace(/```json\n?|```\n?/g, '').trim();
  // direct parse
  try { return JSON.parse(s); } catch {}
  // extract first balanced {...} block
  const start = s.indexOf('{');
  if (start >= 0) {
    let depth = 0, inStr = false, esc = false, end = -1;
    for (let i = start; i < s.length; i++) {
      const c = s[i];
      if (inStr) {
        if (esc) esc = false;
        else if (c === '\\') esc = true;
        else if (c === '"') inStr = false;
      } else {
        if (c === '"') inStr = true;
        else if (c === '{') depth++;
        else if (c === '}') { depth--; if (depth === 0) { end = i; break; } }
      }
    }
    if (end > start) {
      try { return JSON.parse(s.slice(start, end + 1)); } catch {}
    }
    // truncation repair: close open strings/brackets
    let frag = s.slice(start);
    if (inStr) frag += '"';
    let d = 0, arr = 0, inS = false, es = false;
    for (let i = 0; i < frag.length; i++) {
      const c = frag[i];
      if (inS) { if (es) es = false; else if (c === '\\') es = true; else if (c === '"') inS = false; }
      else { if (c === '"') inS = true; else if (c === '{') d++; else if (c === '}') d--; else if (c === '[') arr++; else if (c === ']') arr--; }
    }
    frag = frag.replace(/,\s*$/, '');
    while (arr-- > 0) frag += ']';
    while (d-- > 0) frag += '}';
    try { return JSON.parse(frag); } catch {}
  }
  return null;
}

export function handleError(res, err) {
  console.error('[API Error]', err.message);
  if (!res.headersSent) res.status(500).json({ error: err.message });
}
