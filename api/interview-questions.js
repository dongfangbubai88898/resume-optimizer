import { setCors, handleOptions, checkPost, deepseekCall, parseJson, handleError } from './shared.js';

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;
  if (!checkPost(req, res)) return;
  try {
    const { resume, jd, count = 5 } = req.body;
    if (!resume) return res.status(400).json({ error: '请输入简历内容' });
    const n = Math.min(Math.max(parseInt(count) || 5, 1), 10);
    const prompt = `你是一位资深面试官。请根据以下简历${jd ? '和目标职位' : ''}，预测面试官最可能问的 ${n} 道面试题。

${jd ? `目标职位描述：\n${jd}\n` : ''}
简历：
${resume}

请以JSON格式回复：
{
  "summary": "整体面试准备建议",
  "questions": [
    { "question": "题目", "difficulty": "简单|中等|困难", "type": "技术|行为|项目|综合", "expectedAnswer": "期待的回答要点", "tips": "回答技巧" }
  ]
}`;
    const content = await deepseekCall(prompt, { maxTokens: 4096 });
    const parsed = parseJson(content) || { summary: '解析失败', questions: [] };
    res.json(parsed);
  } catch (err) { handleError(res, err); }
}
