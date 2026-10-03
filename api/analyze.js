import { setCors, handleOptions, checkPost, deepseekCall, parseJson, handleError } from './shared.js';

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;
  if (!checkPost(req, res)) return;
  try {
    const { resume } = req.body;
    if (!resume) return res.status(400).json({ error: '请输入简历内容' });
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
    const content = await deepseekCall(prompt, { maxTokens: 4096 });
    const parsed = parseJson(content) || { score: 0, summary: '解析失败', strengths: [], weaknesses: [], suggestions: [] };
    res.json(parsed);
  } catch (err) { handleError(res, err); }
}
