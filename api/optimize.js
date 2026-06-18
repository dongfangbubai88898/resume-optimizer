export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { resume, jd, style = 'professional' } = req.body;
    if (!resume) return res.status(400).json({ error: '请输入简历内容' });

    const API_KEY = process.env.DEEPSEEK_KEY;

    let styleGuide = '';
    if (style === 'professional') styleGuide = '专业正式、突出成果数据、用词精炼有力';
    else if (style === 'concise') styleGuide = '极度精简、一页以内、只保留核心信息';
    else if (style === 'creative') styleGuide = '体现个性和创造力、用语生动';

    const prompt = `你是一位顶尖简历优化专家。请对以下简历进行深度优化。

${jd ? `目标职位描述：\n${jd}\n\n请重点优化简历使其更匹配该JD。` : '请进行通用优化，提升整体质量。'}

优化要求：
- 风格：${styleGuide}
- 每条工作/项目经历用STAR法则（情境-任务-行动-结果）重写
- 突出量化成果（数字、百分比）
- 优化措辞，去掉废话
- 保持真实，不编造经历

原始简历：
${resume}

请以JSON格式回复：
- optimizedResume: 优化后的完整简历
- changes: 主要修改说明列表
- improvements: 优化亮点列表`;

    const result = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
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
      parsed = { optimizedResume: content, changes: [], improvements: [] };
    }
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
