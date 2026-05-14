

// ------------------ PARAMETER DASHBOARD ------------------

const parameterAmountOfRecipes = 3; // Amount of recipes to recommend
const parameterBudgetMinimum = 50; // Minimum budget
const parameterBudgetMaximum = 75; // Maximum budget
const parameterMemoryScore = {}; // Memory score to personalise recommendations for the user

// ---------------------------------------------------------







const fs = require("fs");
const path = require("path");

// File paths for databases
const RECIPES_FILE_PATH = path.join("algorithm", "data", "recipes.json");

const INGREDIENTS_MAPPING_FILE_PATH = path.join("algorithm", "data","mapping_ingredienser.json");

const BILKA_PRICES_FILE_PATH = path.join("algorithm", "data", "bilka_prices.json");
const NETTO_PRICES_FILE_PATH = path.join("algorithm", "data", "netto_prices.json");
const FOTEX_PRICES_FILE_PATH = path.join("algorithm", "data", "føtex_prices.json");



function fetchData() {

    function loadJsonFile(filePath) {
        const fileContent = fs.readFileSync(filePath, "utf8");
        return JSON.parse(fileContent);
    }

    try {
        const recipes = loadJsonFile(RECIPES_FILE_PATH);

        const ingredientsMapping = loadJsonFile(INGREDIENTS_MAPPING_FILE_PATH);

        const bilkaPrices = loadJsonFile(BILKA_PRICES_FILE_PATH);
        const nettoPrices = loadJsonFile(NETTO_PRICES_FILE_PATH);
        const fotexPrices = loadJsonFile(FOTEX_PRICES_FILE_PATH);

        return {
            recipes: recipes,
            ingredientsMapping: ingredientsMapping,
            prices: {
                bilka: bilkaPrices,
                netto: nettoPrices,
                fotex: fotexPrices,
            }
        };
    }
    catch (error) {
        console.error(`Error loading data from file:\n${error.message}\n`);
        process.exit(0);
    }
}


function printResults(results) {
    let iteration = 1;
    let totalRecipes = Object.keys(results).length;

    let notPricedCount = 0;

    if ("notPricedCount" in results) {
        notPricedCount = results.notPricedCount;
        totalRecipes -= 1
    }

    console.log("\n==================== RESULTS ====================");
    console.log(`Recipes not priced: ${notPricedCount}`);
    
    for (const [name, data] of Object.entries(results)) {
        if (name === "notPricedCount") {
            continue;
        }

        const price = data.price;

        console.log(`>> Recipe ${iteration}/${totalRecipes}: ${name} (${price.toFixed(1)} DKK)`);

        for (const [ingredient, ingredientData] of Object.entries(data.stores || {})) {
            const measure = String(ingredientData.measure || "").trim();
            const store = ingredientData.store;
            const productName = ingredientData.productName;
            const amountToBuy = ingredientData.amountToBuy || 0;
            const ingredientPrice = ingredientData.price || 0;
            const storesData = ingredientData.storesData || {};

            const chosenStoreData = storesData[store] || {};
            const unitPrice = chosenStoreData.pricePerUnit;
            const unit = chosenStoreData.unit;

            let pricePerBuy = 0;

            if (amountToBuy > 0) {
                pricePerBuy = ingredientPrice / amountToBuy;
            }

            const ranking = [];

            for (const [storeName, storeData] of Object.entries(storesData)) {
                const storePrice = storeData.price || 999999;

                if (storePrice !== 999999) {
                    const rankAmountToBuy = storeData.amountToBuy || 0;

                    let rankPricePerBuy = 0;

                    if (rankAmountToBuy > 0) {
                        rankPricePerBuy = storePrice / rankAmountToBuy;
                    }

                    ranking.push({
                        store: storeName,
                        price: storePrice,
                        amountToBuy: rankAmountToBuy,
                        productName: storeData.productName,
                        pricePerUnit: storeData.pricePerUnit,
                        unit: storeData.unit,
                        pricePerBuy: rankPricePerBuy,
                    });
                }
            }

            // Sorting to find the cheapest store
            for (let i = 0; i < ranking.length; i++) {
                for (let j = i + 1; j < ranking.length; j++) {
                    if (ranking[j].price < ranking[i].price) {
                        const temp = ranking[i];
                        ranking[i] = ranking[j];
                        ranking[j] = temp;
                    }
                }
            }

            if (measure) {
                console.log(`${measure} ${ingredient}`);
            } else {
                console.log(`${ingredient}`);
            }

            console.log(`  store: ${store}`);

            if (productName) {
                console.log(`  product: ${productName}`);
            }

            console.log(`  amount: ${amountToBuy}`);
            console.log(`  price: ${ingredientPrice.toFixed(2)} DKK`);

            if (unitPrice !== null && unitPrice !== undefined && unit) {
                console.log(`  price per unit: ${unitPrice.toFixed(2)} DKK / ${unit}`);
            }

            if (amountToBuy > 0) {
                console.log(`  price per buy: ${pricePerBuy.toFixed(2)} DKK`);
            }

            if (ranking.length > 0) {
                console.log("  rank:");

                let rankNumber = 1;

                for (const rankData of ranking) {
                    let rankLine = `    ${rankNumber}. ${rankData.store} - ${rankData.price.toFixed(2)} DKK - buy ${rankData.amountToBuy}`;

                    if (rankData.pricePerUnit !== null && rankData.pricePerUnit !== undefined && rankData.unit) {
                        rankLine += ` - ${rankData.pricePerUnit.toFixed(2)} DKK/${rankData.unit}`;
                    }

                    if (rankData.amountToBuy > 0) {
                        rankLine += ` - ${rankData.pricePerBuy.toFixed(2)} DKK each`;
                    }

                    if (rankData.productName) {
                        rankLine += ` - ${rankData.productName}`;
                    }

                    console.log(rankLine);
                    rankNumber++;
                }
            }

            console.log("");
        }

        iteration++;
    }

    console.log("=================================================\n");
}


