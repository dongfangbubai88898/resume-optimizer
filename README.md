# AI简历优化助手 (resume-optimizer)

在线地址：https://resume-optimizer.cn

## 功能（8 个 Tab）
- ✨ 一键优化（诊断 + JD匹配 + 重写，三合一）
- 🔍 简历诊断
- 🎯 JD匹配
- ✏️ 润色优化
- 🎤 面试题预测
- 🤖 ATS检测
- 💎 价格
- 📋 记录

## 技术栈
- 前端：单文件 HTML（public/index.html），无框架
- 后端：Vercel Serverless Functions（api/*.js，ESM）
- 模型：DeepSeek（deepseek-v4-flash）

## 环境变量
- `DEEPSEEK_KEY`：DeepSeek API Key（在 Vercel 项目设置里配置）

## 接口
| 路径 | 说明 |
|------|------|
| POST /api/full-optimize | 一键优化（诊断+匹配+重写） |
| POST /api/analyze | 简历诊断 |
| POST /api/match | JD匹配 |
| POST /api/optimize | 润色优化 |
| POST /api/interview-questions | 面试题预测 |
| POST /api/ats | ATS检测 |
| POST /api/upload-resume | 文件上传解析 |

## 部署
推送到 GitHub main 分支，Vercel 自动部署。
