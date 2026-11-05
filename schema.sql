CREATE TABLE IF NOT EXISTS "user" (
	"id"	INTEGER NOT NULL UNIQUE,
	"name"	TEXT NOT NULL,
	"auth_vendor"	TEXT NOT NULL,
	"auth_code"	TEXT NOT NULL,
	PRIMARY KEY("id" AUTOINCREMENT)
);

CREATE TABLE IF NOT EXISTS "result" (
	"id"	INTEGER NOT NULL UNIQUE,
	"user_id"	INTEGER NOT NULL REFERENCES "user"(id),
	"score"	INTEGER NOT NULL,
	"head"	INTEGER NOT NULL,
	"tick"	INTEGER NOT NULL,
	"level"	INTEGER NOT NULL,
	"labyrinth"	INTEGER NOT NULL,
	"retry_counter"	INTEGER NOT NULL,
	"is_win"	INTEGER NOT NULL,
	"bands"	TEXT NOT NULL,
	"band_ticks"	TEXT NOT NULL,
	"apples"	TEXT NOT NULL,
	"apple_ticks"	TEXT NOT NULL,
	"bugs"	TEXT NOT NULL,
	"bug_ticks"	TEXT NOT NULL,
	"bug_types"	TEXT NOT NULL,
	"bug_eaten"	TEXT NOT NULL,
	"bug_countdown"	INTEGER NOT NULL,
	"created_at"	INTEGER NOT NULL DEFAULT (strftime('%s','now')),
	PRIMARY KEY("id" AUTOINCREMENT)
);

CREATE INDEX IF NOT EXISTS "idx_result_score" ON "result" ("score" DESC);
CREATE INDEX IF NOT EXISTS "idx_result_lab_level_score" ON "result" ("labyrinth", "level", "score" DESC);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_user_vendor_code" ON "user" ("auth_vendor", "auth_code");