function calculateBuyPrice(recipe, store, currentItem) {
    // Organizing all the possible units from units_extractor.py / units.txt
    const volumeUnits = ["ml", "l", "dl", "cl", "cup", "cups", "pint", "pints", "qt", "quart", "quarts", "milliliters", "milliliter", "liters", "liter", "litres", "litre", "tbs", "tbls", "tblsp", "tbsp", "tablespoon", "tablespoons", "tsp", "teaspoon", "teaspoons"];
    const weightUnits = ["mg", "g", "gram", "grams", "kg", "kilogram", "kilograms", "pound", "pounds", "lb", "lbs", "oz", "ounce", "ounces",];
    const miscUnits = ["bag", "bags", "handful", "handfuls", "handfull", "handfulls", "bottle", "bottles", "jar", "jars", "pot", "pots", "packet", "packets", "pack", "package", "packages", "shot"];
    const abstractUnits = ["slices", "slice", "sliced", "cans", "can", "tin", "piece", "pieces", "part", "parts", "bunch", "bunches", "clove", "cloves", "head", "heads", "leaf", "leaves", "sprig", "sprigs", "stalk", "stalks", "stick", "sticks", "bulb", "bulbs", "knob", "knobs", "pod", "pods", "large", "medium", "small", "whole", "pinch", "pinches", "dash", "drop", "drops", "drizzle", "splash", "fillet", "fillets", "rasher", "rashers", "yolk", "yolks", "tub", "tubs", "stk"];
    const ignoredUnits = [ "as required", "beaten", "boiled", "boneless", "chopped", "diced", "finely chopped", "finely diced", "finely sliced", "grated", "halved", "mashed", "minced", "quartered", "shredded", "skinned", "to serve", "to taste"];

    // Extracting the data from the recipe and store data
    let recipeQuantity = recipe.quantity;
    let recipeUnit = String(recipe.unit || "").trim().toLowerCase();

    let storePrice = store.price;
    let storeUnit = String(store.unit || "").trim().toLowerCase();

    // Setting defaults
    let resultingPrice = 999999;
    let amountToBuy = 0;
    let storeQuantity = null;
    let storeQuantityUnit = "";
    let packagePrice = storePrice;

    // Converting to number type
    recipeQuantity = Number(recipeQuantity);
    storePrice = Number(storePrice);

    if (Number.isNaN(recipeQuantity) || Number.isNaN(storePrice)) {
        return [resultingPrice, amountToBuy];
    }

    // Normalising the recipe unit
    if (["gr", "gram", "grams"].includes(recipeUnit)) {
        recipeUnit = "g";
    } else if (["kilogram", "kilograms"].includes(recipeUnit)) {
        recipeUnit = "kg";
    } else if (["milliliter", "milliliters"].includes(recipeUnit)) {
        recipeUnit = "ml";
    } else if (["liter", "liters", "litre", "litres"].includes(recipeUnit)) {
        recipeUnit = "l";
    } else if (["tablespoon", "tablespoons", "tbsp", "tblsp", "tbls"].includes(recipeUnit)) {
        recipeUnit = "tbs";
    } else if (["teaspoon", "teaspoons"].includes(recipeUnit)) {
        recipeUnit = "tsp";
    } else if (recipeUnit === "") {
        recipeUnit = "stk";
    } else if (miscUnits.includes(recipeUnit) || abstractUnits.includes(recipeUnit) || ignoredUnits.includes(recipeUnit)) {
        recipeUnit = "stk";
    }

    // Normalising the store unit
    if (["gr", "gram", "grams"].includes(storeUnit)) {
        storeUnit = "g";
    } else if (["kilogram", "kilograms"].includes(storeUnit)) {
        storeUnit = "kg";
    } else if (["milliliter", "milliliters"].includes(storeUnit)) {
        storeUnit = "ml";
    } else if (["liter", "liters", "litre", "litres"].includes(storeUnit)) {
        storeUnit = "l";
    } else if (["tablespoon", "tablespoons", "tbsp", "tblsp", "tbls"].includes(storeUnit)) {
        storeUnit = "tbs";
    } else if (["teaspoon", "teaspoons"].includes(storeUnit)) {
        storeUnit = "tsp";
    } else if (storeUnit === "") {
        storeUnit = "stk";
    }

    // Reading the product
    if (currentItem !== null && currentItem !== undefined) {
        packagePrice = Number(currentItem.price);

        if (Number.isNaN(packagePrice)) {
            packagePrice = storePrice;
        }

        storeQuantity = Number(currentItem.contents);

        if (!Number.isNaN(storeQuantity)) {
            storeQuantityUnit = String(currentItem.contentsUnit || "").trim().toLowerCase();
        } else {
            storeQuantity = null;
        }
    }

    // Normalising the package unit
    if (["gr", "gram", "grams"].includes(storeQuantityUnit)) {
        storeQuantityUnit = "g";
    }
    if (["kilogram", "kilograms"].includes(storeQuantityUnit)) {
        storeQuantityUnit = "kg";
    }
    if (["milliliter", "milliliters"].includes(storeQuantityUnit)) {
        storeQuantityUnit = "ml";
    }
    if (["liter", "liters", "litre", "litres"].includes(storeQuantityUnit)) {
        storeQuantityUnit = "l";
    }
    if (miscUnits.includes(storeQuantityUnit) || abstractUnits.includes(storeQuantityUnit) || ignoredUnits.includes(storeQuantityUnit) || storeQuantityUnit === "") {
        storeQuantityUnit = "stk";
    }

    // Conversion values
    const weightValues = {
        mg: 0.001,
        g: 1,
        kg: 1000,
        lb: 453.592,
        lbs: 453.592,
        pound: 453.592,
        pounds: 453.592,
        oz: 28.3495,
        ounce: 28.3495,
        ounces: 28.3495,
    };

    const volumeValues = {
        ml: 1,
        cl: 10,
        dl: 100,
        l: 1000,
        cup: 250,
        cups: 250,
        pint: 568,
        pints: 568,
        qt: 946,
        quart: 946,
        quarts: 946,
        tbs: 15,
        tsp: 5,
    };

    // Calculating amount to buy from package size
    if (storeQuantity !== null && storeQuantity > 0) {
        if (recipeUnit === storeQuantityUnit) {
            amountToBuy = Math.ceil(recipeQuantity / storeQuantity);

        } else if (weightUnits.includes(recipeUnit) && storeQuantityUnit in weightValues) {
            const recipeInGram = recipeQuantity * weightValues[recipeUnit];
            const storeInGram = storeQuantity * weightValues[storeQuantityUnit];
            amountToBuy = Math.ceil(recipeInGram / storeInGram);

        } else if (volumeUnits.includes(recipeUnit) && storeQuantityUnit in volumeValues) {
            const recipeInMl = recipeQuantity * volumeValues[recipeUnit];
            const storeInMl = storeQuantity * volumeValues[storeQuantityUnit];
            amountToBuy = Math.ceil(recipeInMl / storeInMl);

        } else if (recipeUnit === "stk" && storeQuantityUnit === "stk") {
            amountToBuy = Math.ceil(recipeQuantity / storeQuantity);
        }

        if (amountToBuy > 0) {
            resultingPrice = packagePrice * amountToBuy;
        }
    }

    // Rounding to 2 decimals and returning the result
    if (resultingPrice !== 999999) {
        resultingPrice = Math.round(resultingPrice * 100) / 100;
    }

    return [resultingPrice, amountToBuy];
}

