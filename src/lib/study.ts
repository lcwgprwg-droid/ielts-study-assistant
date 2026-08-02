import { createHash } from "node:crypto";
import { createEmptyCard, fsrs, Rating, type Grade } from "ts-fsrs";
import { ERROR_TYPES, type DashboardData, type ErrorType, type LearningSummary, type Rating as AppRating } from "@/lib/domain";
import { sqlite } from "@/lib/db";
import { id, now, chinaDay } from "@/lib/id";

const scheduler = fsrs();
const ratingMap: Record<AppRating, Grade> = { again: Rating.Again, hard: Rating.Hard, good: Rating.Good, easy: Rating.Easy };

type CardRow = { id: string; lexical_item_id: string; due_at: string; reps: number; lapses: number; stability: number; difficulty: number; data: string };

export function ensureSeed() {
  const count = sqlite.prepare("SELECT count(*) count FROM lexical_items").get() as { count: number };
  if (count.count) return;
  [
    { phrase: "get in touch with", meaning: "与……取得联系", contrast: "开始联系", example: "I wanted to get in touch with her.", topic: "Relationships" },
    { phrase: "keep in touch with", meaning: "与……保持联系", contrast: "持续联系", example: "I keep in touch with my friends through WeChat.", topic: "Relationships" },
    { phrase: "lose touch with", meaning: "与……失去联系", contrast: "不再联系", example: "I have lost touch with my old colleagues.", topic: "Relationships" },
  ].forEach((item) => addVocabulary({ ...item, collocations: ["someone through WeChat", "friends and family"], source: "初始雅思词组" }));
}

export function recordEvent(kind: string, payload: Record<string, unknown>) {
  sqlite.prepare("INSERT INTO learning_events (id, kind, payload, created_at) VALUES (?, ?, ?, ?)").run(id(), kind, JSON.stringify(payload), now());
}

