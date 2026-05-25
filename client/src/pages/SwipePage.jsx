import { useState, useCallback, useEffect, useRef } from "react";
import RecipeCard from "../components/recipes/RecipeCard.jsx";
import RecipeModal from "../components/recipes/RecipeModal.jsx";
import SavedList from "../components/recipes/SavedList.jsx";
import { useRecipes } from "../context/RecipeContext.jsx";
import {
    fetchRecommendations,
    INITIAL_BATCH,
    REFILL_THRESHOLD,
    REFILL_BATCH,
} from "../services/recommendations.js";
import { recipeCountDa } from "../utils/translations.js";

const VIEW_LABELS = {
    swipe: "Udforsk",
    saved: "Gemt",
};

export default function SwipePage() {
    const [stack, setStack] = useState([]);
    const { liked, setLiked } = useRecipes();
    const [skipped, setSkipped] = useState([]);
    const [lastAction, setLastAction] = useState(null);
    const [view, setView] = useState("swipe");
    const [flyOut, setFlyOut] = useState(null);
    const [detailRecipe, setDetailRecipe] = useState(null);
    const [savedModal, setSavedModal] = useState(null);
    const [loading, setLoading] = useState(true);

    const initialized = useRef(false);
    const fetchingRef = useRef(false);
    const exhaustedRef = useRef(false);
    const likedRef = useRef(liked);
    const skippedRef = useRef(skipped);
    const stackRef = useRef(stack);

    useEffect(() => { likedRef.current = liked; }, [liked]);
    useEffect(() => { skippedRef.current = skipped; }, [skipped]);
    useEffect(() => { stackRef.current = stack; }, [stack]);

    const loadRecommendations = useCallback(async (amount, replace = false) => {
        if (fetchingRef.current) return;
        fetchingRef.current = true;
        setLoading(true);

        try {
            const batch = await fetchRecommendations({
                amount,
                liked: likedRef.current,
                skipped: skippedRef.current,
                stack: replace ? [] : stackRef.current,
            });

            setStack((prev) => {
                if (replace) {
                    exhaustedRef.current = batch.length === 0;
                    return batch;
                }
                const existingIds = new Set(prev.map((r) => String(r.id)));
                const fresh = batch.filter((r) => !existingIds.has(String(r.id)));
                if (fresh.length === 0) {
                    exhaustedRef.current = true;
                } else {
                    exhaustedRef.current = false;
                }
                return [...fresh, ...prev];
            });
        } catch (err) {
            console.error("Failed to load recommendations:", err);
        } finally {
            fetchingRef.current = false;
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            const saved = localStorage.getItem("recipeState");

            if (saved) {
                const parsed = JSON.parse(saved);
                setLiked(parsed.liked || []);
                setSkipped(parsed.skipped || []);
                if (parsed.stack?.length > 0) {
                    setStack(parsed.stack);
                    initialized.current = true;
                    setLoading(false);
                    return;
                }
            }

            await loadRecommendations(INITIAL_BATCH, true);
            initialized.current = true;
        };

        init();
    }, []);

    useEffect(() => {
        exhaustedRef.current = false;
    }, [liked.length, skipped.length]);

    useEffect(() => {
        if (!initialized.current) return;
        if (stack.length === 0 || stack.length > REFILL_THRESHOLD) return;
        if (exhaustedRef.current || fetchingRef.current) return;

        loadRecommendations(REFILL_BATCH, false);
    }, [stack.length, loadRecommendations]);

    useEffect(() => {
        if (!initialized.current) return;
        localStorage.setItem(
            "recipeState",
            JSON.stringify({ liked, skipped, stack })
        );
    }, [liked, skipped, stack]);

    const currentRecipe = stack[stack.length - 1];
    const TOTAL_STEPS = 7;
    const progress = Math.min(liked.length, TOTAL_STEPS);

    const handleSwipe = useCallback((direction) => {
        if (!currentRecipe || flyOut) return;

        const recipe = currentRecipe;
        setFlyOut({ direction, id: recipe.id });

        setTimeout(() => {
            if (direction === "like") {
                setLiked((prev) => [recipe, ...prev]);
                setLastAction("like");
            } else {
                setSkipped((prev) => [recipe, ...prev]);
                setLastAction("nope");
            }

            setStack((prev) => prev.slice(0, -1));
            setFlyOut(null);
        }, 380);
    }, [currentRecipe, flyOut, setLiked]);

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

    const resetAll = async () => {
        setLiked([]);
        setSkipped([]);
        setLastAction(null);
        setFlyOut(null);
        localStorage.removeItem("recipeState");
        exhaustedRef.current = false;
        initialized.current = true;
        await loadRecommendations(INITIAL_BATCH, true);
    };

    return (
        <div className="min-h-screen flex flex-col items-center bg-[#F5F5F3]">

            <div className="w-full max-w-sm px-6 pt-10 pb-4">
                <div className="flex justify-between">
                    <div className="flex gap-1.5 bg-gray-100 p-1 rounded-full">
                        {["swipe", "saved"].map((v) => (
                            <button
                                key={v}
                                onClick={() => setView(v)}
                                className={`px-4 py-2 rounded-full text-[13px] font-semibold ${view === v
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-500"
                                    }`}
                            >
                                {VIEW_LABELS[v]}
                                {v === "saved" && liked.length > 0 && (
                                    <span className="ml-1.5 text-[9px] bg-green-500 text-white px-1.5 rounded-full">
                                        {liked.length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <section className="w-full max-w-xs mb-10">
                <div className="flex justify-between mb-4">
                    <h2 className="text-xl font-bold">
                        {progress === TOTAL_STEPS
                            ? "Ugen er fuld 🎉"
                            : "Sammensætter din menu"}
                    </h2>
                    <span>{progress}/{TOTAL_STEPS}</span>
                </div>

                <div className="flex gap-2 h-1.5">
                    {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                        <div
                            key={i}
                            className={`flex-1 rounded-full ${i < progress ? "bg-green-400" : "bg-gray-200"
                                }`}
                        />
                    ))}
                </div>
            </section>

            {view === "swipe" ? (
                <>
                    <div className="relative w-full max-w-sm px-6" style={{ height: 520 }}>
                        {loading && stack.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <p className="text-sm text-gray-500">Finder opskrifter til dig...</p>
                            </div>
                        ) : stack.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <h3 className="text-xl font-bold mb-2">Det var det!</h3>
                                <p className="text-sm text-gray-500 mb-4">
                                    Du har gemt {recipeCountDa(liked.length)}
                                </p>
                                <button
                                    onClick={resetAll}
                                    className="bg-black text-white px-6 py-2 rounded-full"
                                >
                                    Start forfra
                                </button>
                            </div>
                        ) : (
                            stack.slice(-4).map((recipe, i, arr) => {
                                const isTop = i === arr.length - 1;
                                const depth = arr.length - 1 - i;
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
                                        key={recipe.id || i}
                                        recipe={recipe}
                                        onSwipe={handleSwipe}
                                        onOpenDetail={() => setDetailRecipe(recipe)}
                                        isTop={isTop}
                                        stackStyle={stackStyle}
                                    />
                                );
                            })
                        )}
                    </div>

                    {stack.length > 0 && (
                        <div className="flex items-center gap-6 mt-6">
                            <button
                                className="group flex flex-col items-center gap-2"
                                onClick={() => handleSwipe("nope")}
                            >
                                <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-all hover:bg-error-container hover:text-on-error-container group-active:scale-90 shadow-sm">
                                    <span className="material-symbols-outlined text-3xl" data-icon="close">close</span>
                                </div>
                                <span className="text-[0.7rem] font-bold tracking-widest uppercase font-label opacity-60">Spring over</span>
                            </button>
                            <button
                                className="group flex flex-col items-center gap-2"
                                onClick={() => handleSwipe("like")}
                            >
                                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary transition-all hover:bg-primary-dim group-active:scale-90 shadow-lg shadow-primary/20">
                                    <span className="material-symbols-outlined text-4xl" data-icon="favorite" data-weight="fill" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                                </div>
                                <span className="text-[0.7rem] font-bold tracking-widest uppercase font-label text-primary">Gem</span>
                            </button>
                            <button
                                className="group flex flex-col items-center gap-2"
                                onClick={handleUndo}
                                disabled={!lastAction}
                                title="Fortryd sidste swipe"
                            >
                                <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-all hover:bg-tertiary-container hover:text-on-tertiary-container group-active:scale-90 shadow-sm">
                                    <span className="material-symbols-outlined text-3xl" data-icon="undo">undo</span>
                                </div>
                                <span className="text-[0.7rem] font-bold tracking-widest uppercase font-label opacity-60">Fortryd</span>
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <SavedList
                    liked={liked}
                    onOpenDetail={setSavedModal}
                    onRemove={(id) => setLiked((prev) => prev.filter((r) => r.id !== id))}
                    onStartSwiping={() => setView("swipe")}
                />
            )}

            {detailRecipe && (
                <RecipeModal
                    recipe={detailRecipe}
                    onClose={() => setDetailRecipe(null)}
                />
            )}

            {savedModal && (
                <RecipeModal
                    recipe={savedModal}
                    onClose={() => setSavedModal(null)}
                />
            )}
        </div>
    );
}
