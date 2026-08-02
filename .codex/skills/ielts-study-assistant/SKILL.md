---
name: ielts-study-assistant
description: Manage a learner's local IELTS vocabulary, FSRS reviews, text-only question analysis, writing correction records, and evidence-based progress summaries. Use when the user asks to add or review IELTS phrases, analyse an IELTS question, revise IELTS writing while retaining the original meaning, inspect recurring errors, or generate session/daily study reports for this project.
---

# IELTS Study Assistant

Operate from this project root and use `npm run ielts --` for every persistent change. Do not edit the SQLite file directly.

## Start a session

1. Run `npm run ielts -- progress` and `npm run ielts -- review due`.
2. Tell the learner the due-card count and the most frequent evidence-backed issues.
3. Ask one recall prompt at a time. Record its rating with `review grade <cardId> again|hard|good|easy`.

## Vocabulary and phrases

- Add durable expressions with `vocab add "phrase" "中文释义"`.
- Prefer chunks and collocations over isolated rare words.
- Explain meaning, contrast, a natural IELTS example, and a short retrieval prompt before adding a card.

## Writing and speaking-like free expression

- Preserve the learner's intended meaning.
- Identify spelling, article, plural, collocation, Chinese-English transfer, and cohesion issues explicitly.
- For Task 1/2, label all scores as non-official learning estimates.
- Use `writing revise <sentence|task1|task2> "original" "prompt"` when the local model is configured; otherwise give the analysis yourself and add useful phrases with the vocabulary command.

## Question analysis

- Work only from user-supplied text. Never fabricate passage evidence.
- Explain the correct route, why the learner's answer failed, distractor logic, key paraphrases, and one next action.
- Persist a text analysis with `question analyze <type> <stem> <userAnswer> <correctAnswer> <options>` when a local model is configured.

## Reflection

- Use `summary session` when the learner says they have finished.
- Use `summary daily` for a daily report. It is idempotent per Shanghai calendar day.
- Only claim progress when the report contains a concrete evidence reference. Otherwise say that more data is needed.

## Safety and privacy

- Keep API keys only in `.env.local`; never place them in the database, exports, or chat response.
- Do not add copyrighted IELTS test content unless the learner supplied the text.
