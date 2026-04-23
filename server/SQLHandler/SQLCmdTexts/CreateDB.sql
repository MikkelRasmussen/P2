CREATE TABLE IF NOT EXISTS "Food" (
	"name" TEXT NOT NULL,
	"price" MONEY NOT NULL,
	"contents" REAL NOT NULL,
	"contentsunit" TEXT NOT NULL,
	"store" TEXT NOT NULL,
	"sku" TEXT NOT NULL,
	"id" SERIAL NOT NULL,
	"embedding" JSON NOT NULL,
	UNIQUE ("store", "sku"),
	PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Recipes" (
	"name" TEXT NOT NULL,
	"ingredients" JSON NOT NULL,
	"instructions " TEXT NOT NULL,
	"category" TEXT NOT NULL,
	"imageurl" TEXT NOT NULL,
	UNIQUE ("name"),
	PRIMARY KEY ("name")
);

CREATE TABLE IF NOT EXISTS "Ingredients" (
	"id" SERIAL NOT NULL,
	"recipe" TEXT NOT NULL,
	"ingredient" TEXT NOT NULL,
	"measurement" TEXT NOT NULL,
	"embedding" JSON NOT NULL,
	PRIMARY KEY ("id"),
	UNIQUE ("recipe", "ingredient", "measurement"),
	CONSTRAINT "FK_Ingredients_Recipes" FOREIGN KEY ("recipe") REFERENCES "Recipes" ("name") ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE TABLE IF NOT EXISTS "IngredientMatches" (
	"ID" SERIAL NOT NULL,
	"Food" INTEGER NOT NULL,
	"Recipe" TEXT NOT NULL,
	"match" REAL NOT NULL,
	"Ingredient" INTEGER NOT NULL,
	PRIMARY KEY ("ID"),
	UNIQUE ("Food", "Recipe"),
	CONSTRAINT "FK_IngredientMatches_Food" FOREIGN KEY ("Food") REFERENCES "Food" ("id") ON UPDATE RESTRICT ON DELETE RESTRICT,
	CONSTRAINT "FK_IngredientMatches_Ingredients" FOREIGN KEY ("Ingredient") REFERENCES "Ingredients" ("id") ON UPDATE RESTRICT ON DELETE RESTRICT,
	CONSTRAINT "FK_IngredientMatches_Recipes" FOREIGN KEY ("Recipe") REFERENCES "Recipes" ("name") ON UPDATE RESTRICT ON DELETE RESTRICT
);

