export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { resume } = req.body;
    if (!resume) return res.status(400).json({ error: '请输入简历内容' });

    const API_KEY = process.env.DEEPSEEK_KEY;
    if (!API_KEY) return res.status(500).json({ error: '服务配置错误: DEEPSEEK_KEY 未设置' });

    const prompt = `你是一位专业的简历顾问和HR专家。请对以下简历进行全面诊断分析。

要求：
1. 评估简历的整体质量和专业度
2. 指出优缺点，具体到段落
3. 给出量化评分（总分100）
4. 给出具体的改进建议

简历内容：
${resume}

请以JSON格式回复，包含以下字段：
- score: 总分 (0-100)
- summary: 一句话整体评价
- strengths: 优点列表
- weaknesses: 缺点列表
- suggestions: 具体改进建议列表`;

    const result = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 4096
      })
    });

    if (!result.ok) {
      const err = await result.text();
      return res.status(500).json({ error: `API error: ${result.status}` });
    }

    const data = await result.json();
    const content = data.choices[0].message.content;
    
    let parsed;
    try {
      parsed = JSON.parse(content.replace(/```json\n?|```\n?/g, '').trim());
    } catch {
      parsed = { score: 0, summary: '解析失败', strengths: [], weaknesses: [], suggestions: [] };
    }
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
