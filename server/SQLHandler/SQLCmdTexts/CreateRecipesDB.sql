CREATE TABLE IF NOT EXISTS "Recipes" (
	"name" TEXT NOT NULL,
	"ingredients" JSON NOT NULL,
	"instructions " TEXT NOT NULL,
	"category" TEXT NOT NULL,
	UNIQUE ("name")
);