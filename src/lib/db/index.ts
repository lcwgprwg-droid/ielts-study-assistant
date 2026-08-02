import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const defaultDataDir = join(process.cwd(), "data");
const databasePath = process.env.IELTS_DB_PATH ?? join(defaultDataDir, "ielts.db");
mkdirSync(join(databasePath, ".."), { recursive: true });
const sqlite = new Database(databasePath);
sqlite.pragma("journal_mode = WAL");

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS lexical_items (
    id TEXT PRIMARY KEY, phrase TEXT NOT NULL UNIQUE, meaning TEXT NOT NULL,
    part_of_speech TEXT NOT NULL DEFAULT '短语', collocations TEXT NOT NULL DEFAULT '[]',
    contrast TEXT NOT NULL DEFAULT '', example TEXT NOT NULL DEFAULT '', topic TEXT NOT NULL DEFAULT 'General',
    source TEXT NOT NULL DEFAULT '手动添加', created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS review_cards (
    id TEXT PRIMARY KEY, lexical_item_id TEXT NOT NULL UNIQUE, due_at TEXT NOT NULL,
    state TEXT NOT NULL, reps INTEGER NOT NULL DEFAULT 0, lapses INTEGER NOT NULL DEFAULT 0,
    stability REAL NOT NULL DEFAULT 0, difficulty REAL NOT NULL DEFAULT 0, data TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS review_logs (
    id TEXT PRIMARY KEY, card_id TEXT NOT NULL, rating TEXT NOT NULL, reviewed_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS writing_submissions (
    id TEXT PRIMARY KEY, task_type TEXT NOT NULL, prompt TEXT NOT NULL, original TEXT NOT NULL,
    minimal_revision TEXT NOT NULL DEFAULT '', natural_revision TEXT NOT NULL DEFAULT '',
    corrections TEXT NOT NULL DEFAULT '[]', useful_phrases TEXT NOT NULL DEFAULT '[]',
    scores TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS question_attempts (
    id TEXT PRIMARY KEY, question_type TEXT NOT NULL, stem TEXT NOT NULL, options_text TEXT NOT NULL,
    user_answer TEXT NOT NULL, correct_answer TEXT NOT NULL, analysis TEXT NOT NULL DEFAULT '{}',
    error_type TEXT NOT NULL DEFAULT '逻辑误判', created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS learning_events (
    id TEXT PRIMARY KEY, kind TEXT NOT NULL, payload TEXT NOT NULL, created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS summaries (
    id TEXT PRIMARY KEY, scope TEXT NOT NULL, period_key TEXT NOT NULL UNIQUE, content_hash TEXT NOT NULL,
    data TEXT NOT NULL, created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY, value TEXT NOT NULL
  );
`);

export { sqlite };
