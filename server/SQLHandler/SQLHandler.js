var pg = require('pg');
var ingMap = require('./mapping_ingredienser.json');
var mesMap = require('./mapping_måling.json');
const fs = require('node:fs');
//https://www.w3schools.com/nodejs/nodejs_mysql.asp
//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/Promise
//https://stackoverflow.com/questions/9205496/how-to-make-connection-to-postgres-via-node-js
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

            const data = await response.json();
            console.log('Success:', data.success);
            console.log('Failed:', data.failed);
            console.log('Results:', data.results);
            console.log('Full response:', data);

            data.results.forEach(result => {
                result.data.forEach(async item => {
                    if (item.inStock === false) return;
                    const itemLowerCase = String(item.name).toLowerCase();
                    if (itemLowerCase === "vand") return;
                    var ingredient = ingredientsQueryResult
                        .filter(e => (` ${e} `.toLowerCase().includes(itemLowerCase)))
                        .filter(e => { //Diffreance threshold.
                            var it = e.split(" ").find(f => f.toLowerCase().includes(itemLowerCase));
                            if (it !== undefined) return it.length <= itemLowerCase.length + 2;
                            else return true;
                        })
                        .filter(e => { //check if item contains multiple ingrediants.
                            var checkString = String(e).replace(itemLowerCase, "").trim();
                            var go = ingredientsQueryResult.filter(f => f.includes(checkString) && checkString.length > 0)
                            return go.length <= 1;
                        });
                    if (ingredient.length < 1) return; //Ignore empty ingredient lists.
                    console.log(`${ingredient} : ${item.name}`);
                    const FormatedContent = FormatContentUnit(item.contents, item.contentsUnit); //Fx: convert kg to g.
                    const formatedItem = {
                        name: item.name,
                        price: item.price,
                        contents: FormatedContent.contents,
                        contentsUnit: FormatedContent.contentsUnit,
                        ingredientMatches: ingredient,
                        store: "Salling",
                        sku: item.sku,
                    }
                    //TODO: change query string to check if a SKU number already exist in the store!
                    var queryString = `INSERT INTO "Food" VALUES (
                    '${formatedItem.name}', 
                    ${formatedItem.price},
                    ${formatedItem.contents},
                    ${formatedItem.contentsUnit}, 
                    '${JSON.stringify(formatedItem.ingredientMatches)}', 
                    '${formatedItem.store}'
                    ${formatedItem.sku});`;
                    if (await this.Query(queryString) === undefined) {
                        console.log(queryString);
                    }

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
            });
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

