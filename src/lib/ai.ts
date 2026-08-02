import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateObject } from "ai";
import { z } from "zod";
import { ERROR_TYPES, type ErrorType } from "@/lib/domain";

const writingSchema = z.object({
  corrections: z.array(z.object({ original: z.string(), replacement: z.string(), category: z.string(), explanation: z.string() })),
  minimalRevision: z.string(),
  naturalRevision: z.string(),
  usefulPhrases: z.array(z.string()).max(8),
  scores: z.object({ taskResponse: z.number().min(0).max(9), coherence: z.number().min(0).max(9), lexical: z.number().min(0).max(9), grammar: z.number().min(0).max(9) }).optional(),
});

const questionSchema = z.object({
  reasoning: z.array(z.string()),
  distractorExplanation: z.string(),
  keyPhrases: z.array(z.string()).max(8),
  synonyms: z.array(z.string()).max(8),
  errorType: z.enum(ERROR_TYPES),
  summary: z.string(),
});

function model() {
  const baseURL = process.env.AI_BASE_URL;
  const modelId = process.env.AI_MODEL;
  if (!baseURL || !modelId) return null;
  return createOpenAICompatible({ name: process.env.AI_PROVIDER_NAME ?? "custom", baseURL, apiKey: process.env.AI_API_KEY ?? "ollama" })(modelId);
}

export async function reviseWriting(input: { taskType: string; prompt: string; original: string }) {
  const activeModel = model();
  if (!activeModel) return {
    corrections: [], minimalRevision: input.original, naturalRevision: input.original,
    usefulPhrases: ["建议在设置页配置 OpenAI 兼容 API 或本地 Ollama，以获得逐处智能批改。"],
    scores: input.taskType === "sentence" ? undefined : { taskResponse: 0, coherence: 0, lexical: 0, grammar: 0 },
    fallback: true,
  };
  const result = await generateObject({
    model: activeModel,
    schema: writingSchema,
    prompt: `你是一名严谨的 IELTS Academic 英语教师。批改以下${input.taskType}文本。保留学生原意，以中文解释拼写、冠词、单复数、搭配、中式表达和衔接问题；不要杜撰错误。Task 1/2 仅给非官方估分。\n题目：${input.prompt || "未提供"}\n原文：${input.original}`,
  });
  return { ...result.object, fallback: false };
}

export async function analyzeQuestion(input: { questionType: string; stem: string; optionsText: string; userAnswer: string; correctAnswer: string }) {
  const activeModel = model();
  if (!activeModel) return {
    reasoning: ["尚未配置模型，已保存题目与答案。", "请在设置页配置模型后重新分析，以生成文本依据与干扰项解释。"],
    distractorExplanation: "模型未配置。", keyPhrases: [], synonyms: [], errorType: "逻辑误判" as ErrorType,
    summary: `你的答案是“${input.userAnswer}”，参考答案是“${input.correctAnswer}”。`, fallback: true,
  };
  const result = await generateObject({
    model: activeModel,
    schema: questionSchema,
    prompt: `你是一名 IELTS 阅读/听力题分析教师。只根据提供的题目内容说明证据，不能编造原文。用中文解释解题步骤、错误原因和干扰项。\n题型：${input.questionType}\n题干：${input.stem}\n选项：${input.optionsText}\n学生答案：${input.userAnswer}\n参考答案：${input.correctAnswer}`,
  });
  return { ...result.object, fallback: false };
}
