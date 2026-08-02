# IELTS Atelier

本地优先的 Academic IELTS 学习助手：词汇与固定搭配、FSRS 复习、文本试题分析、写作修改，以及带证据的单次/每日学习总结。

## 在线版

`docs/` 是 GitHub Pages 静态仪表盘。AI 学习在私有 ChatGPT 助手中完成，直接使用 ChatGPT 订阅额度；网页只保存你主动导入的结构化学习记录，不调用 OpenAI API，也不要求 API Key。

创建私有 GPT 时，请使用 [GPT 指令](chatgpt/IELTS_Atelier_GPT_Instructions.md) 和[创建步骤](chatgpt/SETUP.md)。每次在同一条 ChatGPT 学习对话中说“结束本次学习”后，复制其 JSON 学习记录卡并粘贴到网页的“导入学习记录”页面。日、周、月总结和学习者自画像会随导入记录更新。可用 [样例记录](chatgpt/sample-learning-record.json) 测试导入与图表。

## 启动

```bash
cp .env.example .env.local
npm run dev
```

未配置模型时，系统仍可使用确定性分析与统计总结。若使用 OpenAI 兼容服务或 Ollama，请在 `.env.local` 填写 `AI_BASE_URL`、`AI_MODEL`，以及（如需要）`AI_API_KEY`。例如 Ollama 可使用 `http://127.0.0.1:11434/v1`。

数据保存在 `data/ielts.db`，不会提交到 Git。可在界面中导出，或运行：

```bash
npm run ielts -- vocab list
npm run ielts -- review due
npm run ielts -- progress
npm run ielts -- export
```

项目内 Codex 技能位于 `.codex/skills/ielts-study-assistant`；执行其中的 `scripts/install-global-skill.sh` 可建立全局符号链接。
