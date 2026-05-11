"""
>> README <<

I have made this Python code as a testing program.
The Pseudo code can be found in algo_pseudo.txt inside this folder.
Go to README.txt for an overview of what the code does.

TODO:
1. Make the logic behind finding the correct ingredient names more precise
2. Edit the fetch_data() and calculate_buy_price() functions to use SQL database instead of json
3. Optimize recommender system: Scale the score based on ingredients; main ingredients or secondary ingredients
4. Optimize the time complexity in loops
5. Check and add comments, and update README
"""


from colorama import Style, Fore, init
import sys
import json
import traceback
import math
init()


# File paths for databases
RECIPES_FILE_PATH = r"algorithm prototype\data\recipes.json" # File path to the database with recipes (i dont know how to handle SQL databases here, so keep that in mind)

INGREDIENTS_MAPPING_FILE_PATH = r"algorithm prototype\data\mapping_ingredienser.json" # File path to the mapping of ingredients

BILKA_PRICES_FILE_PATH = r"algorithm prototype\data\bilka_prices.json" # File path to the database of Bilka prices
NETTO_PRICES_FILE_PATH = r"algorithm prototype\data\netto_prices.json" # File path to the database of Netto prices
FØTEX_PRICES_FILE_PATH = r"algorithm prototype\data\føtex_prices.json" # File path to the database of Føtex prices




# ----------------------------------- HELPER FUNCTIONS -----------------------------------




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

    # Returning the inputs to main()
    return budget_min, budget_max, recipes_amount



