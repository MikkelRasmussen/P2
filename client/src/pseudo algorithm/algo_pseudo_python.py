"""
I have made this Python code as a testing program.
The Pseudo code can be found in algo_pseudo.txt.

To run this example, you need to set the file paths below.
You can leave the MEASUREMENTS_MAPPING_FILE_PATH blank, since
i have not yet coded measurements into the algorithm.
"""


from colorama import Style, Fore, init
import sys


# File paths
RECIPES_FILE_PATH = "" # File path to the database with recipes (i dont know how to handle SQL databases here, so keep that in mind)

INGREDIENTS_MAPPING_FILE_PATH = "" # File path to the mapping of ingredients
MEASUREMENTS_MAPPING_FILE_PATH = "" # File path to the mapping of measurents

BILKA_PRICES_FILE_PATH = "" # File path to the database of Bilka prices
NETTO_PRICES_FILE_PATH = "" # File path to the database of Netto prices
FØTEX_PRICES_FILE_PATH = "" # File path to the database of Føtex prices
REMA_PRICES_FILE_PATH = "" # File path to the database of Rema1000 prices



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
def fetch_price_data():
    try:
        recipes = None
        with open(RECIPES_FILE_PATH, "r") as f:
            recipes = f.readlines()

        ingredients_mapping = None
        with open(INGREDIENTS_MAPPING_FILE_PATH, "r") as f:
            ingredients_mapping = f.readlines()

        measurements_mapping = None
        try:
            with open(MEASUREMENTS_MAPPING_FILE_PATH, "r") as f:
                measurements_mapping = f.readlines()
        except:
            pass

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
        
        return recipes, ingredients_mapping, measurements_mapping, bilka_prices, netto_prices, føtex_prices, rema_prices
    except Exception as e:
        print(Fore.RED + f"Error loading data from file:\n{e}\n")
        input(Fore.LIGHTBLACK_EX + "\nPress enter to close program..." + Style.RESET_ALL)
        sys.exit(0)
        




# Helper function to determine the cheapest price from the cheapest store
def find_cheapest_price(ingredient: str, bilka: list, netto: list, føtex: list, rema: list):

    # Finding cheapest price from each store
    price_bilka = 999999
    for i in range(len(bilka)):
        if ingredient in bilka[i]["description"]:
            if bilka[i]["price"] < price_bilka:
                price_bilka = bilka[i]["price"]

    price_netto = 999999
    for i in range(len(netto)):
        if ingredient in netto[i]["description"]:
            if netto[i]["price"] < price_netto:
                price_netto = netto[i]["price"]

    price_føtex = 999999
    for i in range(len(føtex)):
        if ingredient in føtex[i]["description"]:
            if føtex[i]["price"] < price_føtex:
                price_føtex = føtex[i]["price"]

    price_rema = 999999
    for department in rema["departments"]:
        for category in department["categories"]:
            for item in category["items"]:
                if ingredient.lower() in item["name"].lower():
                    if item["pricing"]["price"] < price_rema:
                        price_rema = item["pricing"]["price"]

    # Comparing the cheapest price from each store with each other
    prices = {
        "bilka": price_bilka,
        "netto": price_netto,
        "føtex": price_føtex,
        "rema": price_rema
    }

    store = min(prices, key=prices.get)
    cheapest = prices[store]

    if cheapest == 999999:
        return None, None

    return cheapest, store




# Main function to run the algorithm

def run_algorithm(amount: int = 1, # Amount of recipes needed
                  budget_min: int = 0, # min price per recipe
                  budget_max: float = 9999, # max price per recipe
                ) -> dict:

    # Initialising data for the algorithm
    recipes, ingredients_mapping, measurements_mapping, bilka_prices, netto_prices, føtex_prices, rema_prices = fetch_price_data()

    
    # Algorithm
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
                if any(cheapest_price, store) is None:
                    continue
                ingredients_result["ingredient"] = {"store": store, "price": cheapest_price}
                total_price += cheapest_price
            
            if budget_min <= cheapest_price <= budget_max:
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

    budget_min, budget_max, recipes_amount = get_inputs()

    try:
        results = run_algorithm(recipes_amount, budget_min, budget_max)
        print(results)
    except Exception as e:
        print(Fore.RED + f"ERROR:\n{e}")
        input(Fore.LIGHTBLACK_EX + "\nPress enter to close program..." + Style.RESET_ALL)




if __name__ == "__main__":
    main()