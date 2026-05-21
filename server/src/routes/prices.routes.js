const pool = require('../config/database');

function registerPricesRoutes(app) {
    app.get('/prices', async (req, res) => {
        try {
            const { rows } = await pool.query(`
                SELECT DISTINCT "Recipes".id, "Ingredients".recipe, "Ingredients".ingredient, "Ingredients".measurement, "Food"."name", "Food".price, "Food".contents, "Food".contentsunit, "Food".store, "IngredientMatches"."match"
                FROM "IngredientMatches"
                INNER JOIN "Ingredients" ON "IngredientMatches"."Ingredient" = "Ingredients".id
                INNER JOIN "Food" ON "IngredientMatches"."Food" = "Food".id
                INNER JOIN "Recipes" ON "IngredientMatches"."Recipe" = "Recipes".name
            `);
            res.json(rows);
        } catch (error) {
            console.error("DB ERROR:", error);
            res.status(500).json({ error: 'Failed to fetch prices' });
        }
    });
}

module.exports = registerPricesRoutes;
