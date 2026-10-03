import { setCors, handleOptions, checkPost, deepseekCall, parseJson, handleError } from './shared.js';

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;
  if (!checkPost(req, res)) return;
  try {
    const { resume, jd } = req.body;
    if (!resume) return res.status(400).json({ error: '请输入简历内容' });
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
    const content = await deepseekCall(prompt, { maxTokens: 8192 });
    const parsed = parseJson(content) || { error: '解析失败', raw: content };
    res.json(parsed);
  } catch (err) { handleError(res, err); }
}
