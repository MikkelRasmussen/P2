import { API_BASE } from './api.js';

export const INITIAL_BATCH = 6;
export const REFILL_THRESHOLD = 4;
export const REFILL_BATCH = 4;
export const DEFAULT_BUDGET_MIN = 45;
export const DEFAULT_BUDGET_MAX = 9999;

export function buildExcludes(liked, skipped, stack) {
    const ids = new Set();
    for (const r of [...liked, ...skipped, ...stack]) {
        if (r?.id != null) ids.add(String(r.id));
    }
    return [...ids];
}

export function buildMemoryScores(skippedRecipes) {
    const scores = {};
    for (const recipe of skippedRecipes) {
        const ingredients = recipe.ingredients || [];
        for (const ing of ingredients) {
            const key = (ing.ingredient || ing.recipeIngredient || "").toLowerCase();
            if (!key) continue;
            scores[key] = Math.min(1, (scores[key] ?? 0) + 0.2);
        }
        for (const ing of recipe.valuatedIngredients || []) {
            const key = (ing.recipeIngredient || "").toLowerCase();
            if (!key) continue;
            scores[key] = Math.min(1, (scores[key] ?? 0) + 0.2);
        }
    }
    return scores;
}

export async function fetchRecommendations({
    amount,
    liked = [],
    skipped = [],
    stack = [],
    budgetMin = DEFAULT_BUDGET_MIN,
    budgetMax = DEFAULT_BUDGET_MAX,
}) {
    const params = new URLSearchParams({
        amount: String(amount),
        budgetMin: String(budgetMin),
        budgetMax: String(budgetMax),
        excludes: JSON.stringify(buildExcludes(liked, skipped, stack)),
        memoryScores: JSON.stringify(buildMemoryScores(skipped)),
    });

    const res = await fetch(`${API_BASE}/recommend?${params}`);
    if (!res.ok) throw new Error("Failed to fetch recommendations");
    const data = await res.json();
    return [...data].reverse();
}
