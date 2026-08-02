type AnalysisKind = "writing" | "vocab" | "question";

const schemas: Record<AnalysisKind, Record<string, unknown>> = {
  vocab: {
    type: "object",
    additionalProperties: false,
    required: ["phrase", "meaning", "partOfSpeech", "pronunciation", "collocations", "contrasts", "examples", "retrievalPrompt"],
    properties: {
      phrase: { type: "string" }, meaning: { type: "string" }, partOfSpeech: { type: "string" }, pronunciation: { type: "string" },
      collocations: { type: "array", items: { type: "string" } }, contrasts: { type: "array", items: { type: "string" } },
      examples: { type: "array", items: { type: "string" } }, retrievalPrompt: { type: "string" }
    }
  },
  writing: {
    type: "object",
    additionalProperties: false,
    required: ["summary", "minimalRevision", "naturalRevision", "corrections", "usefulPhrases", "scores"],
    properties: {
      summary: { type: "string" }, minimalRevision: { type: "string" }, naturalRevision: { type: "string" },
      corrections: { type: "array", items: { type: "object", additionalProperties: false, required: ["original", "replacement", "category", "explanation"], properties: { original: { type: "string" }, replacement: { type: "string" }, category: { type: "string" }, explanation: { type: "string" } } } },
      usefulPhrases: { type: "array", items: { type: "string" } },
      scores: { type: ["object", "null"], additionalProperties: false, required: ["taskResponse", "coherence", "lexical", "grammar"], properties: { taskResponse: { type: "number" }, coherence: { type: "number" }, lexical: { type: "number" }, grammar: { type: "number" } } }
    }
  },
  question: {
    type: "object",
    additionalProperties: false,
    required: ["evidence", "reasoning", "distractorExplanation", "paraphrases", "keyPhrases", "errorType", "summary", "nextAction"],
    properties: {
      evidence: { type: "string" }, reasoning: { type: "array", items: { type: "string" } }, distractorExplanation: { type: "string" },
      paraphrases: { type: "array", items: { type: "string" } }, keyPhrases: { type: "array", items: { type: "string" } },
      errorType: { type: "string", enum: ["词汇不足", "定位错误", "题干误读", "逻辑误判", "语法问题", "粗心"] },
      summary: { type: "string" }, nextAction: { type: "string" }
    }
  }
};

const instructions: Record<AnalysisKind, string> = {
  vocab: "你是 Academic IELTS 词汇教练。解释用户输入的单词或词组，优先固定搭配、易混表达和可复用例句。中文解释清楚，英文例句自然。",
  writing: "你是严谨的 Academic IELTS 写作教练。保留用户原意，不完全重写。明确指出拼写、冠词、单复数、固定搭配、中式表达和衔接问题。sentence 类型不评分；task1/task2 分数必须作为非官方学习估分。",
  question: "你是 Academic IELTS 试题分析教练。只依据用户提供的文本，不编造原文证据。解释正确路线、错误原因、干扰项、同义替换和下一步训练。"
};

function cors(origin: string | null, env: Env) {
  const allowed = env.ALLOWED_ORIGINS.split(",").map((item) => item.trim());
  const safeOrigin = origin && allowed.includes(origin) ? origin : allowed[0];
  return { "Access-Control-Allow-Origin": safeOrigin, "Access-Control-Allow-Headers": "Content-Type, X-App-Token", "Access-Control-Allow-Methods": "POST, OPTIONS", Vary: "Origin" };
}

async function sameSecret(provided: string, expected: string) {
  const encoder = new TextEncoder();
  const [a, b] = await Promise.all([crypto.subtle.digest("SHA-256", encoder.encode(provided)), crypto.subtle.digest("SHA-256", encoder.encode(expected))]);
  const left = new Uint8Array(a); const right = new Uint8Array(b); let diff = left.length ^ right.length;
  for (let i = 0; i < left.length; i += 1) diff |= left[i] ^ (right[i] ?? 0);
  return diff === 0;
}

function outputText(payload: { output?: Array<{ content?: Array<{ type?: string; text?: string }> }> }) {
  return payload.output?.flatMap((item) => item.content ?? []).find((item) => item.type === "output_text")?.text;
}

export default {
  async fetch(request, env): Promise<Response> {
    const origin = request.headers.get("Origin"); const headers = cors(origin, env);
    if (request.method === "OPTIONS") return new Response(null, { headers });
    if (request.method !== "POST") return Response.json({ error: "Not found" }, { status: 404, headers });
    if (!env.OPENAI_API_KEY || !env.APP_ACCESS_TOKEN) return Response.json({ error: "服务端密钥尚未配置" }, { status: 503, headers });
    if (!(await sameSecret(request.headers.get("X-App-Token") ?? "", env.APP_ACCESS_TOKEN))) return Response.json({ error: "访问口令不正确" }, { status: 401, headers });

    try {
      const body = await request.json<{ kind?: AnalysisKind; payload?: unknown }>();
      const kind = body.kind;
      if (!kind || !schemas[kind]) return Response.json({ error: "不支持的分析类型" }, { status: 400, headers });
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: env.OPENAI_MODEL, instructions: instructions[kind], input: JSON.stringify(body.payload ?? {}), reasoning: { effort: "low" }, text: { verbosity: "medium", format: { type: "json_schema", name: `ielts_${kind}`, strict: true, schema: schemas[kind] } }, store: false })
      });
      const result = await response.json<{ error?: { message?: string }; output?: Array<{ content?: Array<{ type?: string; text?: string }> }> }>();
      if (!response.ok) return Response.json({ error: result.error?.message ?? "OpenAI 请求失败" }, { status: response.status, headers });
      const text = outputText(result);
      if (!text) return Response.json({ error: "模型未返回可解析结果" }, { status: 502, headers });
      return Response.json(JSON.parse(text), { headers });
    } catch (error) {
      console.error(JSON.stringify({ event: "analysis_failed", message: error instanceof Error ? error.message : "unknown" }));
      return Response.json({ error: "分析暂时不可用，请稍后重试" }, { status: 500, headers });
    }
  }
} satisfies ExportedHandler<Env>;
