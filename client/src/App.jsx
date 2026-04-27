import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import RecipePage from "./pages/RecipesSwiper/RecipePage.jsx"
import Header from "./components/Header.jsx"
import Shoppinglist from "./pages/Shoppinglist.jsx"
import WeekPage from "./pages/WeekPage.jsx"


function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className="bg-surface text-on-surface min-h-screen flex flex-col">
        <Header />
        <Routes>
          <Route path="/" element={<RecipePage />} />
          <Route path="/shopping-list" element={<Shoppinglist />} />
          <Route path="/week" element={<WeekPage />} />
        </Routes>
      </div>
    </>
  )
}

export default App
