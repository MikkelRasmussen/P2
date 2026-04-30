# This is a quick script to extract all the unique and different
# units in strMeasure from all ingredients in recipe.json database.
# Results will be given in units.txt

import json
from pathlib import Path


RECIPES_PATH = Path(r"client\src\pseudo algorithm\data\recipes.json")
OUTPUT_PATH = Path("units.txt")


def parse_quantity(measure: str):

    measure = measure.strip().lower()

    if not measure:
        return None, ""

    number_part = ""
    unit_part = ""
    reading_number = True

    for char in measure:
        if reading_number and (char.isdigit() or char in [",", "."]):
            number_part += char
        else:
            reading_number = False
            unit_part += char

    unit = unit_part.strip()

    if not number_part:
        return None, unit

    amount = float(number_part.replace(",", "."))

    return amount, unit


def load_recipes(path: Path):
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def extract_measurements(data):
    measurements = set()

    for recipe_row in data:
        meals = recipe_row.get("meals", [])

        for recipe in meals:
            for n in range(1, 21):
                measure = recipe.get(f"strMeasure{n}")

                if not measure:
                    continue

                amount, unit = parse_quantity(measure)

                if unit:
                    measurements.add(unit)

    return sorted(measurements)


def save_measurements(measurements, path: Path):
    with path.open("w", encoding="utf-8") as f:
        for measurement in measurements:
            f.write(measurement + "\n")


def main():
    data = load_recipes(RECIPES_PATH)
    measurements = extract_measurements(data)
    save_measurements(measurements, OUTPUT_PATH)

    print(f"Found {len(measurements)} unique measurements")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\nERROR:\n{e}\n")