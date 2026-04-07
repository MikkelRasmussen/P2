"""
I have made this Python code as an testing program.
The Pseudo code can be found in 
"""


import time




# File paths

RECIPES_FILE_PATH = "" # File path to the database with recipes (i dont know how to handle SQL databases here, so keep that in mind)

INGREDIENTS_MAPPING_FILE_PATH = "" # File path to the mapping of ingredients
MEASUREMENTS_MAPPING_FILE_PATH = "" # File path to the mapping of measurents

BILKA_PRICES_FILE_PATH = "" # File path to the database of Bilka prices
NETTO_PRICES_FILE_PATH = "" # File path to the database of Netto prices
FØTEX_PRICES_FILE_PATH = "" # File path to the database of Føtex prices
REMA_PRICES_FILE_PATH = "" # File path to the database of Rema1000 prices






# Helper function to determine the cheapest store

def find_cheapest_price(ingredient: str,
                        bilka: dict,
                        netto: dict,
                        føtex: dict,
                        rema: dict):
    cheapest = 0
    store = ""

    price_bilka = bilka[ingredient]
    price_netto = netto[ingredient]
    price_føtex = føtex[ingredient]
    price_rema = rema[ingredient]

    if price_bilka < all(price_netto, price_føtex, price_rema):
        store = "bilka"
        cheapest = price_bilka

    elif price_netto < all(price_bilka, price_føtex, price_rema):
        store = "netto"
        cheapest = price_netto

    elif price_føtex < all(price_netto, price_bilka, price_rema):
        store = "føtex"
        cheapest = price_føtex

    elif price_rema < all(price_netto, price_føtex, price_bilka):
        store = "rema"
        cheapest = price_rema

    else:
        return None, None

    return cheapest, store




# Main function to run the algorithm

def run_algorithm(amount: int = 1, # Amount of recipes needed
                  budget: float = 9999, # Budget per recipe
                ):

    # Initialising the algorithm

    try:
        recipes = None
        with open(RECIPES_FILE_PATH, "r") as f:
            recipes = f.readlines()

        ingredients_mapping = None
        with open(INGREDIENTS_MAPPING_FILE_PATH, "r") as f:
            ingredients_mapping = f.readlines()

        measurements_mapping = None
        with open(MEASUREMENTS_MAPPING_FILE_PATH, "r") as f:
            measurements_mapping = f.readlines()

        bilka_prices = None
        with open(BILKA_PRICES_FILE_PATH, "r") as f:
            bilka_prices = f.readlines()

        netto_prices = None
        with open(NETTO_PRICES_FILE_PATH, "r") as f:
            netto_prices = f.readlines()

        føtex_prices = None
        with open(FØTEX_PRICES_FILE_PATH, "r") as f:
            føtex_prices = f.readlines()

        rema_prices = None
        with open(REMA_PRICES_FILE_PATH, "r") as f:
            rema_prices = f.readlines()
    except Exception as e:
        print(f"Error with loading data in algorithm:\n\n{e}\n")
        return None


    
    # ------ Main algorithm ------

    results = {}
    for i in range(amount):
        candidates = {}
        cheapest_candidate_price = 999999
        cheapest_candidate_name = None
        cheapest_candidate_stores = None

        for recipe in recipes:
            name = recipe["name"]

            if name in results:
                continue

            ingredients = recipe["ingredients"]

            ingredients_result = {}
            total_price = 0
            for ingredient in ingredients:
                ingredient_DK = ingredients_mapping[ingredient]
                cheapest_price, store = find_cheapest_price(ingredient_DK, bilka_prices, netto_prices, føtex_prices, rema_prices)
                ingredients_result["ingredient"] = {"store": store, "price": cheapest_price}
                total_price += cheapest_price
            
            if cheapest_price <= budget:
                candidates.append(name)
                if total_price < cheapest_candidate_price:
                    cheapest_candidate_price = total_price
                    cheapest_candidate_name = name
                    cheapest_candidate_stores = ingredients_result

        if cheapest_candidate_name: 
            results[cheapest_candidate_name] = {
                "price": cheapest_candidate_price,
                "stores": cheapest_candidate_stores
            }

    return results
        






# Main function

def main():

    # Setting budget
    while True:
        budget = input("Budget per recipe (DKK): ")
        try:
            budget = float(budget)
            if budget <= 0:
                print("Please choose a number above 0")
                time.sleep(2)
                continue
        except:
            print("Please choose a number")
            time.sleep(2)
            continue
        break

    # Setting amount of recipes needed
    while True:
        recipes_amount = input("Amount of recipes: ")
        try:
            recipes_amount = int(budget)
            if recipes_amount <= 0:
                print("Please choose a number above 0")
                time.sleep(2)
                continue
        except:
            print("Please choose a whole number")
            time.sleep(2)
            continue
        break

    try:
        results = run_algorithm(recipes_amount, budget)
        print(results)
    except Exception as e:
        print(f"ERROR:\n {e}")
        input("\n\nPress Enter to continue")




if __name__ == "__main__":
    main()