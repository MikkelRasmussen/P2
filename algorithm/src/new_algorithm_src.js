const fs = require("fs")
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pool = require('./db');
const app = express();

app.use(cors({
    origin: "http://localhost:5173"
}));

app.use(express.json());

// ------------------ PARAMETER DASHBOARD ------------------

const parameterAmountOfRecipes = 5; // Amount of recipes to recommend
const parameterBudgetMinimum = 0; // Minimum budget
const parameterBudgetMaximum = 9999; // Maximum budget
const parameterMemoryScore = {}; // Memory score to personalise recommendations for the user
const parameterExcludes = [];

// ---------------------------------------------------------


// Helper function to get memory score
function getMemoryScore(name) {
    try {
        if (name in memoryScores) {
            return Number(memoryScores[name]);
        } else if (name.toLowerCase() in memoryScores) {
            return Number(memoryScores[name.toLowerCase()]);
        } else {
            return 0;
        }
    }
    catch (error) {
        return 0;
    }
}

// Ingredients to skip
const basicIngredients = [
    "water", "boiling water", "cold water",
    "salt", "sea salt", "kosher salt",
    "pepper", "black pepper", "peppercorns", "whole black peppercorns",
    "cayenne pepper", "chili powder", "chilli powder", "hot chilli powder",
    "red chilli powder", "red pepper flakes",
    "sugar", "vanilla sugar",
    "olive oil", "extra virgin olive oil", "vegetable oil",
    "sunflower oil", "rapeseed oil", "canola oil", "oil",
    "butter", "unsalted butter", "salted butter", "melted butter",
    "flour", "plain flour", "all purpose flour", "white flour", "cornstarch",
    "baking powder", "bicarbonate of soda",
    "paprika", "smoked paprika", "sweet smoked paprika",
    "curry powder", "cumin", "ground cumin",
    "cinnamon", "ground cinnamon", "nutmeg", "ground nutmeg",
    "oregano", "dried oregano", "basil",
    "thyme", "rosemary",
    "allspice", "ground allspice",
    "vinegar", "mustard", "dijon mustard",
    "tomato ketchup", "mayonnaise",
    "chicken stock", "chicken stock cube", "chicken bouillon powder",
    "beef stock", "beef stock cubes", "beef stock concentrate",
    "vegetable stock", "vegetable stock cube", "bouillon cubes",
];

// Helper function to valuate a recipe.
// THIS FUNCTION IS NOT DONE YET!
// But it will return a dictionary of the recipe with cheapest price from cheapest store.
function valuateRecipe(recipeToValuate) {
    let current_recipe_ingredient = "";
    let valuatedRecipe = {}

    for (const entry of recipeToValuate) {
            let recipe_ingredient = entry.current_recipe_ingredient;
            if (current_recipe_ingredient != recipe_ingredient) {
                current_recipe_ingredient = recipe_ingredient;
                let recipeName = null;
                let recipeIngredient = null;
                let recipeMeasurementAndUnit = null;
                let storeIngredient = null;
                let storeMeasurement = null;
                let storeUnit = null;
                let price = null;
                let store = null;
                let match = null;
            }

            recipeName = entry.recipe;
            recipeIngredient = entry.ingredient;
            recipeMeasurementAndUnit = entry.measurement;
            storeIngredient = entry.name;
            storeMeasurement = entry.contents;
            storeUnit = entry.contentsunit;
            price = entry.price;
            store = entry.store;
            match = entry.match;
    }
}

// Helper function to parse the data fetched from the SQL database
// into a format that is faster and easier to use in the algorithm
function parseAndValuateFetchedRecipes(data) {
    const parsedDict = {};

    let currentId = null;
    let ingredientsToValuate = [];

    for (const entry of data) {
        const recipeId = entry.id;

        if (recipeId !== currentId) {
            if (currentId !== null) {
                const valuatedRecipe = valuateRecipe(ingredientsToValuate);
                parsedDict[currentId] = valuatedRecipe;
            }
            currentId = recipeId;
            ingredientsToValuate = [];
        }

        const ingredientEntry = {
            recipe_name: entry.recipe,
            recipe_ingredient: entry.ingredient,
            recipe_measurementAndUnit: entry.measurement,
            store_ingredient: entry.name,
            store_measurement: entry.contents,
            store_unit: entry.contentsunit,
            price: entry.price,
            store: entry.store,
            match: entry.match
        };

        ingredientsToValuate.push(ingredientEntry);
    }

    if (currentId !== null) {
        const valuatedRecipe = valuateRecipe(ingredientsToValuate);
        parsedDict[currentId] = valuatedRecipe;
    }

    return parsedDict;
}

// --------  THE ALGORITHM --------

