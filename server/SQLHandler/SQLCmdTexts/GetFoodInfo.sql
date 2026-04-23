SELECT DISTINCT "Ingredients".recipe, "Ingredients".ingredient, "Ingredients".measurement, "Food"."name", "Food".price, "Food".contents, "Food".contentsunit, "Food".store, "IngredientMatches"."match"
FROM "IngredientMatches" 
INNER JOIN "Ingredients" ON "IngredientMatches"."Ingredient" = "Ingredients".id
INNER JOIN "Food" ON "IngredientMatches"."Food" = "Food".id