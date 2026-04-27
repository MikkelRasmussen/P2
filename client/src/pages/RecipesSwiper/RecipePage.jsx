import { useState, useCallback } from "react";
import { recipes as allRecipes } from "./Components/data/recipes";
import RecipeCard from "./Components/RecipeCard";
import RecipeModal from "./Components/RecipeModal";
import SavedList from "./Components/SavedList";



export default function RecipePage() {
    const [stack, setStack] = useState([...allRecipes].reverse());
    const [liked, setLiked] = useState([]);
    const [skipped, setSkipped] = useState([]);
    const [lastAction, setLastAction] = useState(null);
    const [view, setView] = useState("swipe"); // "swipe" | "saved"
    const [flyOut, setFlyOut] = useState(null); // { direction, id }
    const [detailRecipe, setDetailRecipe] = useState(null); // opened from swipe stack
    const [savedModal, setSavedModal] = useState(null);    // opened from saved list

    const currentRecipe = stack[stack.length - 1];


    const TOTAL_STEPS = 7;
    const progress = Math.min(liked.length, TOTAL_STEPS);


    const handleSwipe = useCallback(
        (direction) => {
            if (!currentRecipe || flyOut) return;
            const recipe = currentRecipe;
            setFlyOut({ direction, id: recipe.id });
            setTimeout(() => {
                if (direction === "like") {
                    setLiked((p) => [recipe, ...p]);
                    setLastAction("like");
                } else {
                    setSkipped((p) => [recipe, ...p]);
                    setLastAction("nope");
                }
                setStack((p) => p.slice(0, -1));
                setFlyOut(null);
            }, 380);
        },
        [currentRecipe, flyOut]
    );

    const handleUndo = () => {
        if (lastAction === "like" && liked.length > 0) {
            setStack((p) => [...p, liked[0]]);
            setLiked((p) => p.slice(1));
        } else if (lastAction === "nope" && skipped.length > 0) {
            setStack((p) => [...p, skipped[0]]);
            setSkipped((p) => p.slice(1));
        }
        setLastAction(null);
    };

    const resetAll = () => {
        setStack([...allRecipes].reverse());
        setLiked([]);
        setSkipped([]);
        setLastAction(null);
        setFlyOut(null);
    };

    return (
        <div className="min-h-screen flex flex-col items-center bg-[#F5F5F3]">
            {/* ── Header ── */}
            <div className="w-full max-w-sm px-6 pt-10 pb-4">
                <div className="flex items-center justify-between">

                    <div className="flex gap-1.5 bg-gray-100 p-1 rounded-full">
                        {["swipe", "saved"].map((v) => (
                            <button
                                key={v}
                                onClick={() => setView(v)}
                                className={`px-4 py-2 rounded-full text-[13px] font-semibold capitalize transition-all duration-200 ${view === v
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                {v}
                                {v === "saved" && liked.length > 0 && (
                                    <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-green-500 text-white">
                                        {liked.length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            {/* Weekly Plan Progress Section */}
            <section className="w-full max-w-xs mb-10">
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <span className="text-[0.75rem] font-medium tracking-[0.1em] text-on-surface-variant uppercase font-label">Weekly Progress</span>

                        <h2 className="text-xl font-bold flex items-center gap-2">
                            {progress === TOTAL_STEPS ? (
                                <>
                                    <span>Week complete</span>
                                    <span className="material-symbols-outlined text-3xl">
                                        celebration
                                    </span>
                                </>
                            ) : (
                                "Curating your menu"
                            )}
                        </h2>

                    </div>

                    <span className="text-primary font-bold text-lg">
                        {progress}/{TOTAL_STEPS}
                    </span>

                </div>
                {/* Tonal Trail Stepper */}

                <div
                    className="flex gap-2 h-1.5 w-full"
                    role="progressbar"
                    aria-valuenow={progress}
                    aria-valuemin={0}
                    aria-valuemax={TOTAL_STEPS}
                >
                    {Array.from({ length: TOTAL_STEPS }).map((_, i) => (

                        <div
                            key={i}
                            className={`flex-1 rounded-full transition-all duration-300 ease-out
                                    ${i < progress
                                    ? "bg-primary-container scale-y-105"
                                    : "bg-surface-container-high"}
                                    `}
                        />

                    ))}
                </div>
            </section >

            {view === "swipe" ? (
                <>
                    {/* ── Card stack ── */}
                    <div className="relative w-full max-w-sm px-6" style={{ height: 480 }}>
                        {stack.length === 0 ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
                                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
                                    <span className="text-4xl">🍽️</span>
                                </div>
                                <h3 className="text-gray-900 text-2xl font-bold mb-2">
                                    All done!
                                </h3>
                                <p className="text-gray-400 text-sm mb-7 max-w-[240px]">
                                    You saved {liked.length} recipe{liked.length !== 1 ? "s" : ""}. Time to cook something delicious!
                                </p>
                                <button
                                    onClick={resetAll}
                                    className="px-8 py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-full text-sm transition-all shadow-lg shadow-gray-900/20 active:scale-95"
                                >
                                    Start Over
                                </button>
                            </div>
                        ) : (
                            stack.map((recipe, i) => {
                                const isTop = i === stack.length - 1;
                                const depth = stack.length - 1 - i;
                                const isFlyingOut = flyOut?.id === recipe.id;

                                const stackStyle = isFlyingOut
                                    ? {
                                        transform: `translateX(${flyOut.direction === "like" ? "130%" : "-130%"
                                            }) rotate(${flyOut.direction === "like" ? 28 : -28}deg)`,
                                        zIndex: 20,
                                        transition: "transform 0.38s cubic-bezier(0.55,0,1,0.45)",
                                    }
                                    : {
                                        transform: `scale(${1 - depth * 0.04}) translateY(${depth * 12}px)`,
                                        zIndex: i,
                                        transition: "transform 0.35s cubic-bezier(0.175,0.885,0.32,1.1)",
                                    };

                                return (
                                    <RecipeCard
                                        key={recipe.id}
                                        recipe={recipe}
                                        onSwipe={handleSwipe}
                                        onOpenDetail={() => setDetailRecipe(recipe)}
                                        isTop={isTop && !flyOut}
                                        stackStyle={stackStyle}
                                    />
                                );
                            })
                        )}
                    </div>

                    {/* ── Action buttons ── */}
                    {stack.length > 0 && (
                        <div className="flex items-center gap-6 mt-6">

                            <button className="group flex flex-col items-center gap-2"
                                onClick={() => handleSwipe("nope")}>
                                <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-all hover:bg-error-container hover:text-on-error-container group-active:scale-90 shadow-sm">
                                    <span className="material-symbols-outlined text-3xl" data-icon="close">close</span>
                                </div>
                                <span className="text-[0.7rem] font-bold tracking-widest uppercase font-label opacity-60">Pass</span>
                            </button>
                            <button className="group flex flex-col items-center gap-2"
                                onClick={() => handleSwipe("like")}>
                                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary transition-all hover:bg-primary-dim group-active:scale-90 shadow-lg shadow-primary/20">
                                    <span className="material-symbols-outlined text-4xl" data-icon="favorite" data-weight="fill" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                                </div>
                                <span className="text-[0.7rem] font-bold tracking-widest uppercase font-label text-primary">Love</span>
                            </button>
                            <button className="group flex flex-col items-center gap-2"
                                onClick={handleUndo}
                                disabled={!lastAction}
                                title="Undo last swipe">
                                <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-all hover:bg-tertiary-container hover:text-on-tertiary-container group-active:scale-90 shadow-sm">
                                    <span className="material-symbols-outlined text-3xl" data-icon="undo">undo</span>
                                </div>
                                <span className="text-[0.7rem] font-bold tracking-widest uppercase font-label opacity-60">Undo</span>
                            </button>
                        </div>

                    )}

                    {/* ── Stats ── */}
                    {stack.length > 0 && (
                        <div className="flex gap-6 mt-5 text-xs font-medium">
                            <div className="flex items-center gap-1.5 text-gray-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                                {skipped.length} skipped
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-600">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                {liked.length} saved
                            </div>
                        </div>
                    )}

                    {stack.length > 0 && liked.length === 0 && skipped.length === 0 && (
                        <p className="text-gray-400 text-[11px] mt-4 font-medium">
                            Swipe right to save · Tap for details
                        </p>
                    )}
                </>
            ) : (
                /* ── Saved view ── */
                <div className="w-full max-w-sm px-6 pb-10">

                </div>
            )
            }

            {/* ── Recipe detail modal (from swipe stack tap) ── */}
            {
                detailRecipe && (
                    <RecipeModal
                        recipe={detailRecipe}
                        onClose={() => setDetailRecipe(null)}
                        onSwipe={(dir) => {
                            handleSwipe(dir);
                            setDetailRecipe(null);
                        }}
                        showActions={true}
                    />
                )
            }

            {/* ── Recipe detail modal (from saved list) ── */}
            {
                savedModal && (
                    <RecipeModal
                        recipe={savedModal}
                        onClose={() => setSavedModal(null)}
                        onSwipe={() => setSavedModal(null)}
                        showActions={false}
                    />
                )
            }
        </div >
    );
}