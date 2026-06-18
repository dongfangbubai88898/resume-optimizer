export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { resume, jd } = req.body;
    if (!resume) return res.status(400).json({ error: '请输入简历内容' });

    const API_KEY = process.env.DEEPSEEK_KEY;

    const prompt = `你是一位全能简历顾问。请执行以下三个步骤，以JSON格式回复。

步骤1 - 简历诊断：评估简历质量，给出评分和改进建议。
${jd ? '步骤2 - JD匹配分析：分析简历与职位描述的匹配度。\n职位描述：\n' + jd : '步骤2 - 通用优化建议'}
步骤3 - 简历优化：用STAR法则重写每条经历，突出量化成果。

回复JSON格式：
{
  "diagnosis": { "score": 0, "summary": "", "strengths": [], "weaknesses": [], "suggestions": [] },
  "match": { "matchScore": 0, "summary": "", "matchedSkills": [], "missingSkills": [] },
  "optimized": { "resume": "", "changes": [], "improvements": [] }
}

简历内容：
${resume}`;

    const result = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 8192
      })
    });
    if (!result.ok) return res.status(500).json({ error: 'API error' });

    const data = await result.json();
    const content = data.choices[0].message.content;
    
    let parsed;
    try {
      parsed = JSON.parse(content.replace(/```json\n?|```\n?/g, '').trim());
    } catch {
      parsed = { error: '解析失败', raw: content };
    }
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
