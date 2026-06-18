export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { resume, jd } = req.body;
    if (!resume || !jd) return res.status(400).json({ error: '请同时提供简历和JD' });

    const API_KEY = process.env.DEEPSEEK_KEY;
    const prompt = `你是一位资深招聘专家。请分析以下简历与职位描述(JD)的匹配程度。

简历：
${resume}

职位描述：
${jd}

请以JSON格式回复：
- matchScore: 匹配度 (0-100)
- summary: 匹配度总结
- matchedSkills: 匹配的技能/经验列表
- missingSkills: 缺失的技能/经验列表
- suggestions: 针对JD的优化建议`;

    const result = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 4096
      })
    });
    if (!result.ok) return res.status(500).json({ error: 'API error' });

    const data = await result.json();
    const content = data.choices[0].message.content;
    
    let parsed;
    try {
      parsed = JSON.parse(content.replace(/```json\n?|```\n?/g, '').trim());
    } catch {
      parsed = { matchScore: 0, summary: '解析失败', matchedSkills: [], missingSkills: [], suggestions: [] };
    }
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
