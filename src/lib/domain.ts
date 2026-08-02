export const ERROR_TYPES = ["词汇不足", "定位错误", "题干误读", "逻辑误判", "语法问题", "粗心"] as const;
export type ErrorType = (typeof ERROR_TYPES)[number];

export type Rating = "again" | "hard" | "good" | "easy";
export type SummaryScope = "session" | "daily";

export type Correction = {
  original: string;
  replacement: string;
  category: string;
  explanation: string;
};

export type LearningSummary = {
  id: string;
  scope: SummaryScope;
  periodKey: string;
  headline: string;
  metricsSnapshot: Record<string, number>;
  currentIssues: { label: string; evidence: string; count: number }[];
  improvements: { label: string; evidence: string }[];
  nextActions: { title: string; description: string; href: string }[];
  confidence: "high" | "medium" | "low";
  createdAt: string;
};

export type DashboardData = {
  metrics: {
    dueCards: number;
    totalCards: number;
    reviewAccuracy: number;
    writingCount: number;
    streak: number;
  };
  dueCards: { id: string; phrase: string; meaning: string; dueAt: string }[];
  errorBreakdown: { name: string; value: number }[];
  weeklyActivity: { day: string; value: number }[];
  summary: LearningSummary | null;
};
