

// ----------- PARAMETER DASHBOARD (fake header) -----------

const parameterAmountOfRecipes = 1; // Amount of recipes to recommend
const parameterBudgetMinimum = 25; // Minimum budget
const parameterBudgetMaximum = 9999; // Maximum budget
const parameterMemoryScore = {}; // Memory score to personalise recommendations for the user
const parameterExcludes = [];

// --------------------- CODE VARIABLES --------------------

// Amount of ingredients in a recipe allowed to not be priced.
// Beware: Making it above 0 will affect the "totalPrice" of a recipe, and therefore
// make not-priced recipes more likely to be recommended.
const notPricedIngredientsAllowed = 1;

// Minimum matching index allowed for an ingredient.
// If match is below, it will count as "not priced".
const MinimumMatchIndex = 0.9;

// ---------------------------------------------------------







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

async function fetchData () {
    var recipes = [];
    try {
        const { rows } = await pool.query(`
            SELECT DISTINCT "Recipes".id, "Ingredients".recipe, "Ingredients".ingredient, "Ingredients".measurement, "Food"."name", "Food".price, "Food".contents, "Food".contentsunit, "Food".store, "IngredientMatches"."match"
            FROM "IngredientMatches" 
            INNER JOIN "Ingredients" ON "IngredientMatches"."Ingredient" = "Ingredients".id
            INNER JOIN "Food" ON "IngredientMatches"."Food" = "Food".id
            INNER JOIN "Recipes" ON "IngredientMatches"."Recipe" = "Recipes".name
        `);
        return rows;
    } catch (error) {
        console.error("DB ERROR:", error);
        return undefined;
    }
}

function FormatContentUnitFromString(text) {
    try {
        var numbers = String(text).match(/(\d+\/\d+|\d+(\.\d+)?)/gms);
        var number = 1;
        if (numbers != null && numbers.length > 0) {
            numbers = numbers.map(e => {
                if (e.includes("/")) {
                    const front = parseFloat(e.match(/^\d+(?=\/)/gms));
                    const back = parseFloat(e.match(/(?<=\/)\d+$/gms));
                    return front / back;
                }
                return parseFloat(e);
            });
            numbers.forEach(e => number *= e);
        }
        var unit = String(text).match(/([^0-9/]*?$)/gms)[0].trim();
        const kg = String(text).match(/(?<=(^| ))kg(?=( |$))/msg);
        const g = String(text).match(/(?<=(^| ))g(?=( |$))/msg);
        if (kg != null && kg[0] != null) unit = kg[0].trim();
        if (g != null && g[0] != null) unit = g[0].trim();
        if (NaN === number) throw number;
        return FormatContentUnit(number, unit)
    } catch (error) {
        console.error(text);
        throw error
    }
}

