import { describe, expect, it } from "vitest";
import { addVocabulary, buildSummary, dueCards, ensureSeed, gradeCard, listVocabulary } from "./study";

describe("IELTS study data", () => {
  it("seeds the touch phrase chain", () => {
    ensureSeed();
    expect(listVocabulary(20).some((item) => item.phrase === "keep in touch with")).toBe(true);
  });

  it("does not duplicate a phrase", () => {
    const first = addVocabulary({ phrase: "evidence-based progress", meaning: "基于证据的进步", source: "test" });
    const second = addVocabulary({ phrase: "evidence-based progress", meaning: "基于证据的进步", source: "test" });
    expect(second.id).toBe(first.id);
    expect(second.existed).toBe(true);
  });

  it("keeps a daily summary idempotent", () => {
    const first = buildSummary("daily", "2099-01-01");
    const second = buildSummary("daily", "2099-01-01");
    expect(second.id).toBe(first.id);
  });

  it("saves an FSRS review", () => {
    const phrase = `fsrs-check-${Date.now()}`;
    addVocabulary({ phrase, meaning: "测试复习" });
    const card = dueCards(100).find((item) => item.phrase === phrase);
    if (!card) throw new Error("新建词卡未进入待复习队列");
    const result = gradeCard(card.id, "good");
    expect(result.reps).toBeGreaterThanOrEqual(1);
  });
});
