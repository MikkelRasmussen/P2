"""
I have made this Python code as a testing program.
The Pseudo code can be found in algo_pseudo.txt.

TODO:
1. Implement measurements and quantities of ingredients using mapping
"""


from colorama import Style, Fore, init
import sys
import json
import traceback
init()


# File paths
RECIPES_FILE_PATH = r"client\src\pseudo algorithm\data\recipes.json" # File path to the database with recipes (i dont know how to handle SQL databases here, so keep that in mind)

INGREDIENTS_MAPPING_FILE_PATH = r"client\src\pseudo algorithm\data\mapping_ingredienser.json" # File path to the mapping of ingredients
MEASUREMENTS_MAPPING_FILE_PATH = r"client\src\pseudo algorithm\data\mapping_måling.json" # File path to the mapping of measurents

BILKA_PRICES_FILE_PATH = r"client\src\pseudo algorithm\data\bilka_prices.json" # File path to the database of Bilka prices
NETTO_PRICES_FILE_PATH = r"client\src\pseudo algorithm\data\netto_prices.json" # File path to the database of Netto prices
FØTEX_PRICES_FILE_PATH = r"client\src\pseudo algorithm\data\føtex_prices.json" # File path to the database of Føtex prices
REMA_PRICES_FILE_PATH = r"client\src\pseudo algorithm\data\rema_prices.json" # File path to the database of Rema1000 prices



# Helper function to get user input
def get_inputs():
    # Setting budget (minimum)
    while True:
        budget_min = input("Minimum price per recipe (DKK): ")
        try:
            budget_min = float(budget_min)
            if budget_min < 0:
                print(Fore.YELLOW + "Please choose a number above 0")
                input(Fore.LIGHTBLACK_EX + "Press enter to try again..." + Style.RESET_ALL)
                continue
        except:
            print(Fore.YELLOW + "Please choose a number")
            input(Fore.LIGHTBLACK_EX + "Press enter to try again..." + Style.RESET_ALL)
            continue
        break

    # Setting budget (maximum)
    while True:
        budget_max = input("Maximum price per recipe (DKK): ")
        try:
            budget_max = float(budget_max)
            if budget_max < budget_min:
                print(Fore.YELLOW + "Max price can not be lower than minimum price")
                input(Fore.LIGHTBLACK_EX + "Press enter to try again..." + Style.RESET_ALL)
                continue  
            if budget_max <= 0:
                print(Fore.YELLOW + "Please choose a number above 0")
                input(Fore.LIGHTBLACK_EX + "Press enter to try again..." + Style.RESET_ALL)
                continue
        except:
            print(Fore.YELLOW + "Please choose a number")
            input(Fore.LIGHTBLACK_EX + "Press enter to try again..." + Style.RESET_ALL)
            continue
        break

    # Setting amount of recipes to find
    while True:
        recipes_amount = input("Amount of recipes: ")
        try:
            recipes_amount = int(recipes_amount)
            if recipes_amount <= 0:
                print(Fore.YELLOW + "Please choose a number above 0")
                input(Fore.LIGHTBLACK_EX + "Press enter to try again..." + Style.RESET_ALL)
                continue
        except:
            print(Fore.YELLOW + "Please choose a whole number")
            input(Fore.LIGHTBLACK_EX + "Press enter to try again..." + Style.RESET_ALL)
            continue
        break

    return budget_min, budget_max, recipes_amount



# Helper function to fetch price data from files
def fetch_data():

    # Internal helper function to load a json file
    def load_json_file(path, default=None, required=True):
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except FileNotFoundError:
            if required:
                raise
            return default
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in {path}: {e}")
        
    # Loading the data files
    try:
        recipes = load_json_file(RECIPES_FILE_PATH)
        ingredients_mapping = load_json_file(INGREDIENTS_MAPPING_FILE_PATH)
        measurements_mapping = load_json_file(
            MEASUREMENTS_MAPPING_FILE_PATH,
            default=None,
            required=False
        )

        bilka_prices = load_json_file(BILKA_PRICES_FILE_PATH)
        netto_prices = load_json_file(NETTO_PRICES_FILE_PATH)
        foetex_prices = load_json_file(FØTEX_PRICES_FILE_PATH)
        rema_prices = load_json_file(REMA_PRICES_FILE_PATH)

        return {
            "recipes": recipes,
            "ingredients_mapping": ingredients_mapping,
            "measurements_mapping": measurements_mapping,
            "prices": {
                "bilka": bilka_prices,
                "netto": netto_prices,
                "føtex": foetex_prices,
                "rema": rema_prices
            }
        }

    except Exception as e:
        print(Fore.RED + f"Error loading data from file:\n{e}\n")
        input(Fore.LIGHTBLACK_EX + "\nPress enter to close program..." + Style.RESET_ALL)
        sys.exit(0)
        