# Helper function to fetch price data from databases
def fetch_data():

    # Internal helper function to load the databases
    def load_json_file(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except FileNotFoundError:
            raise
        
    # Loading the datadase files
    try:
        recipes = load_json_file(RECIPES_FILE_PATH)

        ingredients_mapping = load_json_file(INGREDIENTS_MAPPING_FILE_PATH)

        bilka_prices = load_json_file(BILKA_PRICES_FILE_PATH)
        netto_prices = load_json_file(NETTO_PRICES_FILE_PATH)
        føtex_prices = load_json_file(FØTEX_PRICES_FILE_PATH)

        # Return all the databases
        return {
            "recipes": recipes,
            "ingredients_mapping": ingredients_mapping,
            "prices": {
                "bilka": bilka_prices,
                "netto": netto_prices,
                "føtex": føtex_prices
            }
        }

    # Failsafe if an exception happens
    except Exception as e:
        print(Fore.RED + f"Error loading data from file:\n{e}\n")
        input(Fore.LIGHTBLACK_EX + "\nPress enter to close program..." + Style.RESET_ALL)
        sys.exit(0)


# Helper function to print the results and useful information at the end
def print_results(results):
    iteration = 1
    total_recipes = len(results)
    not_priced_count = 0
    if "not_priced_count" in results:
        not_priced_count = results["not_priced_count"]

    print(Fore.GREEN + "\n==================== RESULTS ====================")
    print(Fore.YELLOW + f"Recipes not priced: {not_priced_count}" + Style.RESET_ALL)
    for name, data in results.items():
        if name == "not_priced_count":
            continue

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
        




# ----------------------------------- MAIN FUNCTIONS -----------------------------------




def calculate_buy_price(recipe, store, current_item):
    # Organizing all the possible units from units_extractor.py / units.txt
    volume_units = ["ml", "l", "dl", "cl", "cup", "cups", "pint", "pints", "qt", "quart", "quarts", "milliliters", "milliliter", "liters", "liter", "litres", "litre", "tbs", "tbls", "tblsp", "tbsp", "tablespoon", "tablespoons", "tsp", "teaspoon", "teaspoons"]
    weight_units = ["mg", "g", "gram", "grams", "kg", "kilogram", "kilograms", "pound", "pounds", "lb", "lbs", "oz", "ounce", "ounces"]
    misc_units = ["bag", "bags", "handful", "handfuls", "handfull", "handfulls", "bottle", "bottles", "jar", "jars", "pot", "pots", "packet", "packets", "pack", "package", "packages", "shot"]
    abstract_units = ["slices", "slice", "sliced", "cans", "can", "tin", "piece", "pieces", "part", "parts", "bunch", "bunches", "clove", "cloves", "head", "heads", "leaf", "leaves", "sprig", "sprigs", "stalk", "stalks", "stick", "sticks", "bulb", "bulbs", "knob", "knobs", "pod", "pods", "large", "medium", "small", "whole", "pinch", "pinches", "dash", "drop", "drops", "drizzle", "splash", "fillet", "fillets", "rasher", "rashers", "yolk", "yolks", "tub", "tubs", "stk"]
    ignored_units = ["as required", "beaten", "boiled", "boneless", "chopped", "diced", "finely chopped", "finely diced", "finely sliced", "grated", "halved", "mashed", "minced", "quartered", "shredded", "skinned", "to serve", "to taste"]
    
    # Extracting the data from the recipe and store data
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

    # Converting to float type
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
        "pint": 568,
        "pints": 568,
        "qt": 946,
        "quart": 946,
        "quarts": 946,
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

    # Rounding and returning the result
    resulting_price = round(resulting_price, 2) if resulting_price != 999999 else resulting_price

    return resulting_price, amount_to_buy


# Function to determine the cheapest price from the cheapest store
def find_cheapest_price(ingredient: str, quantity, unit, price_data: dict):

    try:
        bilka = price_data.get("bilka")
        netto = price_data.get("netto")
        føtex = price_data.get("føtex")
    except:
        return None, None, None, False
    
    recipe_quantity = {"quantity": quantity, "unit": unit}

    # Finding cheapest price from each store
    ingredient_lower = ingredient.lower()

    #Bilka to go
    price_to_buy_bilka = 999999
    amount_to_buy_bilka = 0
    product_name_bilka = None
    unit_price_bilka = None
    unit_bilka = None
    for i in range(len(bilka)):
        if ingredient_lower in bilka[i]["description"].lower():
            unit_price_bilka_check = bilka[i]["unitPrice"]
            unit_bilka_check = bilka[i]["priceUnit"]

            store_quantity = {"price": unit_price_bilka_check, "unit": unit_bilka_check}

            price_to_buy_bilka_check, amount_to_buy_bilka_check = calculate_buy_price(recipe_quantity, store_quantity, bilka[i])

            if price_to_buy_bilka_check < price_to_buy_bilka:
                price_to_buy_bilka = price_to_buy_bilka_check
                amount_to_buy_bilka = amount_to_buy_bilka_check
                unit_price_bilka = unit_price_bilka_check
                unit_bilka = unit_bilka_check
                product_name_bilka = bilka[i]["description"]


    # Netto plus
    price_to_buy_netto = 999999
    amount_to_buy_netto = 0
    product_name_netto = None
    unit_price_netto = None
    unit_netto = None
    for i in range(len(netto)):
        if ingredient_lower in netto[i]["description"].lower():
            unit_price_netto_check = netto[i]["unitPrice"]
            unit_netto_check = netto[i]["priceUnit"]

            store_quantity = {"price": unit_price_netto_check, "unit": unit_netto_check}

            price_to_buy_netto_check, amount_to_buy_netto_check = calculate_buy_price(recipe_quantity, store_quantity, netto[i])

            if price_to_buy_netto_check < price_to_buy_netto:
                price_to_buy_netto = price_to_buy_netto_check
                amount_to_buy_netto = amount_to_buy_netto_check
                unit_price_netto = unit_price_netto_check
                unit_netto = unit_netto_check
                product_name_netto = netto[i]["description"]

    # Føtex plus
    price_to_buy_føtex = 999999
    amount_to_buy_føtex = 0
    product_name_føtex = None
    unit_price_føtex = None
    unit_føtex = None
    for i in range(len(føtex)):
        if ingredient_lower in føtex[i]["description"].lower():
            unit_price_føtex_check = føtex[i]["unitPrice"]
            unit_føtex_check = føtex[i]["priceUnit"]

            store_quantity = {"price": unit_price_føtex_check, "unit": unit_føtex_check}

            price_to_buy_føtex_check, amount_to_buy_føtex_check = calculate_buy_price(recipe_quantity, store_quantity, føtex[i])

            if price_to_buy_føtex_check < price_to_buy_føtex:
                price_to_buy_føtex = price_to_buy_føtex_check
                amount_to_buy_føtex = amount_to_buy_føtex_check
                unit_price_føtex = unit_price_føtex_check
                unit_føtex = unit_føtex_check
                product_name_føtex = føtex[i]["description"]

    # Comparing the cheapest price from each store with each other
    # to find the overall lowest price.
    prices = {
        "bilka": price_to_buy_bilka,
        "netto": price_to_buy_netto,
        "føtex": price_to_buy_føtex   
    }

    # Finding the name of the cheapest store and its price
    try:
        store = min(prices, key=prices.get)
        cheapest_price = prices[store]
    except Exception as e:
        return None, None, None, False

    # Storing the info of each store to return
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
        }
    }

    # Failsafe return
    if cheapest_price == 999999:
        return None, None, None, False

    # Returning to the algorithm:
    # The cheapest overall price, the store name, the data from each store, A bool success value
    return cheapest_price, store, stores_data, True




