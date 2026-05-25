import { API_BASE } from './api.js';

const MIN_MATCH_INDEX = 0.7;

export function parsePrice(price) {
    return parseFloat(String(price).replace("$", "").replace(",", "."));
}

export function normalize(str) {
    return str?.toLowerCase().trim();
}

export function parseAmount(measure) {
    const match = String(measure || "").match(/([\d.,]+)/);
    return match ? parseFloat(match[1].replace(",", ".")) : 1;
}

export function buildShoppingListFromPrices(priceList, likedRecipes) {
    if (!priceList.length || !likedRecipes.length) {
        return { items: [], missing: [] };
    }

    const ingredientMap = {};

    likedRecipes.forEach((recipe) => {
        (recipe.ingredients || []).forEach((ing) => {
            const key = normalize(ing.ingredient);
            if (!key) return;
            if (!ingredientMap[key]) {
                ingredientMap[key] = {
                    ingredient: key,
                    measure: ing.measure,
                };
            }
        });
    });

    const uniqueIngredients = Object.values(ingredientMap);
    const missing = [];

    const items = uniqueIngredients
        .map((ing) => {
            const needed = parseAmount(ing.measure);

            const matches = priceList.filter(
                (p) =>
                    normalize(p.ingredient) === ing.ingredient &&
                    p.match > MIN_MATCH_INDEX
            );

            if (!matches.length) {
                missing.push(ing);
                return null;
            }

            const evaluated = matches.map((item) => {
                const productSize = item.contents || 1;
                const price = parsePrice(item.price);
                const packsNeeded = Math.ceil(needed / productSize);
                const totalCost = packsNeeded * price;

                return {
                    ...item,
                    packsNeeded,
                    totalCost,
                };
            });

            const cheapest = evaluated.reduce((min, item) =>
                item.totalCost < min.totalCost ? item : min
            );

            return {
                id: `${cheapest.store}::${ing.ingredient}::${cheapest.name}`,
                store: cheapest.store,
                name: cheapest.name,
                ingredient: ing.ingredient,
                measure: ing.measure,
                checked: false,
                totalCost: cheapest.totalCost,
            };
        })
        .filter(Boolean);

    return { items, missing };
}

export async function fetchPriceList() {
    const res = await fetch(`${API_BASE}/prices`);
    if (!res.ok) throw new Error("Failed to fetch prices");
    return res.json();
}
