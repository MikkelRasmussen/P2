"""
I have made this Python code as a testing program.
The Pseudo code can be found in algo_pseudo.txt inside this folder.

TODO:
1. Make the logic behind finding the correct ingredient names more precise
2. Use SQL instead of .json files
"""


from colorama import Style, Fore, init
import sys
import json
import traceback
import math
init()


# File paths
RECIPES_FILE_PATH = r"client\src\algorithm prototype\data\recipes.json" # File path to the database with recipes (i dont know how to handle SQL databases here, so keep that in mind)

INGREDIENTS_MAPPING_FILE_PATH = r"client\src\algorithm prototype\data\mapping_ingredienser.json" # File path to the mapping of ingredients

BILKA_PRICES_FILE_PATH = r"client\src\algorithm prototype\data\bilka_prices.json" # File path to the database of Bilka prices
NETTO_PRICES_FILE_PATH = r"client\src\algorithm prototype\data\netto_prices.json" # File path to the database of Netto prices
FØTEX_PRICES_FILE_PATH = r"client\src\algorithm prototype\data\føtex_prices.json" # File path to the database of Føtex prices
REMA_PRICES_FILE_PATH = r"client\src\algorithm prototype\data\rema_prices.json" # File path to the database of Rema1000 prices



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
    def load_json_file(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except FileNotFoundError:
            raise
        
    # Loading the data files
    try:
        recipes = load_json_file(RECIPES_FILE_PATH)
        ingredients_mapping = load_json_file(INGREDIENTS_MAPPING_FILE_PATH)

        bilka_prices = load_json_file(BILKA_PRICES_FILE_PATH)
        netto_prices = load_json_file(NETTO_PRICES_FILE_PATH)
        foetex_prices = load_json_file(FØTEX_PRICES_FILE_PATH)
        rema_prices = load_json_file(REMA_PRICES_FILE_PATH)

        return {
            "recipes": recipes,
            "ingredients_mapping": ingredients_mapping,
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
        

def calculate_buy_price(recipe, store, current_item):
    volume_units = ["ml", "l", "dl", "cl", "cup", "cups", "milliliters", "milliliter", "liters", "liter", "litres", "litre", "tbs", "tbls", "tblsp", "tbsp", "tablespoon", "tablespoons", "tsp", "teaspoon", "teaspoons"]
    weight_units = ["mg", "g", "gram", "grams", "kg", "kilogram", "kilograms", "pound", "pounds", "lb", "lbs", "oz", "ounce", "ounces"]
    misc_units = ["bag", "bags", "handful", "handfuls", "handfull", "handfulls", "bottle", "bottles", "jar", "jars", "pot", "pots", "packet", "packets", "pack", "package", "packages", "shot"]
    abstract_units = ["slices", "slice", "sliced", "cans", "can", "tin", "piece", "pieces", "part", "parts", "bunch", "bunches", "clove", "cloves", "head", "heads", "leaf", "leaves", "sprig", "sprigs", "stalk", "stalks", "stick", "sticks", "bulb", "bulbs", "knob", "knobs", "pod", "pods", "large", "medium", "small", "whole", "stk"]
    ignored_units = ["as required", "beaten", "boiled", "boneless", "chopped", "diced", "finely chopped", "finely diced", "finely sliced", "grated", "halved", "mashed", "minced", "quartered", "shredded", "skinned", "to serve", "to taste"]
    
    # Getting the values
    recipe_quantity = recipe.get("quantity")
    recipe_unit = str(recipe.get("unit") or "").strip().lower()
    store_price = store.get("price")
    store_unit = str(store.get("unit") or "").strip().lower()

    # Setting defaults
    resulting_price = 999999
    amount_to_buy = 0
    store_quantity = None
    store_quantity_unit = ""
    package_price = store_price

    try:
        recipe_quantity = float(recipe_quantity)
        store_price = float(store_price)
    except:
        return resulting_price, amount_to_buy

    # Normalising the units
    if recipe_unit in ["gr", "gram", "grams"]:
        recipe_unit = "g"
    elif recipe_unit in ["kilogram", "kilograms"]:
        recipe_unit = "kg"
    elif recipe_unit in ["milliliter", "milliliters"]:
        recipe_unit = "ml"
    elif recipe_unit in ["liter", "liters", "litre", "litres"]:
        recipe_unit = "l"
    elif recipe_unit in ["tablespoon", "tablespoons", "tbsp", "tblsp", "tbls"]:
        recipe_unit = "tbs"
    elif recipe_unit in ["teaspoon", "teaspoons"]:
        recipe_unit = "tsp"
    elif recipe_unit == "":
        recipe_unit = "stk"
    elif recipe_unit in misc_units or recipe_unit in abstract_units or recipe_unit in ignored_units:
        recipe_unit = "stk"

    if store_unit in ["gr", "gram", "grams"]:
        store_unit = "g"
    elif store_unit in ["kilogram", "kilograms"]:
        store_unit = "kg"
    elif store_unit in ["milliliter", "milliliters"]:
        store_unit = "ml"
    elif store_unit in ["liter", "liters", "litre", "litres"]:
        store_unit = "l"
    elif store_unit in ["tablespoon", "tablespoons", "tbsp", "tblsp", "tbls"]:
        store_unit = "tbs"
    elif store_unit in ["teaspoon", "teaspoons"]:
        store_unit = "tsp"
    elif store_unit == "":
        store_unit = "stk"

    # Reading the product
    if current_item is not None:
        if "pricing" in current_item:
            try:
                package_price = float(current_item["pricing"]["price"])
            except:
                package_price = store_price

            if current_item["pricing"].get("consumption_quantity") is not None and current_item["pricing"].get("consumption_unit") is not None:
                try:
                    store_quantity = float(current_item["pricing"]["consumption_quantity"])
                    store_quantity_unit = str(current_item["pricing"]["consumption_unit"]).strip().lower()
                except:
                    pass

            if store_quantity is None:
                text = str(current_item.get("underline") or "").lower()
                text = text.replace(".", "")
                text = text.replace("/", " ")
                parts = text.split()

                for n in range(len(parts) - 1):
                    try:
                        possible_quantity = float(parts[n].replace(",", "."))
                    except:
                        continue

                    possible_unit = parts[n + 1]
                    if possible_unit == "gr":
                        possible_unit = "g"

                    if possible_unit in ["g", "kg", "mg", "ml", "dl", "cl", "l", "stk"]:
                        store_quantity = possible_quantity
                        store_quantity_unit = possible_unit
                        break

            if store_quantity is None and package_price > 0 and store_price > 0:
                store_quantity = package_price / store_price
                store_quantity_unit = store_unit
        else:
            try:
                package_price = float(current_item["price"])
            except:
                package_price = store_price

            try:
                store_quantity = float(current_item["contents"])
                store_quantity_unit = str(current_item["contentsUnit"]).strip().lower()
            except:
                pass

    # Normalising the package unit
    if store_quantity_unit in ["gr", "gram", "grams"]:
        store_quantity_unit = "g"
    if store_quantity_unit in ["kilogram", "kilograms"]:
        store_quantity_unit = "kg"
    if store_quantity_unit in ["milliliter", "milliliters"]:
        store_quantity_unit = "ml"
    if store_quantity_unit in ["liter", "liters", "litre", "litres"]:
        store_quantity_unit = "l"
    if store_quantity_unit in misc_units or store_quantity_unit in abstract_units or store_quantity_unit in ignored_units or store_quantity_unit == "":
        store_quantity_unit = "stk"

    # Conversion values
    weight_values = {
        "mg": 0.001,
        "g": 1,
        "kg": 1000,
        "lb": 453.592,
        "lbs": 453.592,
        "pound": 453.592,
        "pounds": 453.592,
        "oz": 28.3495,
        "ounce": 28.3495,
        "ounces": 28.3495
    }

    volume_values = {
        "ml": 1,
        "cl": 10,
        "dl": 100,
        "l": 1000,
        "cup": 250,
        "cups": 250,
        "tbs": 15,
        "tsp": 5
    }

    # Calculating from package size
    if store_quantity is not None and store_quantity > 0:
        if recipe_unit == store_quantity_unit:
            amount_to_buy = math.ceil(recipe_quantity / store_quantity)

        elif recipe_unit in weight_units and store_quantity_unit in weight_values:
            recipe_in_g = recipe_quantity * weight_values[recipe_unit]
            store_in_g = store_quantity * weight_values[store_quantity_unit]
            amount_to_buy = math.ceil(recipe_in_g / store_in_g)

        elif recipe_unit in volume_units and store_quantity_unit in volume_values:
            recipe_in_ml = recipe_quantity * volume_values[recipe_unit]
            store_in_ml = store_quantity * volume_values[store_quantity_unit]
            amount_to_buy = math.ceil(recipe_in_ml / store_in_ml)

        elif recipe_unit == "stk" and store_quantity_unit == "stk":
            amount_to_buy = math.ceil(recipe_quantity / store_quantity)

        if amount_to_buy > 0:
            resulting_price = package_price * amount_to_buy

    # Fallback calculation
    if resulting_price == 999999:
        if recipe_unit == store_unit:
            resulting_price = store_price * recipe_quantity
            amount_to_buy = math.ceil(recipe_quantity)

        elif recipe_unit in weight_units and store_unit in weight_values:
            recipe_in_g = recipe_quantity * weight_values[recipe_unit]
            store_in_g = weight_values[store_unit]
            resulting_price = store_price * (recipe_in_g / store_in_g)
            amount_to_buy = 1

        elif recipe_unit in volume_units and store_unit in volume_values:
            recipe_in_ml = recipe_quantity * volume_values[recipe_unit]
            store_in_ml = volume_values[store_unit]
            resulting_price = store_price * (recipe_in_ml / store_in_ml)
            amount_to_buy = 1

        elif recipe_unit == "stk" and store_unit == "stk":
            resulting_price = store_price * recipe_quantity
            amount_to_buy = math.ceil(recipe_quantity)

    # Returning the result
    resulting_price = round(resulting_price, 2) if resulting_price != 999999 else resulting_price

    return resulting_price, amount_to_buy


# Helper function to determine the cheapest price from the cheapest store
def find_cheapest_price(ingredient: str, quantity, unit, price_data: dict, memory_scores: dict):

    try:
        bilka = price_data.get("bilka")
        netto = price_data.get("netto")
        føtex = price_data.get("føtex")
        rema = price_data.get("rema")
    except:
        return None, None, None, False
    
    recipe_quantity = {"quantity": quantity, "unit": unit}

    # Finding cheapest price from each store
    price_bilka = 999999
    price_to_buy_bilka = 999999
    amount_to_buy_bilka = 0
    product_name_bilka = None
    unit_price_bilka = None
    unit_bilka = None
    for i in range(len(bilka)):
        if ingredient in bilka[i]["description"]:
            if bilka[i]["price"] < price_bilka:
                price_bilka = bilka[i]["price"]

                unit_price_bilka = bilka[i]["unitPrice"]
                unit_bilka = bilka[i]["priceUnit"]

                store_quantity = {"price": unit_price_bilka, "unit": unit_bilka}

                price_to_buy_bilka, amount_to_buy_bilka = calculate_buy_price(recipe_quantity, store_quantity, bilka[i])
                product_name_bilka = bilka[i]["description"]

    price_netto = 999999
    price_to_buy_netto = 999999
    amount_to_buy_netto = 0
    product_name_netto = None
    unit_price_netto = None
    unit_netto = None
    for i in range(len(netto)):
        if ingredient in netto[i]["description"]:
            if netto[i]["price"] < price_netto:
                price_netto = netto[i]["price"]

                unit_price_netto = netto[i]["unitPrice"]
                unit_netto = netto[i]["priceUnit"]

                store_quantity = {"price": unit_price_netto, "unit": unit_netto}

                price_to_buy_netto, amount_to_buy_netto = calculate_buy_price(recipe_quantity, store_quantity, netto[i])
                product_name_netto = netto[i]["description"]

    price_føtex = 999999
    price_to_buy_føtex = 999999
    amount_to_buy_føtex = 0
    product_name_føtex = None
    unit_price_føtex = None
    unit_føtex = None
    for i in range(len(føtex)):
        if ingredient in føtex[i]["description"]:
            if føtex[i]["price"] < price_føtex:
                price_føtex = føtex[i]["price"]

                unit_price_føtex = føtex[i]["unitPrice"]
                unit_føtex = føtex[i]["priceUnit"]

                store_quantity = {"price": unit_price_føtex, "unit": unit_føtex}

                price_to_buy_føtex, amount_to_buy_føtex = calculate_buy_price(recipe_quantity, store_quantity, føtex[i])
                product_name_føtex = føtex[i]["description"]

    price_rema = 999999
    price_to_buy_rema = 999999
    amount_to_buy_rema = 0
    product_name_rema = None
    unit_price_rema = None
    unit_rema = None
    for department in rema["departments"]:
        for category in department["categories"]:
            for item in category["items"]:
                if ingredient.lower() in item["name"].lower():
                    if item["pricing"]["price"] < price_rema:
                        price_rema = item["pricing"]["price"]

                        unit_price_rema = item["pricing"]["price_per_kilogram"]
                        unit_rema = "kg"

                        store_quantity = {"price": unit_price_rema, "unit": unit_rema}

                        price_to_buy_rema, amount_to_buy_rema = calculate_buy_price(recipe_quantity, store_quantity, item)
                        product_name_rema = item["name"]

    # Comparing the cheapest price from each store with each other

    try:
        if ingredient in memory_scores:
            score = memory_scores[ingredient]
        else:
            score = 1
    except:
        score = 1

    scores = {
        "bilka": price_to_buy_bilka * score,
        "netto": price_to_buy_netto * score,
        "føtex": price_to_buy_føtex * score,
        "rema": price_to_buy_rema * score
    }

    prices = {
        "bilka": price_to_buy_bilka,
        "netto": price_to_buy_netto,
        "føtex": price_to_buy_føtex,
        "rema": price_to_buy_rema    
    }

    stores_data = {
        "bilka": {
            "price": price_to_buy_bilka,
            "amount_to_buy": amount_to_buy_bilka,
            "product_name": product_name_bilka,
            "price_per_unit": unit_price_bilka,
            "unit": unit_bilka
        },
        "netto": {
            "price": price_to_buy_netto,
            "amount_to_buy": amount_to_buy_netto,
            "product_name": product_name_netto,
            "price_per_unit": unit_price_netto,
            "unit": unit_netto
        },
        "føtex": {
            "price": price_to_buy_føtex,
            "amount_to_buy": amount_to_buy_føtex,
            "product_name": product_name_føtex,
            "price_per_unit": unit_price_føtex,
            "unit": unit_føtex
        },
        "rema": {
            "price": price_to_buy_rema,
            "amount_to_buy": amount_to_buy_rema,
            "product_name": product_name_rema,
            "price_per_unit": unit_price_rema,
            "unit": unit_rema
        }
    }

    store = min(scores, key=scores.get)
    cheapest_price = prices[store]

    if cheapest_price == 999999:
        return None, None, None, False

    return cheapest_price, store, stores_data, True




# -------->  The algorithm iteslf <--------
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

    # Ingredients to skip
    basic_ingredients = [
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
    ]
    
    # ====== ALGORITHM START ======
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


                def parse_quantity(quantity):
                    quantity = quantity.strip().lower()

                    number_part = ""
                    unit_part = ""

                    for char in quantity:
                        if char.isdigit() or char in [",", "."]:
                            number_part += char
                        else:
                            unit_part += char

                    amount = float(number_part.replace(",", "."))
                    unit = unit_part.strip()

                    return amount, unit


                recipe_prices = {}
                total_price = 0
                success_bool = True

                for ingredient_data in ingredients_to_value:
                    ingredient = ingredient_data["name"]
                    measurement = ingredient_data["measure"]

                    try:
                        quantity, unit = parse_quantity(measurement)
                    except:
                        continue


                    # Translate to danish and find the cheapest price in the cheapest store
                    try:
                        ingredient_DK = ingredients_mapping[ingredient]
                    except:
                        continue

                    try:
                        cheapest_price, store, stores_data, found = find_cheapest_price(ingredient_DK, quantity, unit, price_data, memory_scores)
                    except Exception as e:
                        print(f"Error finding cheapest price: {e}")
                        continue

                    # Fail safe
                    if not found or cheapest_price is None or store is None or stores_data is None:
                        success_bool = False
                        break

                    # Collect the data in a dict and accumulate the total cost
                    recipe_prices[ingredient] = {
                        "measure": measurement,
                        "store": store,
                        "stores_data": stores_data,
                        "product_name": stores_data[store]["product_name"],
                        "amount_to_buy": stores_data[store]["amount_to_buy"],
                        "price": cheapest_price
                    }
                    total_price += cheapest_price

                if not success_bool:
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
    # ====== ALGORITHM END ======

    return results
        

# Function to print results for the test
def print_results(results):
    iteration = 1
    total_recipes = len(results)
    print(Fore.GREEN + "\n==================== RESULTS ====================")
    for name, data in results.items():
        price = data.get("price")
        print(Fore.MAGENTA + f">> Recipe {iteration}/{total_recipes}: {name} ({price:.1f} DKK)" + Style.RESET_ALL)
        for ingredient, ingredient_data in data.get("stores", {}).items():
            measure = ingredient_data.get("measure", "").strip()
            store = ingredient_data.get("store")
            product_name = ingredient_data.get("product_name")
            amount_to_buy = ingredient_data.get("amount_to_buy", 0)
            ingredient_price = ingredient_data.get("price", 0)
            stores_data = ingredient_data.get("stores_data", {})
            chosen_store_data = stores_data.get(store, {})
            unit_price = chosen_store_data.get("price_per_unit")
            unit = chosen_store_data.get("unit")
            price_per_buy = 0
            if amount_to_buy > 0:
                price_per_buy = ingredient_price / amount_to_buy

            ranking = []
            for store_name, store_data in stores_data.items():
                store_price = store_data.get("price", 999999)
                if store_price != 999999:
                    rank_amount_to_buy = store_data.get("amount_to_buy", 0)
                    rank_price_per_buy = 0
                    if rank_amount_to_buy > 0:
                        rank_price_per_buy = store_price / rank_amount_to_buy
                    ranking.append({
                        "store": store_name,
                        "price": store_price,
                        "amount_to_buy": rank_amount_to_buy,
                        "product_name": store_data.get("product_name"),
                        "price_per_unit": store_data.get("price_per_unit"),
                        "unit": store_data.get("unit"),
                        "price_per_buy": rank_price_per_buy
                    })

            # Sorting to find the cheapest store
            for i in range(len(ranking)):
                for j in range(i + 1, len(ranking)):
                    if ranking[j]["price"] < ranking[i]["price"]:
                        temp = ranking[i]
                        ranking[i] = ranking[j]
                        ranking[j] = temp

            if measure:
                print(f"{measure} {ingredient}")
            else:
                print(f"{ingredient}")

            print(f"  store: {store}")
            if product_name:
                print(f"  product: {product_name}")
            print(f"  amount: {amount_to_buy}")
            print(f"  price: {ingredient_price:.2f} DKK")
            if unit_price is not None and unit:
                print(f"  price per unit: {unit_price:.2f} DKK / {unit}")
            if amount_to_buy > 0:
                print(f"  price per buy: {price_per_buy:.2f} DKK")

            if len(ranking) > 0:
                print("  rank:")
                rank_number = 1
                for rank_data in ranking:
                    rank_line = f"    {rank_number}. {rank_data['store']} - {rank_data['price']:.2f} DKK - buy {rank_data['amount_to_buy']}"
                    if rank_data["price_per_unit"] is not None and rank_data["unit"]:
                        rank_line += f" - {rank_data['price_per_unit']:.2f} DKK/{rank_data['unit']}"
                    if rank_data["amount_to_buy"] > 0:
                        rank_line += f" - {rank_data['price_per_buy']:.2f} DKK each"
                    if rank_data["product_name"]:
                        rank_line += f" - {rank_data['product_name']}"
                    print(rank_line)
                    rank_number += 1
            print("")
        iteration += 1
        if not iteration == total_recipes+1:
            print("")
    print(Fore.GREEN + "=================================================\n\n" + Style.RESET_ALL)


# Main function
def main():
    try:
        budget_min, budget_max, recipes_amount = get_inputs()
    except Exception as e:
        print(f"\nError with inputs: \n\n{e}\n")
    
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
