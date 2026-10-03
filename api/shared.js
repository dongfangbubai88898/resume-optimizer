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
  try {
    return JSON.parse(content.replace(/```json\n?|```\n?/g, '').trim());
  } catch { return null; }
}

export function handleError(res, err) {
  console.error('[API Error]', err.message);
  if (!res.headersSent) res.status(500).json({ error: err.message });
}