// Function to determine the cheapest price from the cheapest store
function findCheapestPrice(ingredient, quantity, unit, priceData) {
    let bilka;
    let netto;
    let fotex;

    try {
        bilka = priceData.bilka;
        netto = priceData.netto;
        fotex = priceData.fotex;
    }
    catch (error) {
        return [null, null, null, false];
    }

    const recipeQuantity = {
        quantity: quantity,
        unit: unit,
    };

    const ingredientLower = ingredient.toLowerCase();


    // Bilka to go
    let priceToBuyBilka = 999999;
    let amountToBuyBilka = 0;
    let productNameBilka = null;
    let unitPriceBilka = null;
    let unitBilka = null;

    for (let i = 0; i < bilka.length; i++) {
        if (bilka[i].description.toLowerCase().includes(ingredientLower)) {
            const unitPriceBilkaCheck = bilka[i].unitPrice;
            const unitBilkaCheck = bilka[i].priceUnit;

            const storeQuantity = {
                price: unitPriceBilkaCheck,
                unit: unitBilkaCheck,
            };

            const [priceToBuyBilkaCheck, amountToBuyBilkaCheck] = calculateBuyPrice(recipeQuantity, storeQuantity, bilka[i]);

            if (priceToBuyBilkaCheck < priceToBuyBilka) {
                priceToBuyBilka = priceToBuyBilkaCheck;
                amountToBuyBilka = amountToBuyBilkaCheck;
                unitPriceBilka = unitPriceBilkaCheck;
                unitBilka = unitBilkaCheck;
                productNameBilka = bilka[i].description;
            }
        }
    }

    // Netto plus
    let priceToBuyNetto = 999999;
    let amountToBuyNetto = 0;
    let productNameNetto = null;
    let unitPriceNetto = null;
    let unitNetto = null;

    for (let i = 0; i < netto.length; i++) {
        if (netto[i].description.toLowerCase().includes(ingredientLower)) {
            const unitPriceNettoCheck = netto[i].unitPrice;
            const unitNettoCheck = netto[i].priceUnit;

            const storeQuantity = {
                price: unitPriceNettoCheck,
                unit: unitNettoCheck,
            };

            const [priceToBuyNettoCheck, amountToBuyNettoCheck] = calculateBuyPrice(recipeQuantity, storeQuantity, netto[i]);

            if (priceToBuyNettoCheck < priceToBuyNetto) {
                priceToBuyNetto = priceToBuyNettoCheck;
                amountToBuyNetto = amountToBuyNettoCheck;
                unitPriceNetto = unitPriceNettoCheck;
                unitNetto = unitNettoCheck;
                productNameNetto = netto[i].description;
            }
        }
    }

    // Føtex plus
    let priceToBuyFotex = 999999;
    let amountToBuyFotex = 0;
    let productNameFotex = null;
    let unitPriceFotex = null;
    let unitFotex = null;

    for (let i = 0; i < fotex.length; i++) {
        if (fotex[i].description.toLowerCase().includes(ingredientLower)) {
            const unitPriceFotexCheck = fotex[i].unitPrice;
            const unitFotexCheck = fotex[i].priceUnit;

            const storeQuantity = {
                price: unitPriceFotexCheck,
                unit: unitFotexCheck,
            };

            const [priceToBuyFotexCheck, amountToBuyFotexCheck] = calculateBuyPrice(recipeQuantity, storeQuantity, fotex[i]);

            if (priceToBuyFotexCheck < priceToBuyFotex) {
                priceToBuyFotex = priceToBuyFotexCheck;
                amountToBuyFotex = amountToBuyFotexCheck;
                unitPriceFotex = unitPriceFotexCheck;
                unitFotex = unitFotexCheck;
                productNameFotex = fotex[i].description;
            }
        }
    }


    // Comparing the cheapest price from each store with each other
    // to find the overall lowest price.
    const prices = {
        bilka: priceToBuyBilka,
        netto: priceToBuyNetto,
        fotex: priceToBuyFotex,
    };

    let store = "bilka";

    try {
        if (prices.netto < prices[store]) {
            store = "netto";
        }

        if (prices.fotex < prices[store]) {
            store = "fotex";
        }

    }
    catch (error) {
        return [null, null, null, false];
    }

    const cheapestPrice = prices[store];

    const storesData = {
        bilka: {
            price: priceToBuyBilka,
            amountToBuy: amountToBuyBilka,
            productName: productNameBilka,
            pricePerUnit: unitPriceBilka,
            unit: unitBilka,
        },
        netto: {
            price: priceToBuyNetto,
            amountToBuy: amountToBuyNetto,
            productName: productNameNetto,
            pricePerUnit: unitPriceNetto,
            unit: unitNetto,
        },
        fotex: {
            price: priceToBuyFotex,
            amountToBuy: amountToBuyFotex,
            productName: productNameFotex,
            pricePerUnit: unitPriceFotex,
            unit: unitFotex,
        },
    };

    if (cheapestPrice === 999999) {
        return [null, null, null, false];
    }

    return [cheapestPrice, store, storesData, true];
}




