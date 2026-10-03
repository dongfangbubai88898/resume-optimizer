import { setCors, handleOptions, checkPost, deepseekCall, parseJson, handleError } from './shared.js';

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;
  if (!checkPost(req, res)) return;
  try {
    const { resume, content, jd, style = 'professional' } = req.body;
    const text = resume || content;
    if (!text) return res.status(400).json({ error: '请输入简历内容' });
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
${text}

请以JSON格式回复：
- optimizedResume: 优化后的完整简历
- changes: 主要修改说明列表
- improvements: 优化亮点列表`;
    const content2 = await deepseekCall(prompt, { maxTokens: 8192, temperature: 0.5 });
    const parsed = parseJson(content2) || { optimizedResume: '', changes: [], improvements: [] };
    res.json(parsed);
  } catch (err) { handleError(res, err); }
}
