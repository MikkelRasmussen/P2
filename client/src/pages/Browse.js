import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Browse() {
  const navigate = useNavigate();

  const recipes = [
    {
      id: 1,
      title: "Pasta Bolognese",
      description: "Classic pasta with rich meat sauce and parmesan.",
      category: "Italian",
      price: "45 DKK",
      emoji: "🍝",
    },
    {
      id: 2,
      title: "Chicken Curry",
      description: "Creamy curry with chicken, rice, and warm spices.",
      category: "Asian",
      price: "52 DKK",
      emoji: "🍛",
    },
    {
      id: 3,
      title: "Lasagne",
      description: "Layered pasta dish with beef, tomato sauce, and cheese.",
      category: "Italian",
      price: "50 DKK",
      emoji: "🍽️",
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    if (currentIndex < recipes.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const currentRecipe = recipes[currentIndex];

  return (
    <div className="browse-page">
      <div className="browse-header">
        <h1>Discover Recipes</h1>
        <p>Find your next favorite meal</p>
      </div>

      {currentRecipe ? (
        <div className="recipe-card">
          <div className="recipe-image">{currentRecipe.emoji}</div>

          <div className="recipe-content-box">
            <h2>{currentRecipe.title}</h2>
            <p className="recipe-description">{currentRecipe.description}</p>

            <div className="recipe-meta">
              <span>{currentRecipe.category}</span>
              <span>{currentRecipe.price}</span>
            </div>
          </div>

          <div className="recipe-buttons">
            <button className="dislike-button" onClick={handleNext}>
              Dislike
            </button>
            <button className="like-button" onClick={handleNext}>
              Like
            </button>
          </div>
        </div>
      ) : (
        <div className="recipe-card">
          <div className="recipe-content-box">
            <h2>No more recipes</h2>
            <p className="recipe-description">
              You have gone through all demo recipes.
            </p>
            <div className="recipe-buttons">
              <button className="like-button" onClick={() => navigate("/")}>
                Back Home
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bottom-nav">
        <div className="nav-item" onClick={() => navigate("/")}>
          Home
        </div>
        <div className="nav-item active" onClick={() => navigate("/browse")}>
          Browse
        </div>
        <div className="nav-item" onClick={() => navigate("/recipes")}>
          Recipes
        </div>
        <div className="nav-item" onClick={() => navigate("/prices")}>
          Prices
        </div>
      </div>
    </div>
  );
}

export default Browse;