import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Browse from "./pages/Browse";
import Recipes from "./pages/Recipes";
import Prices from "./pages/Prices";
import GeneratePlan from "./pages/GeneratePlan";
import ShoppingList from "./pages/ShoppingList";
import Settings from "./pages/Settings";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/recipes" element={<Recipes />} />
        <Route path="/prices" element={<Prices />} />
        <Route path="/generate-plan" element={<GeneratePlan />} />
        <Route path="/shopping-list" element={<ShoppingList />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Router>
  );
}

export default App;