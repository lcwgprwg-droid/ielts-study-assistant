import { readFile } from "node:fs/promises";
import { analyzeQuestion, reviseWriting } from "../src/lib/ai";
import { addVocabulary, buildSummary, dashboard, dueCards, ensureSeed, exportData, gradeCard, importData, listVocabulary, saveQuestion, saveWriting } from "../src/lib/study";

const [area, action, ...args] = process.argv.slice(2);
const json = (value: unknown) => console.log(JSON.stringify(value, null, 2));

async function main() {
  ensureSeed();
  if (area === "vocab" && action === "add") return json(addVocabulary({ phrase: args[0] ?? "", meaning: args.slice(1).join(" ") }));
  if (area === "vocab" && action === "list") return json(listVocabulary());
  if (area === "review" && action === "due") return json(dueCards());
  if (area === "review" && action === "grade") return json(gradeCard(args[0], (args[1] ?? "good") as "again" | "hard" | "good" | "easy"));
  if (area === "writing" && action === "revise") {
    const [taskType = "sentence", original = "", prompt = ""] = args;
    const result = await reviseWriting({ taskType, original, prompt });
    return json({ id: saveWriting({ taskType, original, prompt, ...result }), ...result });
  }
  if (area === "question" && action === "analyze") {
    const [questionType = "阅读", stem = "", userAnswer = "", correctAnswer = "", optionsText = ""] = args;
    const result = await analyzeQuestion({ questionType, stem, userAnswer, correctAnswer, optionsText });
    return json({ id: saveQuestion({ questionType, stem, userAnswer, correctAnswer, optionsText, analysis: result, errorType: result.errorType }), ...result });
  }
  if (area === "summary" && (action === "session" || action === "daily")) return json(buildSummary(action));
  if (area === "progress") return json(dashboard());
  if (area === "export") return json(exportData());
  if (area === "import") { importData(JSON.parse(await readFile(args[0], "utf8"))); return json({ ok: true }); }
  console.log(`IELTS CLI\n\nCommands:\n  npm run ielts -- vocab add \"keep in touch with\" \"与……保持联系\"\n  npm run ielts -- vocab list\n  npm run ielts -- review due\n  npm run ielts -- review grade <cardId> good\n  npm run ielts -- writing revise sentence \"My sentence\"\n  npm run ielts -- question analyze 阅读 \"题干\" A B \"A. ...\"\n  npm run ielts -- summary session|daily\n  npm run ielts -- progress\n  npm run ielts -- export|import <file>`);
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