async function runAlgorithm(excludes = [], amount = 1, budgetMin = 0, budgetMax = 9999, memoryScores = {}) {
    // Fetching raw recipe data
    var recipes = [];
    try {
        const { rows } = await pool.query(`
            SELECT DISTINCT "Recipes".id, "Ingredients".recipe, "Ingredients".ingredient, "Ingredients".measurement, "Food"."name", "Food".price, "Food".contents, "Food".contentsunit, "Food".store, "IngredientMatches"."match"
            FROM "IngredientMatches" 
            INNER JOIN "Ingredients" ON "IngredientMatches"."Ingredient" = "Ingredients".id
            INNER JOIN "Food" ON "IngredientMatches"."Food" = "Food".id
            INNER JOIN "Recipes" ON "IngredientMatches"."Recipe" = "Recipes".name8
        `);
        recipes = rows;
        console.log(recipes)
    } catch (error) {
        console.error("DB ERROR:", error);
        return undefined
    }

    // Parsing raw data into faster and easier format
    recipes = parseAndValuateFetchedRecipes(recipes)

    const results = {};
    const recipesNotPriced = {};

    // EVERYTHING BELOW IS NOT UP TO DATE!!!
    for (let i = 0; i < amount; i++) {
        const candidates = {};
        let cheapestCandidatePrice = 999999;
        let cheapestCandidateScore = 999999;
        let cheapestCandidateName = null;
        let cheapestCandidateStores = null;

        let current_id = recipes[0].id;
        current_ingredients = []

        for (const entry of database) {
            const recipeId = entry.id;

            if (excludes.includes(recipeId) || name in results) {
                continue;
            }

            if (recipeId != current_entry) {
                current_id = mealID;
                current_ingredients = []
            }

            const recipeName = entry.name;
            const ingredient = entry.ingredient;
            const measurement = entry.measurement;
            
            current_ingredients.push(ingredient)

            const ingredientsToValue = [];
            let total_ingredients = 0;
            for (let n = 1; n < 21; n++) {
                let ingredient = recipe[`strIngredient${n}`];
                let measure = recipe[`strMeasure${n}`];

                if (ingredient !== null && ingredient !== undefined) {
                    ingredient = ingredient.trim();
                }

                if (measure !== null && measure !== undefined) {
                    measure = measure.trim();
                }

                if (ingredient) {
                    const normalizedIngredient = ingredient.toLowerCase();
                    if (!basicIngredients.includes(normalizedIngredient)) {
                        ingredientsToValue.push({ name: ingredient, measure: measure || "" });
                    }
                }
            }

            // Failsafe if there is nothing to price
            if (ingredientsToValue.length < (total_ingredients - 2)) {
                recipesNotPriced[name] = true;
                continue;
            }

            const recipePrices = {};
            let totalPrice = 0;
            let rankingPrice = 0;
            let successBool = true;

            for (const ingredientData of ingredientsToValue) {
                const ingredient = ingredientData.name;
                const measurement = ingredientData.measure;

                let quantity;
                let unit;

                try {
                    [quantity, unit] = parseQuantity(measurement);
                } catch (error) {
                    successBool = false;
                    break;
                }

                const ingredientDK = ingredientsMapping[ingredient];

                if (ingredientDK === undefined) {
                    successBool = false;
                    break;
                }

                let cheapestPrice;
                let store;
                let storesData;
                let found;

                try {
                    [cheapestPrice, store, storesData, found] = findCheapestPrice(
                        ingredientDK,
                        quantity,
                        unit,
                        priceData
                    );
                } catch (error) {
                    console.log(`Error finding cheapest price: ${error.message}`);
                    successBool = false;
                    break;
                }


                // Failsafe
                if (!found || cheapestPrice === null || store === null || storesData === null) {
                    successBool = false;
                    break;
                }

                // Get score from previous likes and dislikes
                let ingredientScore = getMemoryScore(ingredient);

                if (ingredientScore === 0) {
                    ingredientScore = getMemoryScore(ingredientDK);
                }

                // Collect the data in an object and increase the total cost
                recipePrices[ingredient] = {
                    measure: measurement,
                    store: store,
                    storesData: storesData,
                    productName: storesData[store].productName,
                    amountToBuy: storesData[store].amountToBuy,
                    price: cheapestPrice,
                    memoryScore: ingredientScore,
                };

                totalPrice += cheapestPrice;
                rankingPrice += cheapestPrice * (1 + ingredientScore);
            }

            if (!successBool) {
                recipesNotPriced[name] = true;
                continue;
            }

            // Check if the recipe price is within range of budget
            if (budgetMin <= totalPrice && totalPrice <= budgetMax) {
                candidates[name] = recipePrices;

                if (rankingPrice < cheapestCandidateScore) {
                    cheapestCandidatePrice = totalPrice;
                    cheapestCandidateScore = rankingPrice;
                    cheapestCandidateName = name;
                    cheapestCandidateStores = recipePrices;
                }
            }
            
        }

        // Add cheapest recipe to results
        if (cheapestCandidateName) {
            results[cheapestCandidateName] = {
                price: cheapestCandidatePrice,
                score: cheapestCandidateScore,
                stores: cheapestCandidateStores,
            };
        }
    }

    const recipesNotPricedArray = Object.keys(recipesNotPriced);
    results.notPricedCount = recipesNotPricedArray.length;
    return results;

}

app.get("/recommend", async (req, res) => {
    // req.headers
    const results = await runAlgorithm(parameterExcludes, parameterAmountOfRecipes, parameterBudgetMinimum, parameterBudgetMaximum, parameterMemoryScore);
    res.json(results);
})

//const results = runAlgorithm(parameterExcludes, parameterAmountOfRecipes, parameterBudgetMinimum, parameterBudgetMaximum, parameterMemoryScore);
//printResults(results);



const PORT = 3000;
app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

fetch(`http://localhost:${PORT}/recommend`).then(data => data.text()).then(e => console.log(e))