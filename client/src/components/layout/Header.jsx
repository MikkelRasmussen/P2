import { useLocation, Link } from 'react-router-dom';

export default function Header() {
    const location = useLocation();

    const isActive = (path) => {
        return location.pathname === path;
    };

    const linkClasses = (path) => {
        return isActive(path)
            ? "text-green-700 border-b-2 border-green-700 pb-1"
            : "text-zinc-600 hover:text-green-600 transition-colors";
    };

    return (
        <header className="top-0 w-full z-50 bg-white/70 backdrop-blur-md">
            <div className="flex justify-between items-center px-8 h-20 max-w-7xl mx-auto">
                <div className="text-2xl font-bold text-green-800 tracking-tighter">Mealplanner</div>
                <nav className="hidden md:flex items-center space-x-8 font-['Plus_Jakarta_Sans'] font-semibold tracking-tight">
                    <Link to="/" className={linkClasses('/')}>Opskrifter</Link>
                    <Link to="/week" className={linkClasses('/week')}>Ugenlig madplan</Link>
                    <Link to="/shopping-list" className={linkClasses('/shopping-list')}>Indkøbsliste</Link>
                </nav>
            </div>
        </header>
    );
}
