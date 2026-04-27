
export default function WeekPage() {


    function getCurrentWeekRange() {
        const today = new Date();
        const day = today.getDay(); // 0 = Sun, 1 = Mon, ...
        const diffToMonday = (day === 0 ? -6 : 1) - day;

        const monday = new Date(today);
        monday.setDate(today.getDate() + diffToMonday);

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        const format = (date) =>
            date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
            });

        return `${format(monday)} — ${format(sunday)}`;
    }


    return (
        <main className="flex-grow max-w-7xl mx-auto w-full px-8 py-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                <div>
                    <span className="font-['Be_Vietnam_Pro'] text-sm tracking-wide uppercase text-secondary font-bold mb-2 block">
                        Madplan for
                    </span>

                    <h1 className="text-5xl font-extrabold tracking-tight text-on-surface">
                        Nuværende uge
                    </h1>

                    <p className="text-on-surface-variant mt-2 text-lg">
                        {getCurrentWeekRange()} - 7 måltider.
                    </p>
                </div>

                <a href="/shopping-list" className="bg-primary hover:bg-primary-dim text-on-primary px-8 py-4 rounded-full font-bold flex items-center gap-3 transition-transform scale-100 active:scale-95 shadow-lg shadow-primary/20">
                    <span className="material-symbols-outlined">
                        shopping_basket
                    </span>
                    Vis indkøbsliste
                </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                <div className="md:col-span-3 md:row-span-2 bg-surface-container-lowest rounded-lg overflow-hidden group shadow-sm flex flex-col">
                    <div className="relative h-64 overflow-hidden">
                        <img
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            alt="Gourmet salad with grilled halloumi, fresh pomegranate seeds, and vibrant greens on a ceramic plate, bright natural lighting"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_6rFMv7yalMh8BTzJ_3neJ1yASGzBkWxA4DI7O9iKVFTxEEUL1do8p2rG8xncUFbxDdyI4merGhgpIIR4RPvKhSntMYxzO0omeUV42NwGDAtSE0uANDtl_laySQuGHV6bh_1FVqcPisB9Anf4fiDf1ZwQdYnnnSwMyhL3tubZyzXJNFnU55tiETcN0pE4Kq4ijJa0qOeOT8BxTN43XjYpXtWsVBT6qfVQiniQz6LQ7--ezNVdUTe0Gkfv7rHaupZshJ8PYvX4IdwG"
                        />

                        <div className="absolute top-4 left-4 bg-primary-container text-on-primary-container px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                            Monday Hero
                        </div>
                    </div>

                    <div className="p-8 flex-grow flex flex-col justify-between">
                        <div>
                            <h2 className="text-3xl font-bold mb-4">
                                Grilled Halloumi &amp; Pomegranate Zest Salad
                            </h2>

                            <div className="flex gap-4 mb-6">
                                <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-semibold">
                                    Vegetarian
                                </span>

                                <span className="bg-surface-container-high text-on-surface px-3 py-1 rounded-full text-xs font-semibold">
                                    15 Min Prep
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-outline-variant/15 pt-6">
                            <button className="text-primary font-bold flex items-center gap-2 hover:opacity-80 transition-opacity">
                                View Full Recipe{" "}
                                <span className="material-symbols-outlined">
                                    arrow_forward
                                </span>
                            </button>

                            <button className="p-2 hover:bg-surface-container-low rounded-full transition-colors">
                                <span className="material-symbols-outlined text-on-surface-variant">
                                    swap_horiz
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2 bg-surface-container-low rounded-lg p-6 flex flex-col justify-between transition-all hover:bg-surface-container-lowest hover:shadow-md">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-on-surface-variant font-bold text-xs uppercase tracking-tighter">
                                Tuesday
                            </span>

                            <span className="material-symbols-outlined text-secondary">
                                restaurant
                            </span>
                        </div>

                        <h3 className="text-xl font-bold mb-2">
                            Wild Mushroom Risotto with Truffle Oil
                        </h3>
                    </div>

                    <div className="flex justify-between items-center mt-4">
                        <span className="text-sm text-on-surface-variant italic">
                            Refined Dinner
                        </span>

                        <button className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center hover:bg-primary-container transition-colors">
                            <span className="material-symbols-outlined text-sm">
                                swap_horiz
                            </span>
                        </button>
                    </div>
                </div>

                <div className="md:col-span-2 bg-surface-container-low rounded-lg p-6 flex flex-col justify-between transition-all hover:bg-surface-container-lowest hover:shadow-md">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-on-surface-variant font-bold text-xs uppercase tracking-tighter">
                                Wednesday
                            </span>

                            <span className="material-symbols-outlined text-secondary">
                                skillet
                            </span>
                        </div>

                        <h3 className="text-xl font-bold mb-2">
                            Pan-Seared Salmon with Asparagus
                        </h3>
                    </div>

                    <div className="flex justify-between items-center mt-4">
                        <span className="text-sm text-on-surface-variant italic">
                            Omega-3 Boost
                        </span>

                        <button className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center hover:bg-primary-container transition-colors">
                            <span className="material-symbols-outlined text-sm">
                                swap_horiz
                            </span>
                        </button>
                    </div>
                </div>

                <div className="md:col-span-2 bg-surface-container-low rounded-lg p-6 flex flex-col justify-between transition-all hover:bg-surface-container-lowest hover:shadow-md">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-on-surface-variant font-bold text-xs uppercase tracking-tighter">
                                Thursday
                            </span>

                            <span className="material-symbols-outlined text-secondary">
                                local_fire_department
                            </span>
                        </div>

                        <h3 className="text-xl font-bold mb-2">
                            Spicy Thai Basil Chicken Stir-Fry
                        </h3>
                    </div>

                    <div className="flex justify-between items-center mt-4">
                        <span className="text-sm text-on-surface-variant italic">
                            Bold Flavors
                        </span>

                        <button className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center hover:bg-primary-container transition-colors">
                            <span className="material-symbols-outlined text-sm">
                                swap_horiz
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </main>
    )
}
