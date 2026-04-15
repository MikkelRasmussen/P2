import { useLocation, Link } from 'react-router-dom';

export default function Header() {
    const location = useLocation();

    const isActive = (path) => {
        return location.pathname === path;
    };

    const linkClasses = (path) => {
        return isActive(path)
            ? "text-green-700 dark:text-green-400 border-b-2 border-green-700 dark:border-green-400 pb-1"
            : "text-zinc-600 dark:text-zinc-400 hover:text-green-600 dark:hover:text-green-300 transition-colors";
    };

    return (
        <header className=" top-0 w-full z-50 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md">
            <div className="flex justify-between items-center px-8 h-20 max-w-7xl mx-auto">
                <div className="text-2xl font-bold text-green-800 dark:text-green-300 tracking-tighter">Mealplanner</div>
                <nav className="hidden md:flex items-center space-x-8 font-['Plus_Jakarta_Sans'] font-semibold tracking-tight">
                    <Link to="/" className={linkClasses('/')}>Recipes</Link>
                    <Link to="/shopping-list" className={linkClasses('/shopping-list')}>Shopping List</Link>
                </nav>
                <div className="flex items-center space-x-4">
                    <button className="p-2 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-all scale-95 active:opacity-80">
                        <span className="material-symbols-outlined text-green-700 dark:text-green-400" data-icon="account_circle">account_circle</span>
                    </button>
                </div>
            </div>
        </header>
    )
}
