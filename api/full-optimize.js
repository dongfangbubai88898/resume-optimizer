import { setCors, handleOptions, checkPost, deepseekCall, parseJson, handleError } from './shared.js';

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;
  if (!checkPost(req, res)) return;
  try {
    const { resume, jd } = req.body;
    if (!resume) return res.status(400).json({ error: '请输入简历内容' });
    const diagPrompt = `你是一位资深简历顾问。请对以下简历做诊断，以JSON回复：
{ "score": 0-100, "summary": "", "strengths": [], "weaknesses": [], "suggestions": [] }

简历：
${resume}`;
    const matchPrompt = `你是一位招聘专家。请分析以下简历与职位的匹配度，以JSON回复：
{ "matchScore": 0-100, "summary": "", "matchedSkills": [], "missingSkills": [] }

${jd ? '职位描述：\n' + jd + '\n\n' : ''}简历：
${resume}`;
    const optPrompt = `你是一位顶尖简历优化专家。请用STAR法则重写以下简历的每条经历，突出量化成果，保持真实不编造。以JSON回复：
{ "resume": "优化后的完整简历", "changes": [], "improvements": [] }

简历：
${resume}`;
    const [diagRaw, matchRaw, optRaw] = await Promise.all([
      deepseekCall(diagPrompt, { maxTokens: 6000, jsonMode: true }),
      deepseekCall(matchPrompt, { maxTokens: 6000, jsonMode: true }),
      deepseekCall(optPrompt, { maxTokens: 8000, jsonMode: true })
    ]);
    const parsed = {
      diagnosis: parseJson(diagRaw) || { error: '解析失败' },
      match: parseJson(matchRaw) || { error: '解析失败' },
      optimized: parseJson(optRaw) || { error: '解析失败' }
    };
    res.json(parsed);
  } catch (err) { handleError(res, err); }
}
