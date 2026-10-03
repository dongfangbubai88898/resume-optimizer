import { setCors, handleOptions, checkPost, deepseekCall, parseJson, handleError } from './shared.js';

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;
  if (!checkPost(req, res)) return;
  try {
    const { resume, jd } = req.body;
    if (!resume) return res.status(400).json({ error: '请输入简历内容' });
    const prompt = `你是一位ATS（简历筛选系统）专家。请模拟中文主流ATS系统（北森/智联/Moka）的解析逻辑，评估以下简历通过机器筛选的概率。

${jd ? `目标职位描述：\n${jd}\n` : ''}
简历：
${resume}

请以JSON格式回复：
{
  "atsScore": 0-100,
  "estimatedPassRate": { "withJD": "有JD时通过率", "withoutJD": "无JD时通过率" },
  "sectionCheck": { "hasContact": true/false, "hasEducation": true/false, "hasExperience": true/false, "hasSkills": true/false, "hasProjects": true/false, "missingSections": [] },
  "readability": { "score": 0-100, "issues": [] },
  "keywordAnalysis": { "matchedKeywords": [], "missingKeywords": [], "keywordDensity": "百分比" },
  "formatIssues": [],
  "chineseStandards": { "photoIssue": true/false, "politicalStatus": true/false, "expectedSalary": true/false, "note": "说明" },
  "topFixes": ["最需要改的问题"],
  "actionItems": ["具体操作步骤"]
}`;
    const content = await deepseekCall(prompt, { maxTokens: 4096 });
    const parsed = parseJson(content) || { atsScore: 0, error: '解析失败' };
    res.json(parsed);
  } catch (err) { handleError(res, err); }
}
