import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const lexicalItems = sqliteTable("lexical_items", {
  id: text("id").primaryKey(),
  phrase: text("phrase").notNull(),
  meaning: text("meaning").notNull(),
  partOfSpeech: text("part_of_speech").notNull().default("短语"),
  collocations: text("collocations").notNull().default("[]"),
  contrast: text("contrast").notNull().default(""),
  example: text("example").notNull().default(""),
  topic: text("topic").notNull().default("General"),
  source: text("source").notNull().default("手动添加"),
  createdAt: text("created_at").notNull(),
});

export const reviewCards = sqliteTable("review_cards", {
  id: text("id").primaryKey(),
  lexicalItemId: text("lexical_item_id").notNull(),
  dueAt: text("due_at").notNull(),
  state: text("state").notNull(),
  reps: integer("reps").notNull().default(0),
  lapses: integer("lapses").notNull().default(0),
  stability: integer("stability").notNull().default(0),
  difficulty: integer("difficulty").notNull().default(0),
  data: text("data").notNull(),
});
