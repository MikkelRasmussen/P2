import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <div className="hero-section">
        <div className="hero-top">
          <h1 className="brand-title">🍳 Smart Meal-Planner</h1>
          <span
            className="settings-icon"
            onClick={() => navigate("/settings")}
          >
            ⚙
          </span>
        </div>

        <p className="welcome-text">Welcome back!</p>
        <h2 className="hero-heading">Discover your next favorite meal</h2>
      </div>

      <div className="stats-section">
        <div className="stat-card">
          <div className="stat-number">0</div>
          <div className="stat-label">DKK</div>
        </div>

        <div className="stat-card">
          <div className="stat-number">0</div>
          <div className="stat-label">Liked</div>
        </div>

        <div className="stat-card">
          <div className="stat-number">0</div>
          <div className="stat-label">Meals</div>
        </div>

        <div className="stat-card">
          <div className="stat-number">0</div>
          <div className="stat-label">Tried</div>
        </div>
      </div>

      <div className="discover-card">
        <div className="discover-content">
          <h3>🔥 Discover Recipes</h3>
          <p>Swipe through recipes and find your perfect match</p>
          <button
            className="discover-button"
            onClick={() => navigate("/browse")}
          >
            Start Swiping
          </button>
        </div>
        <div className="discover-heart">❤</div>
      </div>

      <div className="quick-actions-section">
        <h3 className="section-title">Quick Actions</h3>

        <div className="quick-actions-grid">
          <div className="action-card" onClick={() => navigate("/browse")}>
            <div>
              <div className="action-icon">🔥</div>
              <div>Discover Recipes</div>
            </div>
          </div>

          <div
            className="action-card"
            onClick={() => navigate("/generate-plan")}
          >
            <div>
              <div className="action-icon">➕</div>
              <div>Generate Plan</div>
            </div>
          </div>

          <div className="action-card" onClick={() => navigate("/recipes")}>
            <div>
              <div className="action-icon">📅</div>
              <div>View Plan</div>
            </div>
          </div>

          <div
            className="action-card"
            onClick={() => navigate("/shopping-list")}
          >
            <div>
              <div className="action-icon">🛒</div>
              <div>Shopping List</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bottom-nav">
        <div className="nav-item active" onClick={() => navigate("/")}>
          Home
        </div>
        <div className="nav-item" onClick={() => navigate("/browse")}>
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

export default Home;
