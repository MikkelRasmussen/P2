import { createContext, useContext, useState, useEffect } from "react";

const RecipeContext = createContext();

export function RecipeProvider({ children }) {
    const [liked, setLiked] = useState([]);

    useEffect(() => {
        const saved = localStorage.getItem("recipeState");
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.liked?.length) {
                setLiked(parsed.liked);
            }
        }
    }, []);

    return (
        <RecipeContext.Provider value={{ liked, setLiked }}>
            {children}
        </RecipeContext.Provider>
    );
}

export function useRecipes() {
    return useContext(RecipeContext);
}
``