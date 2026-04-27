export default function RecipeModal({ recipe, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="fixed inset-0 z-[60] bg-on-surface/30 backdrop-blur-sm flex items-center justify-center p-4 md:p-12"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Container */}
        <div className="bg-surface-container-lowest w-full max-w-4xl h-[921px] rounded-lg shadow-2xl relative flex overflow-hidden">

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-[70] bg-surface-container-highest/80 backdrop-blur-md p-3 rounded-full hover:bg-surface-container-high transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-on-surface">
              close
            </span>
          </button>

          {/*  HERO IMAGE — */}
          <div className="hidden md:block w-1/2 relative">
            <div className="sticky top-0 h-full">
              <img
                src={recipe.image}
                alt={recipe.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.15)] pointer-events-none" />
            </div>
          </div>

          {/* ✅ CONTENT — SCROLLING */}
          <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col gap-10 overflow-y-auto scrollbar">

            {/* Title */}
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-on-surface mb-4">
                {recipe.name}
              </h1>
              <div className="flex gap-6">
                <div>
                  <span className="uppercase text-xs tracking-widest text-on-surface-variant">
                    Prep Time
                  </span>
                  <div className="font-bold text-primary">15 MIN</div>
                </div>
                <div>
                  <span className="uppercase text-xs tracking-widest text-on-surface-variant">
                    Servings
                  </span>
                  <div className="font-bold text-primary">2–3</div>
                </div>
              </div>
            </div>

            {/* Ingredients */}
            <section>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary">
                  shopping_basket
                </span>
                Ingredienser
              </h2>

              <ul className="space-y-4">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} className="flex items-center gap-4">
                    <span className="w-2 h-2 rounded-full bg-secondary-container" />
                    <span className="text-on-surface-variant">{ing}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Preparation */}
            <section className="pb-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  restaurant
                </span>
                The Preparation
              </h2>

              <div className="space-y-8">
                {recipe.steps.map((step, i) => (

                  <div className="flex gap-6">
                    <div className="w-10 h-10 rounded-full bg-primary-container flex-shrink-0 flex items-center justify-center font-headline font-bold text-on-primary-container">
                      {i + 1}
                    </div>
                    <p className="leading-relaxed">{step}</p>
                  </div>

                ))}
              </div>
            </section>

          </div>
        </div>
      </div >
    </div >
  );
}