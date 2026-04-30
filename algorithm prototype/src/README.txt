

This is a prototype of our algorithm for finding cheap recipes.
The code is made as a Python test program, because i am more confident with using Python.



        WHAT THE PROGRAM DOES

The program asks the user for:
- minimum price per recipe
- maximum price per recipe
- how many recipes to find

After that, the program goes through the recipe database and tries to find
recipes where all the important ingredients can be found in the price databases.
If a recipe has an ingredient that can not be priced, the recipe is not shown.



        HOW IT WORKS OVERALL

The program first loads all the JSON files from the data folder:
recipes, ingredient mapping, and prices from Bilka, Netto, Føtex and Rema1000.

The ingredients in the recipes are in English, so the program uses
mapping_ingredienser.json to translate them into Danish names. After that, it
searches for the Danish ingredient names in the store products.

When a product is found, the program calculates how many packages need to be
bought. It also tries to understand simple units like grams, kg, ml, liters,
cups, tablespoons, teaspoons and pieces, because the recipes use many abstract unit names.

For each ingredient, the program chooses the cheapest store. In the end, it adds
the ingredient prices together and checks if the recipe fits inside the user's
budget.

The algorithm also receives memory_scores from outside the algorithm. This is
meant as a recommender system, where ingredients in the recipes the user has previously liked gets a
better score, and ingredients the user dislikes get a worse score.
The score does not change the real price. It is only used to choose which
recipes fit the user best.
