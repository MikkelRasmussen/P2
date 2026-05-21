import { useState } from "react";
import { useRecipes } from "../context/RecipeContext.jsx";
import RecipeModal from "../components/recipes/RecipeModal.jsx";
import { WEEKDAYS_DA, translateCategory } from "../utils/translations.js";

export default function WeekPage() {
    const { liked } = useRecipes();
    const [selectedRecipe, setSelectedRecipe] = useState(null);

    const days = WEEKDAYS_DA;

    const todayIndex = new Date().getDay();

    function getCurrentWeekRange() {
        const today = new Date();
        const day = today.getDay();
        const diffToMonday = (day === 0 ? -6 : 1) - day;

        const monday = new Date(today);
        monday.setDate(today.getDate() + diffToMonday);

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        const format = (date) =>
            date.toLocaleDateString("da-DK", {
                month: "short",
                day: "numeric",
            });

        return `${format(monday)} — ${format(sunday)}`;
    }

    const weekRecipes = days.map((day, i) => ({
        day,
        recipe: liked[i] || null,
    }));

    const hero = weekRecipes[todayIndex]?.recipe;

    const openRecipe = (recipe) => {
        if (recipe) setSelectedRecipe(recipe);
    };

    return (
        <main className="flex-grow max-w-7xl mx-auto w-full px-8 py-12">

            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                <div>
                    <span className="text-sm uppercase font-bold mb-2 block">
                        Madplan for
                    </span>

                    <h1 className="text-5xl font-extrabold">
                        Ugentlig madplan
                    </h1>

                    <p className="mt-2 text-lg">
                        {getCurrentWeekRange()} — {liked.length} måltider.
                    </p>
                </div>

                <a
                    href="/shopping-list"
                    className="bg-black text-white px-6 py-3 rounded-full flex items-center gap-2"
                >
                    <span className="material-symbols-outlined">
                        shopping_basket
                    </span>
                    Vis indkøbsliste
                </a>
            </div>

            {liked.length === 0 ? (
                <div className="text-center py-20">
                    <h2 className="text-2xl font-bold mb-2">
                        Ingen gemte opskrifter endnu
                    </h2>
                    <p className="text-gray-500">
                        Swipe og gem opskrifter for at fylde din madplan
                    </p>
                    <a
                        href="/"
                        className="inline-block mt-6 bg-black text-white px-6 py-3 rounded-full"
                    >
                        Find opskrifter
                    </a>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-7 gap-4">

                    {hero && (
                        <button
                            type="button"
                            onClick={() => openRecipe(hero)}
                            className="md:col-span-3 md:row-span-2 bg-white rounded-lg overflow-hidden shadow-sm flex flex-col text-left hover:shadow-md transition-shadow cursor-pointer"
                        >
                            <div className="relative h-64 bg-gray-200">
                                {hero.imageurl && (
                                    <img
                                        src={hero.imageurl}
                                        alt={hero.name || "opskrift"}
                                        className="w-full h-full object-cover"
                                    />
                                )}

                                <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 rounded-full text-xs">
                                    {days[todayIndex]} (I dag)
                                </div>
                            </div>

                            <div className="p-6">
                                <h2 className="text-2xl font-bold mb-2">
                                    {hero.name || "Uden titel"}
                                </h2>

                                <p className="text-sm text-gray-500">
                                    {translateCategory(hero.category) || "Måltid"}
                                    {hero.price != null && (
                                        <span className="ml-2 text-green-700 font-semibold">
                                            · ca. {Math.round(hero.price)} kr
                                        </span>
                                    )}
                                </p>
                                <p className="text-xs text-gray-400 mt-2">
                                    Klik for at se opskrift
                                </p>
                            </div>
                        </button>
                    )}

                    {weekRecipes.map(({ day, recipe }, i) => {
                        if (i === todayIndex) return null;

                        return (
                            <button
                                key={day}
                                type="button"
                                onClick={() => openRecipe(recipe)}
                                disabled={!recipe}
                                className={`md:col-span-2 rounded-lg p-5 flex flex-col justify-between text-left transition-shadow ${
                                    recipe
                                        ? "bg-gray-50 hover:bg-white hover:shadow-md cursor-pointer"
                                        : "bg-gray-50 opacity-60 cursor-default"
                                }`}
                            >
                                <div>
                                    <div className="flex justify-between mb-3">
                                        <span className="text-xs uppercase text-gray-500 font-bold">
                                            {day}
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-bold">
                                        {recipe?.name || "Intet måltid planlagt"}
                                    </h3>
                                </div>

                                <div className="mt-4 text-sm text-gray-400">
                                    {recipe
                                        ? "Klik for at se opskrift"
                                        : "Gem flere opskrifter"}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {selectedRecipe && (
                <RecipeModal
                    recipe={selectedRecipe}
                    onClose={() => setSelectedRecipe(null)}
                />
            )}
        </main>
    );
}
