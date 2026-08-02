# IELTS Atelier

本地优先的 Academic IELTS 学习助手：词汇与固定搭配、FSRS 复习、文本试题分析、写作修改，以及带证据的单次/每日学习总结。

## 在线版

`docs/` 是 GitHub Pages 静态版。学习记录保存在浏览器的 Local Storage，可通过设置页导出和导入 JSON。AI 请求经 Cloudflare Worker 转发，OpenAI API Key 只作为 Worker Secret 保存，不进入仓库或浏览器。

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
