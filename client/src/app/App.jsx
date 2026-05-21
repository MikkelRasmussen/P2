import { Routes, Route } from 'react-router-dom'
import Header from '../components/layout/Header.jsx'
import { RecipeProvider } from '../context/RecipeContext.jsx'
import SwipePage from '../pages/SwipePage.jsx'
import WeekPage from '../pages/WeekPage.jsx'
import ShoppingListPage from '../pages/ShoppingListPage.jsx'

export default function App() {
  return (
    <RecipeProvider>
      <div className="bg-surface text-on-surface min-h-screen flex flex-col">
        <Header />
        <Routes>
          <Route path="/" element={<SwipePage />} />
          <Route path="/shopping-list" element={<ShoppingListPage />} />
          <Route path="/week" element={<WeekPage />} />
        </Routes>
      </div>
    </RecipeProvider>
  )
}