// --------  THE ALGORITHM --------

function runAlgorithm(amount = 1, budgetMin = 0, budgetMax = 9999, memoryScores = {}) {
    // Initialising data for the algorithm
    const data = fetchData();
    const recipes = data.recipes;
    const ingredientsMapping = data.ingredientsMapping;
    const priceData = data.prices;

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

    // Internal helper function to get memory score
    function getMemoryScore(name) {
        try {
            if (name in memoryScores) {
                return Number(memoryScores[name]);
            } else if (name.toLowerCase() in memoryScores) {
                return Number(memoryScores[name.toLowerCase()]);
            } else {
                return 1;
            }
        }
        catch (error) {
            return 1;
        }
    }

    // Internal helper function to parse quantities of an ingredient of the recipe
    function parseQuantity(quantity) {
        quantity = String(quantity || "").trim().toLowerCase();

        // Changing fractions to simple text
        const fractions = {
            "\u00bd": " 1/2",
            "\u00bc": " 1/4",
            "\u00be": " 3/4",
            "\u2153": " 1/3",
            "\u2154": " 2/3",
            "\u215b": " 1/8",
        };

        // Replacing characters such as ½ to 1/2
        for (const fraction in fractions) {
            quantity = quantity.replaceAll(fraction, fractions[fraction]);
        }

        quantity = quantity.replaceAll(",", ".");
        quantity = quantity.replaceAll("-", " ");
        quantity = quantity.replaceAll("(", " ");
        quantity = quantity.replaceAll(")", " ");

        // Internal helper function to read numbers
        function readNumber(number) {
            number = number.trim();

            // For numbers like "1 1/2" which becomes 1.5
            if (number.includes(" ") && number.includes("/")) {
                const parts = number.split(/\s+/); // Using regex to split and remove whitespace
                const wholeNumber = Number(parts[0]);
                const fractionParts = parts[1].split("/");

                return wholeNumber + (Number(fractionParts[0]) / Number(fractionParts[1]));
            }

            // For numbers like "1/2" which becomes 0.5
            if (number.includes("/")) {
                const fractionParts = number.split("/");

                return Number(fractionParts[0]) / Number(fractionParts[1]);
            }

            return Number(number);
        }

        function isDigit(character) {
            return character >= "0" && character <= "9";
        }

        function readNumberText(text, startPosition) {
            if (startPosition >= text.length || !isDigit(text[startPosition])) {
                return ["", startPosition];
            }

            const start = startPosition;
            let position = startPosition;

            while (position < text.length && isDigit(text[position])) {
                position++;
            }

            const afterWholeNumber = position;

            // Mixed fraction number, for example 1 1/2
            let spacePosition = afterWholeNumber;

            while (spacePosition < text.length && text[spacePosition] === " ") {
                spacePosition++;
            }

            let fractionPosition = spacePosition;

            while (fractionPosition < text.length && isDigit(text[fractionPosition])) {
                fractionPosition++;
            }

            if (spacePosition > afterWholeNumber && fractionPosition < text.length && text[fractionPosition] === "/") {
                fractionPosition++;
                let fractionEnd = fractionPosition;

                while (fractionEnd < text.length && isDigit(text[fractionEnd])) {
                    fractionEnd++;
                }

                if (fractionEnd > fractionPosition) {
                    return [text.slice(start, fractionEnd), fractionEnd];
                }
            }

            // Fraction
            if (position < text.length && text[position] === "/") {
                position++;
                let fractionEnd = position;

                while (fractionEnd < text.length && isDigit(text[fractionEnd])) {
                    fractionEnd++;
                }

                if (fractionEnd > position) {
                    return [text.slice(start, fractionEnd), fractionEnd];
                }
            }

            // Decimal number
            if (position + 1 < text.length && text[position] === "." && isDigit(text[position + 1])) {
                position++;

                while (position < text.length && isDigit(text[position])) {
                    position++;
                }
            }

            return [text.slice(start, position), position];
        }

        function readUnitText(text, startPosition) {
            let position = startPosition;

            while (position < text.length && text[position] === " ") {
                position++;
            }

            let unit = "";

            while (position < text.length && text[position] >= "a" && text[position] <= "z") {
                unit += text[position];
                position++;
            }

            if (unit) {
                return unit;
            }

            return "stk";
        }

        // Checking if the measurement says for exampl "2 x 400g"
        let position = 0;

        while (position < quantity.length) {
            const [firstNumber, firstNumberEnd] = readNumberText(quantity, position);

            if (firstNumber) {
                let xPosition = firstNumberEnd;

                while (xPosition < quantity.length && quantity[xPosition] === " ") {
                    xPosition++;
                }

                if (xPosition < quantity.length && quantity[xPosition] === "x") {
                    let secondNumberStart = xPosition + 1;

                    while (secondNumberStart < quantity.length && quantity[secondNumberStart] === " ") {
                        secondNumberStart++;
                    }

                    const [secondNumber, secondNumberEnd] = readNumberText(quantity, secondNumberStart);

                    if (secondNumber) {
                        const amount = readNumber(firstNumber) * readNumber(secondNumber);
                        const unit = readUnitText(quantity, secondNumberEnd);

                        return [amount, unit];
                    }
                }

                position = firstNumberEnd;
            }
            else {
                position++;
            }
        }

        // Reading the first normal number, for example "500g" or "1.5 kg"
        position = 0;

        while (position < quantity.length) {
            const [number, numberEnd] = readNumberText(quantity, position);

            if (number) {
                const amount = readNumber(number);
                const unit = readUnitText(quantity, numberEnd);

                return [amount, unit];
            }

            position++;
        }

        // If there is no number, it is probably one piece
        const words = quantity.split(/\s+/).filter(word => word !== "");

        if (words.length > 0) {
            return [1, words[0]];
        }

        return [1, "stk"];
    }




    // ====== ALGORITHM START ======

    const results = {};
    const recipesNotPriced = {};

    for (let i = 0; i < amount; i++) {
        const candidates = {};
        let cheapestCandidatePrice = 999999;
        let cheapestCandidateScore = 999999;
        let cheapestCandidateName = null;
        let cheapestCandidateStores = null;

        // Iterate through all recipes
        for (const recipeRow of recipes) {
            const meals = recipeRow.meals || [];

            for (const recipe of meals) {
                const name = recipe.strMeal;

                if (name in results) {
                    continue;
                }

                const ingredientsToValue = [];

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
                            ingredientsToValue.push({
                                name: ingredient,
                                measure: measure || "",
                            });
                        }
                    }
                }

                // Failsafe if there is nothing to price
                if (ingredientsToValue.length === 0) {
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

                    if (ingredientScore === 1) {
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
                    rankingPrice += cheapestPrice * ingredientScore;
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

    // ====== ALGORITHM END ======

    const recipesNotPricedArray = Object.keys(recipesNotPriced);
    results.notPricedCount = recipesNotPricedArray.length;
    return results;

}

const results = runAlgorithm(parameterAmountOfRecipes, parameterBudgetMinimum, parameterBudgetMaximum, parameterMemoryScore);

printResults(results);