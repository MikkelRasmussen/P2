const pool = require('../config/database');
const {
    getValuatedRecipes,
    priceRecipeIngredients,
    MIN_PRICED_INGREDIENT_PERCENT,
    computePriorityMultiplier,
} = require('./pricingService');

const EXCLUDED_CATEGORIES = new Set(['dessert']);

let categoryCache = null;

async function getRecipeCategoryMap() {
    if (categoryCache) return categoryCache;

    const { rows } = await pool.query(`SELECT id, category FROM "Recipes"`);
    categoryCache = Object.fromEntries(
        rows.map((r) => [String(r.id), r.category])
    );
    return categoryCache;
}

function isExcludedCategory(category) {
    if (!category) return false;
    return EXCLUDED_CATEGORIES.has(String(category).toLowerCase().trim());
}

function clearCategoryCache() {
    categoryCache = null;
}

async function runAlgorithm(excludes = [], amount = 1, budgetMin = 0, budgetMax = 9999, memoryScores = {}) {
    const recipes = await getValuatedRecipes();
    const categories = await getRecipeCategoryMap();
    const results = [];
    const recommendedIDs = [];

    for (let i = 0; i < amount; i++) {
        let currentBestRecipe = null;
        let recipeFound = false;
        let currentBestRankingPrice = Infinity;

        for (const [recipeID, recipeData] of Object.entries(recipes)) {
            const recipeName = recipeData.recipeName;
            const recipeIngredients = recipeData.ingredients;

            if (recommendedIDs.includes(recipeID)) continue;
            if (excludes.map(String).includes(String(recipeID))) continue;

            if (isExcludedCategory(categories[recipeID])) continue;

            const priced = priceRecipeIngredients(recipeIngredients, memoryScores);

            if (!priced.isPriced) continue;
            if (priced.pricedPercent < MIN_PRICED_INGREDIENT_PERCENT) continue;

            if (priced.totalPrice < budgetMin || priced.totalPrice > budgetMax) continue;

            const priorityMultiplier = computePriorityMultiplier(priced.pricedPercent);
            const adjustedRankingPrice = priced.rankingPrice * priorityMultiplier;

            if (adjustedRankingPrice < currentBestRankingPrice) {
                recipeFound = true;
                currentBestRankingPrice = adjustedRankingPrice;
                currentBestRecipe = {
                    id: recipeID,
                    name: recipeName,
                    price: priced.totalPrice,
                    confidenceScore: priced.confidenceScore,
                    rankingPrice: priced.rankingPrice,
                    adjustedRankingPrice,
                    pricedPercent: priced.pricedPercent,
                    notPricedCount: priced.notPricedCount,
                    skippedCount: priced.skippedCount,
                    belowMatchThresholdCount: priced.belowMatchThresholdCount,
                    valuatedIngredients: priced.ingredients,
                };
            }
        }

        if (recipeFound) {
            results.push(currentBestRecipe);
            recommendedIDs.push(currentBestRecipe.id);
        }
    }

    return results;
}

async function enrichWithMetadata(ranked) {
    if (ranked.length === 0) return [];

    const ids = ranked.map(r => Number(r.id));
    const { rows } = await pool.query(
        `SELECT id, name, category, imageurl, ingredients, "instructions " AS instructions
         FROM "Recipes"
         WHERE id = ANY($1::int[])`,
        [ids]
    );

    const byId = Object.fromEntries(rows.map(r => [String(r.id), r]));

    return ranked.map(r => {
        const meta = byId[String(r.id)] || {};
        return {
            ...meta,
            ...r,
            id: meta.id ?? r.id,
            name: meta.name ?? r.name,
            category: meta.category ?? r.category,
        };
    });
}

async function recommendWithMetadata({
    excludes = [],
    amount = 1,
    budgetMin = 0,
    budgetMax = 9999,
    memoryScores = {},
}) {
    const ranked = await runAlgorithm(excludes, amount, budgetMin, budgetMax, memoryScores);
    return enrichWithMetadata(ranked);
}

module.exports = {
    recommendWithMetadata,
    clearCategoryCache,
};
