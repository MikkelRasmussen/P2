const pool = require('../config/database');

const notPricedIngredientsAllowed = 4;
const MinimumMatchIndex = 0.7;
const MinimumMatchIndexValuation = 0.5;
const notPricedPenalty = 10;
const MIN_PRICED_INGREDIENT_PERCENT = 0.7;

const KNOWN_UNITS = new Set([
    'g', 'kg', 'ml', 'l', 'dl', 'cl', 'spsk', 'tsk', 'stk', 'st',
    'pk', 'pakke', 'lb', 'hakket', 'bund', 'bundt', 'fed', 'skive',
]);

const basicIngredients = [
    "vand", "kogende vand", "koldt vand",
    "salt", "havsalt", "peber", "sort peber",
    "peberkorn", "peber korn", "cayenne",
    "chili pulver", "chilli pulver", "sukker",
    "olivenolie", "oliven olie", "solsikkeolie",
    "solsikke olie", "rapsolie", "raps olie", "olie",
    "hvedemel", "hvede mel", "paprika", "karry",
    "oregano", "eddike", "ketchup", "mayonnaise",
    "smør", "margarine", "bouillon", "bouillonterning",
];

async function fetchPriceData() {
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

function normalizeRecipeUnit(unit) {
    const u = String(unit || '').toLowerCase().trim();
    if (!u || !KNOWN_UNITS.has(u)) return 'stk';
    if (['st', 'pk', 'pakke', 'bund', 'bundt', 'fed', 'skive'].includes(u)) return 'stk';
    return u;
}

function FormatContentUnitFromString(text) {
    const numbers = String(text).match(/(\d+\/\d+|\d+(\.\d+)?)/gms);
    let number = 1;
    if (numbers != null && numbers.length > 0) {
        const parsed = numbers.map(e => {
            if (e.includes("/")) {
                const front = parseFloat(e.match(/^\d+(?=\/)/gms));
                const back = parseFloat(e.match(/(?<=\/)\d+$/gms));
                return front / back;
            }
            return parseFloat(e);
        });
        parsed.forEach(e => { number *= e; });
    }
    let unit = String(text).match(/([^0-9/]*?$)/gms)[0].trim();
    const kg = String(text).match(/(?<=(^| ))kg(?=( |$))/msg);
    const g = String(text).match(/(?<=(^| ))g(?=( |$))/msg);
    if (kg != null && kg[0] != null) unit = 'kg';
    if (g != null && g[0] != null) unit = 'g';
    unit = normalizeRecipeUnit(unit);
    if (Number.isNaN(number)) throw new Error(`Invalid number in: ${text}`);
    return FormatContentUnit(number, unit);
}

function FormatContentUnit(content, unit) {
    const u = normalizeRecipeUnit(unit);
    switch (u) {
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
        case "ml":
            return { content: content, contentsUnit: "ml" };
        case "hakket":
        case "stk":
            return { content: content, contentsUnit: "stk" };
        default:
            return { content: content, contentsUnit: "stk" };
    }
}

function parsePrice(priceText) {
    return Number(String(priceText).replace("$", "").replace(",", ".").trim()) || 0;
}

function computePackageCost(recipeAmount, storePackage, unitPrice) {
    const packageSize = Math.max(storePackage.content, 0.001);
    const amountToBuy = Math.max(1, Math.ceil(recipeAmount.content / packageSize));
    return {
        amountToBuy,
        totalPrice: amountToBuy * unitPrice,
    };
}

function pickBestVariant(variants, { allowUnitMismatch = false, singlePackageFallback = false } = {}) {
    let best = null;
    let bestTotalPrice = Infinity;

    for (const variant of variants) {
        const match = variant.match ?? 0;
        if (match < MinimumMatchIndexValuation) continue;

        const unitPrice = parsePrice(variant.price);
        if (unitPrice <= 0) continue;

        let recipeAmount;
        let storePackage;
        try {
            recipeAmount = FormatContentUnitFromString(variant.recipeMeasurementAndUnit);
            storePackage = FormatContentUnit(variant.storeMeasurement, variant.storeUnit);
        } catch {
            continue;
        }

        let cost;
        if (recipeAmount.contentsUnit === storePackage.contentsUnit) {
            cost = computePackageCost(recipeAmount, storePackage, unitPrice);
        } else if (allowUnitMismatch || singlePackageFallback) {
            cost = { amountToBuy: 1, totalPrice: unitPrice };
        } else {
            continue;
        }

        if (cost.totalPrice < bestTotalPrice) {
            bestTotalPrice = cost.totalPrice;
            best = {
                variant,
                ...cost,
                unitMismatch: recipeAmount.contentsUnit !== storePackage.contentsUnit,
            };
        }
    }

    return best;
}

function valuateIngredient(ingredients) {
    if (ingredients.length === 0) {
        return null;
    }

    const ingredientName = ingredients[0].recipeIngredient;

    if (basicIngredients.includes(ingredientName.toLowerCase())) {
        return {
            recipeIngredient: ingredientName,
            skipped: true,
            priced: true
        };
    }

    let best = pickBestVariant(ingredients);
    if (!best) {
        best = pickBestVariant(ingredients, { allowUnitMismatch: true });
    }
    if (!best) {
        best = pickBestVariant(ingredients, { singlePackageFallback: true });
    }

    if (!best) {
        return {
            recipeIngredient: ingredientName,
            skipped: false,
            priced: false
        };
    }

    const { variant, amountToBuy, totalPrice, unitMismatch } = best;

    return {
        recipeIngredient: ingredientName,
        skipped: false,
        priced: true,
        product: variant.storeIngredient,
        store: variant.store,
        amountToBuy,
        price: totalPrice,
        unitPrice: parsePrice(variant.price),
        packageContent: variant.storeMeasurement,
        packageUnit: variant.storeUnit,
        recipeMeasurement: variant.recipeMeasurementAndUnit,
        match: variant.match,
        unitMismatch: !!unitMismatch,
    };
}

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
                valuatedRecipe.push(valuateIngredient(ingredientToValuate));
            }
            currentRecipeIngredient = recipeIngredient;
            ingredientToValuate = [];
        }

        ingredientToValuate.push(entry);
    }

    if (currentRecipeIngredient !== null) {
        valuatedRecipe.push(valuateIngredient(ingredientToValuate));
    }

    return valuatedRecipe;
}

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
                parsedDict[currentId] = {
                    recipeName: ingredientsToValuate[0].recipeName,
                    ingredients: valuatedRecipe
                };
            }
            currentId = recipeId;
            ingredientsToValuate = [];
        }

        ingredientsToValuate.push({
            recipeName: entry.recipe,
            recipeIngredient: entry.ingredient,
            recipeMeasurementAndUnit: entry.measurement,
            storeIngredient: entry.name,
            storeMeasurement: entry.contents,
            storeUnit: entry.contentsunit,
            price: entry.price,
            store: entry.store,
            match: entry.match
        });
    }

    if (currentId !== null) {
        const valuatedRecipe = valuateRecipe(ingredientsToValuate);
        parsedDict[currentId] = {
            recipeName: ingredientsToValuate[0].recipeName,
            ingredients: valuatedRecipe
        };
    }

    return parsedDict;
}