# --------  THE ALGORITHM --------

def run_algorithm(amount: int = 1, # Amount of recipes needed
                  budget_min: float = 0, # Min price per recipe
                  budget_max: float = 9999, # Max price per recipe
                  memory_scores: dict = {}, # Memory of previous likes/dislikes of ingredients
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

    # Internal helper function to get memory score
    def get_memory_score(name):
        try:
            if name in memory_scores:
                return float(memory_scores[name])
            elif name.lower() in memory_scores:
                return float(memory_scores[name.lower()])
            else:
                return 1
        except:
            return 1

    # Internal helper function to parse quantities of an ingredient of the recipe
    def parse_quantity(quantity):
        quantity = str(quantity or "").strip().lower()

        # Changing fractions to simple text
        fractions = {
            "\u00bd": " 1/2",
            "\u00bc": " 1/4",
            "\u00be": " 3/4",
            "\u2153": " 1/3",
            "\u2154": " 2/3",
            "\u215b": " 1/8"
        }

        for fraction in fractions:
            quantity = quantity.replace(fraction, fractions[fraction])

        quantity = quantity.replace(",", ".")
        quantity = quantity.replace("-", " ")
        quantity = quantity.replace("(", " ")
        quantity = quantity.replace(")", " ")

        # Internal helper function to read numbers
        def read_number(number):
            number = number.strip()

            if " " in number and "/" in number:
                parts = number.split()
                whole_number = float(parts[0])
                fraction_parts = parts[1].split("/")
                return whole_number + (float(fraction_parts[0]) / float(fraction_parts[1]))

            if "/" in number:
                fraction_parts = number.split("/")
                return float(fraction_parts[0]) / float(fraction_parts[1])

            return float(number)

        def read_number_text(text, start_position):
            if start_position >= len(text) or not text[start_position].isdigit():
                return "", start_position

            start = start_position
            position = start_position

            while position < len(text) and text[position].isdigit():
                position += 1

            after_whole_number = position

            # Mixed number, for example 1 1/2
            space_position = after_whole_number
            while space_position < len(text) and text[space_position] == " ":
                space_position += 1

            fraction_position = space_position
            while fraction_position < len(text) and text[fraction_position].isdigit():
                fraction_position += 1

            if (
                space_position > after_whole_number
                and fraction_position < len(text)
                and text[fraction_position] == "/"
            ):
                fraction_position += 1
                fraction_end = fraction_position

                while fraction_end < len(text) and text[fraction_end].isdigit():
                    fraction_end += 1

                if fraction_end > fraction_position:
                    return text[start:fraction_end], fraction_end

            # Fraction
            if position < len(text) and text[position] == "/":
                position += 1
                fraction_end = position

                while fraction_end < len(text) and text[fraction_end].isdigit():
                    fraction_end += 1

                if fraction_end > position:
                    return text[start:fraction_end], fraction_end

            # Decimal number
            if position + 1 < len(text) and text[position] == "." and text[position + 1].isdigit():
                position += 1

                while position < len(text) and text[position].isdigit():
                    position += 1

            return text[start:position], position

        def read_unit_text(text, start_position):
            position = start_position

            while position < len(text) and text[position] == " ":
                position += 1

            unit = ""
            while position < len(text) and text[position] >= "a" and text[position] <= "z":
                unit += text[position]
                position += 1

            if unit:
                return unit

            return "stk"

        # Checking if the measurement says for exampl "2 x 400g"
        position = 0
        while position < len(quantity):
            first_number, first_number_end = read_number_text(quantity, position)

            if first_number:
                x_position = first_number_end

                while x_position < len(quantity) and quantity[x_position] == " ":
                    x_position += 1

                if x_position < len(quantity) and quantity[x_position] == "x":
                    second_number_start = x_position + 1

                    while second_number_start < len(quantity) and quantity[second_number_start] == " ":
                        second_number_start += 1

                    second_number, second_number_end = read_number_text(quantity, second_number_start)

                    if second_number:
                        amount = read_number(first_number) * read_number(second_number)
                        unit = read_unit_text(quantity, second_number_end)
                        return amount, unit

                position = first_number_end
            else:
                position += 1

        # Reading the first normal number
        position = 0
        while position < len(quantity):
            number, number_end = read_number_text(quantity, position)

            if number:
                amount = read_number(number)
                unit = read_unit_text(quantity, number_end)
                return amount, unit

            position += 1

        # If there is no number, it is probably one item
        words = quantity.split()
        if len(words) > 0:
            return 1, words[0]

        return 1, "stk"
    


    
    # ====== ALGORITHM START ======
    
    results = {}
    recipes_not_priced = {}
    for i in range(amount):
        candidates = {}
        cheapest_candidate_price = 999999
        cheapest_candidate_score = 999999
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

                # Failsafe if there is nothing to price
                if len(ingredients_to_value) == 0:
                    recipes_not_priced[name] = True
                    continue

                recipe_prices = {}
                total_price = 0
                ranking_price = 0
                success_bool = True

                for ingredient_data in ingredients_to_value:
                    ingredient = ingredient_data["name"]
                    measurement = ingredient_data["measure"]

                    try:
                        quantity, unit = parse_quantity(measurement)
                    except:
                        success_bool = False
                        break


                    # Translate to danish and find the cheapest price in the cheapest store
                    try:
                        ingredient_DK = ingredients_mapping[ingredient]
                    except:
                        success_bool = False
                        break

                    try:
                        cheapest_price, store, stores_data, found = find_cheapest_price(ingredient_DK, quantity, unit, price_data)
                    except Exception as e:
                        print(f"Error finding cheapest price: {e}")
                        success_bool = False
                        break

                    # Fail safe
                    if not found or cheapest_price is None or store is None or stores_data is None:
                        success_bool = False
                        break

                    # Get score from previous likes and dislikes
                    ingredient_score = get_memory_score(ingredient)
                    if ingredient_score == 1:
                        ingredient_score = get_memory_score(ingredient_DK)

                    # Collect the data in a dict and accumulate the total cost
                    recipe_prices[ingredient] = {
                        "measure": measurement,
                        "store": store,
                        "stores_data": stores_data,
                        "product_name": stores_data[store]["product_name"],
                        "amount_to_buy": stores_data[store]["amount_to_buy"],
                        "price": cheapest_price,
                        "memory_score": ingredient_score
                    }
                    total_price += cheapest_price
                    ranking_price += cheapest_price * ingredient_score

                if not success_bool:
                    recipes_not_priced[name] = True
                    continue
                
                # Check if the recipe price is within range of budget
                if budget_min <= total_price <= budget_max:
                    candidates[name] = recipe_prices
                    if ranking_price < cheapest_candidate_score:
                        cheapest_candidate_price = total_price
                        cheapest_candidate_score = ranking_price
                        cheapest_candidate_name = name
                        cheapest_candidate_stores = recipe_prices

        # Add cheapest recipe to results
        if cheapest_candidate_name: 
            results[cheapest_candidate_name] = {
                "price": cheapest_candidate_price,
                "score": cheapest_candidate_score,
                "stores": cheapest_candidate_stores
            }
        
    results["not_priced_count"] = len(recipes_not_priced)

    # ====== ALGORITHM END ======




    return results






# Main function
def main():

    try:
        while True:
            try:
                budget_min, budget_max, recipes_amount = get_inputs()
            except Exception as e:
                print(f"\nError with inputs: \n\n{e}\n")
            
            memory_scores = {}

            results = run_algorithm(recipes_amount, budget_min, budget_max, memory_scores)
            print_results(results)

            run_again = input(Fore.CYAN + "\n\nRun algorithm again?\n(y/n): " + Style.RESET_ALL).strip().lower()
            if run_again == "n":
                break

    except Exception as e:
        print(Fore.RED + f"\nERROR:\n" + Fore.LIGHTBLACK_EX)
        traceback.print_exc()
        input(Style.RESET_ALL + "\nPress enter to close program...")
        sys.exit(0)



if __name__ == "__main__":
    main()
