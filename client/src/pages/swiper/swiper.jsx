import { useRef, useState, useCallback } from "react";

const SWIPE_THRESHOLD = 90;
const DRAG_THRESHOLD = 6;

export default function Swiper({ recipe, onSwipe, onOpenDetail, isTop, stackStyle }) {

    const cardRef = useRef(null);
    const drag = useRef({ active: false, startX: 0, startY: 0, moved: false, dx: 0, dy: 0 });
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);

    const likeOpacity = Math.max(0, Math.min(pos.x / 65, 1));
    const nopeOpacity = Math.max(0, Math.min(-pos.x / 65, 1));
    const rotation = pos.x / 22;

    const onPointerDown = useCallback(
        (e) => {
            if (!isTop) return;
            e.preventDefault();
            drag.current = {
                active: true,
                startX: e.clientX,
                startY: e.clientY,
                moved: false,
                dx: 0,
                dy: 0,
            };
            cardRef.current?.setPointerCapture(e.pointerId);
        },
        [isTop]
    );

    const onPointerMove = useCallback((e) => {
        if (!drag.current.active) return;
        const dx = e.clientX - drag.current.startX;
        const dy = e.clientY - drag.current.startY;
        if (
            !drag.current.moved &&
            (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)
        ) {
            drag.current.moved = true;
            setDragging(true);
        }
        if (drag.current.moved) {
            drag.current.dx = dx;
            drag.current.dy = dy;
            setPos({ x: dx, y: dy });
        }
    }, []);

    const onPointerUp = useCallback(() => {
        if (!drag.current.active) return;
        const wasDrag = drag.current.moved;
        const finalX = drag.current.dx;
        drag.current.active = false;
        drag.current.moved = false;
        setDragging(false);

        if (!wasDrag) {
            onOpenDetail();
        } else if (finalX > SWIPE_THRESHOLD) {
            onSwipe("like");
        } else if (finalX < -SWIPE_THRESHOLD) {
            onSwipe("nope");
        } else {
            setPos({ x: 0, y: 0 });
        }
    }, [onSwipe, onOpenDetail]);

    const topTransform = `translateX(${pos.x}px) translateY(${pos.y}px) rotate(${rotation}deg)`;


    return (
        <>
            <div className="bg-surface text-on-surface min-h-screen flex flex-col">
                {/* TopNavBar */}
                <div className=" top-0 w-full z-50 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md">
                    <div className="flex justify-between items-center px-8 h-20 max-w-7xl mx-auto">
                        <div className="text-2xl font-bold text-green-800 dark:text-green-300 tracking-tighter">Mealplanner</div>
                        <nav className="hidden md:flex items-center space-x-8 font-['Plus_Jakarta_Sans'] font-semibold tracking-tight">
                            <a className="text-zinc-600 dark:text-zinc-400 hover:text-green-600 dark:hover:text-green-300 transition-colors" href="#">Plan</a>
                            <a className="text-green-700 dark:text-green-400 border-b-2 border-green-700 dark:border-green-400 pb-1" href="#">Recipes</a>
                            <a className="text-zinc-600 dark:text-zinc-400 hover:text-green-600 dark:hover:text-green-300 transition-colors" href="#">Shopping List</a>
                            <a className="text-zinc-600 dark:text-zinc-400 hover:text-green-600 dark:hover:text-green-300 transition-colors" href="#">Profile</a>
                        </nav>
                        <div className="flex items-center space-x-4">
                            <button className="p-2 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-all scale-95 active:opacity-80">
                                <span className="material-symbols-outlined text-green-700 dark:text-green-400" data-icon="account_circle">account_circle</span>
                            </button>
                        </div>
                    </div>
                </div>
                <main className="flex-grow flex flex-col items-center justify-center px-6 py-8">
                    {/* Weekly Plan Progress Section */}
                    <section className="w-full max-w-xs mb-10">
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <span className="text-[0.75rem] font-medium tracking-[0.1em] text-on-surface-variant uppercase font-label">Weekly Progress</span>
                                <h2 className="text-xl font-bold text-on-surface leading-tight">Curating your menu</h2>
                            </div>
                            <span className="text-primary font-bold text-lg">4/7</span>
                        </div>
                        {/* Tonal Trail Stepper */}
                        <div className="flex gap-2 h-1.5 w-full">
                            <div className="flex-1 bg-primary-container rounded-full"></div>
                            <div className="flex-1 bg-primary-container rounded-full"></div>
                            <div className="flex-1 bg-primary-container rounded-full"></div>
                            <div className="flex-1 bg-primary-container rounded-full"></div>
                            <div className="flex-1 bg-surface-container-high rounded-full"></div>
                            <div className="flex-1 bg-surface-container-high rounded-full"></div>
                            <div className="flex-1 bg-surface-container-high rounded-full"></div>
                        </div>
                    </section>
                    {/* Discovery Swiper Card */}
                    <div className="relative w-max max-w-xs group"
                    >
                        {/* Background Stack Effect */}
                        <div className="absolute inset-0 translate-y-4 scale-95 bg-surface-container-low rounded-lg -z-10"></div>
                        <div className="absolute inset-0 translate-y-2 scale-[0.975] bg-surface-container rounded-lg -z-10"></div>
                        {/* Main Recipe Card */}
                        <article className="bg-surface-container-lowest rounded-lg shadow-[0_12px_40px_rgba(44,47,46,0.06)] overflow-hidden transition-transform hover:scale-[1.01]">
                            <div className="relative h-[320px] w-full p-4">
                                <img alt="Artisanal Salad" className="w-full h-full object-cover rounded-lg" data-alt="Close-up of a vibrant Mediterranean Buddha bowl with roasted chickpeas, fresh kale, radishes, and creamy tahini dressing in soft morning light" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCpq0vA8zMMd67ak4pKq6uO_jS52Kow1JVWUvsqMI1lW0M58w-dbRtTjxSgP2UOS0VqSea7f0d3RZKjktbvPJ5Gxsvb5XhTxGZfLk4iY8PzeTkrexVCkG55av5ELWx4lzZ5QdYYQYQK1EbiRLwkZHnjm46hfm0Mw88bLnvJ7wFB0Asf4AoW-M1fb3krR2o-ubtdH1bv9sAhDYuWT2E0uyCA1wsQP-t5fyJ3T0J60uvery1B8C4X1rYiKj-grnGSzJhR0SniyIHCQ0O7" />
                                {/* Quick Filter Chips */}
                                <div className="absolute top-8 left-8 flex gap-2">
                                    <span className="bg-primary-container/90 backdrop-blur-sm text-on-primary-container px-4 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase font-label">Vegan</span>
                                    <span className="bg-white/90 backdrop-blur-sm text-on-surface px-4 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase font-label">15-Min</span>
                                </div>
                            </div>
                            <div className="px-8 pt-6 pb-10">
                                <h1 className="text-xl font-bold tracking-tight text-on-surface mb-4">Miso-Glazed Autumn Harvest Bowl</h1>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-6">
                                        <div className="flex flex-col">
                                            <span className="text-[0.65rem] font-bold tracking-[0.15em] text-on-surface-variant uppercase font-label">Pris</span>
                                            <span className="text-on-surface font-semibold">55 kr.-</span>
                                        </div>

                                    </div>
                                    <button className="text-primary hover:bg-primary-container p-2 rounded-full transition-colors">
                                        <span className="material-symbols-outlined" data-icon="info">info</span>
                                    </button>
                                </div>
                            </div>
                        </article>
                    </div>
                    {/* Interaction Controls */}
                    <div className="mt-12 flex items-center justify-center gap-10">
                        {/* Dislike */}
                        <button className="group flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-all hover:bg-error-container hover:text-on-error-container group-active:scale-90 shadow-sm">
                                <span className="material-symbols-outlined text-3xl" data-icon="close">close</span>
                            </div>
                            <span className="text-[0.7rem] font-bold tracking-widest uppercase font-label opacity-60">Pass</span>
                        </button>
                        {/* Like */}
                        <button className="group flex flex-col items-center gap-2">
                            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-on-primary transition-all hover:bg-primary-dim group-active:scale-90 shadow-lg shadow-primary/20">
                                <span className="material-symbols-outlined text-4xl" data-icon="favorite" data-weight="fill" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                            </div>
                            <span className="text-[0.7rem] font-bold tracking-widest uppercase font-label text-primary">Love</span>
                        </button>
                        {/*    Skip/Later */}
                        <button className="group flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-all hover:bg-tertiary-container hover:text-on-tertiary-container group-active:scale-90 shadow-sm">
                                <span className="material-symbols-outlined text-3xl" data-icon="forward">forward</span>
                            </div>
                            <span className="text-[0.7rem] font-bold tracking-widest uppercase font-label opacity-60">Skip</span>
                        </button>
                    </div>
                </main>
                {/* Footer */}
                <div className="w-full py-12 mt-auto bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="flex flex-col md:flex-row justify-between items-center px-8 max-w-7xl mx-auto space-y-6 md:space-y-0 font-['Be_Vietnam_Pro'] text-sm tracking-wide">
                        <div className="text-lg font-bold text-green-800 dark:text-green-300">Mealplanner</div>
                        <div className="flex space-x-8 text-zinc-500 dark:text-zinc-400">
                            <a className="hover:underline decoration-green-500 underline-offset-4 transition-opacity" href="#">About Us</a>
                            <a className="hover:underline decoration-green-500 underline-offset-4 transition-opacity" href="#">Privacy Policy</a>
                            <a className="hover:underline decoration-green-500 underline-offset-4 transition-opacity" href="#">Terms of Service</a>
                            <a className="hover:underline decoration-green-500 underline-offset-4 transition-opacity" href="#">Contact</a>
                        </div>
                        <div className="text-zinc-500 dark:text-zinc-400 text-xs">
                            © 2024 The Culinary Atelier. Artfully Curated Meals.
                        </div>
                    </div>
                </div>
            </div></>
    )
}