function getPricedIngredientPercent(valuatedIngredients) {
    const total = valuatedIngredients.length;
    if (total === 0) return 0;

    const storePriced = valuatedIngredients.filter(
        (ing) => ing.priced && !ing.skipped
    ).length;

    return storePriced / total;
}

function computePriorityMultiplier(pricedPercent) {
    if (pricedPercent < MIN_PRICED_INGREDIENT_PERCENT) {
        return Infinity;
    }
    const aboveThreshold = pricedPercent - MIN_PRICED_INGREDIENT_PERCENT;
    const maxRange = 1 - MIN_PRICED_INGREDIENT_PERCENT;
    return 1 - (aboveThreshold / maxRange) * 0.25;
}

function priceRecipeIngredients(valuatedIngredients, memoryScores = {}) {
    let notPricedCount = 0;
    let skippedCount = 0;
    let belowMatchIndexThresholdCount = 0;
    let isPriced = true;
    const recipeIngredientsArr = [];
    let totalPrice = 0;
    let rankingPrice = 0;
    let matchScoreSum = 0;
    let matchScoreCount = 0;

    for (const ingredient of valuatedIngredients) {
        if (!ingredient.priced) {
            notPricedCount++;
            if (notPricedCount > notPricedIngredientsAllowed) {
                isPriced = false;
                totalPrice += notPricedPenalty;
                rankingPrice += notPricedPenalty;
                break;
            }
            recipeIngredientsArr.push({
                recipeIngredient: ingredient.recipeIngredient,
                skipped: false,
                priced: false,
                belowMatchIndex: false,
                matchIndex: ingredient.match
            });
            continue;
        }

        if (ingredient.skipped) {
            skippedCount++;
            recipeIngredientsArr.push({
                recipeIngredient: ingredient.recipeIngredient,
                skipped: true,
                priced: true,
                belowMatchIndex: false
            });
            continue;
        }

        const match = ingredient.match ?? 0;
        const lowMatch = match < MinimumMatchIndex && !ingredient.unitMismatch;

        if (lowMatch) {
            notPricedCount++;
            belowMatchIndexThresholdCount++;
            totalPrice += notPricedPenalty;
            rankingPrice += notPricedPenalty;
            if (notPricedCount > notPricedIngredientsAllowed) {
                isPriced = false;
                break;
            }
            recipeIngredientsArr.push({
                recipeIngredient: ingredient.recipeIngredient,
                skipped: false,
                priced: false,
                belowMatchIndex: true,
                matchIndex: match
            });
            continue;
        }

        let memoryScore = getMemoryScore(ingredient.recipeIngredient, memoryScores);
        if (memoryScore === 0) {
            memoryScore = getMemoryScore(ingredient.product, memoryScores);
        }

        const mismatchPenalty = ingredient.unitMismatch ? 1.15 : 1;

        recipeIngredientsArr.push({
            recipeIngredient: ingredient.recipeIngredient,
            skipped: false,
            priced: true,
            belowMatchIndex: false,
            storeIngredient: ingredient.product,
            store: ingredient.store,
            amountToBuy: ingredient.amountToBuy,
            price: ingredient.price,
            unitPrice: ingredient.unitPrice,
            packageContent: ingredient.packageContent,
            packageUnit: ingredient.packageUnit,
            recipeMeasurement: ingredient.recipeMeasurement,
            matchIndex: match,
            unitMismatch: !!ingredient.unitMismatch,
        });

        totalPrice += ingredient.price;
        rankingPrice += ingredient.price * (1 + memoryScore) * mismatchPenalty;
        matchScoreSum += match;
        matchScoreCount++;
    }

    let confidenceScore = 0;
    if (matchScoreCount > 0) {
        confidenceScore = matchScoreSum / matchScoreCount;
    }

    const pricedPercent = getPricedIngredientPercent(valuatedIngredients);

    return {
        isPriced,
        totalPrice,
        rankingPrice,
        confidenceScore,
        notPricedCount,
        skippedCount,
        belowMatchThresholdCount: belowMatchIndexThresholdCount,
        pricedPercent,
        ingredients: recipeIngredientsArr
    };
}

function getMemoryScore(name, memoryScores) {
    try {
        if (name in memoryScores) {
            return Number(memoryScores[name]);
        }
        if (name.toLowerCase() in memoryScores) {
            return Number(memoryScores[name.toLowerCase()]);
        }
        return 0;
    } catch {
        return 0;
    }
}

let cachedValuatedRecipes = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 10 * 60 * 1000;

function clearValuatedCache() {
    cachedValuatedRecipes = null;
    cacheTimestamp = 0;
}

async function getValuatedRecipes() {
    if (cachedValuatedRecipes && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
        return cachedValuatedRecipes;
    }

    const raw = await fetchPriceData();
    if (raw === undefined) {
        throw new Error("Failed to fetch price data from database");
    }

    cachedValuatedRecipes = parseAndValuateFetchedRecipes(raw);
    cacheTimestamp = Date.now();
    return cachedValuatedRecipes;
}

module.exports = {
    getValuatedRecipes,
    clearValuatedCache,
    priceRecipeIngredients,
    MIN_PRICED_INGREDIENT_PERCENT,
    computePriorityMultiplier,
};
