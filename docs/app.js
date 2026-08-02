const STORE = "ielts-atelier-coach-v2";
const seed = [
  { id: crypto.randomUUID(), phrase: "get in touch with", meaning: "与……取得联系", example: "I wanted to get in touch with my former tutor.", reps: 0, due: Date.now() },
  { id: crypto.randomUUID(), phrase: "keep in touch with", meaning: "与……保持联系", example: "I keep in touch with my friends through WeChat.", reps: 0, due: Date.now() },
  { id: crypto.randomUUID(), phrase: "lose touch with", meaning: "与……失去联系", example: "I have lost touch with several former classmates.", reps: 0, due: Date.now() },
];
const initial = { vocab: seed, reviews: [], events: [], reports: [], portraits: [], profile: { targetOverall: "", targetWriting: "", examDate: "", dailyMinutes: "", assistantUrl: "" } };
let state = load();
let reviewIndex = 0;
let reveal = false;
let selectedScope = "daily";

function load() { try { return { ...structuredClone(initial), ...JSON.parse(localStorage.getItem(STORE) || "{}"), profile: { ...initial.profile, ...JSON.parse(localStorage.getItem(STORE) || "{}").profile } }; } catch { return structuredClone(initial); } }
function save() { localStorage.setItem(STORE, JSON.stringify(state)); renderAll(); }
function esc(value) { return String(value ?? "").replace(/[&<>'"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c])); }
function toast(message) { const el = document.querySelector("#toast"); el.textContent = message; el.classList.add("show"); setTimeout(() => el.classList.remove("show"), 2600); }
function recordEvent(kind, payload = {}, at = new Date().toISOString()) { state.events.push({ id: crypto.randomUUID(), kind, payload, at }); }
function assistantUrl() { return state.profile.assistantUrl || "https://chatgpt.com/"; }
function setAssistantLinks() { document.querySelectorAll(".assistant-link").forEach((link) => { link.href = assistantUrl(); }); }
function go(id) { document.querySelectorAll(".view,.nav").forEach((item) => item.classList.remove("active")); document.querySelector(`#${id}`).classList.add("active"); document.querySelector(`.nav[data-view='${id}']`)?.classList.add("active"); document.querySelector("#sidebar").classList.remove("open"); window.scrollTo(0, 0); renderAll(); }
function due() { return state.vocab.filter((item) => Number(item.due) <= Date.now()); }
function scopeLabel(scope) { return ({ session: "本次", daily: "日", weekly: "周", monthly: "月" }[scope] || "学习"); }
function latestReport(scope) { return state.reports.filter((report) => report.scope === scope).at(-1); }
function latestPortrait() { return state.portraits.at(-1); }
function issueCounts() { const map = {}; for (const report of state.reports) for (const issue of report.currentIssues || []) { const name = typeof issue === "string" ? issue : issue.label; const count = Number(typeof issue === "string" ? 1 : issue.count || 1); if (name) map[name] = (map[name] || 0) + count; } return Object.entries(map).sort((a, b) => b[1] - a[1]); }
function nextActions() { return latestReport("daily")?.nextActions || latestReport("session")?.nextActions || ["在 ChatGPT 助手中完成一次词组学习", "写一段 80–120 词表达", "分析一道错题"]; }
function renderDashboard() {
  const good = state.reviews.filter((review) => ["good", "easy"].includes(review.rating)).length;
  const metrics = [["待复习", due().length, "今日主动回忆"], ["词组库", state.vocab.length, "导入的高价值表达"], ["复习正确率", state.reviews.length ? `${Math.round((good / state.reviews.length) * 100)}%` : "0%", "Good / Easy"], ["学习记录", state.reports.length, "日周月及单次总结"], ["学习活动", state.events.length, "已沉淀证据"]];
  document.querySelector("#metrics").innerHTML = metrics.map((item) => `<div class="metric"><span>${item[0]}</span><b>${item[1]}</b><span>${item[2]}</span></div>`).join("");
  const report = latestReport("daily") || state.reports.at(-1);
  document.querySelector("#latestScope").textContent = report ? `${scopeLabel(report.scope)}总结` : "等待记录";
  document.querySelector("#dashboardSummary").innerHTML = report ? `<h3>${esc(report.headline || `${scopeLabel(report.scope)}学习总结`)}</h3><p>${esc(report.summary || report.currentIssues?.[0]?.evidence || "已导入学习记录。")}</p><p class="muted">进步证据：${esc(report.improvements?.[0]?.evidence || "尚无足够数据")}</p>` : "<p class=\"muted\">在 ChatGPT 助手中完成学习后，导入学习记录卡即可建立长期画像。</p>";
  const issues = issueCounts();
  document.querySelector("#topIssues").innerHTML = issues.length ? issues.slice(0, 3).map(([name, count]) => `<div class="row"><div><b>${esc(name)}</b><small>来自导入记录的 ${count} 条证据</small></div><span class="tag">${count}</span></div>`).join("") : "<p class=\"muted\">尚无足够数据。先完成一次写作或错题分析。</p>";
  document.querySelector("#nextActions").innerHTML = nextActions().slice(0, 3).map((action, index) => `<div class="row"><b>${index + 1}. ${esc(typeof action === "string" ? action : action.title)}</b></div>`).join("");
  const days = [...Array(7)].map((_, index) => { const date = new Date(); date.setDate(date.getDate() - (6 - index)); const key = date.toISOString().slice(0, 10); return { key, label: key.slice(5), value: state.events.filter((event) => event.at.slice(0, 10) === key).length }; });
  const max = Math.max(1, ...days.map((day) => day.value));
  document.querySelector("#activityChart").innerHTML = days.map((day) => `<div class="bar-col"><b>${day.value}</b><i style="height:${Math.max(4, (day.value / max) * 125)}px"></i><span>${day.label}</span></div>`).join("");
}
function renderReview() {
  const cards = due(); const el = document.querySelector("#reviewCard");
  if (!cards.length) { el.innerHTML = "<div class=\"eyebrow\">All clear</div><h2>今天的到期卡片已完成</h2><p class=\"muted\">在 ChatGPT 中学习的新词组会在导入记录卡后出现在这里。</p>"; return; }
  if (reviewIndex >= cards.length) reviewIndex = 0;
  const card = cards[reviewIndex];
  el.innerHTML = `<div class="eyebrow">${reviewIndex + 1} / ${cards.length}</div><div class="phrase">${esc(card.phrase)}</div>${reveal ? `<div class="answer"><b>${esc(card.meaning)}</b><p>${esc(card.example || "")}</p></div><div class="rating-row">${[["again", "Again"], ["hard", "Hard"], ["good", "Good"], ["easy", "Easy"]].map(([rating, label]) => `<button data-rate="${rating}">${label}</button>`).join("")}</div>` : "<button class=\"primary\" id=\"revealButton\">显示答案</button>"}`;
  document.querySelector("#revealButton")?.addEventListener("click", () => { reveal = true; renderReview(); });
  document.querySelectorAll("[data-rate]").forEach((button) => button.addEventListener("click", () => grade(card, button.dataset.rate)));
}
function grade(card, rating) { const intervals = { again: 0.001, hard: 1, good: Math.max(2, 2 ** (card.reps || 0)), easy: Math.max(4, 3 ** (card.reps || 0)) }; card.reps = (card.reps || 0) + 1; card.due = Date.now() + intervals[rating] * 86400000; state.reviews.push({ id: crypto.randomUUID(), cardId: card.id, phrase: card.phrase, rating, at: new Date().toISOString() }); recordEvent("review", { phrase: card.phrase, rating }); reveal = false; save(); toast("复习结果已记录"); }
function renderReports() {
  const scopes = ["daily", "weekly", "monthly"];
  document.querySelector("#reportTabs").innerHTML = scopes.map((scope) => `<button class="${selectedScope === scope ? "primary" : ""}" data-scope="${scope}">${scopeLabel(scope)}总结</button>`).join("");
  document.querySelectorAll("[data-scope]").forEach((button) => button.addEventListener("click", () => { selectedScope = button.dataset.scope; renderReports(); }));
  const report = latestReport(selectedScope);
  document.querySelector("#reportSummary").innerHTML = report ? `<div class="card-head"><h2>${esc(report.headline || `${scopeLabel(selectedScope)}总结`)}</h2><span class="tag gold">${scopeLabel(selectedScope)}记录</span></div><h3>当前问题</h3>${(report.currentIssues || []).map((issue) => `<div class="row"><div><b>${esc(issue.label || issue)}</b><small>${esc(issue.evidence || "已记录相关证据")}</small></div></div>`).join("") || "<p class=\"muted\">尚无明显问题。</p>"}<h3 class="minor-title">进步证据</h3>${(report.improvements || []).map((item) => `<div class="row"><div><b>${esc(item.label || item)}</b><small>${esc(item.evidence || "尚无足够数据")}</small></div></div>`).join("") || "<p class=\"muted\">尚无足够数据。</p>"}<h3 class="minor-title">下一步</h3>${(report.nextActions || []).map((item, index) => `<div class="row"><b>${index + 1}. ${esc(typeof item === "string" ? item : item.title)}</b></div>`).join("")}` : `<h2>尚无${scopeLabel(selectedScope)}总结</h2><p class="muted">在固定 ChatGPT 对话中说“结束本次学习”或“生成${scopeLabel(selectedScope)}总结”，然后导入记录卡。</p>`;
  const issues = issueCounts(); const max = Math.max(1, ...issues.map((item) => item[1]));
  document.querySelector("#errorBreakdown").innerHTML = issues.length ? issues.map(([name, count]) => `<div class="row"><div><b>${esc(name)}</b><div class="progress"><i style="width:${(count / max) * 100}%"></i></div></div><span>${count}</span></div>`).join("") : "<p class=\"muted\">暂无错误趋势。</p>";
  const good = state.reviews.filter((review) => ["good", "easy"].includes(review.rating)).length;
  document.querySelector("#evidenceBreakdown").innerHTML = `<div class="row"><div><b>主动回忆成功</b><small>Good / Easy 复习结果</small></div><span>${good}/${state.reviews.length}</span></div><div class="row"><div><b>学习连续性</b><small>有记录的自然日</small></div><span>${new Set(state.events.map((event) => event.at.slice(0, 10))).size} 天</span></div>`;
}
function renderPortrait() {
  const portrait = latestPortrait();
  document.querySelector("#portraitCard").innerHTML = portrait ? `<div class="card-head"><h2>${esc(portrait.title || "当前学习者自画像")}</h2><span class="tag gold">证据驱动</span></div>${[["优势", portrait.strengths], ["稳定短板", portrait.weaknesses], ["常见触发场景", portrait.triggers], ["最有效练法", portrait.effectiveMethods], ["当前风险", portrait.risks]].map(([title, values]) => `<h3 class="minor-title">${title}</h3>${(values || []).map((value) => `<div class="row"><div><b>${esc(value.label || value)}</b><small>${esc(value.evidence || "需继续积累证据")}</small></div></div>`).join("") || "<p class=\"muted\">尚无足够数据。</p>"}`).join("")}` : "<h2>自画像尚在建立</h2><p class=\"muted\">至少导入一份周总结或月总结后，系统会展示有证据的优势与短板。</p>";
  const profile = state.profile; const hasDate = profile.examDate ? Math.max(0, Math.ceil((new Date(profile.examDate) - Date.now()) / 86400000)) : null;
  document.querySelector("#goalProgress").innerHTML = `<div class="row"><div><b>目标总分</b><small>${profile.targetOverall ? `目标 ${esc(profile.targetOverall)}；以连续样本证据评估` : "未设置，当前采用能力优先模式"}</small></div></div><div class="row"><div><b>写作目标</b><small>${profile.targetWriting ? `目标 ${esc(profile.targetWriting)}；仅作学习方向，不作分数承诺` : "未设置"}</small></div></div><div class="row"><div><b>考试时间</b><small>${hasDate === null ? "未设置，按能力阶段推进" : `距离考试 ${hasDate} 天`}</small></div></div>`;
  const loop = portrait?.actionLoop || latestReport("weekly")?.actionLoop || [];
  document.querySelector("#actionLoop").innerHTML = loop.length ? loop.map((item) => `<div class="row"><div><b>${esc(item.method || item.title || "改进手段")}</b><small>验证：${esc(item.validation || "完成后在下一轮总结复查")}<br>预期：${esc(item.expectedResult || "以真实记录更新")}</small></div></div>`).join("") : "<p class=\"muted\">导入周总结后显示“改进手段—验证标准—预期结果”。</p>";
}
function normalizeRecord(raw) {
  if (raw?.type !== "ielts-study-record" || !raw?.recordedAt) throw new Error("这不是有效的 IELTS 学习记录卡。请复制 GPT 输出的完整 JSON。");
  return { ...raw, scope: raw.scope || raw.report?.scope || "session", report: raw.report || {}, vocabulary: raw.vocabulary || [], reviews: raw.reviews || [], events: raw.events || [], portrait: raw.portrait || null };
}
function importRecord(raw) {
  const record = normalizeRecord(raw); const recordedAt = new Date(record.recordedAt).toISOString();
  for (const item of record.vocabulary) { const phrase = (item.phrase || "").trim(); if (!phrase || state.vocab.some((card) => card.phrase.toLowerCase() === phrase.toLowerCase())) continue; state.vocab.push({ id: crypto.randomUUID(), phrase, meaning: item.meaning || "待补充释义", example: item.example || "", reps: 0, due: Date.now() }); }
  for (const review of record.reviews) { if (!review.phrase || !review.rating) continue; state.reviews.push({ id: crypto.randomUUID(), phrase: review.phrase, rating: review.rating, at: review.at || recordedAt, imported: true }); }
  const actions = record.report.nextActions || record.nextActions || [];
  const report = { id: crypto.randomUUID(), scope: record.scope, periodKey: record.periodKey || recordedAt.slice(0, 10), headline: record.report.headline || `${scopeLabel(record.scope)}学习总结`, summary: record.report.summary || record.summary || "已导入 ChatGPT 学习记录。", currentIssues: record.report.currentIssues || record.currentIssues || [], improvements: record.report.improvements || record.improvements || [], nextActions: actions, actionLoop: record.report.actionLoop || record.actionLoop || [], at: recordedAt };
  if (!state.reports.some((item) => item.scope === report.scope && item.periodKey === report.periodKey)) state.reports.push(report);
  if (record.portrait && !state.portraits.some((item) => item.periodKey === (record.portrait.periodKey || report.periodKey))) state.portraits.push({ ...record.portrait, id: crypto.randomUUID(), periodKey: record.portrait.periodKey || report.periodKey, at: recordedAt });
  const importedEvents = record.events.length ? record.events : [{ kind: "chatgpt_record_imported", payload: { scope: record.scope } }];
  for (const item of importedEvents) recordEvent(item.kind || "chatgpt_activity", item.payload || {}, item.at || recordedAt);
  save();
  return report;
}
function renderProfileForm() { for (const [key, value] of Object.entries(state.profile)) document.querySelector(`#${key === "assistantUrl" ? "assistantUrl" : key}`)?.setAttribute("value", value); }
function renderAll() { setAssistantLinks(); renderDashboard(); renderReview(); renderReports(); renderPortrait(); }

document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => go(button.dataset.view)));
document.querySelector("#menuButton").addEventListener("click", () => document.querySelector("#sidebar").classList.toggle("open"));
document.querySelector("#recordForm").addEventListener("submit", (event) => { event.preventDefault(); try { const report = importRecord(JSON.parse(document.querySelector("#recordJson").value)); document.querySelector("#recordJson").value = ""; document.querySelector("#recordMessage").textContent = `已导入${scopeLabel(report.scope)}记录，并更新仪表盘。`; toast("学习记录已导入"); } catch (error) { document.querySelector("#recordMessage").textContent = error.message; } });
document.querySelector("#profileForm").addEventListener("submit", (event) => { event.preventDefault(); for (const key of Object.keys(state.profile)) state.profile[key] = document.querySelector(`#${key}`).value.trim(); save(); document.querySelector("#profileMessage").textContent = "目标与 ChatGPT 助手链接已保存在当前浏览器。"; });
document.querySelector("#exportButton").addEventListener("click", () => { const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: "application/json" })); link.download = `ielts-atelier-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(link.href); });
document.querySelector("#importInput").addEventListener("change", async (event) => { try { const incoming = JSON.parse(await event.target.files[0].text()); state = { ...structuredClone(initial), ...incoming, profile: { ...initial.profile, ...incoming.profile } }; save(); toast("完整备份已导入"); } catch { toast("备份格式无效"); } });
for (const [key, value] of Object.entries(state.profile)) document.querySelector(`#${key}`).value = value;
renderAll();
