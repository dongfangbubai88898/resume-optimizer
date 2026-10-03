import { setCors, handleOptions, checkPost, deepseekCall, parseJson, handleError } from './shared.js';

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;
  if (!checkPost(req, res)) return;
  try {
    const { resume, jd } = req.body;
    if (!resume || !jd) return res.status(400).json({ error: '请同时提供简历和JD' });
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
    const content = await deepseekCall(prompt, { maxTokens: 4096 });
    const parsed = parseJson(content) || { matchScore: 0, summary: '解析失败', matchedSkills: [], missingSkills: [], suggestions: [] };
    res.json(parsed);
  } catch (err) { handleError(res, err); }
}