# Helper function to determine the cheapest price from the cheapest store
def find_cheapest_price(ingredient: str, price_data: dict, memory_scores: dict):

    try:
        if ingredient in memory_scores:
            score = memory_scores[ingredient]
        else:
            score = 1
    except:
        score = 1

    try:
        bilka = price_data.get("bilka")
        netto = price_data.get("netto")
        føtex = price_data.get("føtex")
        rema = price_data.get("rema")
    except:
        return None, None, False

    # Finding cheapest price from each store
    price_bilka = 999999
    for i in range(len(bilka)):
        if ingredient in bilka[i]["description"]:
            if bilka[i]["price"] < price_bilka:
                price_bilka = bilka[i]["price"] * score

    price_netto = 999999
    for i in range(len(netto)):
        if ingredient in netto[i]["description"]:
            if netto[i]["price"] < price_netto:
                price_netto = netto[i]["price"] * score

    price_føtex = 999999
    for i in range(len(føtex)):
        if ingredient in føtex[i]["description"]:
            if føtex[i]["price"] < price_føtex:
                price_føtex = føtex[i]["price"] * score

    price_rema = 999999
    for department in rema["departments"]:
        for category in department["categories"]:
            for item in category["items"]:
                if ingredient.lower() in item["name"].lower():
                    if item["pricing"]["price"] < price_rema:
                        price_rema = item["pricing"]["price"] * score

    # Comparing the cheapest price from each store with each other
    scores = {
        "bilka": price_bilka,
        "netto": price_netto,
        "føtex": price_føtex,
        "rema": price_rema
    }

    store = min(scores, key=scores.get)
    cheapest = scores[store]

    if cheapest == 999999:
        return None, None, False

    return cheapest, store, True




# Main function to run the algorithm

def run_algorithm(amount: int = 1, # Amount of recipes needed
                  budget_min: float = 0, # Min price per recipe
                  budget_max: float = 9999, # Max price per recipe
                  memory_scores: dict = {}, # Memory of previous likes/dislikes of ingredients/recipes
                ) -> dict:

    # Initialising data for the algorithm
    data = fetch_data()
    recipes = data.get("recipes")
    ingredients_mapping = data.get("ingredients_mapping")
    price_data = data.get("prices")

    basic_ingredients = {
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
        "vegetable stock", "vegetable stock cube", "bouillon cubes"
    }
    
    # ====== Algorithm start ======
    results = {}
    for i in range(amount):
        candidates = {}
        cheapest_candidate_price = 999999
        cheapest_candidate_name = None
        cheapest_candidate_stores = None

        # Iterate through all recipes
        for recipe_row in recipes:
            meals = recipe_row.get("meals", [])

            for recipe in meals:
                name = recipe["strMeal"]

                if name in results:
                    continue

                ingredients_to_value = []
                for n in range(1, 21):
                    ingredient = recipe.get(f"strIngredient{n}")
                    measure = recipe.get(f"strMeasure{n}")
                    if ingredient is not None:
                        ingredient = ingredient.strip()
                    if measure is not None:
                        measure = measure.strip()
                    if ingredient:
                        normalized_ingredient = ingredient.lower()
                        if normalized_ingredient not in basic_ingredients:
                            ingredients_to_value.append({
                                "name": ingredient,
                                "measure": measure or ""
                            })

                recipe_prices = {}
                total_price = 0
                is_valued = False
                for ingredient_data in ingredients_to_value:
                    ingredient = ingredient_data["name"]

                    # Find the cheapest price in the cheapest store
                    try:
                        ingredient_DK = ingredients_mapping[ingredient]
                    except:
                        continue
                    cheapest_price, store, is_valued = find_cheapest_price(ingredient_DK, price_data, memory_scores)
                    if not is_valued:
                        break
                    if cheapest_price is None or store is None:
                        continue

                    # Collect the data in a dict and accumulate the total cost
                    recipe_prices[ingredient] = {
                        "measure": ingredient_data["measure"],
                        "store": store,
                        "price": cheapest_price
                    }
                    total_price += cheapest_price

                if not is_valued:
                    continue
                
                # Check if the recipe price is within range of budget
                if budget_min <= total_price <= budget_max:
                    candidates[name] = recipe_prices
                    if total_price < cheapest_candidate_price:
                        cheapest_candidate_price = total_price
                        cheapest_candidate_name = name
                        cheapest_candidate_stores = recipe_prices

        # Add cheapest recipe to results
        if cheapest_candidate_name: 
            results[cheapest_candidate_name] = {
                "price": cheapest_candidate_price,
                "stores": cheapest_candidate_stores
            }

    return results
        

# Function to print results for the test
def print_results(results):
    iteration = 1
    total_recipes = len(results)
    print(Fore.GREEN + "\n==================== RESULTS ====================")
    for name, data in results.items():
        price = data.get("price")
        print(Fore.CYAN + f">> Recipe {iteration}/{total_recipes}: {name} ({price:.1f} DKK)" + Style.RESET_ALL)
        for ingredient, ingredient_data in data.get("stores", {}).items():
            measure = ingredient_data.get("measure", "").strip()
            store = ingredient_data.get("store")
            price_text = f"{ingredient_data.get('price', 0)} DKK"
            if measure:
                print(f"{measure} {ingredient} ({price_text} - {store})")
            else:
                print(f"{ingredient} ({price_text} - {store})")
        iteration += 1
        if not iteration == total_recipes+1:
            print("")
    print(Fore.GREEN + "=================================================\n\n" + Style.RESET_ALL)


# Main function
def main():
    budget_min, budget_max, recipes_amount = get_inputs()
    memory_scores = {}

    try:
        results = run_algorithm(recipes_amount, budget_min, budget_max, memory_scores)
        print_results(results)
    except Exception as e:
        print(Fore.RED + f"\nERROR:\n" + Fore.LIGHTBLACK_EX)
        traceback.print_exc()
        input(Style.RESET_ALL + "\nPress enter to close program...")




if __name__ == "__main__":
    main()
