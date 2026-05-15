const { test, beforeEach, describe, after, before } = require('node:test');
const assert = require('node:assert/strict');




const useSsl = false;
describe('SQLHandler', async () => {
  const sql = require('../SQLHandler/SQLHandler.js');
  const fs = require('fs');
  var sqlHandler = new sql();

  before(async (t) => {
    await sqlHandler.Connect("localhost", "postgres", "Post2025", 5432, 'postgres', false);
    await sqlHandler.Query(`DROP DATABASE IF EXISTS "TestDB";`);
    await sqlHandler.Query(`CREATE DATABASE "TestDB" WITH
      OWNER = postgres
      ENCODING = 'UTF8'
      LC_COLLATE = 'English_United Kingdom.1252'
      LC_CTYPE = 'English_United Kingdom.1252'
      LOCALE_PROVIDER = 'libc'
      TABLESPACE = pg_default
      CONNECTION LIMIT = -1
      IS_TEMPLATE = False;`);
    await sqlHandler.Disconnect();
  });

  beforeEach((t) => {
    if (!t.name.includes('connect_ssl_') && !sqlHandler.connected)
      t.skip();
  });


  await test('connect_ssl_true', { skip: !useSsl }, async (t) => {
    await sqlHandler.Connect("localhost", "postgres", "Post2025", 5432, 'TestDB', true);
  });
  await test('connect_ssl_false', { skip: useSsl }, async (t) => {
    await sqlHandler.Connect("localhost", "postgres", "Post2025", 5432, 'TestDB', false);
  });


  await test('base_query_1', async (t) => {
    const returnData = await sqlHandler.Query(`SELECT 111 AS test`);
    if (returnData === undefined) assert.fail('Query could not get data!');
    if (returnData.length > 1) assert.fail('Query returned too much data!');
    if (returnData.length < 1) assert.fail('Query returned too little data!');
    if (returnData[0]['test'] !== 111) assert.fail('Query returned the wrong data!');
  });

  await test('ensure_database', async (t) => {
    try {
      const queryText = fs.readFileSync("../server/SQLHandler/SQLCmdTexts/CreateDB.sql", 'utf8').match(/CREATE.*?;/gms);
      for (var i = 0; i < queryText.length; i++) {
        await sqlHandler.Query(queryText[i]);
      }
    } catch (error) {
      assert.fail(error);
    }
  });

  await test('insert into / select', async (t) => {
    await t.test('"Food"', async (st) => {
      await st.test('can insert value', async (t) => {
        if (await sqlHandler.Query(`INSERT INTO "Food" VALUES ('name', 20, 1000, 'g', 'store', 'sku', default, '[1]')`) === undefined)
          assert.fail('could not insert!')
      });
      await st.test('respect unique key', async (t) => {
        if (await sqlHandler.Query(`INSERT INTO "Food" VALUES ('name', 20, 1000, 'g', 'store', 'sku', default, '[]')`) !== undefined)
          assert.fail('unique key was ignored!')
      });
      await st.test('returned values are correct', async (t) => {
        const returnValue = await sqlHandler.Query('SELECT * FROM "Food";');
        if (returnValue === undefined) assert.fail('No value was returned!');
        if (returnValue.length > 1) assert.fail('To much data!');
        if (returnValue.length < 1) assert.fail('To little data!');
        const check =
          returnValue[0]['name'] === 'name' &&
          returnValue[0]['price'] === '£20.00' &&
          returnValue[0]['contents'] === 1000 &&
          returnValue[0]['contentsunit'] === 'g' &&
          returnValue[0]['store'] === 'store' &&
          returnValue[0]['sku'] === 'sku' &&
          returnValue[0]['id'] === 1 &&
          returnValue[0]['embedding'][0] === 1;
        assert.equal(check, true, 'Incorrect data was returned!');
      });
    });

    await t.test('"Recipes"', async (st) => {
      await st.test('can insert value', async (t) => {
        if (await sqlHandler.Query(`INSERT INTO "Recipes" VALUES ('name', '[]', 'instructions', 'category', 'imageurl')`) === undefined)
          assert.fail('could not insert!')
      });
      await st.test('respect unique key', async (t) => {
        if (await sqlHandler.Query(`INSERT INTO "Recipes" VALUES ('name', '[]', 'instructions', 'category', 'imageurl')`) !== undefined)
          assert.fail('unique key was ignored!')
      });
      await st.test('returned values are correct', async (t) => {
        const returnValue = await sqlHandler.Query('SELECT * FROM "Recipes";');
        if (returnValue === undefined) assert.fail('No value was returned!');
        if (returnValue.length > 1) assert.fail('To much data!');
        if (returnValue.length < 1) assert.fail('To little data!');
        const check =
          returnValue[0]['name'] === 'name' &&
          returnValue[0]['instructions '] === 'instructions' &&
          returnValue[0]['category'] === 'category' &&
          returnValue[0]['imageurl'] === 'imageurl';
        assert.equal(check, true, 'Incorrect data was returned!');
      });
    });


    await t.test('"Ingredients"', async (st) => {
      await st.test('can insert value', async (t) => {
        if (await sqlHandler.Query(`INSERT INTO "Ingredients" VALUES (DEFAULT, 'name', 'ingredient', 'measurement', '[1]')`) === undefined)
          assert.fail('could not insert!')
      });

      await st.test('respect foreign key', async (t) => {
        if (await sqlHandler.Query(`INSERT INTO "Ingredients" VALUES (DEFAULT, 'incorrectname', 'ingredient2', 'measurement2', '[1]')`) !== undefined)
          assert.fail('foreign key was ignored!')
      });
      await st.test('respect unique key', async (t) => {
        if (await sqlHandler.Query(`INSERT INTO "Ingredients" VALUES (DEFAULT, 'name', 'ingredient', 'measurement', '[1]')`) !== undefined)
          assert.fail('unique key was ignored!')
      });
      await st.test('returned values are correct', async (t) => {
        const returnValue = await sqlHandler.Query('SELECT * FROM "Ingredients";');
        if (returnValue === undefined) assert.fail('No value was returned!');
        if (returnValue.length > 1) assert.fail('To much data!');
        if (returnValue.length < 1) assert.fail('To little data!');
        const check =
          returnValue[0]['id'] === 1 &&
          returnValue[0]['recipe'] === 'name' &&
          returnValue[0]['ingredient'] === 'ingredient' &&
          returnValue[0]['measurement'] === 'measurement' &&
          returnValue[0]['embedding'][0] === 1;
        assert.equal(check, true, `Incorrect data was returned!
          Data:
            id:           ${returnValue[0]['id']}           expected: 1           boolean: ${returnValue[0]['id'] === 1}
            recipe:       ${returnValue[0]['recipe']}       expected: name        boolean: ${returnValue[0]['recipe'] === 'name'}
            ingredient:   ${returnValue[0]['ingredient']}   expected: ingredient  boolean: ${returnValue[0]['ingredient'] === 'ingredient'}
            measurement:  ${returnValue[0]['measurement']}  expected: measurement boolean: ${returnValue[0]['measurement'][0] === 'measurement'}
            embedding:    ${returnValue[0]['embedding']}    expected: 1           boolean: ${returnValue[0]['embedding'][0] === 1}`);
      });
    });

    await t.test('"IngredientMatches"', async (st) => {
      await st.test('can insert value', async (t) => {
        if (await sqlHandler.Query(`INSERT INTO "IngredientMatches" VALUES (DEFAULT, 1, 'name', 0.9, 1)`) === undefined)
          assert.fail('could not insert!')
      });

      await st.test('respect foreign key 1', async (t) => {
        if (await sqlHandler.Query(`INSERT INTO "IngredientMatches" VALUES (DEFAULT, 2, 'name', 0.9, 1)`) !== undefined)
          assert.fail('foreign key was ignored!')
      });
      await st.test('respect foreign key 2', async (t) => {
        if (await sqlHandler.Query(`INSERT INTO "IngredientMatches" VALUES (DEFAULT, 1, 'incorrectname', 0.9, 1)`) !== undefined)
          assert.fail('foreign key was ignored!')
      });
      await st.test('respect foreign key 3', async (t) => {
        if (await sqlHandler.Query(`INSERT INTO "IngredientMatches" VALUES (DEFAULT, 1, 'name', 0.9, 2)`) !== undefined)
          assert.fail('foreign key was ignored!')
      });

      await st.test('respect unique key', async (t) => {
        if (await sqlHandler.Query(`INSERT INTO "IngredientMatches" VALUES (DEFAULT, 1, 'name', 0.9, 1)`) !== undefined)
          assert.fail('unique key was ignored!')
      });

      await st.test('returned values are correct', async (t) => {
        const returnValue = await sqlHandler.Query('SELECT * FROM "IngredientMatches";');
        if (returnValue === undefined) assert.fail('No value was returned!');
        if (returnValue.length > 1) assert.fail('To much data!');
        if (returnValue.length < 1) assert.fail('To little data!');
        const check =
          returnValue[0]['ID'] === 1 &&
          returnValue[0]['Food'] === 1 &&
          returnValue[0]['Recipe'] === 'name' &&
          returnValue[0]['match'] === 0.9 &&
          returnValue[0]['Ingredient'] === 1;
        assert.equal(check, true, `Incorrect data was returned!`);
      });
    });
  });


  await test('disconnect', async (t) => {
    await sqlHandler.Disconnect();
  })

  after(async () => {
    if (sqlHandler.connected)
      await sqlHandler.Disconnect(); //Disconnect from "TestDB"
    //Connect to default DB to drop "TestDB";
    await sqlHandler.Connect("localhost", "postgres", "Post2025", 5432, 'postgres', false);
    await sqlHandler.Query(`DROP DATABASE IF EXISTS "TestDB";`);
    await sqlHandler.Disconnect();
  })
});