function FormatContentUnit(content, unit) {
    switch (unit.toLowerCase()) {
        case "g":
            return { content: content, contentsUnit: "g" };
        case "kg":
            return { content: (content * 1000), contentsUnit: "g" };
        case "spsk":
            return { content: (content * 15), contentsUnit: "ml" };
        case "tsk":
            return { content: (content * 5), contentsUnit: "ml" };
        case "dl":
            return { content: (content * 100), contentsUnit: "ml" };
        case "lb":
            return { content: (content * 1000), contentsUnit: "ml" };
        case "l":
            return { content: (content * 1000), contentsUnit: "ml" };
        case "cl":
            return { content: (content * 10), contentsUnit: "ml" };
        case "hakket":
            return { content: content, contentsUnit: "stk" };
        case undefined:
            return { content: content, contentsUnit: "stk" };
        default:
            return { content: content, contentsUnit: unit };
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

function parsePrice(priceText) {
    return Number(String(priceText).replace("$", "").trim());
}

// Function to valuate a single ingredient and find the cheapest price in the cheapest store
function valuateIngredient(ingredients) {
    if (ingredients.length === 0) {
        return null;
    }

    const ingredientName = ingredients[0].recipeIngredient;

    if (basicIngredients.includes(ingredientName.toLowerCase())) {
        return {
            recipeIngredient: ingredientName,
            skipped: true,
            priced: true,
            reason: "basic ingredient",
            price: 0,
            amountToBuy: 0,
            store: null,
            product: null
        };
    }

    let bestVariant = null;
    let bestTotalPrice = Infinity;
    let bestAmountToBuy = null;

    for (const variant of ingredients) {
        const recipeAmount = FormatContentUnitFromString(variant.recipeMeasurementAndUnit);

        const storePackage = FormatContentUnit(variant.storeMeasurement, variant.storeUnit);
        const price = parsePrice(variant.price);

        if (recipeAmount.contentsUnit !== storePackage.contentsUnit) {
            continue;
        }

        const amountToBuy = Math.ceil(recipeAmount.content / storePackage.content);
        const totalPrice = amountToBuy * price;

        if (totalPrice < bestTotalPrice) {
            bestTotalPrice = totalPrice;
            bestAmountToBuy = amountToBuy;
            bestVariant = variant;
        }
    }

    if (bestVariant === null) {
        return {
            recipeIngredient: ingredientName,
            skipped: false,
            priced: false,
            reason: "No compatible unit found",
            variants: ingredients
        };
    }

    return {
        recipeIngredient: ingredientName,
        skipped: false,
        priced: true,
        product: bestVariant.storeIngredient,
        store: bestVariant.store,
        amountToBuy: bestAmountToBuy,
        price: bestTotalPrice,
        unitPrice: parsePrice(bestVariant.price),
        packageContent: bestVariant.storeMeasurement,
        packageUnit: bestVariant.storeUnit,
        recipeMeasurement: bestVariant.recipeMeasurementAndUnit,
        match: bestVariant.match
    };
}

// Helper function to valuate a recipe.
function valuateRecipe(recipeToValuate) {
    recipeToValuate.sort((a, b) =>
        a.recipeIngredient.localeCompare(b.recipeIngredient)
    );

    const valuatedRecipe = [];

    let ingredientToValuate = [];
    let currentRecipeIngredient = null;

    for (const entry of recipeToValuate) {
        const recipeIngredient = entry.recipeIngredient;

        if (currentRecipeIngredient !== recipeIngredient) {
            if (currentRecipeIngredient !== null) {
                const valuatedIngredient = valuateIngredient(ingredientToValuate);
                valuatedRecipe.push(valuatedIngredient);
            }

            currentRecipeIngredient = recipeIngredient;
            ingredientToValuate = [];
        }

        ingredientToValuate.push({
            recipeName: entry.recipeName,
            recipeIngredient: entry.recipeIngredient,
            recipeMeasurementAndUnit: entry.recipeMeasurementAndUnit,
            storeIngredient: entry.storeIngredient,
            storeMeasurement: entry.storeMeasurement,
            storeUnit: entry.storeUnit,
            price: entry.price,
            store: entry.store,
            match: entry.match
        });
    }

    if (currentRecipeIngredient !== null) {
        const valuatedIngredient = valuateIngredient(ingredientToValuate);
        valuatedRecipe.push(valuatedIngredient);
    }

    return valuatedRecipe;
}

// Helper function to parse the data fetched from the SQL database
// into a format that is faster and easier to use in the algorithm,
// and also valuate each recipe
function parseAndValuateFetchedRecipes(data) {
    data.sort((a, b) => a.id - b.id);

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
            recipeName: entry.recipe,
            recipeIngredient: entry.ingredient,
            recipeMeasurementAndUnit: entry.measurement,
            storeIngredient: entry.name,
            storeMeasurement: entry.contents,
            storeUnit: entry.contentsunit,
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

// Helper function to get memory score
function getMemoryScore(name, memoryScores) {
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




// Main function to run the algorithm
async function runAlgorithm(excludes = [], amount = 1, budgetMin = 0, budgetMax = 9999, memoryScores = {}) {
    // Fetching raw recipe data
    let recipes_raw = await fetchData();
    if (recipes_raw === undefined) {
        console.log("FAILED TO FETCH RECIPES FROM SQL! \nSHUTTING DOWN ALGORITHM");
        process.exit(1);
    }

    // Parsing raw data into faster and easier format
    let recipes;
    try {
        recipes = parseAndValuateFetchedRecipes(recipes_raw)
    }
    catch {
        console.log("FAILED TO PARSE RECIPES FROM SQL! \nSHUTTING DOWN ALGORITHM");
        process.exit(1);
    }

    // Start of algorithm
    const results = [];
    const recommendedIDs = [];

    // Loop through amount of recipes needed
    for (let i = 0; i < amount; i++) {

        let CurrentBestRecipe = null;
        let recipeFound = false;
        let currentBestPrice = Infinity;
        let currentBestRankingPrice = Infinity;

        // Loop throughg each recipe
        for (const [recipeID, recipeIngredients] of Object.entries(recipes)) {

            // Stop diplicates
            if (recommendedIDs.includes(recipeID)) {
                continue;
            }

            // Checking if the recipeID is excluded
            if (excludes.map(String).includes(recipeID)) {
                continue;
            }

            let notPricedCount = 0;
            let isPriced = true;
            let recipeIngredientsArr = [];
            let totalPrice = 0;
            let rankingPrice = 0;

            // Loop through each ingredient in the recipe
            for (const ingredient of recipeIngredients) {
                let currentIngredient = {}
                // Checking if the ingredient wasnt priced
                if (!ingredient.priced) {
                    notPricedCount++;
                    if (notPricedCount > notPricedIngredientsAllowed) {
                        isPriced = false;
                        break;
                    }
                    currentIngredient = {
                        recipeIngredient: ingredient.recipeIngredient,
                        skipped: false,
                        priced: false,
                        belowMatchIndex: false,
                        variants: ingredient.variants
                    }
                    recipeIngredientsArr.push(currentIngredient);
                    continue;

                }

                if (ingredient.match < MinimumMatchIndex) {
                    notPricedCount++;
                    if (notPricedCount > notPricedIngredientsAllowed) {
                        isPriced = false;
                        break;
                    }
                    currentIngredient = {
                        recipeIngredient: ingredient.recipeIngredient,
                        skipped: false,
                        priced: false,
                        belowMatchIndex: true,
                        variants: ingredient.variants
                    }
                    recipeIngredientsArr.push(currentIngredient);
                    continue;
                }

                // Checking if the ingredient was skipped due to being a basic ingredient
                if (ingredient.skipped) {
                    currentIngredient = {
                        recipeIngredient: ingredient.recipeIngredient,
                        skipped: true,
                        priced: true,
                        belowMatchIndex: false,
                    }
                    recipeIngredientsArr.push(currentIngredient);
                    continue;
                }

                currentIngredient = {
                    recipeIngredient: ingredient.recipeIngredient, // The name of the ingredient in the recipe
                    skipped: false, // Was it skipped due to being a basic ingredient?
                    priced: true, // Was it successfully priced?
                    belowMatchIndex: false, // Was it below the minimum match index threshold?
                    storeIngredient: ingredient.product, // The name of the ingredient in the store
                    store: ingredient.store, // The cheapest store
                    amountToBuy: ingredient.amountToBuy, // How many packages to buy
                    price: ingredient.price, // The total price of all packages needed
                    unitPrice: ingredient.unitPrice, // The unit price
                    packageContent: ingredient.packageContent, // How many units are in 1 package
                    packageUnit: ingredient.packageUnit, // The units of the package
                    recipeMeasurement: ingredient.recipeMeasurement, // Measurement and unit in the recipe
                    matchIndex: ingredient.match // How well was the name matching from SQL
                }

                // Getting the memory score (between 0 and 1: 1 being a bad ingredient, 0 being a nautral ingredient)
                let memoryScore = getMemoryScore(ingredient.recipeIngredient, memoryScores);
                if (memoryScore === 0) {
                    memoryScore = getMemoryScore(ingredient.product, memoryScores);
                }

                totalPrice += ingredient.price;
                rankingPrice += ingredient.price * (1 + memoryScore);

                // add the ingredient object to ingredients
                recipeIngredientsArr.push(currentIngredient);
            }

            // If failed to be priced (if exceeding the threshold), skip the whole recipe
            if (!isPriced) {
                continue;
            }

            if ((rankingPrice < currentBestRankingPrice) && (budgetMin <= totalPrice) && (totalPrice <= budgetMax)) {
                recipeFound = true;
                currentBestRankingPrice = rankingPrice;
                CurrentBestRecipe = {
                    id: recipeID,
                    price: totalPrice,
                    ingredients: recipeIngredientsArr 
                };
            }
        }
        if (recipeFound) {
            results.push(CurrentBestRecipe);
            recommendedIDs.push(CurrentBestRecipe.id);
        }
    }

    return results;
}





app.get("/recommend", async (req, res) => {
    const results = await runAlgorithm(parameterExcludes, parameterAmountOfRecipes, parameterBudgetMinimum, parameterBudgetMaximum, parameterMemoryScore);
    res.json(results);
})


const PORT = 3000;
app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

fetch(`http://localhost:${PORT}/recommend`).then(data => data.text()).then(e => console.log(e))