var pg = require('pg');
var ingMap = require('./mapping_ingredienser.json');
var mesMap = require('./mapping_måling.json');
var cutoutMap = require('./ingredientCutoutKeywords.json');
const fs = require('node:fs');
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


const ollamaUrl = "https://fax-evaluating-compilation-favorites.trycloudflare.com"; "http://127.0.0.1:11434";
const ingrediantEmbeddings = [];

module.exports = class SQLHandler {
    get connected() {
        return this.#_connected;
    }
    #_connected = false;
    #client;
    async Connect(host, user, password, port, db, ssl = true) {
        var conString = `postgres://${user}:${password}@${host}:${port}/${db}?ssl=false`;
        var clientOption = {
            user: user,
            password: password,
            host: host,
            database: db,
            port: port,
        }
        var sslOption = {
            ssl: { rejectUnauthorized: false }
        }
        var options = (ssl ? { ...sslOption, ...clientOption } : { ...clientOption });
        this.#client = new pg.Client(options);

        try {
            await this.#client.connect();
            if (!process.env.NODE_TEST_CONTEXT)
                console.log("Connected to SQL Database!")
            this.#_connected = true;


            this.#client.on("error", (err) => {
                console.error(err);
            });
            this.#client.on('notification', (msg) => {
                console.log(msg.channel) // foo
                console.log(msg.payload) // bar!
            });
            this.#client.on("end", () => {
                if (!process.env.NODE_TEST_CONTEXT)
                    console.warn("Client disconnected!");
            })

        } catch (error) {
            this.#_connected = false;
            if (process.env.NODE_TEST_CONTEXT)
                throw error;
            console.error("Could not connect to SQL Database!");
            console.error(error);
            throw error;
        }
        return true;
    }
    async Disconnect() {
        try {
            await this.#client.end();
            if (!process.env.NODE_TEST_CONTEXT)
                console.log("Client disconnected!");
            return true;
        } catch (error) {
            throw error;
        }
    }
    /**
     * Sends a SQL query to the SQL database and returns a table of data.
     * @param   query  The SQL query in the format of a string.
     * @returns data table, or undefined on an error
     */
    async Query(query) {
        try {
            const result = await this.#client.query(query);
            return Array.from(result.rows);
        } catch (error) {
            if (!process.env.NODE_TEST_CONTEXT) {
                console.error("Could not query!");
                console.error(error);
            }
            return undefined;
        }
    }

    async ImportSallingData(store) {

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

        if (!this.#InsureDatabase()) {
            console.error("Could not insure the existance of the food table!");
            return false;
        }
        try {
            var queryResult = await this.Query(`SELECT * FROM "Food" where store = '${store}'`)
            if (queryResult === undefined) return false;

            console.info("Reading cache...");
            var readSeconds = Date.now();
            var data;
            if (fs.existsSync(`./server/SQLHandler/cache-${store}.json`))
                data = JSON.parse(fs.readFileSync(`./server/SQLHandler/cache-${store}.json`, 'utf8')); //Read cache
            console.info(`Done! (${Date.now() - readSeconds} ms)`)
            //update cache if more then 24 hours has passed, since last update.
            if (data === undefined || data.timeStamp === undefined || data.timeStamp + 86400000 < Date.now()) {
                console.info("More then 24 hours has passed since last refresh! Updating...");
                var readSeconds = Date.now();
                const response = await fetch('http://localhost:5000/api/fetch-multiple', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': 'SG_APIM_4A20F12K69B8YC47D1E094QEZPMW7Q73B1BZCN2PW2QF88VQ3C4G'
                    },
                    body: JSON.stringify({
                        endpoints: [`recommendations/most-bought/${store}/feed`,],
                        basePath: 'api.sallinggroup.com/v1'
                    })
                });
                data = await response.json();
                console.info(`Done! (${Date.now() - readSeconds} ms)`)
                data.timeStamp = Date.now();

                if (data.failed > 0) throw `Data failed (${store})`;
                fs.writeFileSync(`./server/SQLHandler/cache-${store}.json`, JSON.stringify(data), 'utf8');
            }

            console.log('Success:', data.success);
            console.log('Failed:', data.failed);
            console.log('Results:', data.results);
            console.log('Full response:', data);

            var items = Array.from(data.results.map(e => e.data).flat()).map(e => {
                const itemLowerCase = String(e.name).toLowerCase();
                //Remove keywords found in the ingredientCutoutKeywords.json, such as "Øko".
                let lowerCasedCleaned = itemLowerCase;
                cutoutMap.keyword.forEach(f => lowerCasedCleaned = ` ${lowerCasedCleaned} `.replace(` ${f} `, ""));
                e.lowerCaseCleaned = lowerCasedCleaned.trim();
                return e;
            }).filter(e => {
                if (e.inStock === false) return false;
                if (e.lowerCaseCleaned === "vand") return false
                const checkValue = queryResult.find(f => f.sku === e.sku);
                if (checkValue === undefined)
                    return true;

                const format = FormatContentUnit(e.contents, e.contentsUnit);
                if (format.content !== checkValue.contents)
                    return true;

                if (format.contentsUnit !== checkValue.contentsunit)
                    return true;


                return false;
            });
            console.log(`${store}: ${items.length} / ${data.results.map(e => e.data).flat().length} needs refreshing`);
            var itemChunkSize = 100;
            var itemChunks = []
            for (var i = 0; i < items.length; i += itemChunkSize) {
                let chunk = items.slice(i, Math.min(i + itemChunkSize, items.length));
                itemChunks.push(chunk);
            }

            console.time("fetchTime");
            var connectionTestReponse;
            for (var attempts = 3; 0 < attempts; attempts--) {
                try {
                    connectionTestReponse = await fetch(ollamaUrl + "/api/tags");
                    break;
                } catch (error) {
                    console.error(error);
                }
            }
            if (!connectionTestReponse.ok) throw "Could not connect to Ollama!";
            const modelList = await connectionTestReponse.json();
            if (modelList.models.filter(e => String(e.name).startsWith("qwen3-embedding")).length <= 0) throw 'No "qwen3-embedding" model was found!';

            const itemEmbedding = new Promise(async (res, rej) => {
                console.log(`Embedding items... (0 / ${itemChunks.length})`);
                for (var i = 0; i < itemChunks.length; i++) {
                    const body = {
                        model: "qwen3-embedding",
                        input: itemChunks[i].map(e => e.lowerCaseCleaned),
                    };
                    const answer = await fetch(ollamaUrl + "/api/embed", { method: "POST", body: JSON.stringify(body), keepalive: true });
                    const answerText = await answer.text();
                    if (!await isJson(answerText)) {
                        rej(`Answer text is not json! ${answerText}`);
                        return;
                    }
                    const reponseObject = JSON.parse(answerText);
                    const embeddings = reponseObject.embeddings;
                    if (itemChunks[i].length != embeddings.length) throw "LENGTH NO MATCH!";
                    for (var l = 0; l < itemChunks[i].length; l++) {
                        const itemMatch = items.find(e => e.sku === itemChunks[i][l].sku);
                        if (itemMatch === undefined) throw "NO MATCH!";
                        itemMatch.embedding = embeddings[l];
                    }
                    console.log(`Embedding items... (${i + 1} / ${itemChunks.length})`);
                }
                res(items);
            });
            await Promise.all([itemEmbedding]);
            if (items.some(e => e.embedding === undefined))
                throw "Some embeddings where undefined!";
            console.timeEnd("fetchTime")

            console.time("Item catalouge time");
            for (let i = 0; i < items.length; i++) {
                let item = items[i];

                if (item.inStock === false) continue;
                const itemLowerCase = String(item.name).toLowerCase();

                const FormatedContent = FormatContentUnit(item.contents, item.contentsUnit); //Fx: convert kg to g.
                const formatedItem = {
                    name: item.name,
                    price: item.price,
                    contents: FormatedContent.content,
                    contentsUnit: FormatedContent.contentsUnit,
                    store: store,
                    sku: item.sku,
                    embedding: JSON.stringify(item.embedding),
                }


                //TODO: change query string to check if a SKU number already exist in the store!
                var queryString = `INSERT INTO "Food" VALUES (
                    '${formatedItem.name.replaceAll("'", "`")}', 
                    ${formatedItem.price},
                    ${formatedItem.contents},
                    '${formatedItem.contentsUnit}', 
                    '${formatedItem.store}',
                    '${formatedItem.sku}',
                    DEFAULT,
                    '${formatedItem.embedding}') 
                    ON CONFLICT (store, sku)
                    DO UPDATE SET
                    name='${formatedItem.name.replaceAll("'", "`")}', 
                    price=${formatedItem.price},
                    contents=${formatedItem.contents},
                    contentsunit='${formatedItem.contentsUnit}', 
                    embedding='${formatedItem.embedding}'
                    `.trim();

                if (await this.Query(queryString) === undefined) {
                    // console.log(queryString);
                    console.error(formatedItem);
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
            console.timeEnd("Item catalouge time");
            // console.timeEnd("fetchTime")
            return false;
        }

        return true;

    }

    async ImportRecipes() {
        if (!this.#InsureDatabase()) {
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

            const queryResult = await this.Query('SELECT name FROM "Recipes"')
            if (queryResult === undefined) return false;

            const recipes = Array.from(data.results).flatMap(e => Array.isArray(e.data.meals) ? e.data.meals : undefined)
                .filter(e => e !== undefined)
                .filter(e => !queryResult.some(f => f.name === e["strMeal"].replaceAll("'", "`")));
            if (recipes.length <= 0) return true;

            var ingList = [];
            recipes.forEach(item => {
                var ingMesList = GenerateIngredientListWithMesures(item);
                ingMesList.forEach(e => e.recipe = item["strMeal"].replaceAll("'", "`"));
                ingList.push(ingMesList);
            })
            ingList = ingList.flat();

            var ingredientChunkSize = 100;
            var ingredientChunks = []
            for (var i = 0; i < ingList.length; i += ingredientChunkSize) {
                let chunk = ingList.slice(i, Math.min(i + ingredientChunkSize, ingList.length));
                ingredientChunks.push(chunk.filter(e => e.embedding === undefined));
            }

            console.time("embeddingTime");
            const ingredientEmbedding = new Promise(async (res, rej) => {
                console.log(`Embedding ingredients... (0 / ${ingredientChunks.length})`);
                for (var i = 0; i < ingredientChunks.length; i++) {
                    const body = {
                        model: "qwen3-embedding",
                        input: ingredientChunks[i].map(e => e.ingredient.toLowerCase()),
                    };
                    const answer = await fetch(ollamaUrl + "/api/embed", { method: "POST", body: JSON.stringify(body), keepalive: true });
                    const answerText = await answer.text();
                    if (!await isJson(answerText)) {
                        rej(`Answer text is not json! ${answerText}`);
                        return;
                    }
                    const reponseObject = JSON.parse(answerText);
                    const embeddings = reponseObject.embeddings;
                    for (var l = 0; l < embeddings.length; l++) {
                        ingList[i * 100 + l].embedding = JSON.stringify(embeddings[l]);
                    }
                    console.log(`Embedding ingredients... (${i + 1} / ${ingredientChunks.length})`);
                }
                res(ingList);
            });
            await Promise.all([ingredientEmbedding]);
            console.timeEnd("embeddingTime");

            // var ingrediantsAddQuery = `INSERT INTO "Ingredients" VALUES ${ingList.map((e, i) => {
            //     console.log(`${i + 1} / ${ingList.length}`)
            //     return `(DEFAULT, '${e.recipe}', '${e.ingredient}', '${e.measure}', '${e.embedding}')`;//.replaceAll("'", "`");
            // })} ON CONFLICT DO NOTHING;`;
            // console.log("ingrediantsAddQuery");

            for (var i = 0; i < recipes.length; i++) {
                var item = recipes[i];
                var ingMesList = GenerateIngredientListWithMesures(item);
                var cat = item["strCategory"].replaceAll("'", "`");
                var name = item["strMeal"].replaceAll("'", "`");
                var instruct = item["strInstructions"].replaceAll("'", "`");
                var url = item["strMealThumb"].replaceAll("'", "`");
                var queryString =
                    `INSERT INTO "Recipes" VALUES ('${name}', '${JSON.stringify(ingMesList)}', '${instruct}', '${cat}', '${url}') ON CONFLICT DO NOTHING;`;

                console.log(`Adding recipe: ${i + 1} / ${recipes.length}`)
                if (await this.Query(queryString) === undefined) {
                    // console.error(queryString);
                }
            }

            console.log("Adding ingrediants to database!");
            for (var i = 0; i < ingList.length; i++) {
                var e = ingList[i];
                var queryString =
                    `INSERT INTO "Ingredients" VALUES (DEFAULT, '${e.recipe}', '${e.ingredient}', '${e.measure}', '${e.embedding}') ON CONFLICT DO NOTHING;`;

                console.log(`Adding ingredient: ${i + 1} / ${ingList.length}`)
                if (await this.Query(queryString) === undefined) {
                    // console.error(queryString);
                }
            }


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

    async CreateIngredientMatches() {
        console.log("Matching wares and ingredients...");
        const ingrediants = await this.Query('SELECT id, recipe, embedding, measurement FROM "Ingredients"');
        const food = await this.Query('SELECT id, embedding, contentsunit FROM "Food"');
        if (food === undefined || ingrediants === undefined) {
            throw `${food === undefined ? "FOOD IS UNDEFINED" : ""} ${ingrediants === undefined ? "INGREDIANTS IS UNDEFINED" : ""}`
            return false;
        }
        console.log(`Ingredients (${ingrediants.length}) & Food (${food.length})`)
        console.log(`Total matches possible: ${ingrediants.length * food.length}`)

        var progress = 0;
        const matches = [];
        ingrediants.forEach((e, i1) => {
            food.forEach((f, i2) => {
                const messure = FormatContentUnitFromString(e.measurement)
                const unitCheck = messure.contentsUnit === f.contentsunit || (f.contentsunit === "stk" &&
                    messure.contentsUnit !== "g" &&
                    messure.contentsUnit !== "ml" &&
                    messure.contentsUnit !== "stk"); ////<------- Potential check for messuerement match so to exclude matches that doesnt share the same unit


                var lProg = (i1 * food.length + i2) / (ingrediants.length * food.length) * 100;
                if (Math.round(lProg) > progress) {
                    progress = Math.round(lProg);

                    var bar = "[";
                    const barSize = 20;
                    for (var i = 1; i <= barSize; i++) {
                        bar += i > Math.round(barSize * (lProg / 100)) ? "-" : "#";
                    }
                    bar += "]"

                    console.log(`Match progress: ${bar} ${progress}% (${i1 * food.length + i2} / ${ingrediants.length * food.length})`)
                }
                if (!unitCheck) return;

                const similarity = cosinesim(e.embedding, f.embedding);
                if (similarity > 0.85) {
                    const matchObject = { food: f.id, recipe: e.recipe, match: similarity, ingredient: e.id };
                    matches.push(matchObject);
                }
            })
        });


        console.log("Creating Query string")
        progress = 0;
        var addQuery = `INSERT INTO "IngredientMatches" VALUES ${matches.map((e, i) => {
            var lProg = i / matches.length * 100;
            if (Math.round(lProg) > progress) {
                progress = Math.round(lProg);

                var bar = "[";
                const barSize = 20;
                for (var l = 1; l <= barSize; l++) {
                    bar += l > Math.round(barSize * (lProg / 100)) ? "-" : "#";
                }
                bar += "]"
                console.log(`Query progress: ${bar} ${progress}% (${i} / ${matches.length})`)
            }
            return `(DEFAULT, ${e.food}, '${e.recipe}', ${e.match}, ${e.ingredient})`;
        })} ON CONFLICT DO NOTHING;`;
        console.log("Sending query to SQL server")
        if (await this.Query(addQuery) === undefined) {
            console.error("ERROR");
        }
    }

    async GetCheapestPriceForAllRecipe() {
        const getInfoCmd = fs.readFileSync("./server/SQLHandler/SQLCmdTexts/GetFoodInfo.sql", 'utf8');
        const getMaxIngCmd = fs.readFileSync("./server/SQLHandler/SQLCmdTexts/GetRecipeMaxIng.sql", 'utf8');
        const answer = await this.Query(getInfoCmd);
        const maxIng = await this.Query(getMaxIngCmd)
        const maxIngMap = [];
        maxIng.forEach(e => maxIngMap[e.recipe] = parseFloat(e.count));

        const recipes = [];
        answer.forEach(e => {
            if (recipes[e.recipe] === undefined)
                recipes[e.recipe] = { ing: [], total: 0, totalWMod: 0, ingMeet: 0, ingNeed: maxIngMap[e.recipe], messure: 0, unit: "" };
            const r = recipes[e.recipe];
            if (r.ing[e.ingredient] === undefined) {
                r.ing[e.ingredient] = e;
            } else {
                const rIng = r.ing[e.ingredient];
                const rPrice = parseFloat(rIng.price.match(/\d*?\.\d*/gms, "")[0]);
                const ePrice = parseFloat(e.price.match(/\d*?\.\d*/gms, "")[0]);

                if (rIng.match < e.match) {
                    r.ing[e.ingredient] = e;
                }
                else if (rIng.match <= e.match && rPrice > ePrice) {
                    r.ing[e.ingredient] = e;
                }
            }
        });
        Object.entries(recipes).forEach(e => {
            Object.entries(e[1].ing).forEach(f => {
                recipes[e[0]].ingMeet++;
                recipes[e[0]].total += parseFloat(f[1].price.match(/\d*?\.\d*/gms, "")[0]);
            });
            recipes[e[0]].totalWMod = recipes[e[0]].total / Math.min(1, (recipes[e[0]].ingMeet / recipes[e[0]].ingNeed));

        });

        console.log(recipes);
    }

    async GetCompletedRecipes() {
        const getInfoCmd = fs.readFileSync("./server/SQLHandler/SQLCmdTexts/GetFoodInfo.sql", 'utf8');
        const getMaxIngCmd = fs.readFileSync("./server/SQLHandler/SQLCmdTexts/GetRecipeMaxIng.sql", 'utf8');
        const answer = await this.Query(getInfoCmd);
        const maxIng = await this.Query(getMaxIngCmd);
        const ingList = [];
        await this.Query(`SELECT id, recipe, ingredient, measurement FROM "Ingredients"`).then(e => e.forEach(f => {
            if (ingList[f.recipe] === undefined)
                ingList[f.recipe] = [];
            ingList[f.recipe].push(f);
        }));
        const maxIngMap = [];
        maxIng.forEach(e => maxIngMap[e.recipe] = parseFloat(e.count));
        const recipes = [];
        answer.forEach(e => {
            // console.log(e.recipe);
            if (recipes[e.recipe] === undefined)
                recipes[e.recipe] = { ing: [], missing: ingList[e.recipe], ingMeet: 0, ingNeed: maxIngMap[e.recipe] };
            const r = recipes[e.recipe];
            if (r.ing[e.ingredient] === undefined) {
                r.ing[e.ingredient] = [];
            }
            r.ing[e.ingredient].push(e);
        });
        Object.entries(recipes).forEach(e => {
            const ing = Object.entries(e[1].ing);
            ing.forEach(f => {
                recipes[e[0]].ingMeet++;
            });
            recipes[e[0]].missing = recipes[e[0]].missing.filter(f => ing.some(g => g[1][0].id !== f.id))
        });
        const values = Object.entries(recipes)
            .map(e => { return { recipe: e[0], ...e[1] } })
            .filter(e => e.ingMeet >= e.ingNeed - 2);
        return values;
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

    async #InsureDatabase() {
        const queryText = fs.readFileSync("./server/SQLHandler/SQLCmdTexts/CreateDB.sql", 'utf8').match(/CREATE.*?;/gms);
        try {
            for (var i = 0; i < queryText.length; i++) {
                await this.Query(queryText[i]);
            }
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

async function isJson(json) {
    try {
        JSON.parse(json);
        return true;
    } catch (error) {
        return false;
    }
}

async function GetEmbedding(array) {
    const callAmounts = 2;
    const chunkSize = 100;
    const chunkSplits = Math.ceil(chunks.length / callAmounts);
    var chunks = ArrayChunk(array, chunkSize);
    var processes = ArrayChunk(chunks, chunkSplits);

    return new Promise(async (res, rej) => {
        console.log(`Embedding... (0 / ${chunks.length})`);
        var embeddings = [];
        for (var i = 0; i < chunks.length; i++) {
            const body = {
                model: "qwen3-embedding",
                input: chunks[i].map(e => e.ingredient.toLowerCase()),
            };
            const answer = await fetch(ollamaUrl + "/api/embed", { method: "POST", body: JSON.stringify(body), keepalive: true });
            const answerText = await answer.text();
            if (!await isJson(answerText)) {
                rej(`Answer text is not json! ${answerText}`);
                return;
            }
            const reponseObject = JSON.parse(answerText);
            const embeddings = reponseObject.embeddings;
            for (var l = 0; l < embeddings.length; l++) {
                embeddings.push(embeddings[l]);
            }
            console.log(`Embedding... (${i + 1} / ${chunks.length})`);
        }
        res(array);
    });

    var embeddings = [];
    await Promise.all(processes.map((v, index) => new Promise(async (res, rej) => {
        for (var i = 0; i < v.length; i++) {
            const body = {
                model: "qwen3-embedding",
                input: v[i].map(e => e.ingredient.toLowerCase()),
            };
            const answer = await fetch(ollamaUrl + "/api/embed", { method: "POST", body: JSON.stringify(body), keepalive: true });
            const answerText = await answer.text();
            if (!await isJson(answerText)) {
                rej(`Answer text is not json! ${answerText}`);
                return;
            }
            const reponseObject = JSON.parse(answerText);
            const embed = reponseObject.embeddings;
            for (var l = 0; l < embed.length; l++) {
                embeddings[chunkSplits * index + l] = embed[l];
            }
            console.log(`Embedding... (${i + 1} / ${v.length})`);
        }
        res(embedding);
    })));
}

function ArrayChunk(array, chunkSize) {
    var chunks = []
    for (var i = 0; i < array.length; i += chunkSize) {
        let chunk = array.slice(i, Math.min(i + chunkSize, array.length));
        chunks.push(chunk.filter(e => e.embedding === undefined));
    }
    return Array.from(chunk);
}

//https://stackoverflow.com/questions/51362252/javascript-cosine-similarity-function
function cosinesim(A, B) {
    console.assert(A.length == B.length);
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