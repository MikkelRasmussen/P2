var pg = require('pg');
var ingMap = require('./mapping_ingredienser.json');
var mesMap = require('./mapping_måling.json');
var cutoutMap = require('./ingredientCutoutKeywords.json');
const fs = require('node:fs');
const { exec } = require('child_process');
const e = require('express');
//https://www.w3schools.com/nodejs/nodejs_mysql.asp
//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/Promise
//https://stackoverflow.com/questions/9205496/how-to-make-connection-to-postgres-via-node-js

const date = new Date();
function GetTimeStamp() {
    return {
        day: date.getDate(),
        month: date.getMonth(),
        year: date.getFullYear(),
        hour: date.getHours(),
        minute: date.getMinutes(),
    };
}
module.exports = class SQLHandler {
    #client;
    async Connect(host, user, password, port) {
        var conString = `postgres://${user}:${password}@${host}:${port}/FoodDB`;

        this.#client = new pg.Client(conString);

        try {
            await this.#client.connect();
            console.log("Connected to SQL Database!")


            this.#client.on("error", (err) => {
                console.err(err);
            });
            this.#client.on('notification', (msg) => {
                console.log(msg.channel) // foo
                console.log(msg.payload) // bar!
            });
            this.#client.on("end", () => {
                console.warn("Client disconnected!");
            })

        } catch (error) {
            console.error("Could not connect to SQL Database!");
        }
    }
    async Disconnect() {
        await this.#client.end();
        console.log("Client disconnected!");
    }
    /**
     * Sends a SQL query to the SQL database and returns a table of data.
     * @param   query  The SQL query in the format of a string.
     * @returns data table, or undefined on an error
     */
    async Query(query) {
        try {
            const result = await this.#client.query(query);
            return result.rows;
        } catch (error) {
            console.error("Could not query!");
            console.error(error);
            return undefined;
        }
    }

    async ImportSallingData() {

        function ScoreWordMatch(word11, word22) {
            var word1 = String(word11.length > word22.length ? word11 : word22).replace(" ", "");
            var word2 = String(word11.length > word22.length ? word22 : word11).replace(" ", "");

            var match = 0;
            var wordMatches = [];
            for (let off1 = 0; off1 < word2.length; off1++) {
                var wordMatch = [];
                for (let look = 0; look < word1.length; look++) {
                    if (word1[look] == word2[(look + off1) % word2.length])
                        wordMatch += word1[look];
                    else if (wordMatch.length > 0) {
                        if (word1.includes(wordMatch) && word2.includes(wordMatch)) {
                            wordMatches.push(wordMatch);
                            match = Math.max(match, wordMatch.length);
                        }
                        wordMatch = [];
                    }

                }

                if (wordMatch.length > 0) {
                    if (word1.includes(wordMatch) && word2.includes(wordMatch)) {
                        wordMatches.push(wordMatch);
                        match = Math.max(match, wordMatch.length);
                    }
                }
            }
            // console.log(wordMatches);
            return (match / word1.length);
        }


        // var match = ScoreWordMatch("italienske fennikelpølser", "Grillpølser m. ost 62% kød");
        // console.log(match);
        // match = ScoreWordMatch("tyske pølser", "Grillpølser m. ost 62% kød")
        // console.log(match);
        // match = ScoreWordMatch("øl", "Grillpølser m. ost 62% kød")
        // console.log(match);
        // var match = ScoreWordMatch("mandler", "mandler")
        // console.log(match);
        // return;
        if (!this.#InsureFoodDatabase()) {
            console.error("Could not insure the existance of the food table!");
            return false;
        }
        try {

            var getValidIngredientsQuery = `SELECT DISTINCT (json_extract_path_text(json_array_elements(ingredients), 'ingredient')) 
            AS ingredient FROM "Recipes";`
            var ingredientsQueryResult = await this.Query(getValidIngredientsQuery);
            if (ingredientsQueryResult === undefined) return false;
            ingredientsQueryResult = Array.from(ingredientsQueryResult).map(e => String(e.ingredient));

            console.info("Reading cache...");
            var readSeconds = Date.now();
            var data = JSON.parse(fs.readFileSync("./server/SQLHandler/cache.json", 'utf8')); //Read cache
            console.info(`Done! (${Date.now() - readSeconds} ms)`)
            //update cache if more then 24 hours has passed, since last update.
            if (data.timeStamp === undefined || data.timeStamp + 86400000 < Date.now()) {
                console.info("More then 24 hours has passed since last refresh! Updating...");
                var readSeconds = Date.now();
                const response = await fetch('http://localhost:5000/api/fetch-multiple', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': 'SG_APIM_4A20F12K69B8YC47D1E094QEZPMW7Q73B1BZCN2PW2QF88VQ3C4G'
                    },
                    body: JSON.stringify({
                        endpoints: ['recommendations/most-bought/bilkatogo/feed',],
                        basePath: 'api.sallinggroup.com/v1'
                    })
                });
                data = await response.json();
                console.info(`Done! (${Date.now() - readSeconds} ms)`)
                data.timeStamp = Date.now();
                fs.writeFileSync("./server/SQLHandler/cache.json", JSON.stringify(data), 'utf8');
            }

            console.log('Success:', data.success);
            console.log('Failed:', data.failed);
            console.log('Results:', data.results);
            console.log('Full response:', data);

            var items = Array.from(await data.results.map(e => e.data).flat()).map(e => {
                const itemLowerCase = String(e).toLowerCase();
                //Remove keywords found in the ingredientCutoutKeywords.json, such as "Øko".
                let lowerCasedCleaned = itemLowerCase;
                cutoutMap.keyword.forEach(f => lowerCasedCleaned = ` ${lowerCasedCleaned} `.replace(` ${f} `, ""));
                e.lowerCaseCleaned = lowerCasedCleaned.trim();
                return e;
            });
            
            console.time("Item catalouge time");
            for (let i = 0; i < items.length; i++) {
                let item = items[i];

                if (item.inStock === false) continue;
                const itemLowerCase = String(item.name).toLowerCase();
                if (itemLowerCase === "vand") continue;

                //Remove keywords found in the ingredientCutoutKeywords.json, such as "Øko".
                let lowerCasedCleaned = itemLowerCase;
                cutoutMap.keyword.forEach(e => lowerCasedCleaned = ` ${lowerCasedCleaned} `.replace(` ${e} `, ""));
                lowerCasedCleaned = lowerCasedCleaned.trim();

                var ingredient = ingredientsQueryResult
                    .map(e => { return { score: ScoreWordMatch(e, lowerCasedCleaned), name: e } })
                    .filter(e => e.score > 0.25)
                    .sort((a, b) => {
                        if (a.score > b.score) return -1;
                        else if (a.score < b.score) return 1;
                        else return 0;
                    });
                var ing = ingredient.map(e => `\n{${e.score}, ${e.name}}`);
                if (ingredient.length <= 0) continue;
                console.groupCollapsed(`${items[i].name} ScoreMatch: (${i} / ${items.length - 1})`);
                console.log(`${ing}`.substring(1));
                console.groupEnd();

                function cosinesim(A, B) {
                    var dotproduct = 0;
                    var mA = 0;
                    var mB = 0;

                    for (var i = 0; i < A.length; i++) {
                        dotproduct += A[i] * B[i];
                        mA += A[i] * A[i];
                        mB += B[i] * B[i];
                    }

                    mA = Math.sqrt(mA);
                    mB = Math.sqrt(mB);
                    var similarity = dotproduct / (mA * mB);

                    return similarity;
                }
                if (ingredient.map(e => e.score)[0] < 0.99999999) {
                    const filteredQueryList = Array.from([lowerCasedCleaned]).concat(ingredient.map((value) => value.name));
                    // console.log(filteredQueryList);
                    const body = {
                        model: "qwen3-embedding",
                        input: filteredQueryList
                    };
                    console.time("fetchTime");
                    const answer = await fetch("http://127.0.0.1:11434/api/embed", { method: "POST", body: JSON.stringify(body) });
                    const reponseObject = await answer.json();
                    console.timeEnd("fetchTime")

                    const resp = reponseObject.embeddings
                        .map((e, i) => { return { score: cosinesim(reponseObject.embeddings[0], e), name: ingredient[Math.max(0, i - 1)].name } })
                        .splice(1, reponseObject.embeddings.length - 1)
                        .sort((a, b) => {
                            if (a.score > b.score) return -1;
                            else if (a.score < b.score) return 1;
                            else return 0;
                        })
                        .filter(e => e.score > 0.8);

                    var ing2 = resp.map(e => `\n{${e.score}, ${e.name}}`);
                    // console.log("_________");
                    console.groupCollapsed(`${items[i].name} Embedded: (${ing2[0] !== undefined ? ing2[0].substring(1) : ""})`);
                    console.log(`${ing2}`.substring(1))
                    console.groupEnd();
                }

                if (ingredient.length < 1) continue; //Ignore empty ingredient lists.
                const FormatedContent = FormatContentUnit(item.contents, item.contentsUnit); //Fx: convert kg to g.
                const formatedItem = {
                    name: item.name,
                    price: item.price,
                    contents: FormatedContent.content,
                    contentsUnit: FormatedContent.contentsUnit,
                    ingredientMatches: ingredient,
                    store: "Salling",
                    sku: item.sku,
                }


                //TODO: change query string to check if a SKU number already exist in the store!
                var queryString = `INSERT INTO "Food" SELECT
                    '${formatedItem.name}', 
                    ${formatedItem.price},
                    ${formatedItem.contents},
                    '${formatedItem.contentsUnit}', 
                    '${JSON.stringify(formatedItem.ingredientMatches)}', 
                    '${formatedItem.store}',
                    ${formatedItem.sku}
                    WHERE NOT EXISTS (SELECT 1 FROM "Food" WHERE store = '${formatedItem.store}' AND sku = '${formatedItem.sku}')`.trim();
                // console.log(queryString);
                // if (await this.Query(queryString) === undefined) {
                //     console.log(queryString);
                // }

                function FormatContentUnit(content, unit) {
                    switch (unit) {
                        case "g":
                            return { content: content, contentsUnit: "g" };
                        case "kg":
                            return { content: (content * 1000), contentsUnit: "g" };
                        default:
                            return { content: content, contentsUnit: unit };
                    }
                }

            }
            console.timeEnd("Item catalouge time");
            /*
            data.results.forEach(result => {
                result.data.forEach(async item => {
                    if (item.inStock === false) return;
                    const itemLowerCase = String(item.name).toLowerCase();
                    if (itemLowerCase === "vand") return;
                    var ingredient = ingredientsQueryResult.filter(e => (` ${e} `.toLowerCase().includes(` ${itemLowerCase} `)));
                    // if (ingredient.length > 0) console.log(`1:: ${ingredient}`);
                    ingredient = ingredient.filter(e => { //Diffreance threshold.
                        var it = e.split(" ").find(f => f.toLowerCase().includes(itemLowerCase));
                        if (it !== undefined) return it.length <= itemLowerCase.length + 2;
                        else return true;
                    });
                    // if (ingredient.length > 0) console.log(`2:: ${ingredient}`);
                    ingredient = ingredient.filter(e => { //check if item contains multiple ingrediants.
                        var checkString = String(e).replace(itemLowerCase, "").trim();
                        var go = ingredientsQueryResult.filter(f => f.includes(checkString) && checkString.length > 0)
                        return go.length <= 1;
                    });
                    // if (ingredient.length > 0) console.log(`3:: ${ingredient}`);


                    if (ingredient.length < 1) return; //Ignore empty ingredient lists.
                    const FormatedContent = FormatContentUnit(item.contents, item.contentsUnit); //Fx: convert kg to g.
                    const formatedItem = {
                        name: item.name,
                        price: item.price,
                        contents: FormatedContent.content,
                        contentsUnit: FormatedContent.contentsUnit,
                        ingredientMatches: ingredient,
                        store: "Salling",
                        sku: item.sku,
                    }


                    //TODO: change query string to check if a SKU number already exist in the store!
                    var queryString = `INSERT INTO "Food" SELECT
                    '${formatedItem.name}', 
                    ${formatedItem.price},
                    ${formatedItem.contents},
                    '${formatedItem.contentsUnit}', 
                    '${JSON.stringify(formatedItem.ingredientMatches)}', 
                    '${formatedItem.store}',
                    ${formatedItem.sku}
                    WHERE NOT EXISTS (SELECT 1 FROM "Food" WHERE store = '${formatedItem.store}' AND sku = '${formatedItem.sku}')`.trim();
                    // console.log(queryString);
                    // if (await this.Query(queryString) === undefined) {
                    //     console.log(queryString);
                    // }

                    function FormatContentUnit(content, unit) {
                        switch (unit) {
                            case "g":
                                return { content: content, contentsUnit: "g" };
                            case "kg":
                                return { content: (content * 1000), contentsUnit: "g" };
                            default:
                                return { content: content, contentsUnit: unit };
                        }
                    }
                })
            });*/
        } catch (error) {
            console.error('Error:', error);
            return false;
        }

        return true;

    }

    async ImportRecipes() {
        if (!this.#InsureRecipeDatabase()) {
            console.error("Could not insure the existance of the recipes table!");
            return false;
        }
        try {
            const alphabet = "qwertyuiopåasdfghjklæøzxcvbnm";
            const endpoints = [];
            for (var i = 0; i < alphabet.length; i++) {
                endpoints.push(`/1/search.php?f=${alphabet.charAt(i)}`);
            }

            const response = await fetch('http://localhost:5000/api/fetch-multiple', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': 'SG_APIM_4A20F12K69B8YC47D1E094QEZPMW7Q73B1BZCN2PW2QF88VQ3C4G'
                },
                body: JSON.stringify({
                    endpoints: endpoints,
                    basePath: 'www.themealdb.com/api/json/v1'
                })
            });

            const data = await response.json();
            console.log('Success:', data.success);
            console.log('Failed:', data.failed);
            console.log('Results:', data.results);
            console.log('Full response:', data);

            data.results.forEach(result => {
                console.log(result);
                if (result.data !== undefined && Array.isArray(result.data.meals))
                    result.data.meals.forEach(async item => {
                        var ingMesList = GenerateIngredientListWithMesures(item);
                        var cat = item["strCategory"].replaceAll("'", "`");
                        var name = item["strMeal"].replaceAll("'", "`");
                        var instruct = item["strInstructions"].replaceAll("'", "`");
                        var queryString = `INSERT INTO "Recipes" VALUES ('${name}', '${JSON.stringify(ingMesList)}', '${instruct}', '${cat}');`;
                        if (await this.Query(queryString) === undefined) {
                            console.log(queryString);
                        }
                    })
            });


            function GenerateIngredientListWithMesures(item) {
                var ingMesList = [];
                for (var i = 0; i < 20; i++) {
                    var ingredient = ingMap[item[`strIngredient${i}`]];
                    var measure = mesMap[item[`strMeasure${i}`]];
                    if (ingredient !== undefined && measure !== undefined) {
                        // console.log(ingredient);
                        ingMesList.push({ ingredient: ingredient, measure: measure })
                    }
                }
                return ingMesList;
            }
            return true;

        } catch (error) {
            console.error(error);
            return false;
        }
    }

    async #InsureRecipeDatabase() {
        const queryText = fs.readFileSync("./server/SQLHandler/SQLCmdTexts/CreateRecipesDB.sql", 'utf8');
        try {
            await this.Query(queryText);
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    }
    async #InsureFoodDatabase() {
        const queryText = fs.readFileSync("./server/SQLHandler/SQLCmdTexts/CreateFoodDB.sql", 'utf8');
        try {
            await this.Query(queryText);
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    }
}
// Source - https://stackoverflow.com/a/45489272
// Posted by PeterMader
// Retrieved 2026-03-26, License - CC BY-SA 3.0

function waitForCondition(condition) {
    return new Promise(resolve => {
        var start_time = Date.now();
        function checkFlag() {
            if (conditionObj.arg == conditionObj.test) {
                console.log('met');
                resolve();
            } else if (Date.now() > start_time + 3000) {
                console.log('not met, time out');
                resolve();
            } else {
                window.setTimeout(checkFlag, 1000);
            }
        }
        checkFlag();
    });
}