export function addVocabulary(input: { phrase: string; meaning: string; partOfSpeech?: string; collocations?: string[]; contrast?: string; example?: string; topic?: string; source?: string }) {
  const phrase = input.phrase.trim();
  if (!phrase || !input.meaning.trim()) throw new Error("请填写词组和中文释义。");
  const existing = sqlite.prepare("SELECT id FROM lexical_items WHERE lower(phrase) = lower(?)").get(phrase) as { id: string } | undefined;
  if (existing) return { id: existing.id, existed: true };
  const lexicalId = id();
  const cardId = id();
  const card = createEmptyCard(new Date());
  sqlite.transaction(() => {
    sqlite.prepare(`INSERT INTO lexical_items (id, phrase, meaning, part_of_speech, collocations, contrast, example, topic, source, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(lexicalId, phrase, input.meaning.trim(), input.partOfSpeech ?? "短语", JSON.stringify(input.collocations ?? []), input.contrast ?? "", input.example ?? "", input.topic ?? "General", input.source ?? "手动添加", now());
    sqlite.prepare(`INSERT INTO review_cards (id, lexical_item_id, due_at, state, reps, lapses, stability, difficulty, data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(cardId, lexicalId, new Date(card.due).toISOString(), String(card.state), 0, 0, Number(card.stability), Number(card.difficulty), JSON.stringify(card));
    recordEvent("vocab_added", { lexicalId, phrase });
  })();
  return { id: lexicalId, existed: false };
}

export function listVocabulary(limit = 100) {
  return sqlite.prepare(`SELECT l.*, c.due_at, c.reps, c.lapses FROM lexical_items l JOIN review_cards c ON c.lexical_item_id = l.id ORDER BY l.created_at DESC LIMIT ?`).all(limit) as Array<Record<string, unknown>>;
}

export function dueCards(limit = 20) {
  return sqlite.prepare(`SELECT c.id, c.due_at, l.phrase, l.meaning, l.example, l.collocations FROM review_cards c JOIN lexical_items l ON l.id = c.lexical_item_id WHERE c.due_at <= ? ORDER BY c.due_at ASC LIMIT ?`).all(now(), limit) as Array<{ id: string; due_at: string; phrase: string; meaning: string; example: string; collocations: string }>;
}

export function gradeCard(cardId: string, rating: AppRating) {
  const row = sqlite.prepare("SELECT * FROM review_cards WHERE id = ?").get(cardId) as CardRow | undefined;
  if (!row) throw new Error("未找到该复习卡片。");
  const result = scheduler.next(JSON.parse(row.data), new Date(), ratingMap[rating]);
  const card = result.card;
  sqlite.transaction(() => {
    sqlite.prepare(`UPDATE review_cards SET due_at=?, state=?, reps=?, lapses=?, stability=?, difficulty=?, data=? WHERE id=?`).run(
      new Date(card.due).toISOString(), String(card.state), Number(card.reps), Number(card.lapses), Number(card.stability), Number(card.difficulty), JSON.stringify(card), cardId,
    );
    sqlite.prepare("INSERT INTO review_logs (id, card_id, rating, reviewed_at) VALUES (?, ?, ?, ?)").run(id(), cardId, rating, now());
    recordEvent("card_reviewed", { cardId, rating });
  })();
  return { dueAt: new Date(card.due).toISOString(), reps: Number(card.reps) };
}

export function saveWriting(input: { taskType: string; prompt: string; original: string; minimalRevision: string; naturalRevision: string; corrections: unknown[]; usefulPhrases: string[]; scores?: Record<string, number> }) {
  const writingId = id();
  sqlite.prepare(`INSERT INTO writing_submissions (id, task_type, prompt, original, minimal_revision, natural_revision, corrections, useful_phrases, scores, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(writingId, input.taskType, input.prompt, input.original, input.minimalRevision, input.naturalRevision, JSON.stringify(input.corrections), JSON.stringify(input.usefulPhrases), JSON.stringify(input.scores ?? {}), now());
  for (const correction of input.corrections as Array<{ category?: string }>) {
    if (correction.category) recordEvent("writing_error", { writingId, category: correction.category });
  }
  recordEvent("writing_saved", { writingId, taskType: input.taskType });
  return writingId;
}

export function saveQuestion(input: { questionType: string; stem: string; optionsText: string; userAnswer: string; correctAnswer: string; analysis: unknown; errorType: ErrorType }) {
  const questionId = id();
  sqlite.prepare(`INSERT INTO question_attempts (id, question_type, stem, options_text, user_answer, correct_answer, analysis, error_type, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(questionId, input.questionType, input.stem, input.optionsText, input.userAnswer, input.correctAnswer, JSON.stringify(input.analysis), input.errorType, now());
  recordEvent("question_analyzed", { questionId, errorType: input.errorType });
  return questionId;
}

function currentIssues() {
  const rows = sqlite.prepare(`SELECT json_extract(payload, '$.category') category, count(*) count FROM learning_events WHERE kind='writing_error' GROUP BY category ORDER BY count DESC LIMIT 3`).all() as { category: string; count: number }[];
  const questionRows = sqlite.prepare(`SELECT error_type category, count(*) count FROM question_attempts GROUP BY error_type ORDER BY count DESC LIMIT 3`).all() as { category: string; count: number }[];
  const map = new Map<string, number>();
  [...rows, ...questionRows].forEach((row) => map.set(row.category, (map.get(row.category) ?? 0) + row.count));
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([label, count]) => ({ label, count, evidence: `已记录 ${count} 次相关学习事件` }));
}

function improvements() {
  const successful = sqlite.prepare("SELECT count(*) count FROM review_logs WHERE rating IN ('good', 'easy')").get() as { count: number };
  const total = sqlite.prepare("SELECT count(*) count FROM review_logs").get() as { count: number };
  if (total.count >= 3 && successful.count / total.count >= 0.7) return [{ label: "复习保持稳定", evidence: `${successful.count}/${total.count} 次复习得到 Good 或 Easy` }];
  return [{ label: "证据仍在积累", evidence: "继续完成至少 3 次复习或提交两篇写作后，系统会标注明确进步。" }];
}

export function buildSummary(scope: "session" | "daily", periodKey = scope === "daily" ? chinaDay() : `session-${Date.now()}`): LearningSummary {
  const existing = sqlite.prepare("SELECT data FROM summaries WHERE period_key = ?").get(periodKey) as { data: string } | undefined;
  if (existing) return JSON.parse(existing.data) as LearningSummary;
  const due = dueCards(100).length;
  const vocab = sqlite.prepare("SELECT count(*) count FROM lexical_items").get() as { count: number };
  const reviews = sqlite.prepare("SELECT count(*) count FROM review_logs").get() as { count: number };
  const writings = sqlite.prepare("SELECT count(*) count FROM writing_submissions").get() as { count: number };
  const issues = currentIssues();
  const data: LearningSummary = {
    id: id(), scope, periodKey,
    headline: scope === "daily" ? "今日学习画像已更新" : "本次学习已完成",
    metricsSnapshot: { vocabulary: vocab.count, reviews: reviews.count, writings: writings.count, dueCards: due },
    currentIssues: issues.length ? issues : [{ label: "尚未形成明显问题", count: 0, evidence: "继续输入词汇、试题或写作内容以建立个人画像。" }],
    improvements: improvements(),
    nextActions: [
      { title: due ? `复习 ${Math.min(due, 10)} 张到期卡片` : "添加一个高价值词组", description: due ? "用主动回忆巩固今天最需要复习的内容。" : "从今天的阅读或写作中提取一个可复用表达。", href: "/review" },
      { title: "完成一段 80–120 词表达", description: "优先练习固定搭配、冠词与自然衔接。", href: "/writing" },
      { title: "分析一道错题", description: "记录定位和逻辑错误，避免下次重复。", href: "/questions" },
    ],
    confidence: reviews.count + writings.count >= 5 ? "high" : reviews.count + writings.count >= 2 ? "medium" : "low",
    createdAt: now(),
  };
  const contentHash = createHash("sha256").update(JSON.stringify(data.metricsSnapshot) + JSON.stringify(data.currentIssues)).digest("hex");
  sqlite.prepare("INSERT INTO summaries (id, scope, period_key, content_hash, data, created_at) VALUES (?, ?, ?, ?, ?, ?)").run(data.id, scope, periodKey, contentHash, JSON.stringify(data), data.createdAt);
  recordEvent("summary_created", { scope, periodKey });
  return data;
}

export function dashboard(): DashboardData {
  ensureSeed();
  const cards = dueCards(10);
  const reviewed = sqlite.prepare("SELECT count(*) count FROM review_logs").get() as { count: number };
  const success = sqlite.prepare("SELECT count(*) count FROM review_logs WHERE rating IN ('good','easy')").get() as { count: number };
  const total = sqlite.prepare("SELECT count(*) count FROM lexical_items").get() as { count: number };
  const writingCount = sqlite.prepare("SELECT count(*) count FROM writing_submissions").get() as { count: number };
  const errors = currentIssues();
  const activity = sqlite.prepare("SELECT substr(created_at, 1, 10) day, count(*) value FROM learning_events GROUP BY day ORDER BY day DESC LIMIT 7").all() as { day: string; value: number }[];
  const latest = sqlite.prepare("SELECT data FROM summaries ORDER BY created_at DESC LIMIT 1").get() as { data: string } | undefined;
  return {
    metrics: { dueCards: cards.length, totalCards: total.count, reviewAccuracy: reviewed.count ? Math.round((success.count / reviewed.count) * 100) : 0, writingCount: writingCount.count, streak: activity.length },
    dueCards: cards.map((card) => ({ id: card.id, phrase: card.phrase, meaning: card.meaning, dueAt: card.due_at })),
    errorBreakdown: errors.map((error) => ({ name: error.label, value: error.count })),
    weeklyActivity: activity.reverse(),
    summary: latest ? JSON.parse(latest.data) : null,
  };
}

export function exportData() {
  const tables = ["lexical_items", "review_cards", "review_logs", "writing_submissions", "question_attempts", "learning_events", "summaries"];
  return Object.fromEntries(tables.map((table) => [table, sqlite.prepare(`SELECT * FROM ${table}`).all()]));
}

export function importData(data: Record<string, unknown[]>) {
  const allowed = ["lexical_items", "review_cards", "review_logs", "writing_submissions", "question_attempts", "learning_events", "summaries"];
  sqlite.transaction(() => {
    for (const table of allowed) {
      const rows = data[table];
      if (!Array.isArray(rows)) continue;
      for (const row of rows as Record<string, unknown>[]) {
        const keys = Object.keys(row);
        if (!keys.length) continue;
        sqlite.prepare(`INSERT OR IGNORE INTO ${table} (${keys.join(",")}) VALUES (${keys.map(() => "?").join(",")})`).run(...keys.map((key) => row[key]));
      }
    }
  })();
}

export { ERROR_TYPES };
