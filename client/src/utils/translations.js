const CATEGORY_DA = {
    Beef: "Oksekød",
    Breakfast: "Morgenmad",
    Chicken: "Kylling",
    Dessert: "Dessert",
    Goat: "Ged",
    Lamb: "Lam",
    Miscellaneous: "Diverse",
    Pasta: "Pasta",
    Pork: "Svinekød",
    Seafood: "Fisk & skaldyr",
    Side: "Tilbehør",
    Starter: "Forret",
    Vegan: "Vegansk",
    Vegetarian: "Vegetar",
};

export const WEEKDAYS_DA = [
    "Søndag",
    "Mandag",
    "Tirsdag",
    "Onsdag",
    "Torsdag",
    "Fredag",
    "Lørdag",
];

export function translateCategory(category) {
    if (!category) return "Ukendt kategori";
    return CATEGORY_DA[category] ?? category;
}

export function recipeCountDa(count) {
    if (count === 1) return "1 opskrift";
    return `${count} opskrifter`;
}
